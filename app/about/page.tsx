import type { Metadata } from "next";
import Link from "next/link";

import { getStats, getTires } from "@/lib/data";
import { fmtDate } from "@/lib/ui";

export const metadata: Metadata = {
  title: "数据与测试方法",
  description: "滚阻、湿地抓地、防刺与尺寸重量的测试条件说明，以及本站的数据来源、抓取方式与免责声明。",
};

export default function AboutPage() {
  const tires = getTires();
  const stats = getStats();
  const coverage = [
    { label: "滚阻", n: tires.filter((t) => t.rr_high != null).length },
    { label: "湿地抓地", n: tires.filter((t) => t.grip_avg != null).length },
    { label: "防刺", n: tires.filter((t) => t.puncture_tread != null).length },
    { label: "实测重量", n: tires.filter((t) => t.weight_measured != null).length },
    { label: "TPI", n: tires.filter((t) => t.detail?.specs.tpi).length },
    { label: "ETRTO", n: tires.filter((t) => t.detail?.specs.etrto).length },
  ];

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8 md:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Methodology</p>
      <h1 className="mt-1 text-[32px] font-bold tracking-tight md:text-[42px]">这些数字怎么来的</h1>
      <p className="mt-4 text-[13.5px] leading-7 text-ink-soft">
        本站是一个非官方的中文数据整理项目。所有滚阻、抓地、防刺、尺寸与重量数据，
        都来自 <b>Bicycle Rolling Resistance</b>（作者 Jarno Bierman）公开的公路车轮胎评测页面，
        抓取后统一清洗为结构化字段，再重新组织成可筛选、可排序、可对比的界面。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "滚阻（Rolling Resistance）",
            body: "把轮胎装到测试轮上，以恒定速度转动并测量维持转动所需的功率。本站展示的是「高胎压」档：25–27 mm 用 80 psi，28–30 mm 用 72 psi；单胎、28.8 km/h、42.5 kg 负载。数值越低越省力。",
            unit: "单位：瓦特（W）",
          },
          {
            title: "湿地抓地（Wet Grip）",
            body: "在湿润表面做静态摩擦测试，分数 = 摩擦系数 × 100。中心与边缘分别测量，平均分用于排序。分数越高，湿地制动与压弯越有把握。",
            unit: "单位：分（0–100+），越高越好",
          },
          {
            title: "防刺（Puncture Resistance）",
            body: "用尖锐与钝头探针分别穿刺胎面、胎侧，并计入胎体厚度，换算为总防刺分数。分数越高越不容易被扎穿。2021 年起使用新的总分算法。",
            unit: "单位：分，越高越好",
          },
          {
            title: "尺寸与重量",
            body: "轮胎安装到 18 mm 内宽轮圈、充气至 100 psi / 6.9 bar 后测量宽度与高度；重量为电子秤实测。标称值来自厂商，实测值来自测试。",
            unit: "单位：毫米（mm）/ 克（g）",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[14px] font-semibold">{item.title}</h2>
            <p className="mt-2 text-[12px] leading-6 text-muted">{item.body}</p>
            <p className="mt-3 text-[10.5px] font-medium tracking-wide text-accent">{item.unit}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-[20px] font-bold tracking-tight">数据覆盖</h2>
        <p className="mt-2 text-[12.5px] leading-6 text-muted">
          当前入库 {stats.count} 款轮胎、{stats.brandCount} 个品牌，抓取时间{" "}
          <span className="num">{fmtDate(stats.scrapedAt)}</span>。部分项目在原始站点属于 Pro 会员内容，
          本站不包含，因此字段覆盖率并不一致——缺少的数据在页面上显示为「会员数据」或「—」。
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
          {coverage.map((c) => (
            <div key={c.label} className="flex items-center gap-4 border-b border-line/60 px-4 py-3 last:border-0">
              <span className="w-24 text-[12px] text-ink-soft">{c.label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full bg-ink/70"
                  style={{ width: `${Math.round((c.n / stats.count) * 100)}%` }}
                />
              </span>
              <span className="num w-20 text-right text-[11px] text-muted">
                {c.n} / {stats.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[20px] font-bold tracking-tight">技术实现</h2>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-6 text-muted">
          <li>· 抓取脚本：Python + lxml，解析列表页 18 列 + 每条评测页的规格与测试表格，输出 JSON / CSV。</li>
          <li>· 站点：Next.js（App Router）+ Tailwind CSS，详情页与品牌页静态生成。</li>
          <li>· 对比：最多 4 款轮胎并排，按项目自动标注最佳值。</li>
          <li>· 图片：产品图缓存于本地 <code className="rounded bg-paper px-1 text-[11px]">/public/tires</code>，避免外链失效。</li>
        </ul>
      </section>

      <section className="mt-12 rounded-xl border border-line bg-ink p-6 text-paper">
        <h2 className="text-[15px] font-semibold">来源与免责声明</h2>
        <p className="mt-2 text-[12px] leading-6 text-paper/65">
          原始评测、测试方法、图表与产品图的版权归 Jarno Bierman / Bicycle Rolling Resistance 所有。
          本站仅抓取公开可见的结构化数据用于技术演示与个人选胎参考，不提供原始站点的付费内容，
          与原始站点无隶属关系。测试结果只代表实验室特定条件下该条样胎的表现，个体差异、轮圈、胎压与路况都会影响实际体验。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://www.bicyclerollingresistance.com/road-bike-reviews"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center rounded-lg bg-paper px-4 text-[12px] font-semibold text-ink hover:bg-accent hover:text-paper"
          >
            原始列表页 ↗
          </a>
          <a
            href="https://www.bicyclerollingresistance.com/the-test"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center rounded-lg border border-paper/30 px-4 text-[12px] font-medium text-paper hover:border-paper"
          >
            官方测试方法 ↗
          </a>
          <a
            href="/data/tires.csv"
            download
            className="inline-flex h-9 items-center rounded-lg border border-paper/30 px-4 text-[12px] font-medium text-paper hover:border-paper"
          >
            下载 CSV ↓
          </a>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg border border-paper/30 px-4 text-[12px] font-medium text-paper hover:border-paper"
          >
            返回数据库
          </Link>
        </div>
      </section>
    </main>
  );
}
