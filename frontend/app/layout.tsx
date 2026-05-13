import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Syne } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "ContentCube — Turn Content Into a Full Content Pack",
  description:
    "Paste a YouTube video or blog URL and get hooks, LinkedIn posts, Instagram captions, and Shorts ideas in seconds. Runs locally, no API key required.",
  openGraph: {
    title: "ContentCube — Turn Content Into a Full Content Pack",
    description:
      "Paste a YouTube video or blog URL → hooks, LinkedIn posts, Instagram captions, and Shorts ideas in seconds.",
    type: "website",
    siteName: "ContentCube",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentCube — Turn Content Into a Full Content Pack",
    description:
      "Paste a YouTube video or blog URL → hooks, LinkedIn posts, Instagram captions, and Shorts ideas in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${dmMono.variable} ${syne.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
