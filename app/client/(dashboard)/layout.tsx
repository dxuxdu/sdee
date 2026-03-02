import ClientHeader from '../components/ClientHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientHeader />
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}
