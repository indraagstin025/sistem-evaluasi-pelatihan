import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Navbar from '@/components/Navbar';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { WibThemeProvider } from '@/components/providers/WibThemeProvider';
import { NetworkStatusBanner } from '@/components/providers/NetworkStatusBanner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getSessionUser } from '@/lib/auth';

const interFont = localFont({
  src: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: '../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  weight: '400 600',
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistem Evaluasi Pasca Pelatihan | BPSDM Provinsi Jawa Barat',
  description:
    'Platform terpadu pengelolaan kegiatan evaluasi, unggahan dokumen Proper (Proyek Perubahan), penilaian wawancara, dan ekspose hasil evaluasi pasca pelatihan.',
};

const WIB_THEME_INIT_SCRIPT = `(function(){try{localStorage.removeItem('bpsdm-theme-mode');var h=parseInt(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',hour12:false}).format(new Date()),10);document.documentElement.classList.toggle('dark',h>=18||h<6);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${interFont.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: WIB_THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-zinc-950 antialiased">
        <WibThemeProvider>
          <NetworkStatusBanner />
          <TooltipProvider delayDuration={200}>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
            >
              Lompat ke konten utama
            </a>

            <SmoothScrollProvider>
              <Navbar user={user}>{children}</Navbar>
            </SmoothScrollProvider>
          </TooltipProvider>
        </WibThemeProvider>
      </body>
    </html>
  );
}
