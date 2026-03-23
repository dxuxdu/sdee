-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- EncryptStrings.lua
--
-- Encrypts string literals using per-string seeds + streaming PRNG

local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Scope = require("prometheus.scope")
local Parser = require("prometheus.parser")
local Enums = require("prometheus.enums")
local logger = require("logger")
local visitast = require("prometheus.visitast")
local util = require("prometheus.util")

local AstKind = Ast.AstKind

local EncryptStrings = Step:extend()

EncryptStrings.Description = "Encrypts string literals using per-string seeds and a custom PRNG"
EncryptStrings.Name = "Encrypt Strings"

EncryptStrings.SettingsDescriptor = {
    ShuffleCharmap = {
        name = "Shuffle character map",
        description = "Whether to create a randomized 0-255 → char mapping (recommended)",
        type = "boolean",
        default = true
    },
    AddAntiTamperCheck = {
        name = "Add lightweight anti-tampering check",
        description = "Adds simple runtime check that detects basic metatable tampering",
        type = "boolean",
        default = true
    }
}

function EncryptStrings:init(settings)
    self.settings = settings or {}
end

function EncryptStrings:CreateEncryptionService()
    local usedSeeds = {}

    -- Fixed per-obfuscation run secrets
    local secret_key_6  = math.random(0, 63)           -- 6 bit
    local secret_key_7  = math.random(0, 127)          -- 7 bit
    local secret_key_44 = math.random(0, 17592186044415) -- 44 bit
    local secret_key_8  = math.random(0, 255)          -- 8 bit (used in chaining)

    local floor = math.floor

    -- Very small & fast LCG-style parameters derived from secrets
    local param_mul_45 = secret_key_6 * 4 + 1
    local param_add_45 = secret_key_44 * 2 + 1

    local param_mul_8 = (function()
        local g, m, d = 1, 128, 2 * secret_key_7 + 1
        repeat
            g = g * g * (d >= m and 3 or 1) % 257
            m = m / 2
            d = d % m
        until m < 1
        return g
    end)()

    local state_45 = 0
    local state_8  = 2
    local prev_values = {}

    local function set_seed(seed)
        state_45 = seed % 35184372088832
        state_8  = seed % 255 + 2
        prev_values = {}
    end

    local function gen_seed()
        local seed
        repeat
            seed = math.random(0, 35184372088832 - 1)
        until not usedSeeds[seed]
        usedSeeds[seed] = true
        return seed
    end

    local function get_random_32()
        state_45 = (state_45 * param_mul_45 + param_add_45) % 35184372088832

        repeat
            state_8 = state_8 * param_mul_8 % 257
        until state_8 ~= 1

        local r = state_8 % 32
        local shift = 13 - (state_8 - r) / 32
        local n = floor(state_45 / 2 ^ shift) % 2 ^ 32 / 2 ^ r

        local hi = floor(n)
        local lo = floor((n - hi) * 2 ^ 32)
        return hi + lo   -- ≈ unsigned 32-bit value
    end

    local function get_next_pseudo_random_byte()
        if #prev_values == 0 then
            local rnd = get_random_32()
            local low16  =  rnd         % 65536
            local high16 = (rnd - low16) / 65536
            prev_values = {
                low16  % 256,
                floor(low16  / 256) % 256,
                high16 % 256,
                floor(high16 / 256) % 256,
            }
        end
        return table.remove(prev_values)
    end

    local function encrypt(str)
        local seed = gen_seed()
        set_seed(seed)

        local len = #str
        local out = {}
        local prev = secret_key_8

        for i = 1, len do
            local b = str:byte(i)
            out[i] = string.char((b - get_next_pseudo_random_byte() - prev) % 256)
            prev = b
        end

        return table.concat(out), seed
    end

    local function generateBootstrapCode()
        local shuffleCode = self.settings.ShuffleCharmap and [[
    local nums = {}
    for i = 1, 256 do nums[i] = i end

    local charmap = {}
    repeat
        local idx = math.random(1, #nums)
        local n = table.remove(nums, idx)
        charmap[n] = string.char(n-1)
    until #nums == 0
]] or [[
    local charmap = {}
    for i = 0, 255 do charmap[i+1] = string.char(i) end
]]

        local tamperCheck = self.settings.AddAntiTamperCheck and [[
    -- very basic anti-metatable tampering check
    if getmetatable(STRINGS) ~= nil then
        error("i got VVS u got fake gems", 0)
    end
]] or ""

        return ([[
do
    local _floor   = math.floor
    local _random  = math.random
    local _remove  = table.remove
    local _char    = string.char
    local _len     = string.len
    local _byte    = string.byte

    local state_45 = 0
    local state_8  = 2
    local prev_values = {}

    %s

    local function get_next_pseudo_random_byte()
        if #prev_values == 0 then
            state_45 = (state_45 * %d + %d) %% 35184372088832

            repeat
                state_8 = state_8 * %d %% 257
            until state_8 ~= 1

            local r = state_8 %% 32
            local shift = 13 - (state_8 - r) / 32
            local n = _floor(state_45 / 2 ^ shift) %% 2^32 / 2^r

            local rnd = _floor(n) + _floor((n - _floor(n)) * 2^32)
            local low16  = rnd %% 65536
            local high16 = (rnd - low16) / 65536

            prev_values = {
                low16  %% 256,
                _floor(low16  / 256) %% 256,
                high16 %% 256,
                _floor(high16 / 256) %% 256,
            }
        end
        return _remove(prev_values)
    end

    local realStrings = {}
    local STRINGS = setmetatable({}, {
        __index = realStrings,
        __metatable = "protected"
    })

    %s

    local function DECRYPT(enc, seed)
        if realStrings[seed] then
            return realStrings[seed]
        end

        prev_values = {}
        state_45 = seed %% 35184372088832
        state_8  = seed %% 255 + 2

        local prev = %d
        local result = ""

        for i = 1, _len(enc) do
            local cipher = _byte(enc, i)
            local plain  = (cipher + get_next_pseudo_random_byte() + prev) %% 256
            result = result .. charmap[plain + 1]
            prev = plain
        end

        realStrings[seed] = result
        return result
    end
end
]]):format(
            shuffleCode,
            param_mul_45,
            param_add_45,
            param_mul_8,
            tamperCheck,
            secret_key_8
        )
    end

    return {
        encrypt          = encrypt,
        generateBootstrapCode = generateBootstrapCode,
        secret_key_8     = secret_key_8,
        param_mul_45     = param_mul_45,
        param_add_45     = param_add_45,
        param_mul_8      = param_mul_8,
    }
end

function EncryptStrings:apply(ast, pipeline)
    local crypto = self:CreateEncryptionService()

    -- Parse bootstrap code
    local parser = Parser:new({ LuaVersion = Enums.LuaVersion.Lua51 })
    local bootstrapAst = parser:parse(crypto.generateBootstrapCode())
    local doBlock = bootstrapAst.body.statements[1]

    local rootScope = ast.body.scope

    -- Create new variables in root scope
    local varDecrypt = rootScope:addVariable("DECRYPT")
    local varStrings = rootScope:addVariable("STRINGS")

    -- Reparent bootstrap scope
    doBlock.body.scope:setParent(rootScope)

    -- Rename DECRYPT and STRINGS to our new variables
    visitast(bootstrapAst, nil, function(node)
        if node.kind == AstKind.FunctionDeclaration then
            local name = node.scope:getVariableName(node.id)
            if name == "DECRYPT" then
                node.scope:removeReferenceToHigherScope(node.scope, node.id)
                node.scope:addReferenceToHigherScope(rootScope, varDecrypt)
                node.id = varDecrypt
                node.scope = rootScope
            end
        elseif node.kind == AstKind.AssignmentVariable or node.kind == AstKind.VariableExpression then
            local name = node.scope:getVariableName(node.id)
            if name == "STRINGS" then
                node.scope:removeReferenceToHigherScope(node.scope, node.id)
                node.scope:addReferenceToHigherScope(rootScope, varStrings)
                node.id = varStrings
                node.scope = rootScope
            end
        end
    end)

    -- Replace all string literals
    visitast(ast, nil, function(node, parent, key, idx)
        if node.kind ~= AstKind.StringExpression then
            return
        end

        local enc, seed = crypto.encrypt(node.value)

        -- STRINGS[DECRYPT("encrypted", seed)]
        local replacement = Ast.IndexExpression(
            Ast.VariableExpression(rootScope, varStrings),
            Ast.FunctionCallExpression(
                Ast.VariableExpression(rootScope, varDecrypt),
                {
                    Ast.StringExpression(enc),
                    Ast.NumberExpression(seed)
                }
            )
        )

        -- Tell visitor to replace this node
        return replacement
    end)

    -- Insert bootstrap code + local declaration at the top
    table.insert(ast.body.statements, 1, doBlock)
    table.insert(ast.body.statements, 1, Ast.LocalVariableDeclaration(
        rootScope,
        util.shuffle{ varDecrypt, varStrings },
        {}
    ))

    return ast
end

return EncryptStrings
