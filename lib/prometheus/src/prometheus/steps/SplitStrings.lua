-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- SplitStrings.lua
--
-- This Script provides a Simple Obfuscation Step for splitting Strings

local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local visitAst = require("prometheus.visitast")
local Parser = require("prometheus.parser")
local util = require("prometheus.util")
local enums = require("prometheus.enums")

local LuaVersion = enums.LuaVersion
local AstKind = Ast.AstKind
local random = math.random
local str_len = string.len
local str_sub = string.sub

local SplitStrings = Step:extend()
SplitStrings.Description = "This Step splits Strings to a specific or random length"
SplitStrings.Name = "Split Strings"

SplitStrings.SettingsDescriptor = {
	Treshold = {
		name = "Treshold",
		description = "The relative amount of nodes that will be affected",
		type = "number",
		default = 1,
		min = 0,
		max = 1,
	},
	MinLength = {
		name = "MinLength",
		description = "The minimal length for the chunks in that the Strings are splitted",
		type = "number",
		default = 5,
		min = 1,
		max = nil,
	},
	MaxLength = {
		name = "MaxLength",
		description = "The maximal length for the chunks in that the Strings are splitted",
		type = "number",
		default = 5,
		min = 1,
		max = nil,
	},
	ConcatenationType = {
		name = "ConcatenationType",
		type = "enum",
		values = { "strcat", "table", "custom" },
		default = "custom",
	},
	CustomFunctionType = {
		name = "CustomFunctionType",
		type = "enum",
		values = { "global", "local", "inline" },
		default = "global",
	},
	CustomLocalFunctionsCount = {
		name = "CustomLocalFunctionsCount",
		type = "number",
		default = 2,
		min = 1,
	}
}

function SplitStrings:init(settings) end

local function generateStrCatNode(chunks)
	local node = Ast.StringExpression(chunks[1])
	for i = 2, #chunks do
		node = Ast.StrCatExpression(node, Ast.StringExpression(chunks[i]))
	end
	return node
end

local function generateTableConcatNode(chunks, data)
	local entries = {}
	for i = 1, #chunks do
		entries[i] = Ast.TableEntry(Ast.StringExpression(chunks[i]))
	end

	data.scope:addReferenceToHigherScope(data.tableConcatScope, data.tableConcatId)

	return Ast.FunctionCallExpression(
		Ast.VariableExpression(data.tableConcatScope, data.tableConcatId),
		{ Ast.TableConstructorExpression(entries) }
	)
end

local customVariants = 2

