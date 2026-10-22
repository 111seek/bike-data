"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { TireRow } from "@/lib/types";
import { tireCnNote } from "@/lib/tire-cn";
import {
  PRICE_LABEL,
  TIRE_TYPE_LABEL,
  cn,
  fmt,
  fmtInt,
  gripTone,
  punctureTone,
  rrTone,
  toneText,
} from "@/lib/ui";

type SortKey =
  | "rr_high"
  | "grip_avg"
  | "puncture_tread"
  | "weight_measured"
  | "rating"
  | "year"
  | "model";

const DEFAULT_DIR: Record<SortKey, "asc" | "desc"> = {
  rr_high: "asc",
  grip_avg: "desc",
  puncture_tread: "desc",
  weight_measured: "asc",
  rating: "desc",
  year: "desc",
  model: "asc",
};

const TYPE_FILTERS = [
  { key: "all", label: "全部" },
  { key: "TLR", label: "真空胎" },
  { key: "TT", label: "开口胎" },
  { key: "TU", label: "管胎" },
];

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "rr_high", label: "滚阻最低" },
  { key: "grip_avg", label: "抓地最强" },
  { key: "puncture_tread", label: "防刺最好" },
  { key: "weight_measured", label: "重量最轻" },
  { key: "rating", label: "评分最高" },
  { key: "year", label: "年份最新" },
];

function typeBadge(type: string) {
  const styles: Record<string, string> = {
    TLR: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    TT: "bg-amber-50 text-amber-800 ring-amber-600/20",
    TU: "bg-violet-50 text-violet-800 ring-violet-600/20",
  };
  return styles[type] ?? "bg-stone-100 text-stone-700 ring-stone-500/20";
}

