import Link from "next/link";

import TireExplorer from "@/components/tire-explorer";
import { getRows, getStats } from "@/lib/data";
import { TIRE_TYPE_LABEL, fmt, fmtInt, rrTone, toneText } from "@/lib/ui";

export default function HomePage() {
  const rows = getRows();
  const stats = getStats();
  const fastest = rows
    .filter((r) => r.rr_high != null)
    .sort((a, b) => (a.rr_high ?? 99) - (b.rr_high ?? 99))
    .slice(0, 5);

  const brands = [...new Set(rows.map((r) => r.brand))];

  return (
    <main>
      {/* hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] dotted-grid opacity-[0.35] [mask-image:linear-gradient(to_left,black,transparent)] lg:block" />
        <div className="relative mx-auto max-w-[1320px] px-4 pb-10 pt-12 md:px-8 md:pb-14 md:pt-16">
          <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                Bicycle Rolling Resistance
                <span className="text-line-strong">/</span>
                <span>公路车轮胎实测</span>
              </p>

              <h1 className="mt-5 text-[42px] font-bold leading-[1.04] tracking-[-0.035em] md:text-[64px]">
                公路车轮胎
                <br />
                <span className="relative inline-block">
                  用数据说话
                  <svg
                    className="absolute -bottom-1 left-0 h-3 w-full text-accent/70"
                    viewBox="0 0 300 12"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path d="M2 8C70 3 180 2 298 6" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-accent">。</span>
              </h1>

              <p className="mt-6 max-w-xl text-[14px] leading-7 text-ink-soft">
                汇总 {stats.count} 款公路车轮胎的第三方实验室实测数据：滚阻、湿地抓地、防刺、厚度与重量。
                不用看广告词，筛一筛、排一排，找到适合你路况的那一条。
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#database"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
                >
                  浏览全部轮胎
                  <span aria-hidden>↓</span>
                </a>
                <Link
                  href="/rankings"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-line-strong bg-surface px-5 text-[13px] font-semibold text-ink transition-colors hover:border-ink"
                >
                  看看最快榜单
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/about"
                  className="px-1 text-[12px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
                >
                  这些数字怎么来的？
                </Link>
              </div>
            </div>

            {/* fastest mini board */}
            <div className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_0_rgba(25,23,16,0.04)]">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
                  当前滚阻最低
                </h2>
                <span className="num text-[11px] text-muted">W @ 高胎压</span>
              </div>
              <ol className="mt-4 space-y-3">
                {fastest.map((t, i) => (
                  <li key={t.slug}>
                    <Link href={`/tires/${t.slug}`} className="group block">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="num w-4 shrink-0 text-[11px] text-muted">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium group-hover:text-accent">
                          {t.brand} {t.model}
                        </span>
                        <span className={`num ml-auto text-[13px] font-semibold ${toneText[rrTone(t.rr_high)]}`}>
                          {fmt(t.rr_high)}
                        </span>
                      </div>
                      <div className="mt-1.5 ml-6 h-1 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-ink/70 transition-all group-hover:bg-accent"
                          style={{ width: `${Math.max(8, 100 - ((t.rr_high ?? 0) - 6) * 9)}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-5 text-muted">
                同一测试条件下，滚阻每降低 3W，大约相当于在 30 km/h 时省下 10W 的踩踏功率。
              </p>
            </div>
          </div>

          {/* stats band */}
          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
            {[
              { label: "收录轮胎", value: fmtInt(stats.count), unit: "款" },
              { label: "覆盖品牌", value: fmtInt(stats.brandCount), unit: "个" },
              {
                label: "最低滚阻",
                value: fmt(stats.fastestRr),
                unit: "W",
                accent: true,
              },
              { label: "最近评测", value: stats.latestPublished?.slice(0, 10) ?? "—", unit: "" },
            ].map((item) => (
              <div key={item.label} className="bg-surface px-5 py-4">
                <dt className="text-[11px] tracking-wide text-muted">{item.label}</dt>
                <dd className={`num mt-1 text-[24px] font-semibold ${item.accent ? "text-accent" : ""}`}>
                  {item.value}
                  {item.unit && <span className="ml-1 text-[12px] font-normal text-muted">{item.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* database */}
      <div className="mx-auto max-w-[1320px] px-4 pt-10 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">全部轮胎</h2>
            <p className="mt-1 text-[12px] text-muted">
              {brands.length} 个品牌 · 按滚阻、重量、抓地、防刺或年份排序 · 勾选最多 4 款进行对比
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["TLR", "TT", "TU"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-muted"
              >
                {TIRE_TYPE_LABEL[t]}
              </span>
            ))}
          </div>
        </div>
        <TireExplorer rows={rows} updatedAt={stats.scrapedAt} />
      </div>

      {/* explainer */}
      <section className="mx-auto mt-16 max-w-[1320px] px-4 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {[
            {
              n: "01",
              title: "滚阻决定快慢",
              body: "在平整柏油路上，滚阻是你需要持续克服的最大阻力之一。表中数值是单胎在 28.8 km/h、42.5 kg 负载下的功率损耗，越低越省力。",
              link: "/rankings#rr",
              cta: "看滚阻榜",
            },
            {
              n: "02",
              title: "抓地决定敢不敢压弯",
              body: "湿地抓地分数由摩擦系数换算而来，越高越好。竞速胎为了低滚阻往往牺牲抓地，耐力胎则相反——这就是选胎的取舍。",
              link: "/rankings#grip",
              cta: "看抓地榜",
            },
            {
              n: "03",
              title: "防刺决定能不能回家",
              body: "防刺总分综合了尖锐物穿刺力、钝器穿刺力与胎体厚度。通勤、长途和烂路，优先看这一栏。",
              link: "/rankings#puncture",
              cta: "看防刺榜",
            },
          ].map((card) => (
            <div key={card.n} className="bg-surface p-6">
              <span className="num text-[11px] font-semibold text-accent">{card.n}</span>
              <h3 className="mt-3 text-[16px] font-semibold">{card.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-soft">{card.body}</p>
              <Link
                href={card.link}
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
              >
                {card.cta} <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
