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

ConstantArray.Description = "Constant Array"
ConstantArray.Name = "Constant Array"

ConstantArray.SettingsDescriptor = {
    Threshold = {type="number",default=0.85,min=0,max=1},
    StringsOnly = {type="boolean",default=true},
    Shuffle = {type="boolean",default=true},
    Rotate = {type="boolean",default=true},
    LocalWrapperThreshold = {type="number",default=0.4,min=0,max=1},
    LocalWrapperCount = {type="number",default=3,min=0,max=64},
    LocalWrapperArgCount = {type="number",default=8,min=2,max=32},
    MaxWrapperOffset = {type="number",default=32767,min=0},
    Encoding = {type="enum",default="base64",values={"none","base64"}},
    XorEncoding = {type="boolean",default=false},
    FakeConstants = {type="boolean",default=true},
    SparseArray = {type="boolean",default=false}
}

local function generateName(namegen,...)
    if type(namegen)=="table" then namegen=namegen.generateName end
    return namegen(...)
end

local function reverseTable(t,i,j)
    while i<j do t[i],t[j]=t[j],t[i] i,j=i+1,j-1 end
end

local function rotateTable(t,shift)
    local n=#t
    if n<=1 then return end
    shift=((shift or 1)%n+n)%n
    reverseTable(t,1,n)
    reverseTable(t,1,shift)
    reverseTable(t,shift+1,n)
end

function ConstantArray:encodeXor(str,key)
    local out={}
    for i=1,#str do out[i]=string.char(bit32.bxor(str:byte(i),key)) end
    return table.concat(out)
end