export default function TireExplorer({ rows, updatedAt }: { rows: TireRow[]; updatedAt?: string }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("all");
  const [price, setPrice] = useState("all");
  const [gripOnly, setGripOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("rr_high");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<string[]>([]);

  const brands = useMemo(
    () => [...new Set(rows.map((r) => r.brand))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const years = useMemo(
    () => [...new Set(rows.map((r) => r.year).filter((y): y is number => y != null))].sort((a, b) => b - a),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (q) {
        const haystack = `${r.brand} ${r.model} ${r.compound ?? ""} ${r.etrto ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (brand !== "all" && r.brand !== brand) return false;
      if (type !== "all" && r.tire_type !== type) return false;
      if (year !== "all" && String(r.year) !== year) return false;
      if (price !== "all" && r.price_range !== price) return false;
      if (gripOnly && r.grip_avg == null) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sortKey === "model") {
        const cmp = `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [rows, query, brand, type, year, price, gripOnly, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  }

  function toggleSelect(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= 4 ? prev : [...prev, slug],
    );
  }

  const hasFilters =
    query !== "" || brand !== "all" || type !== "all" || year !== "all" || price !== "all" || gripOnly;

  const selectedTires = selected
    .map((slug) => rows.find((r) => r.slug === slug))
    .filter((r): r is TireRow => Boolean(r));

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return <span className="text-stone-300">↕</span>;
    return <span className="text-accent">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <section id="database" className="scroll-mt-20">
      {/* toolbar */}
      <div className="-mx-4 border-y border-line bg-paper/95 px-4 py-3 backdrop-blur md:sticky md:top-16 md:z-30 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative flex min-w-[220px] flex-1 items-center">
            <span className="pointer-events-none absolute left-3 text-muted">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索品牌、型号、规格…"
              className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] shadow-sm outline-none transition-colors placeholder:text-muted/70 focus:border-ink"
            />
          </label>

          <div className="flex rounded-lg border border-line bg-surface p-0.5">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={cn(
                  "h-9 rounded-md px-2.5 text-[12px] font-medium transition-colors",
                  type === t.key ? "bg-ink text-paper" : "text-ink-soft hover:bg-ink/5",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="h-10 rounded-lg border border-line bg-surface px-2.5 text-[12px] text-ink-soft outline-none focus:border-ink"
          >
            <option value="all">全部品牌</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-10 rounded-lg border border-line bg-surface px-2.5 text-[12px] text-ink-soft outline-none focus:border-ink"
          >
            <option value="all">全部年份</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y} 年
              </option>
            ))}
          </select>

          <select
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-10 rounded-lg border border-line bg-surface px-2.5 text-[12px] text-ink-soft outline-none focus:border-ink"
          >
            <option value="all">全部价位</option>
            {Object.entries(PRICE_LABEL)
              .filter(([k]) => rows.some((r) => r.price_range === k))
              .map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
          </select>

          <button
            onClick={() => setGripOnly((v) => !v)}
            className={cn(
              "h-10 rounded-lg border px-3 text-[12px] font-medium transition-colors",
              gripOnly
                ? "border-ink bg-ink text-paper"
                : "border-line bg-surface text-ink-soft hover:border-line-strong",
            )}
            title="原始站点部分老款轮胎未做湿地抓地测试"
          >
            有抓地数据
          </button>

          {hasFilters && (
            <button
              onClick={() => {
                setQuery("");
                setBrand("all");
                setType("all");
                setYear("all");
                setPrice("all");
                setGripOnly(false);
              }}
              className="h-10 px-1 text-[12px] text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              重置
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span className="num">
            显示 <b className="font-semibold text-ink">{filtered.length}</b> / {rows.length} 款
          </span>
          <span className="text-line-strong">·</span>
          <span>点击表头排序</span>
          <div className="ml-auto flex flex-wrap gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSortKey(s.key);
                  setSortDir(DEFAULT_DIR[s.key]);
                }}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  sortKey === s.key
                    ? "border-accent/30 bg-accent-soft text-accent"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* mobile cards */}
      <div className="mt-4 space-y-2 md:hidden">
        {filtered.map((r) => {
          const isSelected = selected.includes(r.slug);
          return (
            <div
              key={r.slug}
              className={cn(
                "rounded-xl border bg-surface p-3 transition-colors",
                isSelected ? "border-accent/40 bg-accent-soft/40" : "border-line",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(r.slug)}
                  aria-label={`对比 ${r.brand} ${r.model}`}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#da3f12]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-muted">
                    <span>{r.brand}</span>
                    <span className="text-line-strong">·</span>
                    <span>{r.year ?? "—"}</span>
                    <span
                      className={cn(
                        "ml-1 rounded px-1 py-0.5 text-[9px] font-semibold ring-1 ring-inset",
                        typeBadge(r.tire_type),
                      )}
                    >
                      {TIRE_TYPE_LABEL[r.tire_type] ?? r.tire_type}
                    </span>
                  </div>
                  <Link href={`/tires/${r.slug}`} className="mt-0.5 block text-[13.5px] font-semibold leading-snug">
                    {r.model}
                  </Link>
                  <div className="mt-0.5 text-[10px] leading-snug text-muted">{tireCnNote(r)}</div>
                  <div className="mt-2.5 grid grid-cols-4 gap-2">
                    <div>
                      <div className="text-[9.5px] text-muted">滚阻</div>
                      <div className={cn("num text-[13px] font-semibold", toneText[rrTone(r.rr_high)])}>
                        {fmt(r.rr_high)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9.5px] text-muted">抓地</div>
                      <div className={cn("num text-[13px]", toneText[gripTone(r.grip_avg)])}>
                        {fmtInt(r.grip_avg)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9.5px] text-muted">防刺</div>
                      <div className={cn("num text-[13px]", toneText[punctureTone(r.puncture_tread)])}>
                        {fmtInt(r.puncture_tread)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9.5px] text-muted">重量</div>
                      <div className="num text-[13px]">{fmtInt(r.weight_measured)}<span className="ml-0.5 text-[9px] text-muted">g</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-line-strong px-4 py-12 text-center text-[12px] text-muted">
            没有符合条件的轮胎，试试放宽筛选条件。
          </div>
        )}
      </div>

      {/* table */}
      <div className="table-scroll -mx-4 mt-4 hidden overflow-x-auto md:-mx-8 md:block">
        <table className="w-full min-w-[1020px] border-collapse text-[13px]">
          <caption className="sr-only">公路车轮胎实测数据表</caption>
          <thead>
            <tr className="border-b border-line-strong text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="w-9 px-2 py-3" />
              <th className="px-3 py-3">
                <button onClick={() => toggleSort("model")} className="inline-flex items-center gap-1 hover:text-ink">
                  品牌 / 型号 {sortIndicator("model")}
                </button>
              </th>
              <th className="w-16 px-2 py-3">
                <button onClick={() => toggleSort("year")} className="inline-flex items-center gap-1 hover:text-ink">
                  年份 {sortIndicator("year")}
                </button>
              </th>
              <th className="w-20 px-2 py-3">类型</th>
              <th className="w-20 px-2 py-3">价位</th>
              <th className="w-24 px-2 py-3 text-right">宽度<span className="block font-normal normal-case">标称 / 实测</span></th>
              <th className="w-24 px-2 py-3 text-right">重量<span className="block font-normal normal-case">标称 / 实测</span></th>
              <th className="w-20 px-2 py-3 text-right">
                <button onClick={() => toggleSort("rr_high")} className="inline-flex items-center gap-1 hover:text-ink" title="高胎压下的滚阻，越低越好">
                  滚阻 W {sortIndicator("rr_high")}
                </button>
              </th>
              <th className="w-16 px-2 py-3 text-right">
                <button onClick={() => toggleSort("grip_avg")} className="inline-flex items-center gap-1 hover:text-ink" title="湿地抓地分数，越高越好">
                  抓地 {sortIndicator("grip_avg")}
                </button>
              </th>
              <th className="w-16 px-2 py-3 text-right">
                <button onClick={() => toggleSort("puncture_tread")} className="inline-flex items-center gap-1 hover:text-ink" title="胎面防刺总分，越高越好">
                  防刺 {sortIndicator("puncture_tread")}
                </button>
              </th>
              <th className="w-16 px-2 py-3 text-right">厚 mm</th>
              <th className="w-16 px-2 py-3 text-right">
                <button onClick={() => toggleSort("rating")} className="inline-flex items-center gap-1 hover:text-ink">
                  评分 {sortIndicator("rating")}
                </button>
              </th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isSelected = selected.includes(r.slug);
              return (
                <tr
                  key={r.slug}
                  className={cn(
                    "group border-b border-line/70 transition-colors",
                    isSelected ? "bg-accent-soft/50" : "hover:bg-white",
                  )}
                >
                  <td className="px-2 py-2.5 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(r.slug)}
                      aria-label={`对比 ${r.brand} ${r.model}`}
                      className="h-3.5 w-3.5 cursor-pointer accent-[#da3f12]"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">{r.brand}</div>
                    <Link
                      href={`/tires/${r.slug}`}
                      className="font-semibold leading-snug text-ink decoration-accent/40 underline-offset-4 group-hover:text-accent group-hover:underline"
                    >
                      {r.model}
                    </Link>
                    <div className="mt-0.5 text-[10px] leading-snug text-muted">{tireCnNote(r)}</div>
                  </td>
                  <td className="num px-2 py-2.5 text-muted">{r.year ?? "—"}</td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                        typeBadge(r.tire_type),
                      )}
                    >
                      {TIRE_TYPE_LABEL[r.tire_type] ?? r.tire_type}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-[12px] text-muted">{PRICE_LABEL[r.price_range ?? ""] ?? r.price_range ?? "—"}</td>
                  <td className="num px-2 py-2.5 text-right text-[12px]">
                    <span className="text-muted">{fmtInt(r.width_spec)}</span>
                    <span className="text-line-strong"> / </span>
                    <span className="font-medium">{fmtInt(r.width_measured)}</span>
                  </td>
                  <td className="num px-2 py-2.5 text-right text-[12px]">
                    <span className="text-muted">{fmtInt(r.weight_spec)}</span>
                    <span className="text-line-strong"> / </span>
                    <span className="font-medium">{fmtInt(r.weight_measured)}</span>
                  </td>
                  <td className={cn("num px-2 py-2.5 text-right font-semibold", toneText[rrTone(r.rr_high)])}>
                    {fmt(r.rr_high)}
                  </td>
                  <td className={cn("num px-2 py-2.5 text-right", toneText[gripTone(r.grip_avg)])}>
                    {fmtInt(r.grip_avg)}
                  </td>
                  <td className={cn("num px-2 py-2.5 text-right", toneText[punctureTone(r.puncture_tread)])}>
                    {fmtInt(r.puncture_tread)}
                  </td>
                  <td className="num px-2 py-2.5 text-right text-muted">{fmt(r.thickness_tread)}</td>
                  <td className="num px-2 py-2.5 text-right">
                    <span className="font-medium">{fmt(r.rating)}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Link
                      href={`/tires/${r.slug}`}
                      aria-label={`查看 ${r.brand} ${r.model}`}
                      className="text-muted transition-colors group-hover:text-accent"
                    >
                      →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-16 text-center text-muted">
                  没有符合条件的轮胎，试试放宽筛选条件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <span>
          滚阻为高胎压下单个轮胎在 28.8 km/h、42.5 kg 负载时的功率损耗，数值越低越快。缺测项目显示为「—」。
        </span>
        <span className="num">数据抓取：{updatedAt?.slice(0, 10) ?? "—"}</span>
      </div>

      {selectedTires.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-surface/95 shadow-[0_-8px_30px_rgba(25,23,16,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 px-4 py-3 md:px-8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              已选 {selectedTires.length}/4
            </span>
            <div className="flex flex-1 flex-wrap gap-2">
              {selectedTires.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => toggleSelect(t.slug)}
                  className="group inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] hover:border-line-strong"
                  title="点击移除"
                >
                  <span className="font-medium">{t.brand} {t.model}</span>
                  <span className="text-muted group-hover:text-accent">×</span>
                </button>
              ))}
            </div>
            <Link
              href={`/compare?tires=${selected.join(",")}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-5 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
            >
              开始对比 →
            </Link>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      )}
      {selectedTires.length > 0 && <div className="h-20" />}
    </section>
  );
}
