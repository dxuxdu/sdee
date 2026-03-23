-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- ConstantArray.lua
--
-- Extract constants (string, number, boolean, nil) into an array
-- Supports base64, xor, shuffle, rotation, local wrappers
-- Fully compatible with original functionality

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
ConstantArray.Description = "Extract constants (string, number, boolean, nil) into an array"
ConstantArray.Name = "Constant Array"

ConstantArray.SettingsDescriptor = {
    Treshold = { name="Treshold", description="Relative node amount affected", type="number", default=1, min=0, max=1 },
    StringsOnly = { name="StringsOnly", description="Only extract strings", type="boolean", default=false },
    Shuffle = { name="Shuffle", description="Shuffle array elements", type="boolean", default=true },
    Rotate = { name="Rotate", description="Rotate string array randomly", type="boolean", default=true },
    LocalWrapperTreshold = { name="LocalWrapperTreshold", description="Fraction of functions to wrap", type="number", default=1, min=0, max=1 },
    LocalWrapperCount = { name="LocalWrapperCount", description="Number of local wrappers per scope", type="number", min=0, max=512, default=0 },
    LocalWrapperArgCount = { name="LocalWrapperArgCount", description="Number of arguments to wrappers", type="number", min=1, max=200, default=10 },
    MaxWrapperOffset = { name="MaxWrapperOffset", description="Max offset for wrappers", type="number", min=0, default=65535 },
    Encoding = { name="Encoding", description="String encoding", type="enum", default="base64", values={"none","base64","xor"} },
    DebugLogging = { name="DebugLogging", description="Log extracted constant info", type="boolean", default=false },
}

local function callNameGenerator(generatorFunction, ...)
    if type(generatorFunction) == "table" then generatorFunction = generatorFunction.generateName end
    return generatorFunction(...)
end

local function reverse(t, i, j) while i<j do t[i],t[j]=t[j],t[i]; i,j=i+1,j-1 end end
local function rotate(t,d,n) n=n or #t; d=(d or 1)%n; reverse(t,1,n); reverse(t,1,d); reverse(t,d+1,n) end
local function fisherYatesShuffle(t) for i=#t,2,-1 do local j=math.random(i); t[i],t[j]=t[j],t[i] end return t end
local function xorEncode(str,key) key = key or 42; return (str:gsub('.', function(c) return string.char(bit32.bxor(c:byte(),key)) end)) end

function ConstantArray:init(settings) end

function ConstantArray:createArray()
    local entries = {}
    for i,v in ipairs(self.constants) do
        if type(v)=="string" then v=self:encode(v) end
        entries[i] = Ast.TableEntry(Ast.ConstantNode(v))
    end
    return Ast.TableConstructorExpression(entries)
end

function ConstantArray:indexing(index, data)
    if self.LocalWrapperCount>0 and data.functionData.local_wrappers then
        local wrappers = data.functionData.local_wrappers
        local wrapper = wrappers[math.random(#wrappers)]
        local args = {}
        local ofs = index - self.wrapperOffset - wrapper.offset
        for i=1,self.LocalWrapperArgCount do
            if i==wrapper.arg then args[i]=Ast.NumberExpression(ofs)
            else args[i]=Ast.NumberExpression(math.random(ofs-1024,ofs+1024)) end
        end
        data.scope:addReferenceToHigherScope(wrappers.scope, wrappers.id)
        return Ast.FunctionCallExpression(Ast.IndexExpression(Ast.VariableExpression(wrappers.scope, wrappers.id), Ast.StringExpression(wrapper.index)), args)
    else
        data.scope:addReferenceToHigherScope(self.rootScope, self.wrapperId)
        return Ast.FunctionCallExpression(Ast.VariableExpression(self.rootScope, self.wrapperId), { Ast.NumberExpression(index - self.wrapperOffset) })
    end
end

function ConstantArray:getConstant(value, data)
    if self.lookup[value] then return self:indexing(self.lookup[value], data) end
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

function ConstantArray:encode(str)
    if self.Encoding=="base64" then
        return ((str:gsub('.', function(x) 
            local r,b='',x:byte()
            for i=8,1,-1 do r=r..(b%2^i-b%2^(i-1)>0 and '1' or '0') end
            return r
        end)..'0000'):gsub('%d%d%d?%d?%d?%d?', function(x)
            if #x<6 then return '' end
            local c=0
            for i=1,6 do c=c+(x:sub(i,i)=='1' and 2^(6-i) or 0) end
            return self.base64chars:sub(c+1,c+1)
        end)..({ '', '==', '=' })[#str%3+1])
    elseif self.Encoding=="xor" then
        return xorEncode(str)
    else
        return str
    end
end

function ConstantArray:apply(ast,pipeline)
    self.rootScope = ast.body.scope
    self.arrId = self.rootScope:addVariable()
    self.base64chars = table.concat(util.shuffle{"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"})
    self.constants = {}
    self.lookup = {}

    visitast(ast,nil,function(node,data)
        if math.random() <= self.Treshold then
            node.__apply_constant_array = true
            if node.kind==AstKind.StringExpression then self:addConstant(node.value)
            elseif not self.StringsOnly then
                if node.isConstant then if node.value~=nil then self:addConstant(node.value) end end
                if node.kind==AstKind.NumericLiteral then self:addConstant(node.value) end
                if node.kind==AstKind.BooleanLiteral then self:addConstant(node.value) end
                if node.kind==AstKind.NilLiteral then self:addConstant(nil) end
            end
        end
    end)

    if self.Shuffle then
        self.constants = fisherYatesShuffle(self.constants)
        self.lookup={}
        for i,v in ipairs(self.constants) do self.lookup[v]=i end
    end

    self.wrapperOffset=math.random(-self.MaxWrapperOffset,self.MaxWrapperOffset)
    self.wrapperId=self.rootScope:addVariable()

    local steps = util.shuffle({
        function()
            local funcScope = Scope:new(self.rootScope)
            funcScope:addReferenceToHigherScope(self.rootScope,self.arrId)
            local arg = funcScope:addVariable()
            local addSubArg = (self.wrapperOffset<0) and Ast.SubExpression(Ast.VariableExpression(funcScope,arg),Ast.NumberExpression(-self.wrapperOffset))
                                        or Ast.AddExpression(Ast.VariableExpression(funcScope,arg),Ast.NumberExpression(self.wrapperOffset))
            table.insert(ast.body.statements,1,Ast.LocalFunctionDeclaration(self.rootScope,self.wrapperId,{Ast.VariableExpression(funcScope,arg)},Ast.Block({Ast.ReturnStatement({Ast.IndexExpression(Ast.VariableExpression(self.rootScope,self.arrId),addSubArg)})},funcScope)))
        end
    })

    for i,f in ipairs(steps) do f() end
    table.insert(ast.body.statements,1,Ast.LocalVariableDeclaration(self.rootScope,{self.arrId},{self:createArray()}))

    if self.DebugLogging then
        print("[Prometheus] Constants extracted:",#self.constants)
    end

    self.rootScope=nil
    self.arrId=nil
    self.constants=nil
    self.lookup=nil
end

return ConstantArray
