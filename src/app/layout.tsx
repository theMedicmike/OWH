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
  metadataBase: new URL("https://owh-three.vercel.app"),
  title: "Connecting the Dots of Service",
  description:
    "A living record of where veterans served, what they were exposed to, and what it cost them. An Operation Whole Health initiative.",
  applicationName: "Connect the Dots",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Connect the Dots", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Connecting the Dots of Service",
    description:
      "A living record of where veterans served, what they were exposed to, and what it cost them.",
    url: "https://owh-three.vercel.app",
    siteName: "Operation Whole Health",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Operation Whole Health" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Connecting the Dots of Service",
    description: "A living record of where veterans served, what they were exposed to, and what it cost them.",
    images: ["/icon-512.png"],
  },
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
