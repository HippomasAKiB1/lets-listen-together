import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};
import { Archivo_Black, Space_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const monoFont = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "TUNETOGETHER — REAL-TIME SYNCHRONIZED AUDIO & VIDEO",
  description: "REAL-TIME SYNCHRONIZED MUSIC, VIDEOS, AND LIVE VOICE CHAT WITH ZERO DELAY. SHARED QUEUES AND INSTANT ROOMS.",
  icons: {
    icon: "/assets/app-logo.jpg",
    shortcut: "/assets/app-logo.jpg",
    apple: "/assets/app-logo.jpg",
  },
  openGraph: {
    title: "TUNETOGETHER — REAL-TIME SYNCHRONIZED AUDIO & VIDEO",
    description: "REAL-TIME SYNCHRONIZED MUSIC, VIDEOS, AND LIVE VOICE CHAT WITH FRIENDS.",
    images: [{ url: "/assets/app-logo.jpg", width: 1200, height: 1200, alt: "TUNETOGETHER LOGO" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
