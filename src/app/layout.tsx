import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CrisisSupport from "@/components/CrisisSupport";
import { AuthProvider } from "@/components/AuthProvider";
import { TextSizeApplier } from "@/components/TextSize";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Every relative canonical, OG url and image below resolves against this.
  metadataBase: new URL(SITE_URL),
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
  // NO canonical here. Next merges `alternates` down the tree, so a canonical
  // set on the layout is inherited by every page that does not set its own —
  // which told Google that /about, /help and every such page was a duplicate of
  // the homepage and should not be indexed separately. Each page now declares
  // its own; the homepage does it in src/app/page.tsx.
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
    url: SITE_URL,
    siteName: "Operation Whole Health",
    // 1200x630 is what Facebook, LinkedIn, iMessage and Slack all crop to. The
    // old 512-square rendered as a tiny centred logo in every preview — and a
    // veteran texting a book chapter to his wife IS the sharing path this public
    // layer was built for, so the preview is part of the product.
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Connecting the Dots of Service — a free record of where you served and what it cost you" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Connecting the Dots of Service",
    description: "A living record of where veterans served, what they were exposed to, and what it cost them.",
    images: ["/og-image.png"],
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
      // BOTH types, not just NGO. Google documents rich-result support for
      // `Organization` and says nothing about `NGO` — publishing the bare
      // NGO type means the entity signals (logo, legalName, sameAs) may not
      // be read as an Organization at all. The array keeps the more precise
      // schema.org type while staying inside what Google actually documents.
      // Verified against Google's Organization structured-data docs
      // 2026-08-16; `nonprofitStatus` below is schema.org-only and earns
      // nothing from Google, kept because other consumers do read it.
      "@type": ["NGO", "Organization"],
      "@id": `${SITE_URL}/#organization`,
      name: "Operation Whole Health",
      alternateName: "OWH",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
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
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Connecting the Dots of Service",
      description:
        "A living record of where veterans served, what they were exposed to, and what it cost them.",
      publisher: { "@id": `${SITE_URL}/#organization` },
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
