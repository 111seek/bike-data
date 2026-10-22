import type { Metadata } from "next";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "滚阻库 · 公路车实测数据库",
    template: "%s · 滚阻库",
  },
  description:
    "182 款公路车轮胎的滚阻、抓地、防刺数据，以及 49 款公路/砾石车架的车架、前叉重量与价格。支持搜索、筛选、排序与并排对比。",
  keywords: ["公路车轮胎", "滚阻", "轮胎对比", "车架重量", "车架对比", "公路车架", "砾石车架"],
  openGraph: {
    title: "滚阻库 · 公路车实测数据库",
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
