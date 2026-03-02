'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/client/auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function VerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verify, email } = useAuth();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email in context (didn't go through login)
  useEffect(() => {
    if (!email) router.replace('/client/login');
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((val, i) => {
        if (i < 6 && !isNaN(Number(val))) newOtp[i] = val;
    });
    setOtp(newOtp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
        setError('Please enter the full 6-digit code');
        return;
    }

    setLoading(true);
    setError('');
    
    const res = await verify(code);
    
    setLoading(false);
    if (!res.success) {
        setError(res.error || 'Verification failed');
    }
  };

  if (!email) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#050505]">
      <Card className="w-full max-w-md p-10 bg-[#0f0f0f] border border-[#1f1f1f] shadow-2xl rounded-2xl">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Nearly there...</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
                We've sent a verification code to<br/>
                <span className="text-white font-semibold">{email}</span>. Please enter it below.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-12 h-14 bg-[#141414] border border-[#2a2a2a] rounded-lg text-center text-xl font-bold text-white focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder-transparent"
                    />
                ))}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-pulse">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full accent-bg hover-accent-bg text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(var(--accent-rgb),0.2)] hover:shadow-[0_4px_25px_rgba(var(--accent-rgb),0.3)] hover:-translate-y-0.5"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    'Sign in'
                )}
            </button>
            
            <div className="text-center">
                <button 
                    type="button" 
                    onClick={() => router.push('/client/login')}
                    className="text-xs text-gray-500 hover-accent transition-colors"
                >
                    Entered the wrong email?
                </button>
            </div>
        </form>
      </Card>
      
      <p className="mt-8 text-center text-xs text-gray-600">
        &copy; 2026 Seisen Hub. All rights reserved.
      </p>
    </div>
  );
}
