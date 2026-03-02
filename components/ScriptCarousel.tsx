'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Script {
  id: string;
  name: string;
  scriptUrl: string;
  status: 'Working' | 'Discontinued';
  type: 'Free' | 'Premium' | 'Discontinued';
  universeId?: string;
  displayType?: string;
}

interface ScriptCarouselProps {
  scripts: Script[];
}

export default function ScriptCarousel({ scripts }: ScriptCarouselProps) {
  // Client-side randomization to ensure fresh order on mount
  const [displayScripts, setDisplayScripts] = useState<Script[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    // Filter and shuffle on mount
    const working = scripts.filter(s => s.status === 'Working');
    const shuffled = [...working].sort(() => 0.5 - Math.random()).slice(0, 30);
    setDisplayScripts(shuffled);
  }, [scripts]);
  
  // Fetch thumbnails for displayed scripts
  useEffect(() => {
     if (displayScripts.length === 0) return;

     const fetchIcons = async () => {
         const ids = displayScripts.map(s => s.universeId || s.id).join(',');
         if(!ids) return;

         try {
             const res = await fetch(`/api/proxy/thumbnails?universeIds=${ids}`);
             const data = await res.json();
             
             if (data.data) {
                 const map: Record<string, string> = {};
                 data.data.forEach((item: any) => {
                     map[item.targetId] = item.imageUrl;
                 });
                 setThumbnails(map);
             }
         } catch (e) {
             console.error("Failed to fetch thumbnails", e);
         }
     };

     fetchIcons();
  }, [displayScripts]);

  // Duplicate for marquee effect
  const marqueeScripts = [...displayScripts, ...displayScripts];
  
  if (displayScripts.length === 0) return null;

  return (
    <div className="w-full relative overflow-hidden py-4">
      {/* Marquee Container */}
      <div 
        className="flex w-max animate-marquee gap-4"
        style={{ animationPlayState: 'running' }}
        onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
        onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
      >
        {marqueeScripts.map((script, index) => {
            const thumb = thumbnails[script.universeId || script.id];
            
            return (
              <div key={`${script.id}-${index}`} className="w-[180px] md:w-[220px] flex-shrink-0 group">
                <Link href={`/scripts?id=${script.id}`}>
                    <div 
                      className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#1a1a1a] transition-all duration-300 group-hover:scale-105"
                      style={{
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = `rgba(var(--accent-rgb), 0.5)`}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    >
                        {thumb ? (
                            <img 
                                src={thumb} 
                                alt={script.name} 
                                className="w-full h-full object-cover transition-opacity duration-300"
                                loading="lazy"
                            />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center bg-[#222]">
                                 <span className="text-4xl opacity-50">🎮</span>
                             </div>
                        )}
                        
                        <div className="absolute inset-x-0 bottom-0 py-3 px-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                             <p className="text-white font-semibold text-sm truncate text-center drop-shadow-md">
                                 {script.name}
                             </p>
                        </div>
                        
                        {script.type === 'Premium' && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                        )}
                    </div>
                </Link>
              </div>
            );
        })}
      </div>
      
      {/* Side Fades */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10" />
    </div>
  );
}
