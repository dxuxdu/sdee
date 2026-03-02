import { AuthProvider } from '@/lib/client/auth';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Client Area | Seisen Hub',
  description: 'Manage your keys and subscriptions',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        {children}
      </div>
    </AuthProvider>
  );
}
