'use client';

import { useEffect, useRef } from 'react';

export default function VisitorTracker() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Fire and forget
    fetch('/api/visitor-stats', { method: 'POST' }).catch(console.error);
  }, []);

  return null;
}