local custom1Code = [[
function custom(table)
    local stringTable, str = table[#table], ""
    for i=1,#stringTable do
        str = str .. stringTable[table[i]]
    end
    return str
end
]]

local custom2Code = [[
function custom(tb)
	local str = ""
	for i=1,#tb/2 do
		str = str .. tb[#tb/2 + tb[i]]
	end
	return str
end
]]

local function generateCustomFunctionLiteral(parentScope, variant)
	local parser = Parser:new({ LuaVersion = LuaVersion.Lua52 })
	local code = (variant == 1) and custom1Code or custom2Code
	local node = parser:parse(code).body.statements[1]

	node.body.scope:setParent(parentScope)
	return Ast.FunctionLiteralExpression(node.args, node.body)
end

local function generateCustomNodeArgs(chunks, variant)
	local indices = {}
	for i = 1, #chunks do indices[i] = i end
	util.shuffle(indices)

	local shuffled = {}
	for i = 1, #indices do
		shuffled[indices[i]] = chunks[i]
	end

	local entries = {}

	if variant == 1 then
		for i = 1, #indices do
			entries[#entries + 1] = Ast.TableEntry(Ast.NumberExpression(indices[i]))
		end

		local strEntries = {}
		for i = 1, #shuffled do
			strEntries[i] = Ast.TableEntry(Ast.StringExpression(shuffled[i]))
		end

		entries[#entries + 1] = Ast.TableEntry(Ast.TableConstructorExpression(strEntries))
	else
		for i = 1, #indices do
			entries[#entries + 1] = Ast.TableEntry(Ast.NumberExpression(indices[i]))
		end
		for i = 1, #shuffled do
			entries[#entries + 1] = Ast.TableEntry(Ast.StringExpression(shuffled[i]))
		end
	end

	return { Ast.TableConstructorExpression(entries) }
end

function SplitStrings:variant()
	return random(1, customVariants)
end

function SplitStrings:apply(ast, pipeline)
	local data = {}

	if self.ConcatenationType == "table" then
		local scope = ast.body.scope
		data.tableConcatScope = scope
		data.tableConcatId = scope:addVariable()
	elseif self.ConcatenationType == "custom" and self.CustomFunctionType == "global" then
		local scope = ast.body.scope
		data.customFuncScope = scope
		data.customFuncId = scope:addVariable()
		data.customFunctionVariant = self:variant()
	end

	visitAst(ast,
		function(node, data)
			if self.ConcatenationType == "custom"
				and self.CustomFunctionType == "local"
				and node.kind == AstKind.Block
				and node.isFunctionBlock then

				data.functionData.localFunctions = {}

				for i = 1, self.CustomLocalFunctionsCount do
					local scope = data.scope
					data.functionData.localFunctions[i] = {
						scope = scope,
						id = scope:addVariable(),
						variant = self:variant(),
						used = false
					}
				end
			end
		end,
		function(node, data)
			if self.ConcatenationType == "custom"
				and self.CustomFunctionType == "local"
				and node.kind == AstKind.Block
				and node.isFunctionBlock then

				for _, func in ipairs(data.functionData.localFunctions) do
					if func.used then
						table.insert(node.statements, 1,
							Ast.LocalVariableDeclaration(func.scope, { func.id },
								{ generateCustomFunctionLiteral(func.scope, func.variant) }
							)
						)
					end
				end
			end

			if node.kind == AstKind.StringExpression then
				local str = node.value
				local len = str_len(str)
				local chunks = {}
				local i = 1

				while i <= len do
					local size = random(self.MinLength, self.MaxLength)
					chunks[#chunks + 1] = str_sub(str, i, i + size - 1)
					i = i + size
				end

				if #chunks > 1 and random() < self.Treshold then
					if self.ConcatenationType == "strcat" then
						return generateStrCatNode(chunks), true
					elseif self.ConcatenationType == "table" then
						return generateTableConcatNode(chunks, data), true
					else
						if self.CustomFunctionType == "global" then
							data.scope:addReferenceToHigherScope(data.customFuncScope, data.customFuncId)
							return Ast.FunctionCallExpression(
								Ast.VariableExpression(data.customFuncScope, data.customFuncId),
								generateCustomNodeArgs(chunks, data.customFunctionVariant)
							), true
						elseif self.CustomFunctionType == "local" then
							local funcs = data.functionData.localFunctions
							local f = funcs[random(#funcs)]
							f.used = true

							data.scope:addReferenceToHigherScope(f.scope, f.id)

							return Ast.FunctionCallExpression(
								Ast.VariableExpression(f.scope, f.id),
								generateCustomNodeArgs(chunks, f.variant)
							), true
						else
							local variant = self:variant()
							return Ast.FunctionCallExpression(
								generateCustomFunctionLiteral(data.scope, variant),
								generateCustomNodeArgs(chunks, variant)
							), true
						end
					end
				end
			end
		end,
		data
	)

	if self.ConcatenationType == "table" then
		local g = data.globalScope
		local scope, id = g:resolve("table")

		ast.body.scope:addReferenceToHigherScope(g, id)

		table.insert(ast.body.statements, 1,
			Ast.LocalVariableDeclaration(data.tableConcatScope, { data.tableConcatId },
				{ Ast.IndexExpression(Ast.VariableExpression(scope, id), Ast.StringExpression("concat")) }
			)
		)
	elseif self.ConcatenationType == "custom" and self.CustomFunctionType == "global" then
		table.insert(ast.body.statements, 1,
			Ast.LocalVariableDeclaration(data.customFuncScope, { data.customFuncId },
				{ generateCustomFunctionLiteral(data.customFuncScope, data.customFunctionVariant) }
			)
		)
	end
end

return SplitStrings
