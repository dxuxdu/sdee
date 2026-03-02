'use client';

import { useState } from 'react';
import { Key, ExternalLink, CheckCircle, Clock, AlertCircle, Crown, Shield, Terminal, Copy, Zap, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getApiUrl, copyToClipboard } from '@/lib/utils';
import Link from 'next/link';

export default function GetKeyPage() {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedLoader, setCopiedLoader] = useState(false);

  const scriptLoader = `loadstring(game:HttpGet("https://api.junkie-development.de/api/v1/luascripts/public/8ac2e97282ac0718aeeb3bb3856a2821d71dc9e57553690ab508ebdb0d1569da/download"))()`;



  const handleCopyLoader = async () => {
    await copyToClipboard(scriptLoader);
    setCopiedLoader(true);
    setTimeout(() => setCopiedLoader(false), 2000);
  };

  return (
    <div className="min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <section className="text-center animate-fade-in space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Access Key System
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose your preferred method to access premium scripts
          </p>
        </section>

        {/* Access Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Free Access Card */}
          <div className="relative group">
            <div className="absolute inset-0 accent-bg blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-3xl" />
            <Card className="h-full border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-sm p-8 flex flex-col relative overflow-hidden">
               {/* Shine effect */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-32 -mt-32" />
               
               <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="p-3 rounded-xl accent-bg border accent-border accent-text">
                   <Key className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-bold text-white">Free Access Key</h2>
               </div>

                 <div className="space-y-6 flex-1 relative z-10">
                   <p className="text-gray-400">
                     Complete a quick verification process to get your temporary access key.
                   </p>
                   
                   <ul className="space-y-4">
                     <li className="flex items-center gap-3 text-sm text-gray-300">
                         <div className="w-5 h-5 rounded-full accent-bg flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 accent-text" />
                         </div>
                         Key valid for: <span className="font-bold text-white ml-1">1h, 10h, 24h, or 48h</span>
                     </li>
                     <li className="flex items-center gap-3 text-sm text-gray-300">
                         <div className="w-5 h-5 rounded-full accent-bg flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 accent-text" />
                         </div>
                         Page opens in new tab for verification
                     </li>
                     <li className="flex items-center gap-3 text-sm text-gray-300">
                         <div className="w-5 h-5 rounded-full accent-bg flex items-center justify-center">
                            <Zap className="w-3 h-3 accent-text" />
                         </div>
                         Tip: Use different browser or disable ad-blockers if issues occur
                     </li>
                   </ul>

                   <div className="pt-4 mt-auto">
                     <a href="https://jnkie.com/get-key/seisenhub" target="_blank" rel="noopener noreferrer">
                        <Button 
                          className="w-full h-12 text-lg bg-[var(--accent)] hover:opacity-90 shadow-lg shadow-[var(--accent)]/20"
                        >
                          <ExternalLink className="w-5 h-5 mr-2" />
                          Get Free Key
                        </Button>
                     </a>
                     
                     <div className="text-left text-xs text-gray-500 mt-6 pt-4 border-t border-[#1f1f1f]">
                       <span className="block mb-2">Secured & Powered by</span>
                       <div className="flex items-center gap-4">
                          <a href="https://work.ink" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                            <img src="/images/partners/workink.webp" alt="Work.ink" className="h-6 w-auto" />
                          </a>
                          <span className="text-[#2a2a2a] h-4 w-px bg-[#2a2a2a]" />
                          <a href="https://lockr.so" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                            <img src="/images/partners/lockr.webp" alt="Lockr.so" className="h-5 w-auto" />
                          </a>
                       </div>
                     </div>
                   </div>
                 </div>
            </Card>
          </div>

          {/* Premium Access Card */}
          <div className="relative group">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
            <div className="absolute inset-0 bg-amber-500/5 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-3xl" />
            
            <Card className="h-full border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-sm p-8 flex flex-col relative overflow-hidden group-hover:border-amber-500/30 transition-colors">
               <div className="absolute top-4 right-4 animate-pulse">
                   <div className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                       RECOMMENDED
                   </div>
               </div>
               
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                   <Crown className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-bold text-white">Instant Premium Access</h2>
               </div>

               <div className="space-y-6 flex-1">
                 <p className="text-gray-400">
                   Skip the key system entirely with lifetime premium membership.
                 </p>
                 
                 <ul className="space-y-4">
                   {[
                     'Unlimited access - no keys needed',
                     'Instant script execution',
                     'Priority support & early access',
                     'Exclusive premium-only scripts',
                     'Custom discord role & badge',
                     'Access to private community'
                   ].map((item, i) => (
                     <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                       <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Crown className="w-3 h-3 text-amber-500" />
                       </div>
                       {item}
                     </li>
                   ))}
                 </ul>
                 
                 <div className="mt-auto space-y-3 pt-6">
                     <Link href="/premium" className="block">
                        <Button 
                            className="w-full h-12 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-900/20 border-0"
                        >
                            Get Premium
                            <Crown className="w-4 h-4 ml-2" />
                        </Button>
                     </Link>
                     <Link href="/legal" className="block">
                         <Button variant="secondary" className="w-full hover:bg-[#1a1a1a]">
                             View Terms
                         </Button>
                     </Link>
                 </div>
               </div>
            </Card>
          </div>
        </div>

        {/* Script Loader Section */}
        <section className="animate-fade-in animation-delay-200">
            <div className="flex items-center justify-center gap-2 mb-4">
                <Terminal className="w-5 h-5 accent-text" />
                <h2 className="text-xl font-bold text-white">Script Loader</h2>
            </div>
            <p className="text-center text-gray-500 text-sm mb-6 max-w-lg mx-auto">
                Copy and paste this loader into your executor after obtaining a key to run the script hub.
            </p>

            <Card className="max-w-3xl mx-auto bg-[#050505] border-[#222]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                        <div className="w-3 h-3 rounded-full accent-bg" />
                    </div>
                    <span className="text-xs text-gray-600 font-mono">loader.lua</span>
                </div>
                <div className="p-6 relative group">
                    <pre className="accent-text font-mono text-sm break-all whitespace-pre-wrap">
                        {scriptLoader}
                    </pre>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" onClick={handleCopyLoader}>
                            {copiedLoader ? <CheckCircle className="w-4 h-4 accent-text" /> : <Copy className="w-4 h-4" />}
                            {copiedLoader ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </div>
            </Card>
        </section>
      </div>
    </div>
  );
}
