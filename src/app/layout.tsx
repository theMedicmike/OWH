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
  // A template, so a child page setting `title: "Find a VSO"` renders
  // "Find a VSO · Connecting the Dots of Service" instead of replacing the
  // product name entirely — every tab and every search result keeps the
  // brand, and no page has to repeat it by hand.
  title: {
    default: "Connecting the Dots of Service",
    template: "%s · Connecting the Dots of Service",
  },
  description:
    "A living record of where veterans served, what they were exposed to, and what it cost them. An Operation Whole Health initiative.",
  alternates: { canonical: "/" },
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

// STRUCTURED DATA — what this nonprofit IS, in the one format search engines
// and AI assistants both read. Emitted on every page from the layout.
//
// Two types, doing different jobs. NGO establishes the entity: a real
// 501(c)(3), free, veteran-facing, with a contact route — the signals that
// separate this from the paid claim-consultant sites that dominate every
// veteran-benefits search result. WebSite establishes the property.
//
// Everything asserted here is verifiable and already stated on /about and
// /trust. Nothing is claimed that the app doesn't back elsewhere — no
// invented awards, no review counts, no ratings. Structured data is exactly
// where sites overreach and get manual actions, and it is also the last place
// this project should start overclaiming.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NGO",
      "@id": "https://owh-three.vercel.app/#organization",
      name: "Operation Whole Health",
      alternateName: "OWH",
      url: "https://owh-three.vercel.app",
      logo: "https://owh-three.vercel.app/icon-512.png",
      description:
        "A Patriot-founded 501(c)(3) nonprofit helping veterans document the connection between their service and their health. Free, and it sells nothing.",
      nonprofitStatus: "Nonprofit501c3",
      email: "michael@operationwholehealth.org",
      knowsAbout: [
        "VA disability claims",
        "Military toxic exposure",
        "Burn pits",
        "Agent Orange",
        "Camp Lejeune water contamination",
        "PACT Act presumptive conditions",
        "Veterans Service Officers",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://owh-three.vercel.app/#website",
      url: "https://owh-three.vercel.app",
      name: "Connecting the Dots of Service",
      description:
        "A living record of where veterans served, what they were exposed to, and what it cost them.",
      publisher: { "@id": "https://owh-three.vercel.app/#organization" },
      inLanguage: "en-US",
    },
  ],
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
        <script
          type="application/ld+json"
          // Serialised from a typed object literal above, not from user input
          // or anything read out of the database — there is no injection
          // surface here, and the < escape is belt-and-braces.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
          }}
        />
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
