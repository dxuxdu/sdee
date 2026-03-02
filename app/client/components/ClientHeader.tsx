'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Download, Headset, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/client/auth'; // For logout

export default function ClientHeader() {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  const navItems = [
    { href: '/client/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/client/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/client/downloads', label: 'Downloads', icon: Download },
    { href: '/client/support', label: 'Support', icon: Headset },
  ];

  return (
    <header className="w-full bg-[#0a0a0a] border-b border-[#1f1f1f] px-8 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'accent-text' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout / User Actions */}
        <button 
            onClick={logout}
            className="text-gray-500 hover:text-red-400 text-xs font-medium flex items-center gap-2 transition-colors"
        >
            <LogOut className="w-3 h-3" />
            Sign Out
        </button>
      </div>
    </header>
  );
}
