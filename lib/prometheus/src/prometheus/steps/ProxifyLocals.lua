-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- ProxifyLocals.lua
--
-- This Script provides a Obfuscation Step for putting all Locals into Proxy Objects

local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Scope = require("prometheus.scope")
local visitast = require("prometheus.visitast")
local RandomLiterals = require("prometheus.randomLiterals")

local AstKind = Ast.AstKind
local random = math.random

local ProifyLocals = Step:extend()
ProifyLocals.Description = "This Step wraps all locals into Proxy Objects"
ProifyLocals.Name = "Proxify Locals"

ProifyLocals.SettingsDescriptor = {
	LiteralType = {
		name = "LiteralType",
		description = "The type of the randomly generated literals",
		type = "enum",
		values = { "dictionary", "number", "string", "any" },
		default = "string",
	},
}

local function shallowcopy(orig)
    if type(orig) ~= "table" then return orig end
    local copy = {}
    for k, v in pairs(orig) do
        copy[k] = v
    end
    return copy
end

local function callNameGenerator(generatorFunction, ...)
	if type(generatorFunction) == "table" then
		generatorFunction = generatorFunction.generateName
	end
	return generatorFunction(...)
end

local MetatableExpressions = {
    { constructor = Ast.AddExpression, key = "__add" },
    { constructor = Ast.SubExpression, key = "__sub" },
    { constructor = Ast.IndexExpression, key = "__index" },
    { constructor = Ast.MulExpression, key = "__mul" },
    { constructor = Ast.DivExpression, key = "__div" },
    { constructor = Ast.PowExpression, key = "__pow" },
    { constructor = Ast.StrCatExpression, key = "__concat" }
}

function ProifyLocals:init(settings)
	self.LiteralType = settings and settings.LiteralType or "string"
end

