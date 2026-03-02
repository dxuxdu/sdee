import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const octokit = new Octokit({ auth: token });

    // List repositories for the authenticated user
    // Per_page 100 to get a good amount, sort by updated
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all',
      sort: 'updated',
      per_page: 100,
    });

    const repos = data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      default_branch: repo.default_branch
    }));

    return NextResponse.json({ repos });
  } catch (error: any) {
    console.error('GitHub API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch repositories', 
      details: error.message 
    }, { status: 500 });
  }
}
