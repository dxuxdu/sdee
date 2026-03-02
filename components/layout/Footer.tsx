'use client';

import Link from 'next/link';
import { Zap, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useEffect, useState } from 'react';

const productLinks = [
  { href: '/obfuscator', label: 'Lua Obfuscator' },
  { href: '/scripts', label: 'Script Hub' },
  { href: '/videos', label: 'Tutorials' },
  { href: '/premium', label: 'Premium Access' },
  { href: '/getkey', label: 'Get Key' },
];

const communityLinks = [
  { href: 'https://discord.gg/F4sAf6z8Ph', label: 'Discord Server', icon: true },
  { href: 'https://www.youtube.com/@SeisenHub', label: 'YouTube Channel', icon: true },
];

const legalLinks = [
  { href: '/legal#terms', label: 'Terms of Service' },
  { href: '/legal#privacy', label: 'Privacy Policy' },
  { href: '/legal#license', label: 'License (AGPL v3.0)' },
];

const taglines = [
  'Premium scripts and tools for enhanced gaming experiences.',
  'Advanced obfuscation and script protection solutions.',
  'Your trusted hub for Roblox scripting excellence.',
  'Powerful tools for developers and gamers alike.',
];

export default function Footer() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [stats, setStats] = useState({ totalVisits: 0, uniqueVisitors: 0 });
  const [fade, setFade] = useState(true);

  // Tagline carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % taglines.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch visitor stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/visitor-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch visitor stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <footer className="bg-[#0d0d0d] border-t border-[#1f1f1f]">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Logo className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <span className="font-semibold text-base">Seisen</span>
            </div>
            <p
              className={`text-gray-500 text-sm transition-opacity duration-300 ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {taglines[taglineIndex]}
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-2">
              Products
            </h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover-accent text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-2">
              Community
            </h4>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover-accent text-sm transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.icon && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-xs uppercase tracking-wider text-gray-400 mb-2">
              Legal
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover-accent text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 Seisen. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>👁</span>
            <span>{stats.totalVisits.toLocaleString()} Total Visits</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
