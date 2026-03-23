-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- AntiTamper.lua (improved environment + anti-hook variant)
--
-- This Step adds strong environment validation + basic anti-debug/tamper checks.
-- It breaks / warns when run outside Roblox or under heavy modification/hooks.

local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Parser = require("prometheus.parser")
local Enums = require("prometheus.enums")
local logger = require("logger")

local AntiTamper = Step:extend()

AntiTamper.Description = "Adds Roblox environment validation + anti-hook/timing checks. Effective against many sandboxes, debuggers and basic tamper attempts."
AntiTamper.Name = "Anti Tamper (improved)"
AntiTamper.SettingsDescriptor = {}

function AntiTamper:init(settings)
    -- No settings used in this version
end

function AntiTamper:apply(ast, pipeline)
    if pipeline.PrettyPrint then
        logger:warn(string.format("\"%s\" cannot be used with PrettyPrint, ignoring", self.Name))
        return ast
    end

    local code = [[
do
    local function isTampered()
        -- 1. Basic Roblox env presence
        if typeof == nil or typeof(game) ~= "Instance" or game.ClassName ~= "DataModel" then
            return true
        end

        -- 2. Service enumeration / hook check
        local ok, rs = pcall(game.GetService, game, "RunService")
        if not ok or typeof(rs) ~= "Instance" or rs.ClassName ~= "RunService" then
            return true
        end

        local ok2, ps = pcall(game.GetService, game, "Players")
        if not ok2 or typeof(ps) ~= "Instance" or ps.ClassName ~= "Players" then
            return true
        end

        -- 3. Heartbeat timing + hook detection (many exploits delay or skip heartbeats)
        local heartbeat = rs.Heartbeat
        local count = 0
        local conn
        local start = os.clock()

        conn = heartbeat:Connect(function()
            count = count + 1
            if count >= 4 then
                conn:Disconnect()
            end
        end)

        -- Wait ~0.2-0.3s real time (os.clock is process CPU time â†’ affected by heavy hooks/debug)
        local waited = 0
        while waited < 0.25 and count < 4 do
            task.wait(0.06)
            waited = os.clock() - start
        end

        local reached = (count >= 3)

        -- Clean up
        if conn.Connected then conn:Disconnect() end

        if not reached then
            return true  -- too slow / hooked / no heartbeat
        end

        -- 4. Extra cheap string function integrity (many exploits hook gmatch / gsub)
        local testStr = "test:123:abc"
        local parts = {}
        for part in string.gmatch(testStr, "([^:]+)") do
            table.insert(parts, part)
        end
        if #parts ~= 3 or parts[2] ~= "123" then
            return true
        end

        -- 5. getrenv / getgc basic presence (some exploits mess with these)
        if getrenv == nil or type(getrenv) ~= "function" or getgc == nil then
            return true
        end

        return false  -- looks clean
    end

    local tampered = isTampered()

    if tampered then
        warn("skid")
        -- Infinite annoying loop (can be made worse with math.random junk)
        while true do
            task.wait(9e9)
        end
    else
        print("rest in peace my granny she got hit by a bazooka")
    end
end
]]

    local parser = Parser:new({LuaVersion = Enums.LuaVersion.Lua51})
    local parsed = parser:parse(code)

    local doBlock = parsed.body.statements[1]
    -- Link scope so variables don't conflict with rest of script
    doBlock.body.scope:setParent(ast.body.scope)

    -- Insert right at the beginning
    table.insert(ast.body.statements, 1, doBlock)

    return ast
end

return AntiTamper
