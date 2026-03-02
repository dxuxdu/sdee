'use client';

import { useEffect, useRef } from 'react';

export default function TabTitleAnimation() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const texts = [
      'Seisen',
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeWriter = () => {
      const fullText = texts[textIndex];
      let currentText = '';
      
      if (isDeleting) {
        currentText = fullText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        currentText = fullText.substring(0, charIndex + 1);
        charIndex++;
      }

      document.title = currentText || 'Seisen';

      // Speed settings
      let typeSpeed = isDeleting ? 200 : 400; // Slow, distinct speed

      if (!isDeleting && charIndex === fullText.length) {
        typeSpeed = 3000; // Pause at end (3s)
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typeSpeed = 1000; // Pause before next text (1s)
      }

      timeoutRef.current = setTimeout(typeWriter, typeSpeed);
    };

    typeWriter();

    // Cleanup: STOP the loop and reset title
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.title = 'Seisen';
    };
  }, []);

  return null;
}
