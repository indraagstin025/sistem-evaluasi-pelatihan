import './globals.css';
import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sistem Evaluasi Pasca Pelatihan - BPSDM',
  description: 'Dashboard evaluasi pasca pelatihan PKP di BPSDM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#F4F7F6] text-gray-900 flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 max-w-[1400px] overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
