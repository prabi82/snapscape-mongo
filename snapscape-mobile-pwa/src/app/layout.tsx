import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapScape Mobile - Photography Competitions",
  description: "Join photography competitions, vote on amazing photos, and showcase your talent on mobile",
  keywords: ["photography", "competitions", "mobile app", "photo sharing", "contests"],
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
  
  // Apple-specific meta tags
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
        url: "/icons/apple-splash-1668-2388.png", 
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/icons/apple-splash-1536-2048.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
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
      {
        url: "/icons/apple-splash-640-1136.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
    ],
  },
  
  // Icons
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icon-180x180.png", sizes: "180x180" },
    { rel: "icon", url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
    { rel: "icon", url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    { rel: "icon", url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { rel: "icon", url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    { rel: "shortcut icon", url: "/favicon.ico" },
  ],
  
  // Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://snapscape-mobile.vercel.app",
    siteName: "SnapScape Mobile",
    title: "SnapScape Mobile - Photography Competitions",
    description: "Join photography competitions, vote on amazing photos, and showcase your talent on mobile",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SnapScape Mobile App",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "SnapScape Mobile - Photography Competitions",
    description: "Join photography competitions, vote on amazing photos, and showcase your talent on mobile",
    images: ["/og-image.png"],
    creator: "@snapscape",
  },
  
  // Additional meta tags
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "SnapScape",
    "application-name": "SnapScape",
    "msapplication-TileColor": "#3B82F6",
    "msapplication-TileImage": "/icons/icon-144x144.png",
    "msapplication-config": "/browserconfig.xml",
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
    <html lang="en" className="h-full">
      <head>
        {/* Additional mobile optimization meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SnapScape" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        <div id="root" className="min-h-full">
          {children}
        </div>
        
        {/* Install prompt and service worker registration will be handled by next-pwa */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent zoom on input focus for iOS
              document.addEventListener('touchstart', function() {
                if (window.DeviceMotionEvent) {
                  var viewport = document.querySelector('meta[name=viewport]');
                  if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
                  }
                }
              });
              
              // Handle install prompt
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                // Show install button when ready
                const installBtn = document.querySelector('#install-btn');
                if (installBtn) {
                  installBtn.style.display = 'block';
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
