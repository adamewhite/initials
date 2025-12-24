import type { Metadata } from 'next';
import { Sometype_Mono, Archivo } from 'next/font/google';
import './globals.css';
import ScrollToTop from '@/components/ScrollToTop';

const sometypeMono = Sometype_Mono({
  subsets: ['latin'],
  variable: '--font-sometype-mono',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'INITIALS',
  description: 'A game not for the faint of heart.',
  openGraph: {
    title: 'INITIALS',
    description: 'A game not for the faint of heart.',
    type: 'website',
    images: [
      {
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: 'INITIALS - A game not for the faint of heart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INITIALS',
    description: 'A game not for the faint of heart.',
    images: ['/og_image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${archivo.className} ${sometypeMono.variable} bg-gradient-to-br from-indigo-900 to-indigo-950 min-h-screen`}
      >
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
