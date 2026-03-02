import React from 'react';
import { cn } from '@/lib/utils';

export const Logo: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, style, ...props }) => {
  return (
    <div
      // bg-current ensures the div takes the text color (e.g. text-accent, text-white) as its background
      // This background is then "masked" by the image shape, making the logo the color of the theme.
      className={cn("bg-current", className)}
      style={{
        maskImage: "url('/images/logo%20seisen.png')",
        WebkitMaskImage: "url('/images/logo%20seisen.png')",
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        ...style
      }}
      {...props}
    />
  );
};
