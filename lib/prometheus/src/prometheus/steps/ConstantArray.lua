-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- ConstantArray.lua
--
-- Extracts constants (mainly strings, optionally numbers) into one table at the top.
-- Supports basic encodings, rotation, local wrapper functions, global index wrapper.
--
-- New/improved features (2024–2026 edition):
--  • Added "xor" encoding (simple single-byte XOR with random key)
--  • Skips decode loop when Encoding = "none"
--  • Slightly better base64 padding logic comment & variable naming
--  • More consistent naming (base64Alphabet, MaxIndexOffset)
--

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

ConstantArray.Description = "Extracts constants (strings + optionally numbers) into an array at the top of the script"
ConstantArray.Name = "Constant Array"

ConstantArray.SettingsDescriptor = {
    Treshold = {
        name = "Treshold",
        description = "Probability (0–1) that a constant will be extracted",
        type = "number",
        default = 1,
        min = 0,
        max = 1,
    },
    StringsOnly = {
        name = "StringsOnly",
        description = "Only extract string literals (ignore numbers)",
        type = "boolean",
        default = false,
    },
    Shuffle = {
        name = "Shuffle",
        description = "Randomly shuffle order of constants in array",
        type = "boolean",
        default = true,
    },
    Rotate = {
        name = "Rotate",
        description = "Rotate array by random amount (unrotated at runtime)",
        type = "boolean",
        default = true,
    },
    LocalWrapperTreshold = {
        name = "LocalWrapperTreshold",
        description = "Probability of adding local wrapper table in function scopes",
        type = "number",
        default = 1,
        min = 0,
        max = 1,
    },
    LocalWrapperCount = {
        name = "LocalWrapperCount",
        description = "How many local wrapper functions per selected scope (0 = disable)",
        type = "number",
        min = 0,
        max = 512,
        default = 0,
    },
    LocalWrapperArgCount = {
        name = "LocalWrapperArgCount",
        description = "Number of dummy arguments in each local wrapper function",
        type = "number",
        min = 1,
        max = 200,
        default = 10,
    },
    MaxIndexOffset = {   -- was MaxWrapperOffset
        name = "MaxIndexOffset",
        description = "Maximum random offset for index shifting (± this value)",
        type = "number",
        min = 0,
        default = 65535,
    },
    Encoding = {
        name = "Encoding",
        description = "Encoding method for string constants",
        type = "enum",
        default = "base64",
        values = { "none", "base64", "xor" }
    }
}

local function callNameGenerator(generatorFunction, ...)
    if type(generatorFunction) == "table" then
        generatorFunction = generatorFunction.generateName
    end
    return generatorFunction(...)
end

function ConstantArray:init(settings)
    -- nothing special needed anymore
end

function ConstantArray:createArray()
    local entries = {}
    for i, v in ipairs(self.constants) do
        local value = v
        if type(v) == "string" then
            value = self:encode(v)
        end
        entries[i] = Ast.TableEntry(Ast.ConstantNode(value))
    end
    return Ast.TableConstructorExpression(entries)
end

