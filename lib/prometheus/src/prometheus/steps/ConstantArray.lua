-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- ConstantArray.lua
--
-- This Step extracts constants (strings + optionally numbers) into an array
-- Supports multiple encodings, local wrapper functions, rotation, shuffling, etc.

local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Scope = require("prometheus.scope")
local visitast = require("prometheus.visitast")
local util = require("prometheus.util")
local Parser = require("prometheus.parser")
local enums = require("prometheus.enums")

local LuaVersion = enums.LuaVersion
local AstKind = Ast.AstKind

local ConstantArray = Step:extend()
ConstantArray.Description = "Extracts constants (strings & optionally numbers) into an array + various protections"
ConstantArray.Name = "Constant Array"

ConstantArray.SettingsDescriptor = {
    Treshold = {
        name = "Treshold",
        description = "Relative chance a constant is extracted",
        type = "number",
        default = 1,
        min = 0,
        max = 1,
    },
    StringsOnly = {
        name = "StringsOnly",
        description = "Only extract strings (ignore numbers)",
        type = "boolean",
        default = false,
    },
    NumberObfuscationChance = {
        name = "NumberObfuscationChance",
        description = "Chance to obfuscate a number when not in StringsOnly mode",
        type = "number",
        default = 0.85,
        min = 0,
        max = 1,
    },
    Shuffle = {
        name = "Shuffle",
        description = "Shuffle constant array order",
        type = "boolean",
        default = true,
    },
    Rotate = {
        name = "Rotate",
        description = "Rotate array by random amount (reversed at runtime)",
        type = "boolean",
        default = true,
    },
    Encoding = {
        name = "Encoding",
        description = "String encoding method",
        type = "enum",
        default = "base64",
        values = { "none", "base64", "xor", "xor+base64", "identity" }
    },
    XorKey = {
        name = "XorKey",
        description = "Byte used for XOR encoding (0–255)",
        type = "number",
        default = 57,
        min = 0,
        max = 255,
    },
    LocalWrapperTreshold = {
        name = "LocalWrapperTreshold",
        description = "Chance to add local wrapper table per function",
        type = "number",
        default = 0.4,
        min = 0,
        max = 1,
    },
    LocalWrapperCount = {
        name = "LocalWrapperCount",
        description = "Number of local wrapper functions per selected scope",
        type = "number",
        min = 0,
        max = 384,
        default = 6,
    },
    LocalWrapperArgCount = {
        name = "LocalWrapperArgCount",
        description = "Arguments per local wrapper function",
        type = "number",
        min = 2,
        max = 180,
        default = 12,
    },
    MaxWrapperOffset = {
        name = "MaxWrapperOffset",
        description = "Maximum random offset for wrapper indexing",
        type = "number",
        min = 0,
        default = 32767,
    },
    AllowNegativeIndices = {
        name = "AllowNegativeIndices",
        description = "Allow negative indices in wrapper (light anti-analysis)",
        type = "boolean",
        default = false,
    }
}

local function callNameGenerator(generatorFunction, ...)
    if type(generatorFunction) == "table" then
        generatorFunction = generatorFunction.generateName
    end
    return generatorFunction(...)
end

function ConstantArray:init(settings)
    self.XorKey = settings.XorKey or 57
end

function ConstantArray:createArray()
    local entries = {}
    for i, v in ipairs(self.constants) do
        if type(v) == "string" then
            v = self:encode(v)
        end
        entries[i] = Ast.TableEntry(Ast.ConstantNode(v))
    end
    return Ast.TableConstructorExpression(entries)
end

