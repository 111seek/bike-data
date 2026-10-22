"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import RadarChart, { type Benchmark } from "@/components/radar-chart";
import type { Tire } from "@/lib/types";
import {
  PRICE_LABEL,
  TIRE_TYPE_LABEL,
  VERDICT_LABEL,
  cn,
  fmt,
  fmtDate,
  fmtInt,
  rrTone,
  toneText,
} from "@/lib/ui";

type Option = {
  slug: string;
  brand: string;
  model: string;
  year: number | null;
  tire_type: string;
  rr_high: number | null;
  image: string | null;
};

type Row = {
  label: string;
  group: string;
  value: (t: Tire) => string;
  numeric?: (t: Tire) => number | null;
  better?: "lower" | "higher";
};

const GROUPS = ["基本", "滚阻", "湿地抓地", "防刺与厚度", "规格"];

const ROWS: Row[] = [
  { label: "品牌", group: "基本", value: (t) => t.brand },
  { label: "型号", group: "基本", value: (t) => t.model },
  { label: "年份", group: "基本", value: (t) => String(t.year ?? "—") },
  { label: "类型", group: "基本", value: (t) => TIRE_TYPE_LABEL[t.tire_type] ?? t.tire_type },
  { label: "价位", group: "基本", value: (t) => PRICE_LABEL[t.price_range ?? ""] ?? t.price_range ?? "—" },
  { label: "综合评分", group: "基本", value: (t) => `${fmt(t.rating)} / 5`, numeric: (t) => t.rating, better: "higher" },

  { label: "滚阻 · 高胎压", group: "滚阻", value: (t) => (t.rr_high == null ? "—" : `${fmt(t.rr_high)} W`), numeric: (t) => t.rr_high, better: "lower" },
  { label: "滚阻 · 中胎压", group: "滚阻", value: (t) => (t.rr_medium == null ? "会员数据" : `${fmt(t.rr_medium)} W`), numeric: (t) => t.rr_medium, better: "lower" },
  { label: "滚阻 · 超高胎压", group: "滚阻", value: (t) => (t.rr_extra_high == null ? "会员数据" : `${fmt(t.rr_extra_high)} W`), numeric: (t) => t.rr_extra_high, better: "lower" },
  { label: "CRR（高胎压）", group: "滚阻", value: (t) => (t.detail?.rr.high?.crr ? t.detail.rr.high.crr.toFixed(5) : "—") },

  { label: "湿地抓地 · 平均", group: "湿地抓地", value: (t) => (t.grip_avg == null ? "—" : `${fmtInt(t.grip_avg)} 分`), numeric: (t) => t.grip_avg, better: "higher" },
  { label: "湿地抓地 · 中心", group: "湿地抓地", value: (t) => (t.grip_center == null ? "会员数据" : `${fmtInt(t.grip_center)} 分`), numeric: (t) => t.grip_center, better: "higher" },
  { label: "湿地抓地 · 边缘", group: "湿地抓地", value: (t) => (t.grip_edge == null ? "会员数据" : `${fmtInt(t.grip_edge)} 分`), numeric: (t) => t.grip_edge, better: "higher" },

  { label: "胎面防刺总分", group: "防刺与厚度", value: (t) => (t.puncture_tread == null ? "—" : `${fmtInt(t.puncture_tread)} 分`), numeric: (t) => t.puncture_tread, better: "higher" },
  { label: "胎侧防刺总分", group: "防刺与厚度", value: (t) => (t.puncture_sidewall == null ? "会员数据" : `${fmtInt(t.puncture_sidewall)} 分`), numeric: (t) => t.puncture_sidewall, better: "higher" },
  { label: "胎面厚度", group: "防刺与厚度", value: (t) => (t.thickness_tread == null ? "—" : `${fmt(t.thickness_tread)} mm`), numeric: (t) => t.thickness_tread },
  { label: "胎侧厚度", group: "防刺与厚度", value: (t) => (t.thickness_sidewall == null ? "会员数据" : `${fmt(t.thickness_sidewall)} mm`), numeric: (t) => t.thickness_sidewall },

  { label: "标称宽度", group: "规格", value: (t) => (t.width_spec == null ? "—" : `${fmtInt(t.width_spec)} mm`) },
  { label: "实测宽度", group: "规格", value: (t) => (t.width_measured == null ? "—" : `${fmtInt(t.width_measured)} mm`), numeric: (t) => t.width_measured },
  { label: "标称重量", group: "规格", value: (t) => (t.weight_spec == null ? "—" : `${fmtInt(t.weight_spec)} g`) },
  { label: "实测重量", group: "规格", value: (t) => (t.weight_measured == null ? "—" : `${fmtInt(t.weight_measured)} g`), numeric: (t) => t.weight_measured, better: "lower" },
  { label: "TPI", group: "规格", value: (t) => t.detail?.specs.tpi ?? "—" },
  { label: "胎唇", group: "规格", value: (t) => t.detail?.specs.bead ?? "—" },
  { label: "ETRTO", group: "规格", value: (t) => t.detail?.specs.etrto ?? "—" },
  { label: "最大胎压", group: "规格", value: (t) => (t.detail?.specs.max_pressure == null ? "—" : `${fmtInt(t.detail.specs.max_pressure)} psi`) },
  { label: "评测日期", group: "规格", value: (t) => fmtDate(t.detail?.published) },
];

