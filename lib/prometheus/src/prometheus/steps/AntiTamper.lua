-- This Script is Part of the Prometheus Obfuscator by Levno_710
-- AntiTamper.lua
-- This Script provides an Obfuscation Step, that breaks the script, when someone tries to tamper with it.

local Step = require("prometheus.step")
local Ast = require("prometheus.ast")
local Scope = require("prometheus.scope")
local RandomStrings = require("prometheus.randomStrings")
local Parser = require("prometheus.parser")
local Enums = require("prometheus.enums")
local logger = require("logger")

local AntiTamper = Step:extend()

AntiTamper.Description = "This Step Breaks your Script when it is modified. This is only effective when using the new VM."
AntiTamper.Name = "Anti Tamper"

AntiTamper.SettingsDescriptor = {
    UseDebug = {
        type = "boolean",
        default = true,
        description = "Use debug library. (Recommended, however scripts will not work without debug library.)"
    }
}

function AntiTamper:init(settings)
end

function AntiTamper:apply(ast, pipeline)
    if pipeline.PrettyPrint then
        logger:warn(string.format("\"%s\" cannot be used with PrettyPrint, ignoring \"%s\"", self.Name, self.Name))
        return ast
    end

    local code = [[
do
    local valid = true

    warn("skid detected – get ratio'd")

    local gmatch = string.gmatch
    local err = function() error("Tamper Detected!") end
    local pcallIntact2 = false
    local pcallIntact = pcall(function() pcallIntact2 = true end) and pcallIntact2
    local random = math.random
    local tblconcat = table.concat
    local unpkg = table and table.unpack or unpack
    local n = random(3, 65)
    local acc1 = 0
    local acc2 = 0

    local pcallRet = {pcall(function()
        local a = ]] .. tostring(math.random(1, 2^24)) .. [[ - "]] .. RandomStrings.randomString() .. [[" ^ ]] .. tostring(math.random(1, 2^24)) .. [[
        return "]] .. RandomStrings.randomString() .. [[" / a
    end)}
    local origMsg = pcallRet[2]
    local line = tonumber(gmatch(tostring(origMsg), ':(%d*):')())

    for i = 1, n do
        local len = math.random(1, 100)
        local n2 = random(0, 255)
        local pos = random(1, len)
        local shouldErr = random(1, 2) == 1
        local msg = origMsg:gsub(':(%d*):', ':' .. tostring(random(0, 10000)) .. ':')

        local arr = {pcall(function()
            if random(1, 2) == 1 or i == n then
                local line2 = tonumber(gmatch(tostring(({pcall(function()
                    local a = ]] .. tostring(math.random(1, 2^24)) .. [[ - "]] .. RandomStrings.randomString() .. [[" ^ ]] .. tostring(math.random(1, 2^24)) .. [[
                    return "]] .. RandomStrings.randomString() .. [[" / a
                end)})[2]), ':(%d*):')())
                valid = valid and line == line2
            end
            if shouldErr then
                error(msg, 0)
            end
            local arr = {}
            for i = 1, len do
                arr[i] = random(0, 255)
            end
            arr[pos] = n2
            return unpkg(arr)
        end)}

        if shouldErr then
            valid = valid and arr[1] == false and arr[2] == msg
        else
            valid = valid and arr[1]
            acc1 = (acc1 + arr[pos + 1]) % 256
            acc2 = (acc2 + n2) % 256
        end
    end

    valid = valid and acc1 == acc2

    if valid then
    else
        repeat
            return (function()
                while true do
                    l1, l2 = l2, l1
                    err()
                end
            end)()
        until true
        while true do
            l2 = random(1, 6)
            if l2 > 2 then
                l2 = tostring(l1)
            else
                l1 = l2
            end
        end
        return
    end

    local obj = setmetatable({}, { __tostring = err })
    obj[math.random(1, 100)] = obj
    (function() end)(obj)

    repeat until valid

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
    print("DETECTED BY @esdeekid – by 9")

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
end
]]

    if self.Settings.UseDebug then
        local randomStr = RandomStrings.randomString()
        code = [[
do
    local valid = true

    warn("skid detected – get ratio'd")

    local sethook = debug and debug.sethook or function() end
    local allowedLine = nil
    local called = 0
    sethook(function(s, line)
        if not line then return end
        called = called + 1
        if allowedLine then
            if allowedLine ~= line then
                sethook(error, "l", 5)
            end
        else
            allowedLine = line
        end
    end, "l", 5)
    (function() end)()
    (function() end)()
    sethook()
    if called < 2 then valid = false end
    if called < 2 then valid = false end

    local funcs = {pcall, string.char, debug.getinfo, string.dump}
    for i = 1, #funcs do
        if debug.getinfo(funcs[i]).what ~= "C" then valid = false end
        if debug.getlocal(funcs[i], 1) then valid = false end
        if debug.getupvalue(funcs[i], 1) then valid = false end
        if pcall(string.dump, funcs[i]) then valid = false end
    end

    local function getTraceback()
        local str = (function(arg) return debug.traceback(arg) end)("]] .. randomStr .. [[")
        return str
    end
    local traceback = getTraceback()
    valid = valid and traceback:sub(1, traceback:find("\n") - 1) == "]] .. randomStr .. [["
    local iter = traceback:gmatch(":(%d*):")
    local v, c = iter(), 1
    for i in iter do
        valid = valid and i == v
        c = c + 1
    end
    valid = valid and c >= 2

]] .. code:sub(4)  
    end

    local parsed = Parser:new({LuaVersion = Enums.LuaVersion.Lua51}):parse(code)
    local doStat = parsed.body.statements[1]
    doStat.body.scope:setParent(ast.body.scope)
    table.insert(ast.body.statements, 1, doStat)

    return ast
end

return AntiTamper
