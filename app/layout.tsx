import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BinksBrowser — Next-Gen Advanced Browser',
  description: 'The world\'s most advanced browser combining the best features of Chrome, Firefox, Safari, Edge, Opera, Brave, and Arc — plus revolutionary AI-powered tools.',
  keywords: 'browser, next-gen, AI browser, privacy browser, advanced browser, BinksBrowser',
  authors: [{ name: 'BinksBrowser Team' }],
  openGraph: {
    title: 'BinksBrowser — Next-Gen Advanced Browser',
    description: 'Revolutionary browser with AI Co-Pilot, Privacy Shield, Tab Canvas, and 30+ exclusive features.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
