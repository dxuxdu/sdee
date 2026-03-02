import { NextResponse } from 'next/server';

function parseLuaGameNames(luaCode: string): string[] {
  const names: string[] = [];
  const lines = luaCode.split('\n');
  let currentComment = '';

  for (const line of lines) {
    const commentMatch = line.match(/--\s*(.+)/);
    if (commentMatch) {
      currentComment = commentMatch[1].trim();
    }

    const entryMatch = line.match(/\["(\d+)"\]\s*=\s*"([^"]+)"/);
    if (entryMatch) {
      const scriptUrl = entryMatch[2];
      let name = currentComment;
      if (!name) {
        const nameMatch = scriptUrl.match(/Script_([^.]+)\.lua/);
        name = nameMatch ? nameMatch[1].replace(/([A-Z])/g, ' $1').trim() : 'Unknown Game';
      }
      if (name && !names.includes(name)) names.push(name);
      currentComment = '';
    }
  }
  return names;
}

export async function GET() {
  try {
    const [freeRes, premiumRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/gamelist.lua', {
        next: { revalidate: 3600 },
      }),
      fetch('https://raw.githubusercontent.com/Ken-884/roblox/refs/heads/main/premium/gamelist.lua', {
        next: { revalidate: 3600 },
      }),
    ]);

    const [freeCode, premiumCode] = await Promise.all([freeRes.text(), premiumRes.text()]);

    const freeNames = parseLuaGameNames(freeCode);
    const premiumNames = parseLuaGameNames(premiumCode);

    // Merge, deduplicate, sort
    const all = Array.from(new Set([...freeNames, ...premiumNames])).sort();

    return NextResponse.json({ success: true, games: all });
  } catch (error) {
    console.error('Failed to fetch game list:', error);
    // Fallback list in case GitHub is unreachable
    return NextResponse.json({
      success: true,
      games: [
        'Blox Fruits',
        'Pet Simulator 99',
        'Anime Defenders',
        'Fisch',
        'Rivals',
        'Slap Battles',
        'Murder Mystery 2',
        'Da Hood',
        'Brookhaven',
        'Arsenal',
      ],
    });
  }
}
