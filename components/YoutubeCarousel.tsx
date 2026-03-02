'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface YoutubeCarouselProps {
  videos: Video[];
}

export default function YoutubeCarousel({ videos }: YoutubeCarouselProps) {
  if (videos.length === 0) return null;

  // Duplicate for marquee effect
  const marqueeVideos = [...videos, ...videos];

  return (
    <div className="w-full relative overflow-hidden py-4 group">
      {/* Marquee Container (Reverse Direction) */}
      <div 
        className="flex w-max animate-marquee-reverse gap-4"
        style={{ animationPlayState: 'running' }}
        onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
        onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
      >
        {marqueeVideos.map((video, index) => (
          <div key={`${video.id}-${index}`} className="w-[280px] md:w-[320px] flex-shrink-0">
            <a 
              href={video.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#1a1a1a] transition-transform duration-300 hover:scale-105 hover:border-red-500/50 group/card"
            >
                {/* Thumbnail */}
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center transform scale-75 group-hover/card:scale-100 transition-transform">
                        <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                </div>
                
                {/* Title Overlay */}
                <div className="absolute inset-x-0 bottom-0 py-3 px-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                        <p className="text-white font-medium text-sm truncate drop-shadow-md">
                            {video.title}
                        </p>
                </div>
            </a>
          </div>
        ))}
      </div>
      
      {/* Side Fades */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10" />
    </div>
  );
}
