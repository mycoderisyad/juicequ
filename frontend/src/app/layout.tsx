import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { locales, defaultLocale, type Locale } from "@/locales";
import "./globals.css";
import { Providers } from "./providers";
import { SkipLink } from "@/components/ui/SkipLink";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("juicequ-locale")?.value as Locale | undefined;
  const initialLocale = localeCookie && locales[localeCookie] ? localeCookie : defaultLocale;

  return (
    <html lang={initialLocale} className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers initialLocale={initialLocale}>
          <SkipLink />
          {children}
        </Providers>
      </body>
    </html>
  );
}
