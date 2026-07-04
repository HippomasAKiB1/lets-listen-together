import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneTogether — Listen Together",
  description: "Real-time synchronized music listening with friends. Join a room, talk over voice, and feel the same beat at the exact same moment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
