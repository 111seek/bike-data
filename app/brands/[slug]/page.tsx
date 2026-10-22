import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { brandSlug, getBrands } from "@/lib/data";
import {
  TIRE_TYPE_LABEL,
  cn,
  fmt,
  fmtInt,
  gripTone,
  punctureTone,
  rrTone,
  toneText,
} from "@/lib/ui";

export function generateStaticParams() {
  return getBrands().map((b) => ({ slug: brandSlug(b.brand) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrands().find((b) => brandSlug(b.brand) === slug);
  if (!brand) return { title: "品牌不存在" };
  return {
    title: `${brand.brand} 轮胎实测数据`,
    description: `${brand.brand} 共 ${brand.count} 款公路车轮胎入库，平均滚阻 ${fmt(brand.avgRr)} W，最快型号 ${fmt(brand.bestRr)} W。`,
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrands().find((b) => brandSlug(b.brand) === slug);
  if (!brand) notFound();

  const fastest = brand.models.find((m) => m.rr_high != null);

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-8">
      <nav className="flex items-center gap-2 text-[11px] text-muted">
        <Link href="/" className="hover:text-ink">数据库</Link>
        <span className="text-line-strong">/</span>
        <Link href="/brands" className="hover:text-ink">品牌</Link>
        <span className="text-line-strong">/</span>
        <span className="text-ink-soft">{brand.brand}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[34px] font-bold tracking-tight md:text-[44px]">{brand.brand}</h1>
          <p className="mt-2 text-[13px] text-muted">
            {brand.count} 款轮胎入库 · 平均滚阻 {fmt(brand.avgRr)} W · 最快 {fmt(brand.bestRr)} W
            {fastest ? `（${fastest.model}）` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/rankings"
            className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-[11.5px] text-ink-soft hover:border-ink"
          >
            查看总榜
          </Link>
          <Link
            href={`/compare?tires=${brand.models[0]?.slug ?? ""}`}
            className="inline-flex h-9 items-center rounded-lg bg-ink px-3 text-[11.5px] font-medium text-paper hover:bg-accent"
          >
            对比该品牌
          </Link>
        </div>
      </div>

      <div className="table-scroll mt-8 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-line-strong bg-paper text-left text-[10.5px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">型号</th>
              <th className="px-2 py-3 font-semibold">年份</th>
              <th className="px-2 py-3 font-semibold">类型</th>
              <th className="px-2 py-3 text-right font-semibold">宽度</th>
              <th className="px-2 py-3 text-right font-semibold">重量</th>
              <th className="px-2 py-3 text-right font-semibold">滚阻</th>
              <th className="px-2 py-3 text-right font-semibold">抓地</th>
              <th className="px-2 py-3 text-right font-semibold">防刺</th>
              <th className="px-2 py-3 text-right font-semibold">评分</th>
            </tr>
          </thead>
          <tbody>
            {brand.models.map((m) => (
              <tr key={m.slug} className="group border-b border-line/60 last:border-0 hover:bg-paper">
                <td className="px-4 py-2.5">
                  <Link href={`/tires/${m.slug}`} className="font-medium group-hover:text-accent">
                    {m.model}
                  </Link>
                </td>
                <td className="num px-2 py-2.5 text-muted">{m.year ?? "—"}</td>
                <td className="px-2 py-2.5 text-[11px] text-muted">{TIRE_TYPE_LABEL[m.tire_type]}</td>
                <td className="num px-2 py-2.5 text-right">{fmtInt(m.width_measured)}</td>
                <td className="num px-2 py-2.5 text-right">{fmtInt(m.weight_measured)} g</td>
                <td className={cn("num px-2 py-2.5 text-right font-semibold", toneText[rrTone(m.rr_high)])}>
                  {fmt(m.rr_high)}
                </td>
                <td className={cn("num px-2 py-2.5 text-right", toneText[gripTone(m.grip_avg)])}>
                  {fmtInt(m.grip_avg)}
                </td>
                <td className={cn("num px-2 py-2.5 text-right", toneText[punctureTone(m.puncture_tread)])}>
                  {fmtInt(m.puncture_tread)}
                </td>
                <td className="num px-2 py-2.5 text-right">{fmt(m.rating)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        宽度与重量为实测值，单位分别为 mm 与 g；滚阻单位 W，抓地与防刺为分数。
      </p>
    </main>
  );
}