function ConstantArray:indexing(index, data)
    local realIndexExpr

    if self.LocalWrapperCount > 0 and data.functionData.local_wrappers then
        local wrappers = data.functionData.local_wrappers
        local wrapper = wrappers[math.random(1, #wrappers)]

        local args = {}
        local ofs = index - self.wrapperOffset - wrapper.offset

        for i = 1, self.LocalWrapperArgCount do
            if i == wrapper.arg then
                args[i] = Ast.NumberExpression(ofs)
            else
                local noise = math.random(-2048, 2048)
                args[i] = Ast.NumberExpression(ofs + noise)
            end
        end

        data.scope:addReferenceToHigherScope(wrappers.scope, wrappers.id)
        realIndexExpr = Ast.FunctionCallExpression(
            Ast.IndexExpression(
                Ast.VariableExpression(wrappers.scope, wrappers.id),
                Ast.StringExpression(wrapper.index)
            ),
            args
        )
    else
        data.scope:addReferenceToHigherScope(self.rootScope, self.wrapperId)
        realIndexExpr = Ast.FunctionCallExpression(
            Ast.VariableExpression(self.rootScope, self.wrapperId),
            { Ast.NumberExpression(index - self.wrapperOffset) }
        )
    end

    if self.AllowNegativeIndices and math.random() < 0.25 then
        -- light fake negative index (still resolves correctly)
        return Ast.IndexExpression(
            Ast.VariableExpression(self.rootScope, self.arrId),
            Ast.UnaryMinusExpression(realIndexExpr)
        )
    end

    return realIndexExpr
end

function ConstantArray:getConstant(value, data)
    if self.lookup[value] then
        return self:indexing(self.lookup[value], data)
    end

    local idx = #self.constants + 1
    self.constants[idx] = value
    self.lookup[value] = idx
    return self:indexing(idx, data)
end

function ConstantArray:addConstant(value)
    if self.lookup[value] then return end
    local idx = #self.constants + 1
    self.constants[idx] = value
    self.lookup[value] = idx
end

-- ───────────────────────────────────────────────
--  Rotate helpers
-- ───────────────────────────────────────────────

local function reverse(t, i, j)
    while i < j do
        t[i], t[j] = t[j], t[i]
        i, j = i + 1, j - 1
    end
end

local function rotate(t, d, n)
    n = n or #t
    d = (d or 1) % n
    reverse(t, 1, n)
    reverse(t, 1, d)
    reverse(t, d + 1, n)
end

local rotateCode = [=[
    local function rev(i,j)
        while i < j do
            ARR[i], ARR[j], i, j = ARR[j], ARR[i], i+1, j-1
        end
    end
    local n = #ARR
    local d = SHIFT
    rev(1,n)
    rev(1,d)
    rev(d+1,n)
]=]

function ConstantArray:addRotateCode(ast, shift)
    if #self.constants < 2 then return end

    local parser = Parser:new({ LuaVersion = LuaVersion.Lua51 })
    local code = rotateCode:gsub("SHIFT", tostring(shift))
    local newAst = parser:parse(code)

    local block = newAst.body.statements[1].body
    block.scope:setParent(ast.body.scope)

    visitast(newAst, nil, function(node)
        if node.kind == AstKind.VariableExpression then
            local name = node.scope:getVariableName(node.id)
            if name == "ARR" then
                node.scope = self.rootScope
                node.id = self.arrId
            end
        end
    end)

    table.insert(ast.body.statements, 1, newAst.body.statements[1])
end

-- ───────────────────────────────────────────────
--  Decoding / Encoding
-- ───────────────────────────────────────────────

function ConstantArray:encode(str)
    if self.Encoding == "none" or self.Encoding == "identity" then
        return str
    elseif self.Encoding == "base64" then
        return ((str:gsub('.', function(x)
            local r, b = '', x:byte()
            for i = 8, 1, -1 do
                r = r .. (b % 2^i - b % 2^(i-1) > 0 and '1' or '0')
            end
            return r
        end) .. '0000'):gsub('%d%d%d?%d?%d?%d?', function(x)
            if #x < 6 then return '' end
            local c = 0
            for i = 1, 6 do
                c = c + (x:sub(i,i) == '1' and 2^(6-i) or 0)
            end
            return self.base64chars:sub(c+1, c+1)
        end) .. ({'', '==', '='})[#str % 3 + 1])
    elseif self.Encoding == "xor" or self.Encoding == "xor+base64" then
        local result = {}
        for i = 1, #str do
            local byte = str:byte(i)
            result[i] = string.char(bit32.bxor(byte, self.XorKey))
        end
        local s = table.concat(result)
        if self.Encoding == "xor+base64" then
            return self:encode(s)   -- recursive (base64)
        end
        return s
    end
    return str -- fallback
end

function ConstantArray:addDecodeCode(ast)
    local decodeParts = {}

    if self.Encoding == "base64" or self.Encoding == "xor+base64" then
        table.insert(decodeParts, [[
            local lookup = ]] .. util.dump(self:createBase64Lookup():toLua(0)) .. [[
            local len    = string.len
            local sub    = string.sub
            local floor  = math.floor
            local char   = string.char
            local concat = table.concat
            local insert = table.insert

            for i = 1, #ARR do
                local s = ARR[i]
                if type(s) == "string" then
                    local parts, value, count = {}, 0, 0
                    local idx = 1
                    while idx <= len(s) do
                        local c = sub(s, idx, idx)
                        local code = lookup[c]
                        if code then
                            value = value + code * (64 ^ (3 - count))
                            count = count + 1
                            if count == 4 then
                                insert(parts, char(floor(value/65536), floor(value%65536/256), value%256))
                                value, count = 0, 0
                            end
                        elseif c == "=" then
                            if count > 0 then
                                insert(parts, char(floor(value/65536)))
                                if count > 1 then
                                    insert(parts, char(floor(value%65536/256)))
                                end
                            end
                            break
                        end
                        idx = idx + 1
                    end
                    ARR[i] = concat(parts)
                end
            end
        ]])
    end

    if self.Encoding == "xor" or self.Encoding == "xor+base64" then
        table.insert(decodeParts, ([[
            local key = %d
            for i = 1, #ARR do
                local s = ARR[i]
                if type(s) == "string" then
                    local t = {}
                    for j = 1, #s do
                        t[j] = string.char(bit32.bxor(s:byte(j), key))
                    end
                    ARR[i] = table.concat(t)
                end
            end
        ]]):format(self.XorKey))
    end

    if #decodeParts == 0 then return end

    local code = "do\n" .. table.concat(decodeParts, "\n") .. "\nend"

    local parser = Parser:new({ LuaVersion = LuaVersion.Lua51 })
    local newAst = parser:parse(code)
    local doStat = newAst.body.statements[1]
    doStat.body.scope:setParent(ast.body.scope)

    visitast(newAst, nil, function(node)
        if node.kind == AstKind.VariableExpression and node.scope:getVariableName(node.id) == "ARR" then
            node.scope = self.rootScope
            node.id = self.arrId
        end
    end)

    table.insert(ast.body.statements, 1, doStat)
end

function ConstantArray:createBase64Lookup()
    local chars = {}
    for _, c in ipairs({
        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
        "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
        "0","1","2","3","4","5","6","7","8","9","+","/"
    }) do
        chars[#chars+1] = c
    end
    chars = util.shuffle(chars)

    local entries = {}
    for i, c in ipairs(chars) do
        entries[#entries+1] = Ast.KeyedTableEntry(
            Ast.StringExpression(c),
            Ast.NumberExpression(i-1)
        )
    end
    return Ast.TableConstructorExpression(entries)
end

function ConstantArray:apply(ast, pipeline)
    self.rootScope = ast.body.scope
    self.arrId = self.rootScope:addVariable()

    self.constants = {}
    self.lookup = {}

    -- Phase 1: collect candidates
    visitast(ast, nil, function(node)
        if math.random() > self.Treshold then return end

        node.__want_const_array = true

        if node.kind == AstKind.StringExpression then
            self:addConstant(node.value)
        elseif not self.StringsOnly and node.isConstant and node.value ~= nil then
            if type(node.value) == "number" then
                if math.random() <= (self.NumberObfuscationChance or 0.85) then
                    self:addConstant(node.value)
                end
            else
                self:addConstant(node.value)
            end
        end
    end)

    -- Shuffle
    if self.Shuffle then
        self.constants = util.shuffle(self.constants)
        local newLookup = {}
        for i, v in ipairs(self.constants) do
            newLookup[v] = i
        end
        self.lookup = newLookup
    end

    self.wrapperOffset = math.random(-self.MaxWrapperOffset, self.MaxWrapperOffset)
    self.wrapperId = self.rootScope:addVariable()

    -- Phase 2: insert wrappers & replace constants
    visitast(ast, function(pre, data)
        -- Decide whether to add local wrappers in this function
        if self.LocalWrapperCount > 0
            and pre.kind == AstKind.Block
            and pre.isFunctionBlock
            and math.random() <= self.LocalWrapperTreshold then

            local id = pre.scope:addVariable()
            data.functionData.local_wrappers = {
                id = id,
                scope = pre.scope,
                used = false
            }

            local taken = {}
            for _ = 1, self.LocalWrapperCount do
                local name
                repeat
                    name = callNameGenerator(pipeline.namegenerator, math.random(8, 64))
                until not taken[name]
                taken[name] = true

                local offset = math.random(-self.MaxWrapperOffset, self.MaxWrapperOffset)
                local argPos = math.random(1, self.LocalWrapperArgCount)

                table.insert(data.functionData.local_wrappers, {
                    index  = name,
                    arg    = argPos,
                    offset = offset
                })
            end
        end
    end, function(post, data)
        -- Replace constant nodes
        if post.__want_const_array then
            post.__want_const_array = nil
            if post.kind == AstKind.StringExpression then
                return self:getConstant(post.value, data)
            elseif not self.StringsOnly and post.isConstant and post.value ~= nil then
                if type(post.value) == "number" and math.random() <= (self.NumberObfuscationChance or 0.85) then
                    return self:getConstant(post.value, data)
                end
            end
        end

        -- Insert local wrapper table (only if actually used)
        if self.LocalWrapperCount > 0
            and post.kind == AstKind.Block
            and post.isFunctionBlock
            and data.functionData.local_wrappers
            and data.functionData.local_wrappers.used then

            local w = data.functionData.local_wrappers
            local elems = {}

            for _, wrapper in ipairs(w) do
                local funcScope = Scope:new(post.scope)
                local args = {}
                local realArg

                for i = 1, self.LocalWrapperArgCount do
                    args[i] = funcScope:addVariable()
                    if i == wrapper.arg then
                        realArg = args[i]
                    end
                end

                local indexExpr
                if wrapper.offset < 0 then
                    indexExpr = Ast.SubExpression(
                        Ast.VariableExpression(funcScope, realArg),
                        Ast.NumberExpression(-wrapper.offset)
                    )
                else
                    indexExpr = Ast.AddExpression(
                        Ast.VariableExpression(funcScope, realArg),
                        Ast.NumberExpression(wrapper.offset)
                    )
                end

                funcScope:addReferenceToHigherScope(self.rootScope, self.wrapperId)

                local call = Ast.FunctionCallExpression(
                    Ast.VariableExpression(self.rootScope, self.wrapperId),
                    { indexExpr }
                )

                local fargs = {}
                for _, v in ipairs(args) do
                    fargs[#fargs+1] = Ast.VariableExpression(funcScope, v)
                end

                elems[#elems+1] = Ast.KeyedTableEntry(
                    Ast.StringExpression(wrapper.index),
                    Ast.FunctionLiteralExpression(fargs, Ast.Block({
                        Ast.ReturnStatement({ call })
                    }, funcScope))
                )
            end

            table.insert(post.statements, 1, Ast.LocalVariableDeclaration(post.scope, {
                w.id
            }, {
                Ast.TableConstructorExpression(elems)
            }))
        end
    end)

    -- Mark functions that actually used constants
    visitast(ast, nil, function(node, data)
        if node.__want_const_array then
            if data.functionData and data.functionData.local_wrappers then
                data.functionData.local_wrappers.used = true
            end
        end
    end)

    -- Add decode / rotate / wrapper in somewhat random order
    local postSteps = util.shuffle({
        function() self:addDecodeCode(ast) end,
        function()
            if self.Rotate and #self.constants > 1 then
                local shift = math.random(1, #self.constants - 1)
                rotate(self.constants, -shift)
                self:addRotateCode(ast, shift)
            end
        end,
        function()
            -- global wrapper function
            local funcScope = Scope:new(self.rootScope)
            funcScope:addReferenceToHigherScope(self.rootScope, self.arrId)

            local arg = funcScope:addVariable()
            local offsetExpr

            if self.wrapperOffset < 0 then
                offsetExpr = Ast.SubExpression(
                    Ast.VariableExpression(funcScope, arg),
                    Ast.NumberExpression(-self.wrapperOffset)
                )
            else
                offsetExpr = Ast.AddExpression(
                    Ast.VariableExpression(funcScope, arg),
                    Ast.NumberExpression(self.wrapperOffset)
                )
            end

            table.insert(ast.body.statements, 1, Ast.LocalFunctionDeclaration(
                self.rootScope,
                self.wrapperId,
                { Ast.VariableExpression(funcScope, arg) },
                Ast.Block({
                    Ast.ReturnStatement({
                        Ast.IndexExpression(
                            Ast.VariableExpression(self.rootScope, self.arrId),
                            offsetExpr
                        )
                    })
                }, funcScope)
            ))
        end
    })

    for _, fn in ipairs(postSteps) do fn() end

    -- Finally — the array itself
    if #self.constants > 0 then
        table.insert(ast.body.statements, 1, Ast.LocalVariableDeclaration(
            self.rootScope,
            { self.arrId },
            { self:createArray() }
        ))
    end

    -- cleanup
    self.rootScope = nil
    self.arrId = nil
    self.constants = nil
    self.lookup = nil
end

return ConstantArray
