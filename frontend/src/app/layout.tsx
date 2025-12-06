import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JuiceQu - Fresh & Healthy Juice Store",
    template: "%s | JuiceQu",
  },
  description:
    "Order fresh, healthy juices with AI-powered recommendations. Voice ordering available!",
  keywords: ["juice", "healthy", "fresh", "AI", "voice ordering", "indonesia"],
  authors: [{ name: "JuiceQu Team" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://juicequ.app",
    siteName: "JuiceQu",
    title: "JuiceQu - Fresh & Healthy Juice Store",
    description: "Order fresh, healthy juices with AI-powered recommendations.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-green-600 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
