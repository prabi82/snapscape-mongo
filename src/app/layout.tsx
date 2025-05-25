import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthContext from "./context/AuthContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SnapScape: Share, compete, and discover amazing photography.",
  description: "A photography competition platform where you can share your best shots, compete with fellow photographers, and discover amazing photography.",
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/logo.png', sizes: '16x16' },
      { url: '/logo.png', sizes: '32x32' },
      { url: '/logo.png', sizes: '48x48' }
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={inter.className} style={{ isolation: "isolate" }}>
        <GoogleAnalytics />
        <AuthContext>
          {children}
        </AuthContext>
      </body>
    </html>
  );
}
