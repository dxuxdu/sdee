import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path') || '';

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo param' }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });

    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
        });

        const items = Array.isArray(data) ? data : [data];
        
        // Sort: Folders first, then files
        const sortedItems = items.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type, // 'file' or 'dir'
            sha: item.sha
        })).sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });

        return NextResponse.json({ items: sortedItems });
    } catch (err: any) {
        // If path doesn't exist or is empty repo
        if(err.status === 404) {
             return NextResponse.json({ items: [] });
        }
        throw err;
    }

  } catch (error: any) {
    console.error('GitHub Tree API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch repository contents', 
      details: error.message 
    }, { status: 500 });
  }
}
