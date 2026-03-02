import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API configuration
// {SAME}
export function getApiUrl() {
  if (typeof window !== 'undefined') return ''; // Client-side: use relative path
  return process.env.NEXT_PUBLIC_API_URL || ''; // Server-side: use env var
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
