import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAIT Outlets — Find a plug before your battery dies",
  description:
    "Crowdsourced indoor outlet directory for SAIT main campus. Filter by building, floor, and wing; vote Works or Broken; no GPS required.",
  keywords: [
    "SAIT",
    "campus outlets",
    "charging",
    "battery",
    "indoor navigation",
    "crowdsourced",
  ],
  icons: {
    icon: "/uploads/logo/power-logo.png",
    apple: "/uploads/logo/power-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full light`}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.className} flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
