import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BaseDrop | Simple Crypto Payment Links on Base",
  description: "Share a link, send crypto. The easiest way to send USDC and ETH on the Base network. No complex addresses, just simple payment links.",
  keywords: ["Base", "Web3", "Crypto", "Payments", "Escrow", "USDC", "Ethereum", "Payment Link"],
  authors: [{ name: "nayrbryanGaming" }],
  openGraph: {
    title: "BaseDrop | Send Crypto via Link",
    description: "The easiest way to send cryptocurrency on Base. Safe, fast, and social.",
    url: "https://basedrop.vercel.app",
    siteName: "BaseDrop",
    images: [
      {
        url: "https://basedrop.vercel.app/og-image.png", // We can generate this asset later
        width: 1200,
        height: 630,
        alt: "BaseDrop - Easy Crypto Payments",
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
    images: ["https://basedrop.vercel.app/og-image.png"],
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
