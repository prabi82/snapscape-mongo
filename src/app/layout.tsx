import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthContext from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SnapScape: Share, compete, and discover amazing photography.",
  description: "A photography competition platform where you can share your best shots, compete with fellow photographers, and discover amazing photography.",
  icons: {
    icon: '/logo.png',
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
      <body className={inter.className} style={{ isolation: "isolate" }}>
        <AuthContext>
          {children}
        </AuthContext>
      </body>
    </html>
  );
}
