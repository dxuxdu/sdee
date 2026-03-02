'use client';

import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PurchaseCounter() {
  const [count, setCount] = useState<string>('0'); // Default/Fallback

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/stats/purchases');
        const data = await res.json();
        if (data.formatted) {
          setCount(data.formatted);
        }
      } catch (err) {
        console.error('Failed to load purchase stats', err);
      }
    };

    fetchCount();
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 text-sm px-4 py-1.5 rounded-full mx-auto w-fit mb-8 animate-fade-in" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)/50', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
      <span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span> have purchased premium
      </span>
    </div>
  );
}
