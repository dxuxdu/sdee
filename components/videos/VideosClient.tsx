'use client';

import { useState } from 'react';
import { Play, ExternalLink, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Image from 'next/image';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface VideosClientProps {
  initialVideos: Video[];
}

export default function VideosClient({ initialVideos }: VideosClientProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 604800;
    if (interval > 1) return Math.floor(interval) + " weeks ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <section className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/30">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white mb-2">Tutorial Videos</h1>
          <p className="text-gray-500">
            Watch guides, tutorials, and feature showcases
          </p>
        </section>

        {/* YouTube Channel Link */}
        <div className="text-center">
          <a
            href="https://www.youtube.com/@SeisenHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              <Play className="w-4 h-4" />
              Subscribe on YouTube
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="w-full max-w-5xl bg-[#101010] rounded-xl border border-[#333] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative pt-[56.25%] bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414]">
                <div>
                    <h3 className="text-white font-bold text-lg line-clamp-1">{selectedVideo.title}</h3>
                    <p className="text-gray-500 text-sm">{getTimeAgo(selectedVideo.publishedAt)}</p>
                </div>
                <Button variant="secondary" onClick={() => setSelectedVideo(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Videos Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialVideos.map((video) => (
            <Card
              key={video.id}
              variant="hover"
              className="overflow-hidden cursor-pointer group bg-[#101010] border-[#1f1f1f]"
              onClick={() => setSelectedVideo(video)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-[#1a1a1a]">
                <Image 
                    src={video.thumbnail} 
                    alt={video.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
                {/* Duration placeholder if available, otherwise omitted */}
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-bold text-white mb-2 line-clamp-2 leading-tight min-h-[44px]">
                  {video.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTimeAgo(video.publishedAt)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </section>

        {initialVideos.length === 0 && (
          <div className="text-center py-20 bg-[#101010] rounded-xl border border-[#1f1f1f]">
             <p className="text-gray-400">Unable to load videos at the moment.</p>
             <a href="https://www.youtube.com/@SeisenHub" target="_blank" className="text-blue-500 hover:underline mt-2 inline-block">Visit our Channel</a>
          </div>
        )}

        {/* More Videos CTA */}
        <Card className="p-6 text-center bg-gradient-to-r from-[#141414] to-[#1a1a1a] border-[#2a2a2a]">
          <h3 className="font-semibold text-white mb-2">Want more tutorials?</h3>
          <p className="text-gray-500 text-sm mb-4">
            Subscribe to our YouTube channel for the latest videos
          </p>
          <a
            href="https://www.youtube.com/@SeisenHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <Play className="w-4 h-4" />
              Visit YouTube Channel
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
