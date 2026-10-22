import type { Metadata } from "next";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "滚阻库 · 公路车轮胎实测数据库",
    template: "%s · 滚阻库",
  },
  description:
    "182 款公路车轮胎的滚阻、湿地抓地、防刺、厚度与重量实测数据。支持搜索、筛选、排序与最多 4 款轮胎的并排对比。数据来自 Bicycle Rolling Resistance。",
  keywords: ["公路车轮胎", "滚阻", "滚阻测试", "轮胎对比", "真空胎", "开口胎", "管胎"],
  openGraph: {
    title: "滚阻库 · 公路车轮胎实测数据库",
    description: "用实测数据挑公路车胎：滚阻、抓地、防刺、重量，一表看完。",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
