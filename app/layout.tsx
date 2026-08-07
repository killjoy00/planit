import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "planit — group polls people actually answer",
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Free group polls for picking dates, places, and plans. Your friends vote from their email — no account, no app, no group chat scrollback.",
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
};

/**
 * The AdSense tag is deliberately *not* loaded here. It lives in the public
 * content layout so that ads only ever appear alongside published articles,
 * never on sign-in, app, or voting screens.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
