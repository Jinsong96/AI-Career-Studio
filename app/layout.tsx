import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileTabBar, SiteFooter, SiteHeader } from "@/components/common/site-chrome";
import { MotionProvider } from "@/components/common/motion-provider";

export const metadata: Metadata = {
  title: "职业平行人生 · 在选专业之前，先试穿你的未来",
  description: "面向高中生和家长的 AI 职业探索产品 Demo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B4CCA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-sans">
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