function ConstantArray:encodeBase64(str)
    if self.Encoding~="base64" then return str end
    local b64=self.base64Alphabet
    return ((str:gsub('.',function(c)
        local r,b='',c:byte()
        for i=8,1,-1 do r=r..(b%2^i-b%2^(i-1)>0 and'1'or'0') end
        return r
    end)..'0000'):gsub('%d%d%d?%d?%d?%d?',function(x)
        if #x<6 then return '' end
        local n=0
        for i=1,6 do n=n+(x:sub(i,i)=='1'and 2^(6-i)or 0) end
        return b64:sub(n+1,n+1)
    end)..({'','==','='})[#str%3+1])
end

function ConstantArray:init() end

function ConstantArray:createConstantArrayNode()
    local entries={}
    for _,value in pairs(self.constants) do
        local stored=value
        if type(value)=="string" then
            if self.Encoding=="base64" then stored=self:encodeBase64(stored) end
            if self.XorEncoding then stored=self:encodeXor(stored,self.xorKey) end
        end
        table.insert(entries,Ast.TableEntry(Ast.ConstantNode(stored)))
    end
    return Ast.TableConstructorExpression(entries)
end

function ConstantArray:addConstant(value)
    if self.valueToIndex[value] then return end
    local idx
    if self.SparseArray then
        repeat idx=math.random(1,9999) until not self.constants[idx]
    else
        idx=#self.constants+1
    end
    self.constants[idx]=value
    self.valueToIndex[value]=idx
end

function ConstantArray:rebuildLookup()
    self.valueToIndex={}
    for i,v in pairs(self.constants) do self.valueToIndex[v]=i end
end

function ConstantArray:buildIndexExpr(idx,data,globalWrapperId,globalOffset)
    local realIndex=idx+globalOffset
    local noise=math.random(-50,50)
    local indexExpr=Ast.AddExpression(
        Ast.NumberExpression(realIndex-noise),
        Ast.NumberExpression(noise)
    )
    if data.localWrappers and data.localWrappers.list then
        data.localWrappers.used=true
        local w=data.localWrappers.list[math.random(#data.localWrappers.list)]
        local args={}
        for i=1,self.LocalWrapperArgCount do
            args[i]=(i==w.argPos) and Ast.NumberExpression(realIndex-w.offset) or Ast.NumberExpression(math.random(-8192,8192))
        end
        return Ast.FunctionCallExpression(
            Ast.IndexExpression(
                Ast.VariableExpression(data.localWrappers.scope,data.localWrappers.id),
                Ast.StringExpression(w.name)
            ),args)
    end
    data.scope:addReferenceToHigherScope(self.rootScope,self.proxyWrapperId or globalWrapperId)
    return Ast.FunctionCallExpression(
        Ast.VariableExpression(self.rootScope,self.proxyWrapperId or globalWrapperId),
        {indexExpr}
    )
end

function ConstantArray:insertGlobalIndexWrapper(ast,wrapperId,offset)
    local funcScope=Scope:new(self.rootScope)
    local arg=funcScope:addVariable()
    local indexExpr=(offset>=0)
        and Ast.AddExpression(Ast.VariableExpression(funcScope,arg),Ast.NumberExpression(offset))
        or Ast.SubExpression(Ast.VariableExpression(funcScope,arg),Ast.NumberExpression(-offset))
    table.insert(ast.body.statements,1,Ast.LocalFunctionDeclaration(
        self.rootScope,wrapperId,
        {Ast.VariableExpression(funcScope,arg)},
        Ast.Block({
            Ast.ReturnStatement({
                Ast.IndexExpression(
                    Ast.VariableExpression(self.rootScope,self.arrId),
                    indexExpr
                )
            })
        },funcScope)
    ))
end

function ConstantArray:insertProxyWrapper(ast,globalWrapperId)
    local proxyId=self.rootScope:addVariable()
    local scope=Scope:new(self.rootScope)
    local arg=scope:addVariable()
    table.insert(ast.body.statements,1,Ast.LocalFunctionDeclaration(
        self.rootScope,proxyId,
        {Ast.VariableExpression(scope,arg)},
        Ast.Block({
            Ast.ReturnStatement({
                Ast.FunctionCallExpression(
                    Ast.VariableExpression(self.rootScope,globalWrapperId),
                    {Ast.VariableExpression(scope,arg)}
                )
            })
        },scope)
    ))
    self.proxyWrapperId=proxyId
end

function ConstantArray:insertXorDecodeLoop(ast)
    local code=([[
        for i=1,#ARR do
            local s=ARR[i]
            if type(s)=="string" then
                local r={}
                for j=1,#s do
                    r[j]=string.char(bit32.bxor(s:byte(j),%d))
                end
                ARR[i]=table.concat(r)
            end
        end
    ]]):format(self.xorKey)
    local parser=Parser:new({LuaVersion=LuaVersion.Lua51})
    local parsed=parser:parse(code)
    for _,stmt in ipairs(parsed.body.statements) do
        visitast(stmt,nil,function(node)
            if node.kind==AstKind.VariableExpression and node.scope:getVariableName(node.id)=="ARR" then
                node.scope=self.rootScope
                node.id=self.arrId
            end
        end)
        table.insert(ast.body.statements,1,stmt)
    end
end

function ConstantArray:apply(ast,pipeline)
    local rootScope=ast.body.scope
    self.rootScope=rootScope
    self.arrId=rootScope:addVariable()
    self.constants={}
    self.valueToIndex={}
    self.base64Alphabet=table.concat(util.shuffle(("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"):split("")))
    self.xorKey=math.random(1,255)

    visitast(ast,nil,function(node)
        if math.random()>self.Threshold then return end
        if node.kind==AstKind.StringExpression then
            self:addConstant(node.value)
        elseif not self.StringsOnly and node.isConstant and node.value~=nil then
            self:addConstant(node.value)
        end
    end)

    if self.FakeConstants then
        for i=1,math.random(5,15) do
            table.insert(self.constants,util.randomString(math.random(5,20)))
        end
    end

    if self.Shuffle then
        self.constants=util.shuffle(self.constants)
        self:rebuildLookup()
    end

    local globalOffset=0
    if self.Rotate and #self.constants>1 then
        globalOffset=math.random(1,#self.constants-1)
        rotateTable(self.constants,-globalOffset)
        self:rebuildLookup()
    end

    local globalWrapperId=rootScope:addVariable()

    visitast(ast,function(pre,data)
        if pre.kind==AstKind.Block and pre.isFunctionBlock and self.LocalWrapperCount>0 and math.random()<=self.LocalWrapperThreshold then
            data.localWrappers={scope=pre.scope,id=pre.scope:addVariable(),list={},used=false}
            for i=1,self.LocalWrapperCount do
                table.insert(data.localWrappers.list,{
                    name=generateName(pipeline.namegenerator,math.random(1000,999999)),
                    argPos=math.random(1,self.LocalWrapperArgCount),
                    offset=math.random(-self.MaxWrapperOffset,self.MaxWrapperOffset)
                })
            end
        end
    end,function(post,data)
        if post.kind==AstKind.StringExpression and self.valueToIndex[post.value] then
            return self:buildIndexExpr(self.valueToIndex[post.value],data,globalWrapperId,globalOffset)
        elseif not self.StringsOnly and post.isConstant and post.value~=nil and self.valueToIndex[post.value] then
            return self:buildIndexExpr(self.valueToIndex[post.value],data,globalWrapperId,globalOffset)
        end
    end)

    self:insertGlobalIndexWrapper(ast,globalWrapperId,globalOffset)
    self:insertProxyWrapper(ast,globalWrapperId)
    if self.XorEncoding then self:insertXorDecodeLoop(ast) end

    table.insert(ast.body.statements,1,Ast.LocalVariableDeclaration(
        rootScope,{self.arrId},{self:createConstantArrayNode()}
    ))

    self.rootScope=nil
    self.arrId=nil
    self.constants=nil
    self.valueToIndex=nil
end

return ConstantArray
