import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CrisisSupport from "@/components/CrisisSupport";
import { AuthProvider } from "@/components/AuthProvider";
import { TextSizeApplier } from "@/components/TextSize";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Connecting the Dots of Service",
  description: "A living record of where veterans served, what they were exposed to, and what it cost them.",
  applicationName: "Connect the Dots",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Connect the Dots", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#16314f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>
          {children}
          <CrisisSupport />
        </AuthProvider>
        <TextSizeApplier />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
