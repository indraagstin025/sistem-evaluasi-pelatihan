import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getSessionUser } from '@/lib/auth';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistem Evaluasi Pasca Pelatihan | BPSDM Provinsi Jawa Barat',
  description:
    'Platform terpadu pengelolaan kegiatan, unggahan Inovasi/Proper, penilaian wawancara, dan ekspose hasil evaluasi pasca pelatihan.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="id" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-zinc-950 antialiased">
        <TooltipProvider delayDuration={200}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
          >
            Lompat ke konten utama
          </a>

          <Navbar user={user}>{children}</Navbar>
        </TooltipProvider>
      </body>
    </html>
  );
}