function ConstantArray:indexing(index, data)
    if self.LocalWrapperCount > 0 and data.functionData.local_wrappers then
        local wrappers = data.functionData.local_wrappers
        local wrapper = wrappers[math.random(1, #wrappers)]

        local args = {}
        local ofs = index - self.indexOffset - wrapper.offset

        for i = 1, self.LocalWrapperArgCount do
            if i == wrapper.arg then
                args[i] = Ast.NumberExpression(ofs)
            else
                -- wider range helps a bit against pattern-based deobfuscators
                args[i] = Ast.NumberExpression(math.random(ofs - 2048, ofs + 2048))
            end
        end

        data.scope:addReferenceToHigherScope(wrappers.scope, wrappers.id)
        return Ast.FunctionCallExpression(
            Ast.IndexExpression(
                Ast.VariableExpression(wrappers.scope, wrappers.id),
                Ast.StringExpression(wrapper.index)
            ),
            args
        )
    else
        data.scope:addReferenceToHigherScope(self.rootScope, self.wrapperId)
        return Ast.FunctionCallExpression(
            Ast.VariableExpression(self.rootScope, self.wrapperId),
            { Ast.NumberExpression(index - self.indexOffset) }
        )
    end
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

-- ──────────────────────────────────────────────────────────────────────────────
--  Array rotation helpers
-- ──────────────────────────────────────────────────────────────────────────────

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

local rotateCodeTemplate = [=[
for i, v in ipairs({{1, LEN}, {1, SHIFT}, {SHIFT + 1, LEN}}) do
    while v[1] < v[2] do
        ARR[v[1]], ARR[v[2]], v[1], v[2] = ARR[v[2]], ARR[v[1]], v[1] + 1, v[2] - 1
    end
end
]=]

function ConstantArray:addRotateCode(ast, shift)
    local code = rotateCodeTemplate
        :gsub("SHIFT", tostring(shift))
        :gsub("LEN",   tostring(#self.constants))

    local parser = Parser:new({ LuaVersion = LuaVersion.Lua51 })
    local newAst = parser:parse(code)
    local forStat = newAst.body.statements[1]

    forStat.body.scope:setParent(ast.body.scope)

    visitast(newAst, nil, function(node)
        if node.kind ~= AstKind.VariableExpression then return end
        if node.scope:getVariableName(node.id) ~= "ARR" then return end

        node.scope:removeReferenceToHigherScope(node.scope, node.id)
        node.scope:addReferenceToHigherScope(self.rootScope, self.arrId)
        node.scope = self.rootScope
        node.id = self.arrId
    end)

    table.insert(ast.body.statements, 1, forStat)
end

-- ──────────────────────────────────────────────────────────────────────────────
--  Decoding logic insertion
-- ──────────────────────────────────────────────────────────────────────────────

function ConstantArray:addDecodeCode(ast)
    if self.Encoding == "none" then
        return
    end

    if self.Encoding == "base64" then
        self:addBase64DecodeCode(ast)
    elseif self.Encoding == "xor" then
        self:addXorDecodeCode(ast)
    end
end

function ConstantArray:addBase64DecodeCode(ast)
    local code = [[
do
    local lookup = LOOKUP_TABLE
    local len    = string.len
    local sub    = string.sub
    local floor  = math.floor
    local char   = string.char
    local insert = table.insert
    local concat = table.concat
    local type   = type
    local arr    = ARR

    for i = 1, #arr do
        local data = arr[i]
        if type(data) == "string" then
            local length = len(data)
            local parts = {}
            local index = 1
            local value = 0
            local count = 0

            while index <= length do
                local ch = sub(data, index, index)
                local code = lookup[ch]
                if code then
                    value = value + code * (64 ^ (3 - count))
                    count = count + 1
                    if count == 4 then
                        count = 0
                        insert(parts, char(floor(value / 65536)))
                        insert(parts, char(floor(value % 65536 / 256)))
                        insert(parts, char(value % 256))
                        value = 0
                    end
                elseif ch == "=" then
                    -- padding
                    if count > 0 then
                        insert(parts, char(floor(value / 65536)))
                        if count > 1 then
                            insert(parts, char(floor(value % 65536 / 256)))
                        end
                    end
                    break
                end
                index = index + 1
            end
            arr[i] = concat(parts)
        end
    end
end
]]

    local parser = Parser:new({ LuaVersion = LuaVersion.Lua51 })
    local newAst = parser:parse(code)
    local doStat = newAst.body.statements[1]

    doStat.body.scope:setParent(ast.body.scope)

    visitast(newAst, nil, function(node)
        if node.kind ~= AstKind.VariableExpression then return end

        local name = node.scope:getVariableName(node.id)
        if name == "ARR" then
            node.scope:removeReferenceToHigherScope(node.scope, node.id)
            node.scope:addReferenceToHigherScope(self.rootScope, self.arrId)
            node.scope = self.rootScope
            node.id = self.arrId
        elseif name == "LOOKUP_TABLE" then
            node.scope:removeReferenceToHigherScope(node.scope, node.id)
            return self:createBase64Lookup()
        end
    end)

    table.insert(ast.body.statements, 1, doStat)
end

function ConstantArray:addXorDecodeCode(ast)
    local key = math.random(1, 255)
    self.xorKey = key   -- we'll need it for encoding too

    local code = string.format([[
do
    local key = %d
    local arr = ARR
    local byte = string.byte
    local char = string.char
    for i = 1, #arr do
        local s = arr[i]
        if type(s) == "string" then
            local t = {}
            for j = 1, #s do
                t[j] = char(bit32.bxor(byte(s, j), key))
            end
            arr[i] = table.concat(t)
        end
    end
end
]], key)

    local parser = Parser:new({ LuaVersion = LuaVersion.Lua51 })
    local newAst = parser:parse(code)
    local doStat = newAst.body.statements[1]
    doStat.body.scope:setParent(ast.body.scope)

    -- replace ARR
    visitast(newAst, nil, function(node)
        if node.kind == AstKind.VariableExpression
        and node.scope:getVariableName(node.id) == "ARR" then
            node.scope:removeReferenceToHigherScope(node.scope, node.id)
            node.scope:addReferenceToHigherScope(self.rootScope, self.arrId)
            node.scope = self.rootScope
            node.id = self.arrId
        end
    end)

    table.insert(ast.body.statements, 1, doStat)
end

function ConstantArray:createBase64Lookup()
    local entries = {}
    local i = 0
    for char in string.gmatch(self.base64Alphabet, ".") do
        table.insert(entries, Ast.KeyedTableEntry(
            Ast.StringExpression(char),
            Ast.NumberExpression(i)
        ))
        i = i + 1
    end
    util.shuffle(entries)
    return Ast.TableConstructorExpression(entries)
end

function ConstantArray:encode(str)
    if self.Encoding == "none" then
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
            return self.base64Alphabet:sub(c+1, c+1)
        end) .. ({'', '==', '='})[#str % 3 + 1])
    elseif self.Encoding == "xor" then
        local t = {}
        for i = 1, #str do
            t[i] = string.char(bit32.bxor(str:byte(i), self.xorKey))
        end
        return table.concat(t)
    end
    return str -- fallback
end

function ConstantArray:apply(ast, pipeline)
    self.rootScope = ast.body.scope
    self.arrId = self.rootScope:addVariable()

    self.base64Alphabet = table.concat(util.shuffle({
        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
        "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
        "0","1","2","3","4","5","6","7","8","9","+","/"
    }))

    self.constants = {}
    self.lookup = {}

    -- Phase 1: collect constants
    visitast(ast, nil, function(node)
        if math.random() > self.Treshold then return end

        node.__apply_constant_array = true

        if node.kind == AstKind.StringExpression then
            self:addConstant(node.value)
        elseif not self.StringsOnly and node.isConstant and node.value ~= nil then
            self:addConstant(node.value)
        end
    end)

    -- Shuffle if requested
    if self.Shuffle then
        self.constants = util.shuffle(self.constants)
        self.lookup = {}
        for i, v in ipairs(self.constants) do
            self.lookup[v] = i
        end
    end

    -- Index offset (used by wrapper / local wrappers)
    self.indexOffset = math.random(-self.MaxIndexOffset, self.MaxIndexOffset)
    self.wrapperId = self.rootScope:addVariable()

    -- Phase 2: replacement + local wrappers
    visitast(ast, function(node, data)
        -- local wrapper table decision
        if self.LocalWrapperCount > 0
        and node.kind == AstKind.Block
        and node.isFunctionBlock
        and math.random() <= self.LocalWrapperTreshold then

            local id = node.scope:addVariable()
            data.functionData.local_wrappers = { id = id, scope = node.scope }

            local nameLookup = {}
            for i = 1, self.LocalWrapperCount do
                local name
                repeat
                    name = callNameGenerator(pipeline.namegenerator, math.random(1, self.LocalWrapperArgCount * 16))
                until not nameLookup[name]
                nameLookup[name] = true

                local offset = math.random(-self.MaxIndexOffset, self.MaxIndexOffset)
                local argPos = math.random(1, self.LocalWrapperArgCount)

                data.functionData.local_wrappers[i] = {
                    arg    = argPos,
                    index  = name,
                    offset = offset,
                }
            end
            data.functionData.__used = false
        end

        if node.__apply_constant_array then
            data.functionData.__used = true
        end
    end, function(node, data)
        -- replace constant → index access
        if node.__apply_constant_array then
            local replacement
            if node.kind == AstKind.StringExpression then
                replacement = self:getConstant(node.value, data)
            elseif not self.StringsOnly and node.isConstant and node.value ~= nil then
                replacement = self:getConstant(node.value, data)
            end
            node.__apply_constant_array = nil
            if replacement then return replacement end
        end

        -- insert local wrapper table
        if self.LocalWrapperCount > 0
        and node.kind == AstKind.Block
        and node.isFunctionBlock
        and data.functionData.local_wrappers
        and data.functionData.__used then

            data.functionData.__used = nil
            local wrappers = data.functionData.local_wrappers

            local elems = {}
            for i = 1, self.LocalWrapperCount do
                local w = wrappers[i]
                local funcScope = Scope:new(node.scope)
                local args = {}
                local realArg

                for j = 1, self.LocalWrapperArgCount do
                    args[j] = funcScope:addVariable()
                    if j == w.arg then realArg = args[j] end
                end

                local indexExpr
                if w.offset < 0 then
                    indexExpr = Ast.SubExpression(
                        Ast.VariableExpression(funcScope, realArg),
                        Ast.NumberExpression(-w.offset)
                    )
                else
                    indexExpr = Ast.AddExpression(
                        Ast.VariableExpression(funcScope, realArg),
                        Ast.NumberExpression(w.offset)
                    )
                end

                funcScope:addReferenceToHigherScope(self.rootScope, self.wrapperId)

                local call = Ast.FunctionCallExpression(
                    Ast.VariableExpression(self.rootScope, self.wrapperId),
                    { indexExpr }
                )

                elems[i] = Ast.KeyedTableEntry(
                    Ast.StringExpression(w.index),
                    Ast.FunctionLiteralExpression(
                        args,
                        Ast.Block({
                            Ast.ReturnStatement({ call })
                        }, funcScope)
                    )
                )
            end

            table.insert(node.statements, 1, Ast.LocalVariableDeclaration(
                node.scope,
                { wrappers.id },
                { Ast.TableConstructorExpression(elems) }
            ))
        end
    end)

    -- Add decode / rotate / wrapper steps in random order
    self:addDecodeCode(ast)

    local steps = util.shuffle({
        -- 1. Add global index wrapper function
        function()
            local funcScope = Scope:new(self.rootScope)
            funcScope:addReferenceToHigherScope(self.rootScope, self.arrId)

            local arg = funcScope:addVariable()
            local indexExpr

            if self.indexOffset < 0 then
                indexExpr = Ast.SubExpression(
                    Ast.VariableExpression(funcScope, arg),
                    Ast.NumberExpression(-self.indexOffset)
                )
            else
                indexExpr = Ast.AddExpression(
                    Ast.VariableExpression(funcScope, arg),
                    Ast.NumberExpression(self.indexOffset)
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
                            indexExpr
                        )
                    })
                }, funcScope)
            ))
        end,

        -- 2. Rotate array + insert unrotate code
        function()
            if not self.Rotate or #self.constants <= 1 then return end
            local shift = math.random(1, #self.constants - 1)
            rotate(self.constants, -shift)
            self:addRotateCode(ast, shift)
        end,
    })

    for _, fn in ipairs(steps) do
        fn()
    end

    -- Finally — insert the big constant array
    table.insert(ast.body.statements, 1, Ast.LocalVariableDeclaration(
        self.rootScope,
        { self.arrId },
        { self:createArray() }
    ))

    -- cleanup
    self.rootScope   = nil
    self.arrId       = nil
    self.constants   = nil
    self.lookup      = nil
    self.xorKey      = nil
end

return ConstantArray
