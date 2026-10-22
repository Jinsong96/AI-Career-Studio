import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MobileTabBar, SiteFooter, SiteHeader } from "@/components/common/site-chrome";
import { MotionProvider } from "@/components/common/motion-provider";
import { ThemeSync, themeBootScript } from "@/components/common/theme-sync";
import { Starfield } from "@/components/common/starfield";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "职业平行人生",
  description: "面向高中生和家长的 AI 职业探索产品 Demo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0D1A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark" className={mono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeSync />
        <Starfield />
        <MotionProvider>
          <SiteHeader />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <SiteFooter />
          <MobileTabBar />
        </MotionProvider>
      </body>
    </html>
  );
}
