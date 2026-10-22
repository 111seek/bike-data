import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSimilar, getTire, getTires } from "@/lib/data";
import {
  BEAD_LABEL,
  PRESSURE_LABEL,
  PRESSURE_NOTE,
  PRICE_LABEL,
  TIRE_TYPE_HINT,
  TIRE_TYPE_LABEL,
  TUBE_LABEL,
  VERDICT_LABEL,
  bestWorst,
  cn,
  fmt,
  fmtDate,
  fmtInt,
  gripTone,
  percentileOf,
  proFieldLabel,
  punctureTone,
  ratingStars,
  rrTone,
  toneBg,
  toneText,
} from "@/lib/ui";

export function generateStaticParams() {
  return getTires().map((tire) => ({ slug: tire.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tire = getTire(slug);
  if (!tire) return { title: "轮胎不存在" };
  const parts = [
    `${tire.brand} ${tire.model}`,
    `${TIRE_TYPE_LABEL[tire.tire_type] ?? tire.tire_type}`,
    tire.rr_high != null ? `滚阻 ${fmt(tire.rr_high)} W` : null,
    tire.grip_avg != null ? `抓地 ${fmtInt(tire.grip_avg)} 分` : null,
    tire.weight_measured != null ? `实测 ${fmtInt(tire.weight_measured)} g` : null,
  ].filter(Boolean);
  return {
    title: `${tire.brand} ${tire.model} 实测数据`,
    description: parts.join(" · ") + "。查看完整规格、滚阻、湿地抓地与防刺测试数据。",
  };
}

function verdictStyle(verdict: string | null) {
  if (verdict === "Highly Recommended") return "bg-flag-soft text-flag ring-flag/20";
  if (verdict === "Recommended") return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
  if (verdict === "Not Recommended") return "bg-orange-50 text-orange-800 ring-orange-600/20";
  return "bg-stone-100 text-stone-700 ring-stone-500/20";
}

function TestRow({
  label,
  value,
  unit,
  gated,
}: {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  gated?: boolean;
}) {
  const empty = value == null || value === "";
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/60 py-2.5 last:border-0">
      <dt className="text-[12.5px] text-ink-soft">{label}</dt>
      <dd className={cn("num text-[13px]", gated && "italic text-muted")}>
        {gated ? (
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">会员数据</span>
        ) : empty ? (
          <span className="text-muted">—</span>
        ) : (
          <>
            <span className="font-medium">{value}</span>
            {unit && <span className="ml-1 text-[11px] font-normal text-muted">{unit}</span>}
          </>
        )}
      </dd>
    </div>
  );
}

function PercentileRow({
  label,
  value,
  unit,
  pct,
  sentence,
  range,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  pct: number | null;
  sentence: string;
  range: string;
  tone: keyof typeof toneBg;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-ink-soft">{label}</span>
        <span className="num text-[15px] font-semibold">
          {value}
          <span className="ml-1 text-[11px] font-normal text-muted">{unit}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className={cn("h-full rounded-full", toneBg[tone])} style={{ width: `${pct ?? 0}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
        <span>{pct == null ? "样本不足" : sentence}</span>
        <span className="num">{range}</span>
      </div>
    </div>
  );
}

export default async function TirePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tire = getTire(slug);
  if (!tire) notFound();

  const all = getTires();
  const detail = tire.detail;
  const specs = detail?.specs ?? {};
  const measurements = detail?.measurements ?? {};
  const rr = detail?.rr ?? {};
  const grip = detail?.grip ?? {};
  const puncture = detail?.puncture ?? {};
  const gated = new Set(detail?.pro_gated ?? []);
  const similar = getSimilar(tire, 4);

  const rrs = all.map((t) => t.rr_high);
  const grips = all.map((t) => t.grip_avg);
  const punctures = all.map((t) => t.puncture_tread);
  const weights = all.map((t) => t.weight_measured);

  const rrPct = percentileOf(rrs, tire.rr_high, false);
  const gripPct = percentileOf(grips, tire.grip_avg, true);
  const puncturePct = percentileOf(punctures, tire.puncture_tread, true);
  const weightPct = percentileOf(weights, tire.weight_measured, false);
  const ratingPct = percentileOf(all.map((t) => t.rating), tire.rating, true);

  const rrRange = bestWorst(rrs, false);
  const gripRange = bestWorst(grips, true);
  const punctureRange = bestWorst(punctures, true);
  const weightRange = bestWorst(weights, false);

  const rrRank =
    tire.rr_high == null ? null : 1 + all.filter((t) => (t.rr_high ?? 999) < tire.rr_high!).length;

  const verdict = detail?.verdict ?? null;
  const typeLabel = TIRE_TYPE_LABEL[tire.tire_type] ?? tire.tire_type;

  const summary = [
    `${tire.brand} ${tire.model} 是一条 ${fmtInt(tire.width_measured ?? tire.width_spec)} mm 的${typeLabel}`,
    tire.rr_high != null ? `实测滚阻 ${fmt(tire.rr_high)} W` : null,
    tire.grip_avg != null ? `湿地抓地 ${fmtInt(tire.grip_avg)} 分` : null,
    tire.puncture_tread != null ? `胎面防刺 ${fmtInt(tire.puncture_tread)} 分` : null,
    tire.weight_measured != null ? `实测重量 ${fmtInt(tire.weight_measured)} g` : null,
  ]
    .filter(Boolean)
    .join("，");

  const priceRange =
    PRICE_LABEL[tire.price_range ?? ""] ?? specs.price_range ?? tire.price_range ?? "—";

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-6 md:px-8 md:py-8">
      <nav className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <Link href="/" className="hover:text-ink">
          数据库
        </Link>
        <span className="text-line-strong">/</span>
        <Link href={`/brands/${tire.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="hover:text-ink">
          {tire.brand}
        </Link>
        <span className="text-line-strong">/</span>
        <span className="text-ink-soft">{tire.model}</span>
      </nav>

      {/* header */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <figure className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="pointer-events-none absolute inset-0 dotted-grid opacity-20" />
          <div className="relative flex aspect-[5/4] items-center justify-center p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tire.image ?? ""}
              alt={`${tire.brand} ${tire.model} 轮胎`}
              className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.03]"
              loading="eager"
            />
          </div>
          <figcaption className="relative flex items-center justify-between border-t border-line px-4 py-2.5 text-[10.5px] text-muted">
            <span>产品图：Bicycle Rolling Resistance</span>
            <span className="num">{specs.ean ? `EAN ${specs.ean}` : specs.mpn ? `MPN ${specs.mpn}` : ""}</span>
          </figcaption>
        </figure>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{tire.brand}</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span className="text-[11px] text-muted">{tire.year ?? "—"} 年</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span className="text-[11px] text-muted">{priceRange}价位</span>
          </div>

          <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.03em] md:text-[38px]">
            {tire.model}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-2.5 py-1 text-[10.5px] font-semibold text-paper">
              {typeLabel}
            </span>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10.5px] text-ink-soft">
              {TIRE_TYPE_HINT[tire.tire_type] ?? ""}
            </span>
            {specs.etrto && (
              <span className="num rounded-full border border-line bg-surface px-2.5 py-1 text-[10.5px] text-ink-soft">
                ETRTO {specs.etrto}
              </span>
            )}
            {specs.tpi && (
              <span className="num rounded-full border border-line bg-surface px-2.5 py-1 text-[10.5px] text-ink-soft">
                {specs.tpi} TPI
              </span>
            )}
          </div>

          <p className="mt-4 max-w-2xl text-[13.5px] leading-6 text-ink-soft">{summary}。</p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="num text-[30px] font-bold leading-none">{fmt(tire.rating)}</span>
              <div className="leading-tight">
                <div className="text-[15px] tracking-[0.1em] text-accent">{ratingStars(tire.rating)}</div>
                <div className="text-[10.5px] text-muted">综合评分 / 5</div>
              </div>
            </div>
            {verdict && (
              <span
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-semibold ring-1 ring-inset",
                  verdictStyle(verdict),
                )}
              >
                {VERDICT_LABEL[verdict] ?? verdict}
              </span>
            )}
            <span className="text-[11px] text-muted">
              {detail?.published ? `${fmtDate(detail.published)} 评测` : null}
            </span>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Link
              href={`/compare?tires=${tire.slug}${similar[0] ? `,${similar[0].slug}` : ""}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[12.5px] font-semibold text-paper transition-colors hover:bg-accent"
            >
              与近似胎对比 →
            </Link>
            <a
              href={tire.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink"
            >
              原始评测 ↗
            </a>
          </div>
        </div>
      </div>

      {/* key metrics */}
      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "滚阻 · 高胎压", value: fmt(tire.rr_high), unit: "W", tone: rrTone(tire.rr_high) },
          { label: "湿地抓地", value: fmtInt(tire.grip_avg), unit: "分", tone: gripTone(tire.grip_avg) },
          { label: "胎面防刺", value: fmtInt(tire.puncture_tread), unit: "分", tone: punctureTone(tire.puncture_tread) },
          { label: "实测重量", value: fmtInt(tire.weight_measured), unit: "g", tone: "muted" as const },
          { label: "实测宽度", value: fmtInt(tire.width_measured), unit: "mm", tone: "muted" as const },
          { label: "胎面厚度", value: fmt(tire.thickness_tread), unit: "mm", tone: "muted" as const },
        ].map((m) => (
          <div key={m.label} className="bg-surface px-4 py-3.5">
            <div className="text-[10.5px] text-muted">{m.label}</div>
            <div className={cn("num mt-1 text-[22px] font-semibold leading-none", toneText[m.tone])}>
              {m.value}
              <span className="ml-0.5 text-[10px] font-normal text-muted">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* body */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[18px] font-bold tracking-tight">横向对比</h2>
              <span className="text-[11px] text-muted">与全部 {all.length} 款公路车轮胎比较</span>
            </div>
            <div className="mt-5 grid gap-6 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
              <PercentileRow
                label="滚阻"
                value={fmt(tire.rr_high)}
                unit="W"
                pct={rrPct}
                sentence={rrPct == null ? "" : `快过 ${rrPct}% 的轮胎${rrRank ? ` · 第 ${rrRank} 名` : ""}`}
                range={`${fmt(rrRange.best)}–${fmt(rrRange.worst)} W`}
                tone={rrTone(tire.rr_high)}
              />
              <PercentileRow
                label="湿地抓地"
                value={fmtInt(tire.grip_avg)}
                unit="分"
                pct={gripPct}
                sentence={gripPct == null ? "" : `强过 ${gripPct}% 的轮胎`}
                range={`${fmtInt(gripRange.best)}–${fmtInt(gripRange.worst)} 分`}
                tone={gripTone(tire.grip_avg)}
              />
              <PercentileRow
                label="胎面防刺"
                value={fmtInt(tire.puncture_tread)}
                unit="分"
                pct={puncturePct}
                sentence={puncturePct == null ? "" : `强过 ${puncturePct}% 的轮胎`}
                range={`${fmtInt(punctureRange.best)}–${fmtInt(punctureRange.worst)} 分`}
                tone={punctureTone(tire.puncture_tread)}
              />
              <PercentileRow
                label="实测重量"
                value={fmtInt(tire.weight_measured)}
                unit="g"
                pct={weightPct}
                sentence={weightPct == null ? "" : `轻过 ${weightPct}% 的轮胎`}
                range={`${fmtInt(weightRange.best)}–${fmtInt(weightRange.worst)} g`}
                tone="muted"
              />
            </div>
            {ratingPct != null && (
              <p className="mt-3 text-[11px] text-muted">
                综合评分 {fmt(tire.rating)} / 5，高于 {ratingPct}% 的入库轮胎。评分由原始评测给出，反映滚阻、抓地、防刺与做工的综合取舍。
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-[18px] font-bold tracking-tight">测试结果</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              单胎、28.8 km/h、42.5 kg 负载；胎压按实测胎宽调整。
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface p-5">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">滚阻（W / CRR）</h3>
                <dl className="mt-2">
                  {(["ultra_high", "extra_high", "high", "medium"] as const).map((key) => {
                    const reading = rr[key];
                    const isGated = gated.has(`rr.${key}`);
                    const watts = reading?.watts ?? null;
                    return (
                      <TestRow
                        key={key}
                        label={PRESSURE_LABEL[key]}
                        value={
                          watts == null
                            ? null
                            : `${fmt(watts)} W${reading?.crr ? ` · ${reading.crr.toFixed(5)}` : ""}`
                        }
                        gated={isGated && watts == null}
                      />
                    );
                  })}
                </dl>
                <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-5 text-muted">
                  高胎压为最常见测试档：25–27 mm 用 80 psi，28–30 mm 用 72 psi。
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-5">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">湿地抓地（分）</h3>
                <dl className="mt-2">
                  <TestRow label="平均" value={grip.wet_avg} gated={gated.has("grip.wet_avg")} />
                  <TestRow label="中心" value={grip.wet_center} gated={gated.has("grip.wet_center")} />
                  <TestRow label="边缘" value={grip.wet_edge} gated={gated.has("grip.wet_edge")} />
                </dl>
                <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-5 text-muted">
                  分数 = 摩擦系数 × 100。测试轮圈内宽 19 mm，越高代表湿地制动越有把握。
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-5 md:col-span-2">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">防刺与厚度</h3>
                <div className="mt-2 grid gap-x-8 md:grid-cols-2">
                  <dl>
                    <TestRow label="胎面防刺总分" value={puncture.score_tread} unit="分" gated={gated.has("puncture.score_tread")} />
                    <TestRow label="胎侧防刺总分" value={puncture.score_sidewall} unit="分" gated={gated.has("puncture.score_sidewall")} />
                    <TestRow label="胎面尖锐物穿刺力" value={puncture.force_sharp_tread} gated={gated.has("puncture.force_sharp_tread")} />
                    <TestRow label="胎面钝器穿刺力" value={puncture.force_blunt_tread} gated={gated.has("puncture.force_blunt_tread")} />
                  </dl>
                  <dl>
                    <TestRow label="胎面厚度" value={puncture.thickness_tread} unit="mm" gated={gated.has("puncture.thickness_tread")} />
                    <TestRow label="胎侧厚度" value={puncture.thickness_sidewall} unit="mm" gated={gated.has("puncture.thickness_sidewall")} />
                    <TestRow label="胎侧尖锐物穿刺力" value={puncture.force_sharp_sidewall} gated={gated.has("puncture.force_sharp_sidewall")} />
                    <TestRow label="胎侧钝器穿刺力" value={puncture.force_blunt_sidewall} gated={gated.has("puncture.force_blunt_sidewall")} />
                  </dl>
                </div>
              </div>
            </div>
          </section>

          {similar.length > 0 && (
            <section className="mt-10">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[18px] font-bold tracking-tight">滚阻相近的轮胎</h2>
                <Link href="/rankings" className="text-[11.5px] text-accent hover:underline">
                  查看完整榜单 →
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {similar.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/tires/${s.slug}`}
                    className="group flex min-w-0 items-center gap-4 overflow-hidden rounded-xl border border-line bg-surface p-3 transition-colors hover:border-line-strong"
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image ?? ""} alt="" className="h-full w-full object-contain mix-blend-multiply" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted">{s.brand}</div>
                      <div className="truncate text-[12.5px] font-medium group-hover:text-accent">{s.model}</div>
                      <div className="mt-1 text-[10.5px] text-muted">
                        {TIRE_TYPE_LABEL[s.tire_type]} · {fmtInt(s.weight_measured)} g
                      </div>
                    </div>
                    <div className={cn("num text-[15px] font-semibold", toneText[rrTone(s.rr_high)])}>
                      {fmt(s.rr_high)}
                      <span className="ml-0.5 text-[9px] font-normal text-muted">W</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* sidebar */}
        <aside className="space-y-5">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[13px] font-bold">制造商规格</h2>
            <dl className="mt-2">
              <TestRow label="品牌" value={specs.brand ?? tire.brand} />
              <TestRow label="型号" value={specs.model ?? tire.model} />
              <TestRow label="年份" value={specs.year ?? tire.year} />
              <TestRow label="类型" value={TIRE_TYPE_LABEL[tire.tire_type] ?? tire.tire_type} />
              <TestRow label="内胎" value={TUBE_LABEL[tire.inner_tube ?? ""] ?? tire.inner_tube} />
              <TestRow label="价位" value={priceRange} />
              <TestRow label="TPI" value={specs.tpi} />
              <TestRow label="胶料 / Compound" value={specs.compound} />
              <TestRow label="胎唇" value={BEAD_LABEL[specs.bead ?? ""] ?? specs.bead} />
              <TestRow label="ETRTO" value={specs.etrto} />
              <TestRow label="标称宽度" value={tire.width_spec} unit="mm" />
              <TestRow label="标称重量" value={tire.weight_spec} unit="g" />
              <TestRow label="最大胎压" value={specs.max_pressure} unit="psi" />
              <TestRow label="产地" value={specs.made_in} gated={gated.has("spec.made_in")} />
              <TestRow label="EAN" value={specs.ean} />
              <TestRow label="MPN" value={specs.mpn} />
            </dl>
            {specs.available_sizes && specs.available_sizes.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <div className="text-[11px] text-muted">可选尺寸</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {specs.available_sizes.map((s) => (
                    <span key={s} className="num rounded border border-line bg-paper px-2 py-1 text-[10.5px] text-ink-soft">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[13px] font-bold">尺寸与重量实测</h2>
            <dl className="mt-2">
              <TestRow label="实测重量" value={measurements.weight_measured ?? tire.weight_measured} unit="g" />
              <TestRow label="含气嘴/补胎液" value={measurements.weight_system} unit="g" gated={gated.has("measurement.weight_system")} />
              <TestRow label="实测宽度" value={measurements.width_measured ?? tire.width_measured} unit="mm" />
              <TestRow label="实测高度" value={measurements.height_measured} unit="mm" gated={gated.has("measurement.height_measured")} />
              <TestRow label="周长" value={measurements.circumference} unit="mm" gated={gated.has("measurement.circumference")} />
              <TestRow label="胎面厚度" value={measurements.thickness_tread ?? tire.thickness_tread} unit="mm" />
              <TestRow label="胎侧厚度" value={measurements.thickness_sidewall} unit="mm" gated={gated.has("measurement.thickness_sidewall")} />
              <TestRow label="胎体宽度" value={measurements.casing_width} unit="mm" gated={gated.has("measurement.casing_width")} />
              <TestRow label="胎面宽度" value={measurements.tread_width} unit="mm" gated={gated.has("measurement.tread_width")} />
              <TestRow label="胎面覆盖率" value={measurements.tread_cover != null ? `${fmt(measurements.tread_cover, 0)}%` : null} gated={gated.has("measurement.tread_cover")} />
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-5 text-muted">
              尺寸在 100 psi / 6.9 bar、18 mm 内宽轮圈上测得（除非另注）。
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-line-strong bg-paper p-5">
            <h2 className="text-[12px] font-semibold">关于「会员数据」</h2>
            <p className="mt-2 text-[11.5px] leading-5 text-muted">
              原始站点将部分测试项（多胎压滚阻、抓地中心/边缘、胎侧防刺等）放在 Pro 会员中。本站只收录公开可见的数据，
              因此这些字段显示为「会员数据」。
            </p>
            {detail?.pro_gated && detail.pro_gated.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-accent">查看缺失字段（{detail.pro_gated.length}）</summary>
                <ul className="mt-2 space-y-1 text-[11px] text-muted">
                  {detail.pro_gated.map((key) => (
                    <li key={key}>· {proFieldLabel(key)}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div className="rounded-xl border border-line bg-ink p-5 text-paper">
            <h2 className="text-[12px] font-semibold">数据来源</h2>
            <p className="mt-2 text-[11.5px] leading-5 text-paper/60">
              评测数据、测试方法及产品图来自 Bicycle Rolling Resistance（作者 Jarno Bierman）。
              本站为非官方中文整理，版权归原作者所有。
            </p>
            <a
              href={tire.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-paper hover:text-accent"
            >
              阅读原始评测 <span aria-hidden>↗</span>
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
