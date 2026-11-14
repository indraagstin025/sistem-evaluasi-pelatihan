import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  title: 'Sistem Evaluasi Pasca Pelatihan - BPSDM',
  description: 'Dashboard evaluasi pasca pelatihan PKP di BPSDM Provinsi Jawa Barat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-canvas font-sans text-zinc-950 antialiased">
        <TooltipProvider delayDuration={200}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-950 focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:text-white"
          >
            Langsung ke konten utama
          </a>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main
              id="main-content"
              className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
            >
              {children}
            </main>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
