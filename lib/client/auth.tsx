'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  verify: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage on mount
    const storedEmail = localStorage.getItem('client_email');
    const storedAuth = localStorage.getItem('client_auth'); // Simple flag for valid session

    if (storedEmail && storedAuth === 'true') {
        setEmail(storedEmail);
        setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (emailInput: string) => {
    try {
        const res = await fetch('/api/auth/send-code', {
            method: 'POST',
            body: JSON.stringify({ email: emailInput }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        if (data.success) {
            setEmail(emailInput); // Store temporarily in state until verified
            return { success: true };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
  };

  const verify = async (code: string) => {
    if (!email) return { success: false, error: 'No email found' };

    try {
        const res = await fetch('/api/auth/verify-code', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (data.success) {
            setIsAuthenticated(true);
            localStorage.setItem('client_email', email);
            localStorage.setItem('client_auth', 'true');
            router.push('/client/dashboard');
            return { success: true };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: 'Verification error' };
    }
  };

  const logout = () => {
    setEmail(null);
    setIsAuthenticated(false);
    localStorage.removeItem('client_email');
    localStorage.removeItem('client_auth');
    router.push('/client/login');
  };

  return (
    <AuthContext.Provider value={{ email, isAuthenticated, login, verify, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
