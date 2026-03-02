'use client';

import { useState } from 'react';
import { Palette, X, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function ThemeSelector() {
  const { currentTheme, setTheme, allThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[1999] p-3 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-all shadow-xl"
        style={{ color: 'var(--accent)' }}
        aria-label="Theme Selector"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Theme Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[2000] animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-20 right-6 z-[2001] w-[420px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h3 className="font-semibold text-white text-lg">Theme Selector</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-4 border-b border-[#1f1f1f]">
              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: '#000' 
                  }}
                >
                  All
                </button>
                <button className="flex-1 px-4 py-2 rounded-lg bg-[#141414] text-gray-400 hover:bg-[#1a1a1a] font-medium text-sm transition-all flex items-center justify-center gap-2">
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
              </div>
            </div>

            {/* Theme Grid */}
            <div className="p-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {allThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                      currentTheme.id === theme.id
                        ? 'border-[var(--accent)] bg-[#141414]'
                        : 'border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#2a2a2a]'
                    }`}
                  >
                    {/* Color Swatches */}
                    <div className="flex gap-2 mb-3">
                      {theme.swatches.map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-lg"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Theme Name */}
                    <div className="text-left">
                      <div className="text-white font-medium text-sm mb-1">{theme.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Moon className="w-3 h-3" />
                        <span>dark</span>
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {currentTheme.id === theme.id && (
                      <div 
                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
