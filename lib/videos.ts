
export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

const YOUTUBE_RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCfswDYyGktViLU2E2larQlg';

export async function fetchVideos(): Promise<Video[]> {
  try {
    const response = await fetch(YOUTUBE_RSS_URL, { next: { revalidate: 3600 } });
    const text = await response.text();
    
    return parseRSS(text);
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return [];
  }
}

function parseRSS(xmlText: string): Video[] {
  const videos: Video[] = [];
  
  // Simple regex parsing for RSS feed
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entry = match[1];
    
    const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    // Media thumbnail is often in media:group -> media:thumbnail
    // But standardized YouTube RSS usually just needs videoId to construct thumbnail
    
    if (idMatch && titleMatch) {
      const videoId = idMatch[1];
      const title = titleMatch[1];
      const publishedAt = publishedMatch ? publishedMatch[1] : new Date().toISOString();
      
      videos.push({
        id: videoId,
        title: title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: publishedAt,
        url: `https://www.youtube.com/watch?v=${videoId}`
      });
    }
  }

  return videos;
}
