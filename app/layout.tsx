import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "BaseDrop | 101% Perfected Crypto Links",
  description: "The gold standard for crypto payment links on Base. Send USDC and ETH with absolute precision and world-class security.",
  keywords: ["Base", "Web3 architect", "USDC", "Ethereum", "Payment Link", "Escrow"],
  authors: [{ name: "Antigravity Architect" }],
  openGraph: {
    title: "BaseDrop | Ultimate Crypto Experience",
    description: "Send cryptocurrency on Base as easily as a text message. Secure, audited, and optimized.",
    url: "https://basedrop-mu.vercel.app",
    siteName: "BaseDrop",
    images: [
      {
        url: "https://basedrop-mu.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "BaseDrop - The Perfect Link",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BaseDrop | Send Crypto via Link",
    description: "The easiest way to send cryptocurrency on Base. Safe, fast, and social.",
    creator: "@BaseDrop",
    images: ["https://basedrop-mu.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-slate-950 text-slate-50 min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
