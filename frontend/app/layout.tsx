import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "TuneTogether — Listen & Watch Together in Real Time",
  description: "Real-time synchronized music, videos, and live voice chat with friends. Zero lag, shared queues, and unforgettable listening parties.",
  icons: {
    icon: "/assets/app-logo.jpg",
    shortcut: "/assets/app-logo.jpg",
    apple: "/assets/app-logo.jpg",
  },
  openGraph: {
    title: "TuneTogether — Listen & Watch Together",
    description: "Real-time synchronized music, videos, and live voice chat with friends.",
    images: [{ url: "/assets/app-logo.jpg", width: 1200, height: 1200, alt: "TuneTogether" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
