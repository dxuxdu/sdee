import { fetchVideos } from '@/lib/videos';
import VideosClient from '@/components/videos/VideosClient';

export default async function VideosPage() {
  const videos = await fetchVideos();

  // Used for statically generating the page if needed, or just standard SSR
  return <VideosClient initialVideos={videos} />;
}
