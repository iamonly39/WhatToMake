import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WhatToMake',
  description: 'Weekly meal planning for the family',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-600 tracking-tight">
            WhatToMake
          </Link>
          <Link
            href="/preferences"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-xl"
            aria-label="Preferences"
          >
            ⚙️
          </Link>
        </header>
        <main className="pb-24 min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
