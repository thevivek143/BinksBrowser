import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  output: isExport ? 'export' : undefined,
  // Required for static export (Electron/Capacitor)
  images: {
    unoptimized: isExport,
    remotePatterns: isExport ? [] : [
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
  // Clean URLs for file:// protocol
  trailingSlash: isExport,
  // Disable server-side features for static export
  ...(isExport && {
    distDir: 'out',
  }),
};

export default nextConfig;
