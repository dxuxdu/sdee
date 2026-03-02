
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const universeIds = searchParams.get('universeIds');

  if (!universeIds) {
    return NextResponse.json({ error: 'Missing universeIds' }, { status: 400 });
  }

  try {
    const targetUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`;
    
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Thumbnail proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch thumbnails' }, { status: 500 });
  }
}
