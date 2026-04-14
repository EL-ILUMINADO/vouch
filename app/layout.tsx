import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { PwaInit } from "@/components/PwaInit";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const inter = Inter({ subsets: ["latin"], display: "swap" });

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://vouchdating.vercel.app";

// ─── Viewport / theme-color
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f43f5e" },
    { media: "(prefers-color-scheme: dark)", color: "#f43f5e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ─── SEO + PWA metadata
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: "Vouch — Verified Campus Dating for Nigerian University Students",
    template: "%s | Vouch",
  },

  description:
    "Vouch is the invite-only campus dating app for Nigerian university students. Meet verified, real people at UNIBEN, UNILAG and more. 100% free, 100% verified.",

  keywords: [
    "campus dating Nigeria",
    "Nigerian university dating app",
    "dating app Nigeria",
    "UNIBEN dating",
    "UNILAG dating",
    "verified student dating",
    "campus social app Nigeria",
    "Nigerian college dating",
    "university dating app Nigeria",
    "student dating app",
    "Nigerian dating",
    "campus love Nigeria",
    "exclusive dating app",
    "invite-only dating Nigeria",
  ],

  authors: [{ name: "Vouch", url: APP_URL }],
  creator: "Vouch",
  publisher: "Vouch",
  category: "dating",
  applicationName: "Vouch",

  // PWA manifest
  manifest: "/manifest.json",

  // Apple PWA meta tags
  appleWebApp: {
    capable: true,
    title: "Vouch",
    statusBarStyle: "default",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: "Vouch",
    title: "Vouch — Verified Campus Dating for Nigerian University Students",
    description:
      "Meet real, verified students near you. Vouch is the invite-only dating & social app built exclusively for Nigerian university campuses.",
    images: [
      {
        url: "/logo.png",
        width: 1280,
        height: 698,
        alt: "Vouch — Campus Dating App",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Vouch — Verified Campus Dating",
    description:
      "The invite-only campus dating app for Nigerian university students. 100% verified. 100% free.",
    images: ["/logo.png"],
  },

  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
    shortcut: "/logo.png",
  },

  alternates: {
    canonical: "/",
  },
};

// ─── JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vouch",
  url: APP_URL,
  description:
    "Vouch is the invite-only campus dating and social networking app for verified Nigerian university students.",
  applicationCategory: "SocialNetworkingApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "NGN",
  },
  audience: {
    "@type": "Audience",
    audienceType: "University students in Nigeria",
  },
  inLanguage: "en-NG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={cn(
          inter.className,
          "overflow-x-hidden scrollbar-hide bg-background text-foreground",
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PwaInit />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
