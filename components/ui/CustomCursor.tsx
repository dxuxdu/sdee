'use client';

import { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide default cursor
    document.documentElement.classList.add('hide-cursor');

    const updatePosition = (e: MouseEvent) => {
       if (!isVisible) setIsVisible(true);
       
       // Update cursor position
       if (cursorRef.current) {
          cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
       }
       if (followerRef.current) {
          // Delayed follower effect logic can be complex, using simple tracking for now
          // or we can use requestAnimationFrame for smooth trailing.
          // For high performance, lets keep it direct for now or add a slight CSS transition delay
          followerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
       }
    };

    const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInteractive = 
            target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'LABEL' ||
            target.closest('button') ||
            target.closest('a') ||
            target.closest('[role="button"]') ||
            target.classList.contains('interactive');
        
        setIsHovering(!!isInteractive);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
        document.documentElement.classList.remove('hide-cursor');
        window.removeEventListener('mousemove', updatePosition);
        window.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main Cursor Dot */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-3 h-3 rounded-full pointer-events-none z-[9999] mix-blend-difference -ml-1.5 -mt-1.5 will-change-transform"
        style={{ backgroundColor: 'var(--accent)' }}
      />
      
      {/* Position Wrapper for Follower */}
      <div 
        ref={followerRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] -ml-4 -mt-4 will-change-transform"
      >
          {/* Visual Follower Ring */}
          <div 
            className={`w-8 h-8 rounded-full transition-all duration-300 ease-out ${
                isHovering ? 'scale-150' : 'scale-100 opacity-50'
            }`}
            style={{ 
              border: '1px solid var(--accent)',
              backgroundColor: isHovering ? 'var(--accent)/10' : 'transparent'
            }}
          />
      </div>
    </>
  );
}
