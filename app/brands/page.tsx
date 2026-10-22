import type { Metadata } from "next";
import Link from "next/link";

import { brandSlug, getBrands, getTires } from "@/lib/data";
import { TIRE_TYPE_LABEL, fmt, rrTone, toneText } from "@/lib/ui";

export const metadata: Metadata = {
  title: "品牌索引",
  description: "按品牌浏览公路车轮胎实测数据：收录数量、平均滚阻与最快型号。",
};

export default function BrandsPage() {
  const brands = getBrands();
  const total = getTires().length;
  const maxCount = Math.max(...brands.map((b) => b.count));

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Brands</p>
      <h1 className="mt-1 text-[32px] font-bold tracking-tight md:text-[42px]">品牌索引</h1>
      <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted">
        {brands.length} 个品牌、{total} 款轮胎。卡片上的数字是品牌平均滚阻（越低越好）与最快型号。
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link
            key={b.brand}
            href={`/brands/${brandSlug(b.brand)}`}
            className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[19px] font-bold tracking-tight group-hover:text-accent">{b.brand}</h2>
                <p className="mt-0.5 text-[11px] text-muted">{b.count} 款轮胎</p>
              </div>
              <span className="num rounded-full border border-line bg-paper px-2 py-1 text-[10.5px] text-muted">
                {fmt(b.avgRr)} W 平均
              </span>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-ink/60 group-hover:bg-accent"
                style={{ width: `${Math.max(8, (b.count / maxCount) * 100)}%` }}
              />
            </div>

            <div className="mt-4 space-y-1.5">
              {b.models.slice(0, 3).map((m) => (
                <div key={m.slug} className="flex items-baseline justify-between gap-3 text-[11.5px]">
                  <span className="truncate text-ink-soft">
                    <span className="text-muted">{TIRE_TYPE_LABEL[m.tire_type]}</span> {m.model}
                  </span>
                  <span className={`num shrink-0 font-medium ${toneText[rrTone(m.rr_high)]}`}>{fmt(m.rr_high)}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 text-[10.5px] text-muted">
              最快：{b.models.filter((m) => m.rr_high != null)[0]?.model ?? "—"} ·{" "}
              {fmt(b.bestRr)} W
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
