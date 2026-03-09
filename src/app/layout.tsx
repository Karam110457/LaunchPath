import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Tiempos Headline — Light and Light Italic for serif/italic styling (same font, weight, and style as Tiempos font-light italic pattern). */
const tiemposHeadline = localFont({
  src: [
    { path: "../../Test Tiempos Headline/TestTiemposHeadline-Light.otf", weight: "300", style: "normal" },
    { path: "../../Test Tiempos Headline/TestTiemposHeadline-LightItalic.otf", weight: "300", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LaunchPath — Stop learning AI. Start shipping.",
  description: "The guided path from confusion to your first sellable AI offer.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${tiemposHeadline.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster theme="system" position="bottom-left" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
