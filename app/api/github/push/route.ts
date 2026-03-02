import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function POST(req: NextRequest) {
  try {
    const { token, owner, repo, branch, path, content, message } = await req.json();

    if (!token || !owner || !repo || !path || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });

    // 1. Get the current file (if it exists) to get its SHA
    let sha: string | undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch || 'main',
      });
      
      if (!Array.isArray(data) && data.sha) {
        sha = data.sha;
      }
    } catch (err: any) {
      // File doesn't exist, which is fine (we'll create it)
      if (err.status !== 404) {
        throw err;
      }
    }

    // 2. Create or Update the file
    // Content must be base64 encoded
    const contentBase64 = Buffer.from(content).toString('base64');

    const { data: updateData } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || `Add ${path} via Seisen Obfuscator`,
      content: contentBase64,
      sha, // Only required if updating
      branch: branch || 'main',
    });

    return NextResponse.json({ 
      success: true, 
      url: updateData.content?.html_url,
      commit: updateData.commit.sha 
    });

  } catch (error: any) {
    console.error('GitHub Push Error:', error);
    return NextResponse.json({ 
      error: 'Failed to push to GitHub', 
      details: error.message 
    }, { status: 500 });
  }
}
