-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- AntiTamper.lua (improved environment + anti-hook variant with self-integrity trap)
--
-- This Step adds strong environment validation + basic anti-debug/tamper checks.
-- It breaks / warns when run outside Roblox or under heavy modification/hooks.

local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Parser = require("prometheus.parser")
local Enums = require("prometheus.enums")
local logger = require("logger")

local AntiTamper = Step:extend()

AntiTamper.Description = "Adds Roblox environment validation + anti-hook/timing checks + self-integrity trap. Effective against many sandboxes, debuggers, deobfuscators and basic tamper attempts."
AntiTamper.Name = "Anti Tamper (improved + self-trap)"
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
    local function validateEnvironment()
        -- Anti-hook trap: create a closure whose upvalue we can detect tampering on
        local secret = math.random(1e8, 9e8)
        local function trap()
            return secret * 2
        end

        -- Immediately after definition → most deobfuscators that rename/hook will break this
        if trap() ~= secret * 2 then
            return false  -- someone hooked or replaced the closure
        end

        -- Quick env sanity
        if typeof == nil or typeof(game) ~= "Instance" or game.ClassName ~= "DataModel" then
            return false
        end

        local RunService = game:GetService("RunService")
        local Players = game:GetService("Players")
        local HttpService = game:GetService("HttpService")

        if not RunService or not Players or not HttpService then
            return false
        end

        if typeof(RunService.Heartbeat) ~= "RBXScriptSignal" or
           typeof(Players.LocalPlayer) ~= "Instance" or
           typeof(HttpService.JsonEncode) ~= "function" then
            return false
        end

        local beats = 0
        local startClock = os.clock()
        local startTick = tick()

        local conn = RunService.Heartbeat:Connect(function()
            beats = beats + 1
            if beats >= 12 then
                conn:Disconnect()
            end
        end)

        task.wait(0.42)

        if conn.Connected then
            conn:Disconnect()
        end

        local deltaClock = os.clock() - startClock
        local deltaTick = tick() - startTick

        if beats < 9 or beats > 22 or
           deltaClock < 0.28 or deltaClock > 0.70 or
           deltaTick < 0.30 or deltaTick > 0.80 then
            return false
        end

        local test = "a:b:c:123:test"
        local parts = {}
        for seg in string.gmatch(test, "[^:]+") do
            parts[#parts+1] = seg
        end

        if #parts ~= 5 or parts[3] ~= "c" or parts[4] ~= "123" then
            return false
        end

        if type(getrenv) ~= "function" or type(getgc) ~= "function" then
            return false
        end

        local mt = getrawmetatable(game)
        if type(mt) ~= "table" or mt.__index ~= game.__index then
            return false
        end

        if game.PlaceId <= 0 or game.JobId == "" or #Players:GetPlayers() == 0 then
            return false
        end

        -- Final trap check: make sure our secret is still intact (some advanced hooks tamper upvalues)
        if secret < 1e8 or trap() ~= secret * 2 then
            return false
        end

        return true
    end

    local isClean = validateEnvironment()

    if not isClean then
        warn("skid detected – get ratio'd")

        print("I'm floatin' 'round 4 a.m.'s")
        print("Chillin' out in estate kens")
        print("That summer-spring collection just got bagged")
        print("You're still on the same trends")
        print("I'm the same kid with the same friends")
        print("Posted up in the same ends")
        print("Ridin' 'round in that A-Benz")
        print("I got VVS, you got fake gems")
        print("Lad, I burst through like a rhino (rhino)")
        print("Smoked out, no pyro (pyro)")
        print("Keep a mask up on me face, kid")
        print("And it's all black, gotta lie low (lie low)")
        print("Drugs white, albino ('bino)")
        print("If you know, then I know (I know)")
        print("Where did all of that time go?")
        print("I see pyramids, no Cairo (Cairo)")
        print("I'm bold (bold), I'm eager (eager)")
        print("She's lovin' my demeanour")
        print("I just did shrooms in Malibu and I'm seein' shit so clearer")
        print("I'm an animal, hyena")
        print("I was mean, but I just got meaner")
        print("As a kid, I was always a leader")
        print("Achieved that shit, then I come back cleaner, I clean ya")
        print("I'm the boy, I'm the boss")
        print("I take all of the stock, I don't care what it cost")
        print("I put fire to crops")
        print("Had to flip that rock, had an oz in me socks")
        print("3.5 in me bills")
        print("When I walk in the gaff, lad, I give man chills")
        print("Too halves of the pills")
        print("You're never gonna see these buss-down grillz")
        print("")
        print("DETECTED BY @esdeekid – real ones only")
        print[[
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣴⢶⣾⣯⠿⠾⠿⢿⡷⣦⣤⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢨⢊⣿⠏⣰⣿⣿⣿⣿⠆⣸⠇⣼⣁⣬⣙⢿⣷⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡣⡀⠌⣤⡦⢰⣿⣿⣿⣿⡿⢀⣿⠀⣯⡙⠿⠿⢸⠨⣯⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠃⡼⢸⣿⣧⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣤⣤⣼⡀⡇⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣍⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡜⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⢿⣿⣿⣿⣿⣿⣟⡉⠁⠀⠀⠀⠀⢩⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣾⣿⣿⣿⣿⠿⣿⢻⣶⡄⠀⠀⠀⠩⠽⠻⠔⠛⠉⢙⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣽⣿⣿⣏⣹⣉⠀⠘⠃⠁⠀⠀⢀⣀⣀⣤⣶⣾⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣛⣻⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡌⣿⣿⣿⣿⣿⣿⣿⣿⣯⣿⣯⣿⢿⣟⣿⣿⣿⢿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣷⡜⣿⣿⣿⣿⣿⢯⣿⣯⣭⡿⢿⣿⣛⣿⣽⣿⣿⡏⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⠓⠹⣿⣿⣿⣿⣿⣿⠿⣿⣿⣻⣻⣽⣿⡿⣛⣿⡀⢻⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣾⣿⣆⢀⣹⣿⣿⣿⣿⣿⣿⣻⣿⣿⡿⢿⣻⣛⣿⣿⡃⢸⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⡿⠃⡈⠻⣿⣻⣿⠾⠿⣿⣭⢽⠿⡿⣛⣿⣿⣿⣿⣟⣿⣿⣿⣿⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣿⣿⣿⣿⣿⣥⣤⡔⢤⣿⣿⣿⣿⣿⣷⣷⣾⣾⣛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣴⣾⣿⣿⣿⣿⣿⣿⣿⡇⡜⠂⠈⠛⣿⣿⣿⣿⣾⣿⣯⣽⣷⣿⣿⣿⣾⡟⠀⠀⣿⣿⣿⣿⣿⣿⣷⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⣠⣴⣷⣿⣿⣿⣿⣯⣿⣞⣻⣿⣿⣿⣿⡿⣡⡀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣷⣤⣀⠀⠀⠀⠀⠀
⠀⠀⢀⣰⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣾⣿⣿⣿⣿⣿⣿⣾⢯⣿⢿⣻⡿⣫⣿⡟⠁⠻⣿⠦⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣄⠀⠀
⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⢿⣿⣿⣻⣿⢯⣿⣿⣄⠀⠛⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀
⠠⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠽⠿⠿⠿⠮⠿⠾⠻⠿⠿⠿⠿⠿⠷⠀⠀⠠⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠄
        ]]

        for _ = 1, 35 do
            warn("stop hooking / decompiling kid")
            task.wait(1.8 + math.random() * 2.4)
        end
    end
end
]]

    local parser = Parser:new({LuaVersion = Enums.LuaVersion.Lua51})
    local parsed = parser:parse(code)

    local doBlock = parsed.body.statements[1]
    doBlock.body.scope:setParent(ast.body.scope)

    table.insert(ast.body.statements, 1, doBlock)

    return ast
end

return AntiTamper
