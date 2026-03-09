import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "BaseDrop | Crypto Payment Links on Base",
  description: "Lock ETH or USDC in a smart contract escrow and share a claimable link. No wallet address needed on the recipient side.",
  keywords: ["Base", "Web3", "USDC", "ETH", "Payment Link", "Escrow", "Crypto"],
  authors: [{ name: "BaseDrop" }],
  openGraph: {
    title: "BaseDrop | Send Crypto via Link",
    description: "Lock funds in escrow on Base, share a link. Recipient claims directly to their wallet.",
    url: "https://basedrop-protocol.vercel.app",
    siteName: "BaseDrop",
    images: [
      {
        url: "https://basedrop-protocol.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "BaseDrop - Crypto Payment Links on Base",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BaseDrop | Send Crypto via Link",
    description: "Lock funds in escrow on Base, share a link. Recipient claims directly to their wallet.",
    creator: "@BaseDrop",
    images: ["https://basedrop-protocol.vercel.app/og-image.png"],
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
