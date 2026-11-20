import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./light-theme.css";
import "@xterm/xterm/css/xterm.css";
import "./clarity.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unzoo One | The AI task workspace",
  description:
    "Run, approve and track long-running AI tasks, with evidence, limits and a clear result for every step.",
  openGraph: {
    title: "Unzoo One | The AI task workspace",
    description: "See every step, approval and piece of evidence of your long-running AI tasks.",
    images: [
      {
        url: "https://unzoo-one-console.matiancheng528.chatgpt.site/og.png",
        width: 1740,
        height: 909,
        alt: "Unzoo One, the AI task workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unzoo One | The AI task workspace",
    description: "See every step, approval and piece of evidence of your long-running AI tasks.",
    images: ["https://unzoo-one-console.matiancheng528.chatgpt.site/og.png"],
  },
  icons: {
    icon: "/unzoo-favicon-v6.png",
    shortcut: "/unzoo-favicon-v6.png",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
