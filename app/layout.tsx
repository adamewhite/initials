import type { Metadata } from 'next';
import { Sometype_Mono, Mukta } from 'next/font/google';
import './globals.css';
import ScrollToTop from '@/components/ScrollToTop';

const sometypeMono = Sometype_Mono({
  subsets: ['latin'],
  variable: '--font-sometype-mono',
});

const mukta = Mukta({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'INITIALS',
  description: 'A game not for the faint of heart.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${mukta.className} ${sometypeMono.variable} bg-gradient-to-br from-indigo-900 to-indigo-950 min-h-screen`}
      >
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