local function generateLocalMetatableInfo(pipeline)
    local usedOps = {}
    local info = {}

    for _, name in ipairs({ "setValue", "getValue", "index" }) do
        local rop
        repeat
            rop = MetatableExpressions[random(#MetatableExpressions)]
        until not usedOps[rop]
        usedOps[rop] = true
        info[name] = rop
    end

    info.valueName = callNameGenerator(pipeline.namegenerator, random(1, 4096))
    return info
end

function ProifyLocals:CreateAssignmentExpression(info, expr, parentScope)
    local metatableVals = {}

    -- setValue
    local setScope = Scope:new(parentScope)
    local selfVar = setScope:addVariable()
    local argVar = setScope:addVariable()

    local setFunc = Ast.FunctionLiteralExpression(
        {
            Ast.VariableExpression(setScope, selfVar),
            Ast.VariableExpression(setScope, argVar),
        },
        Ast.Block({
            Ast.AssignmentStatement({
                Ast.AssignmentIndexing(
                    Ast.VariableExpression(setScope, selfVar),
                    Ast.StringExpression(info.valueName)
                )
            }, {
                Ast.VariableExpression(setScope, argVar)
            })
        }, setScope)
    )

    metatableVals[#metatableVals + 1] =
        Ast.KeyedTableEntry(Ast.StringExpression(info.setValue.key), setFunc)

    -- getValue
    local getScope = Scope:new(parentScope)
    local getSelf = getScope:addVariable()
    local getArg = getScope:addVariable()

    local valueExpr
    if info.getValue.key == "__index" or info.setValue.key == "__index" then
        valueExpr = Ast.FunctionCallExpression(
            Ast.VariableExpression(getScope:resolveGlobal("rawget")),
            {
                Ast.VariableExpression(getScope, getSelf),
                Ast.StringExpression(info.valueName),
            }
        )
    else
        valueExpr = Ast.IndexExpression(
            Ast.VariableExpression(getScope, getSelf),
            Ast.StringExpression(info.valueName)
        )
    end

    local getFunc = Ast.FunctionLiteralExpression(
        {
            Ast.VariableExpression(getScope, getSelf),
            Ast.VariableExpression(getScope, getArg),
        },
        Ast.Block({
            Ast.ReturnStatement({ valueExpr })
        }, getScope)
    )

    metatableVals[#metatableVals + 1] =
        Ast.KeyedTableEntry(Ast.StringExpression(info.getValue.key), getFunc)

    parentScope:addReferenceToHigherScope(self.setMetatableVarScope, self.setMetatableVarId)

    return Ast.FunctionCallExpression(
        Ast.VariableExpression(self.setMetatableVarScope, self.setMetatableVarId),
        {
            Ast.TableConstructorExpression({
                Ast.KeyedTableEntry(Ast.StringExpression(info.valueName), expr)
            }),
            Ast.TableConstructorExpression(metatableVals)
        }
    )
end

function ProifyLocals:apply(ast, pipeline)
    local localMetatableInfos = {}

    local function getInfo(scope, id)
        if scope.isGlobal then return nil end

        localMetatableInfos[scope] = localMetatableInfos[scope] or {}
        local existing = localMetatableInfos[scope][id]

        if existing then
            return existing.locked and nil or existing
        end

        local info = generateLocalMetatableInfo(pipeline)
        localMetatableInfos[scope][id] = info
        return info
    end

    local function disable(scope, id)
        if scope.isGlobal then return end
        localMetatableInfos[scope] = localMetatableInfos[scope] or {}
        localMetatableInfos[scope][id] = { locked = true }
    end

    self.setMetatableVarScope = ast.body.scope
    self.setMetatableVarId = ast.body.scope:addVariable()

    self.emptyFunctionScope = ast.body.scope
    self.emptyFunctionId = ast.body.scope:addVariable()
    self.emptyFunctionUsed = false

    table.insert(ast.body.statements, 1,
        Ast.LocalVariableDeclaration(self.emptyFunctionScope, { self.emptyFunctionId }, {
            Ast.FunctionLiteralExpression({}, Ast.Block({}, Scope:new(ast.body.scope)))
        })
    )

    visitast(ast,
        function(node, data)
            if node.kind == AstKind.ForStatement then
                disable(node.scope, node.id)
            elseif node.kind == AstKind.ForInStatement then
                for _, id in ipairs(node.ids) do
                    disable(node.scope, id)
                end
            elseif node.kind == AstKind.FunctionDeclaration
                or node.kind == AstKind.LocalFunctionDeclaration
                or node.kind == AstKind.FunctionLiteralExpression then

                for _, expr in ipairs(node.args) do
                    if expr.kind == AstKind.VariableExpression then
                        disable(expr.scope, expr.id)
                    end
                end
            elseif node.kind == AstKind.AssignmentStatement then
                if #node.lhs == 1 and node.lhs[1].kind == AstKind.AssignmentVariable then
                    local var = node.lhs[1]
                    local info = getInfo(var.scope, var.id)

                    if info then
                        local args = shallowcopy(node.rhs)
                        local vexp = Ast.VariableExpression(var.scope, var.id)
                        vexp.__ignoreProxifyLocals = true

                        args[1] = info.setValue.constructor(vexp, args[1])

                        self.emptyFunctionUsed = true
                        data.scope:addReferenceToHigherScope(self.emptyFunctionScope, self.emptyFunctionId)

                        return Ast.FunctionCallStatement(
                            Ast.VariableExpression(self.emptyFunctionScope, self.emptyFunctionId),
                            args
                        )
                    end
                end
            end
        end,
        function(node)
            if node.kind == AstKind.LocalVariableDeclaration then
                for i, id in ipairs(node.ids) do
                    local expr = node.expressions[i] or Ast.NilExpression()
                    local info = getInfo(node.scope, id)

                    if info then
                        node.expressions[i] =
                            self:CreateAssignmentExpression(info, expr, node.scope)
                    end
                end
            elseif node.kind == AstKind.VariableExpression and not node.__ignoreProxifyLocals then
                local info = getInfo(node.scope, node.id)

                if info then
                    local literal
                    if self.LiteralType == "dictionary" then
                        literal = RandomLiterals.Dictionary()
                    elseif self.LiteralType == "number" then
                        literal = RandomLiterals.Number()
                    elseif self.LiteralType == "string" then
                        literal = RandomLiterals.String(pipeline)
                    else
                        literal = RandomLiterals.Any(pipeline)
                    end

                    return info.getValue.constructor(node, literal)
                end
            elseif node.kind == AstKind.AssignmentVariable then
                local info = getInfo(node.scope, node.id)
                if info then
                    return Ast.AssignmentIndexing(node, Ast.StringExpression(info.valueName))
                end
            elseif node.kind == AstKind.LocalFunctionDeclaration then
                local info = getInfo(node.scope, node.id)
                if info then
                    local func = Ast.FunctionLiteralExpression(node.args, node.body)
                    return Ast.LocalVariableDeclaration(
                        node.scope,
                        { node.id },
                        { self:CreateAssignmentExpression(info, func, node.scope) }
                    )
                end
            elseif node.kind == AstKind.FunctionDeclaration then
                local info = getInfo(node.scope, node.id)
                if info then
                    table.insert(node.indices, 1, info.valueName)
                end
            end
        end
    )

    table.insert(ast.body.statements, 1,
        Ast.LocalVariableDeclaration(self.setMetatableVarScope, { self.setMetatableVarId }, {
            Ast.VariableExpression(self.setMetatableVarScope:resolveGlobal("setmetatable"))
        })
    )
end

return ProifyLocals