export default function CompareClient({
  selected,
  options,
  benchmark,
}: {
  selected: Tire[];
  options: Option[];
  benchmark: Benchmark;
}) {
  const router = useRouter();
  const slugs = selected.map((t) => t.slug);

  function go(next: string[]) {
    if (next.length === 0) router.push("/compare");
    else router.push(`/compare?tires=${next.join(",")}`);
  }

  function add(slug: string) {
    if (!slug || slugs.includes(slug) || slugs.length >= 4) return;
    go([...slugs, slug]);
  }

  const brands = [...new Set(options.map((o) => o.brand))].sort((a, b) => a.localeCompare(b));

  return (
    <main className="mx-auto max-w-[1320px] px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Compare</p>
          <h1 className="mt-1 text-[30px] font-bold tracking-tight md:text-[38px]">轮胎对比</h1>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted">
            最多同时对比 4 条轮胎。数值行中，表现最好的一格会以绿色标出；会员数据表示原始站点未公开该项。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value=""
            onChange={(e) => add(e.target.value)}
            disabled={selected.length >= 4}
            className="h-10 max-w-[260px] rounded-lg border border-line bg-surface px-3 text-[12px] text-ink-soft outline-none focus:border-ink disabled:opacity-50"
          >
            <option value="">＋ 添加轮胎…</option>
            {brands.map((brand) => (
              <optgroup key={brand} label={brand}>
                {options
                  .filter((o) => o.brand === brand)
                  .map((o) => (
                    <option key={o.slug} value={o.slug} disabled={slugs.includes(o.slug)}>
                      {o.model} {o.year ? `· ${o.year}` : ""} {o.rr_high != null ? `· ${fmt(o.rr_high)}W` : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {selected.length > 0 && (
            <button
              onClick={() => go([])}
              className="h-10 rounded-lg border border-line bg-surface px-3 text-[12px] text-muted hover:border-line-strong hover:text-ink"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-line text-2xl text-muted">＋</div>
          <h2 className="mt-4 text-[16px] font-semibold">还没有选择轮胎</h2>
          <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-6 text-muted">
            从上方下拉框添加，或先在数据库里勾选。也可以从这几条热门轮胎开始：
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {options
              .filter((o) => o.rr_high != null)
              .sort((a, b) => (a.rr_high ?? 99) - (b.rr_high ?? 99))
              .slice(0, 4)
              .map((o) => (
                <button
                  key={o.slug}
                  onClick={() => add(o.slug)}
                  className="rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] hover:border-ink"
                >
                  {o.brand} {o.model}
                </button>
              ))}
          </div>
          <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-ink px-5 text-[12.5px] font-semibold text-paper hover:bg-accent">
            去数据库挑选 →
          </Link>
        </div>
      ) : (
        <>
          {selected.length >= 2 && <RadarChart tires={selected} benchmark={benchmark} />}

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {selected.map((t) => (
              <div key={t.slug} className="relative overflow-hidden rounded-xl border border-line bg-surface">
                <button
                  onClick={() => go(slugs.filter((s) => s !== t.slug))}
                  aria-label={`移除 ${t.model}`}
                  className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-[13px] text-muted hover:border-ink hover:text-ink"
                >
                  ×
                </button>
                <div className="flex h-32 items-center justify-center bg-paper p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image ?? ""} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </div>
                <div className="border-t border-line p-3">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted">{t.brand}</div>
                  <Link href={`/tires/${t.slug}`} className="line-clamp-2 text-[12.5px] font-semibold leading-snug hover:text-accent">
                    {t.model}
                  </Link>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={cn("num text-[18px] font-bold", toneText[rrTone(t.rr_high)])}>
                      {fmt(t.rr_high)}
                      <span className="ml-0.5 text-[9px] font-normal text-muted">W</span>
                    </span>
                    <span className="text-[10px] text-muted">
                      {TIRE_TYPE_LABEL[t.tire_type]} · {fmtInt(t.weight_measured)} g
                    </span>
                  </div>
                  {t.detail?.verdict && (
                    <div className="mt-1 text-[10px] text-muted">{VERDICT_LABEL[t.detail.verdict] ?? t.detail.verdict}</div>
                  )}
                </div>
              </div>
            ))}
            {selected.length < 4 && (
              <div className="hidden items-center justify-center rounded-xl border border-dashed border-line-strong p-4 text-center text-[11.5px] text-muted lg:flex">
                还可以再加 {4 - selected.length} 条
              </div>
            )}
          </div>

          <div className="table-scroll mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-[12.5px]">
              <colgroup>
                <col style={{ width: 150 }} />
                {selected.map((t) => (
                  <col key={t.slug} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-[150px] border-b border-r border-line bg-paper px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                    测试项目
                  </th>
                  {selected.map((t) => (
                    <th key={t.slug} className="border-b border-line px-3 py-3 text-left">
                      <Link href={`/tires/${t.slug}`} className="text-[12px] font-semibold hover:text-accent">
                        {t.model}
                      </Link>
                      <div className="mt-0.5 text-[10px] font-normal text-muted">{t.year ?? ""}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((group) => (
                  <FragmentGroup key={group} group={group} rows={ROWS.filter((r) => r.group === group)} selected={selected} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-muted">
            提示：滚阻越低越好，抓地/防刺分数越高越好。「会员数据」字段需要原始站点的 Pro 会员权限。
          </p>
        </>
      )}
    </main>
  );
}

function FragmentGroup({ group, rows, selected }: { group: string; rows: Row[]; selected: Tire[] }) {
  return (
    <>
      <tr>
        <td
          colSpan={selected.length + 1}
          className="sticky left-0 border-b border-line bg-paper px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
        >
          {group}
        </td>
      </tr>
      {rows.map((row) => {
        const nums = selected.map((t) => (row.numeric ? row.numeric(t) : null));
        const valid = nums.filter((n): n is number => n != null);
        const unique = new Set(valid).size === valid.length;
        const best =
          valid.length > 1 && unique && row.better
            ? row.better === "lower"
              ? Math.min(...valid)
              : Math.max(...valid)
            : null;
        return (
          <tr key={row.label} className="border-b border-line/60 last:border-0">
            <th className="sticky left-0 z-10 border-r border-line bg-surface px-4 py-2.5 text-left text-[12px] font-normal text-ink-soft">
              {row.label}
            </th>
            {selected.map((t, i) => {
              const isBest = best != null && nums[i] === best;
              return (
                <td
                  key={t.slug}
                  className={cn(
                    "num px-3 py-2.5",
                    isBest ? "bg-flag-soft font-semibold text-flag" : "text-ink",
                  )}
                >
                  {row.value(t)}
                  {isBest && <span className="ml-1.5 text-[9px] font-medium tracking-wide">最佳</span>}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
