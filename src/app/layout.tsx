import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthContext from "./context/AuthContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "SnapScape: Share, compete, and discover amazing photography.",
  description: "A photography competition platform where you can share your best shots, compete with fellow photographers, and discover amazing photography.",
  keywords: ["photography", "competitions", "photo sharing", "contests", "photographers", "mobile app"],
  authors: [{ name: "SnapScape Team" }],
  creator: "SnapScape",
  publisher: "SnapScape",
  
  // PWA Configuration
  manifest: "/manifest.json",
  
  // Theme colors for mobile browsers
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1E40AF" }
  ],
  
  // Apple-specific meta tags for iOS PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SnapScape",
    startupImage: [
      {
        url: "/icons/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/icons/apple-splash-1125-2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/icons/apple-splash-1242-2208.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/icons/apple-splash-750-1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
    ],
  },
  
  // Enhanced icons for PWA
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://snapscape.vercel.app",
    siteName: "SnapScape",
    title: "SnapScape - Photography Competitions",
    description: "Join photography competitions, vote on amazing photos, and showcase your talent with photographers worldwide",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SnapScape Photography Competition Platform",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "SnapScape - Photography Competitions",
    description: "Join photography competitions, vote on amazing photos, and showcase your talent with photographers worldwide",
    images: ["/og-image.png"],
    creator: "@snapscape",
  },
  
  // Additional meta tags for PWA
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "SnapScape",
    "application-name": "SnapScape",
    "msapplication-TileColor": "#3B82F6",
    "msapplication-TileImage": "/icons/icon-144x144.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1E40AF" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="icon" href="/logo.png" />
        
        {/* Additional mobile optimization meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SnapScape" />
        
        {/* Preload critical resources for PWA */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} min-h-full`} style={{ isolation: "isolate" }}>
        <GoogleAnalytics />
        <AuthContext>
          <div id="root" className="min-h-full">
            {children}
          </div>
        </AuthContext>
        
        {/* PWA Install Prompt and Service Worker will be handled by next-pwa */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent zoom on input focus for iOS
              document.addEventListener('touchstart', function() {}, {passive: true});
              
              // Handle install prompt
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                // Store for later use
                window.deferredPrompt = deferredPrompt;
              });
              
              // Track PWA installation
              window.addEventListener('appinstalled', () => {
                console.log('SnapScape PWA was installed');
                // Optional: Track installation in analytics
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
