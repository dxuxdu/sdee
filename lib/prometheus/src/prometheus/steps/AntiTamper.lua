local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Parser = require("prometheus.parser")
local Enums = require("prometheus.enums")
local logger = require("logger")

local AntiTamper = Step:extend()

AntiTamper.Description = "Strong Roblox environment validation + anti-hook/timing/metatable checks. Shows lyrics + ASCII on tamper/deobfuscate attempt."
AntiTamper.Name = "Anti Tamper (improved 2026 + drip reveal)"
AntiTamper.SettingsDescriptor = {}

function AntiTamper:init(settings)
end

function AntiTamper:apply(ast, pipeline)
    if pipeline.PrettyPrint then
        logger:warn(string.format("\"%s\" cannot be used with PrettyPrint, ignoring", self.Name))
        return ast
    end

    local code = [[
        do
            local function isTampered()
                if typeof == nil 
                    or typeof(game) ~= "Instance" 
                    or game.ClassName ~= "DataModel" then
                    return true
                end

                local services = {
                    {"RunService",   "RunService"},
                    {"Players",      "Players"},
                    {"ReplicatedStorage", "ReplicatedStorage"},
                    {"HttpService",  "HttpService"},
                    {"TweenService", "TweenService"},
                }

                for _, svc in ipairs(services) do
                    local ok, inst = pcall(game.GetService, game, svc[1])
                    if not ok 
                        or typeof(inst) ~= "Instance" 
                        or inst.ClassName ~= svc[2] then
                        return true
                    end
                end

                local rs = game:GetService("RunService")
                local heartbeat = rs.Heartbeat
                local samples = {}
                local conn
                local startGlobal = os.clock()

                local count = 0
                conn = heartbeat:Connect(function()
                    count = count + 1
                    table.insert(samples, os.clock() - startGlobal)
                    if count >= 7 then
                        conn:Disconnect()
                    end
                end)

                local waited = 0
                local maxWait = 0.45
                while waited < maxWait and count < 7 do
                    task.wait(0.06)
                    waited = os.clock() - startGlobal
                end

                if conn and conn.Connected then conn:Disconnect() end

                if count < 5 then
                    return true
                end

                local deltas = {}
                for i = 2, #samples do
                    table.insert(deltas, samples[i] - samples[i-1])
                end

                local avg = 0
                for _, d in ipairs(deltas) do avg = avg + d end
                avg = avg / #deltas

                local variance = 0
                for _, d in ipairs(deltas) do
                    variance = variance + (d - avg) ^ 2
                end
                variance = variance / #deltas

                if avg > 0.085 or variance > 0.004 then
                    return true
                end

                local testStr = "a:b:c:123:xyz"
                local parts = {}
                for p in string.gmatch(testStr, "([^:]+)") do
                    table.insert(parts, p)
                end
                if #parts ~= 5 or parts[4] ~= "123" then return true end

                if string.find(testStr, "123") ~= 11 then return true end
                if string.match(testStr, "%d+") ~= "123" then return true end

                if getrenv == nil or type(getrenv) ~= "function" 
                    or getgc == nil or type(getgc) ~= "function"
                    or gethui == nil or type(gethui) ~= "function" then
                    return true
                end

                local function isLocked(t)
                    local mt = getrawmetatable(t)
                    if not mt then return false end
                    return rawget(mt, "__metatable") ~= nil
                end

                if not isLocked(game) 
                    or not isLocked(game:GetService("RunService"))
                    or not isLocked(_G) then
                    return true
                end

                local ok, name = pcall(function()
                    return game.Name
                end)
                if not ok or name ~= "game" then
                    return true
                end

                return false
            end

            if isTampered() then
                warn("DETECTED by @esdeekid")

                print("I'm floatin' 'round 4 a.m.s")
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

                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣴⢶⣾⣯⠿⠾⠿⢿⡷⣦⣤⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢨⢊⣿⠏⣰⣿⣿⣿⣿⠆⣸⠇⣼⣁⣬⣙⢿⣷⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡣⡀⠌⣤⡦⢰⣿⣿⣿⣿⡿⢀⣿⠀⣯⡙⠿⠿⢸⠨⣯⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠃⡼⢸⣿⣧⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣤⣤⣼⡀⡇⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣍⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡜⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⢿⣿⣿⣿⣿⣿⣟⡉⠁⠀⠀⠀⠀⢩⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣾⣿⣿⣿⣿⠿⣿⢻⣶⡄⠀⠀⠀⠩⠽⠻⠔⠛⠉⢙⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣽⣿⣿⣏⣹⣉⠀⠘⠃⠁⠀⠀⢀⣀⣀⣤⣶⣾⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣛⣻⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡌⣿⣿⣿⣿⣿⣿⣿⣿⣯⣿⣯⣿⢿⣟⣿⣿⣿⢿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣷⡜⣿⣿⣿⣿⣿⢯⣿⣯⣭⡿⢿⣿⣛⣿⣽⣿⣿⡏⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⠓⠹⣿⣿⣿⣿⣿⣿⠿⣿⣿⣻⣻⣽⣿⡿⣛⣿⡀⢻⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣾⣿⣆⢀⣹⣿⣿⣿⣿⣿⣿⣻⣿⣿⡿⢿⣻⣛⣿⣿⡃⢸⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⡿⠃⡈⠻⣿⣻⣿⠾⠿⣿⣭⢽⠿⡿⣛⣿⣿⣿⣿⣟⣿⣿⣿⣿⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣿⣿⣿⣿⣿⣥⣤⡔⢤⣿⣿⣿⣿⣿⣷⣷⣾⣾⣛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣴⣾⣿⣿⣿⣿⣿⣿⣿⡇⡜⠂⠈⠛⣿⣿⣿⣿⣾⣿⣯⣽⣷⣿⣿⣿⣾⡟⠀⠀⣿⣿⣿⣿⣿⣿⣷⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀")
                print("⠀⠀⠀⠀⠀⢀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⣠⣴⣷⣿⣿⣿⣿⣯⣿⣞⣻⣿⣿⣿⣿⡿⣡⡀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣷⣤⣀⠀⠀⠀⠀⠀")
                print("⠀⠀⢀⣰⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣾⣿⣿⣿⣿⣿⣿⣾⢯⣿⢿⣻⡿⣫⣿⡟⠁⠻⣿⠦⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣄⠀⠀")
                print("⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⢿⣿⣿⣻⣿⢯⣿⣿⣄⠀⠛⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀")
                print("⠠⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠽⠿⠿⠿⠮⠿⠾⠻⠿⠿⠿⠿⠿⠷⠀⠀⠠⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠄")

                while true do
                    task.wait(4 + math.random(1,8)/10)
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
