"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const themeFor = (path: string) => (path.startsWith("/report") ? "light" : "dark");

/** 家长报告为浅色文档风，其余学生端页面为深色 */
export function ThemeSync() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.dataset.theme = themeFor(pathname);
  }, [pathname]);
  return null;
}

/** 首屏前设置主题，避免闪烁 */
export const themeBootScript = `document.documentElement.dataset.theme=location.pathname.startsWith('/report')?'light':'dark'`;
