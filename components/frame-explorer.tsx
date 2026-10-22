"use client";

import { useMemo, useState } from "react";

import type { Frame } from "@/lib/types";
import {
  FRAME_CATEGORY_LABEL,
  FRAME_MATERIAL_LABEL,
  cn,
  euro,
  fmtInt,
  frameTotal,
} from "@/lib/ui";

type SortKey = "frame" | "fork" | "total" | "price" | "year" | "model";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "frame", label: "车架最轻" },
  { key: "fork", label: "前叉最轻" },
  { key: "total", label: "合计最轻" },
  { key: "price", label: "价格最低" },
  { key: "year", label: "年份最新" },
];

const CATEGORIES = ["all", "race", "aero", "endurance", "gravel", "allroad", "cyclocross"] as const;

function categoryBadge(category: string) {
  const styles: Record<string, string> = {
    race: "bg-ink text-paper ring-ink/20",
    aero: "bg-blue-50 text-blue-800 ring-blue-600/20",
    endurance: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    gravel: "bg-amber-50 text-amber-800 ring-amber-600/20",
    allroad: "bg-violet-50 text-violet-800 ring-violet-600/20",
    cyclocross: "bg-teal-50 text-teal-800 ring-teal-600/20",
  };
  return styles[category] ?? "bg-stone-100 text-stone-700 ring-stone-500/20";
}

function sortValue(f: Frame, key: SortKey): number | null {
  switch (key) {
    case "frame":
      return f.frame_weight;
    case "fork":
      return f.fork_weight;
    case "total":
      return frameTotal(f);
    case "price":
      return f.price;
    case "year":
      return f.year;
    default:
      return null;
  }
}

const DIR: Record<SortKey, "asc" | "desc"> = {
  frame: "asc",
  fork: "asc",
  total: "asc",
  price: "asc",
  year: "desc",
  model: "asc",
};

export default function FrameExplorer({ frames }: { frames: Frame[] }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState<string>("all");
  const [material, setMaterial] = useState("all");
  const [year, setYear] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("frame");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<string[]>([]);

  const brands = useMemo(
    () => [...new Set(frames.map((f) => f.brand))].sort((a, b) => a.localeCompare(b)),
    [frames],
  );
  const years = useMemo(
    () => [...new Set(frames.map((f) => f.year))].sort((a, b) => b - a),
    [frames],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = frames.filter((f) => {
      if (q && !`${f.brand} ${f.model}`.toLowerCase().includes(q)) return false;
      if (brand !== "all" && f.brand !== brand) return false;
      if (category !== "all" && f.category !== category) return false;
      if (material !== "all" && f.material !== material) return false;
      if (year !== "all" && String(f.year) !== year) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sortKey === "model") {
        const cmp = `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [frames, query, brand, category, material, year, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(DIR[key]);
    }
  }

  function toggleSelect(slug: string) {
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length >= 4
          ? prev
          : [...prev, slug],
    );
  }

  const hasFilters =
    query !== "" || brand !== "all" || category !== "all" || material !== "all" || year !== "all";
  const selectedFrames = selected
    .map((slug) => frames.find((f) => f.slug === slug))
    .filter((f): f is Frame => Boolean(f));

  function headBtn(key: SortKey, label: string) {
    return (
      <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        <span className={sortKey === key ? "text-accent" : "text-stone-300"}>
          {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    );
  }

  return (
    <section id="frames" className="scroll-mt-20">
      <div className="sticky top-16 z-30 -mx-4 border-y border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative flex min-w-[200px] flex-1 items-center">
            <span className="pointer-events-none absolute left-3 text-muted">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索品牌或型号…"
              className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] shadow-sm outline-none transition-colors placeholder:text-muted/70 focus:border-ink"
            />
          </label>

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
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="h-10 rounded-lg border border-line bg-surface px-2.5 text-[12px] text-ink-soft outline-none focus:border-ink"
          >
            <option value="all">全部材质</option>
            {Object.entries(FRAME_MATERIAL_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
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

          {hasFilters && (
            <button
              onClick={() => {
                setQuery("");
                setBrand("all");
                setCategory("all");
                setMaterial("all");
                setYear("all");
              }}
              className="h-10 px-1 text-[12px] text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              重置
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  category === c
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong",
                )}
              >
                {c === "all" ? "全部类型" : FRAME_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>

          <span className="num ml-auto text-[11.5px]">
            显示 <b className="font-semibold text-ink">{filtered.length}</b> / {frames.length} 款
          </span>

          <div className="flex flex-wrap gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSortKey(s.key);
                  setSortDir(DIR[s.key]);
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

      {/* mobile */}
      <div className="mt-4 space-y-2 md:hidden">
        {filtered.map((f) => {
          const isSelected = selected.includes(f.slug);
          return (
            <div
              key={f.slug}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                isSelected ? "border-accent/40 bg-accent-soft/40" : "border-line bg-surface",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(f.slug)}
                  aria-label={`对比 ${f.brand} ${f.model}`}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#da3f12]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                    <span>{f.year}</span>
                    <span className="rounded px-1 py-0.5 text-[9px] font-semibold ring-1 ring-inset ring-current/10">
                      {FRAME_CATEGORY_LABEL[f.category]}
                    </span>
                    <span>{FRAME_MATERIAL_LABEL[f.material]}</span>
                  </div>
                  <a
                    href={f.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-0.5 block text-[13.5px] font-semibold leading-snug"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted">{f.brand}</span>{" "}
                    {f.model}
                  </a>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[9.5px] text-muted">车架</div>
                      <div className="num text-[13px] font-semibold text-ink">{fmtInt(f.frame_weight)} g</div>
                    </div>
                    <div>
                      <div className="text-[9.5px] text-muted">前叉</div>
                      <div className="num text-[13px]">{fmtInt(f.fork_weight)} g</div>
                    </div>
                    <div>
                      <div className="text-[9.5px] text-muted">参考价</div>
                      <div className="num text-[13px]">{euro(f.price)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-line-strong px-4 py-12 text-center text-[12px] text-muted">
            没有符合条件的车架，试试放宽筛选。
          </div>
        )}
      </div>

      {/* desktop */}
      <div className="table-scroll -mx-4 mt-4 hidden overflow-x-auto md:-mx-8 md:block">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <caption className="sr-only">公路车架实测数据表</caption>
          <thead>
            <tr className="border-b border-line-strong text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="w-9 px-2 py-3" />
              <th className="px-3 py-3">
                <button onClick={() => toggleSort("model")} className="inline-flex items-center gap-1 hover:text-ink">
                  品牌 / 型号
                  <span className={sortKey === "model" ? "text-accent" : "text-stone-300"}>
                    {sortKey === "model" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
              </th>
              <th className="w-16 px-2 py-3">{headBtn("year", "年份")}</th>
              <th className="w-20 px-2 py-3">类型</th>
              <th className="w-20 px-2 py-3">材质</th>
              <th className="w-24 px-2 py-3 text-right">{headBtn("frame", "车架 g")}</th>
              <th className="w-24 px-2 py-3 text-right">{headBtn("fork", "前叉 g")}</th>
              <th className="w-24 px-2 py-3 text-right">{headBtn("total", "合计 g")}</th>
              <th className="w-24 px-2 py-3 text-right">{headBtn("price", "参考价")}</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const isSelected = selected.includes(f.slug);
              return (
                <tr
                  key={f.slug}
                  className={cn(
                    "group border-b border-line/70 transition-colors",
                    isSelected ? "bg-accent-soft/50" : "hover:bg-white",
                  )}
                >
                  <td className="px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(f.slug)}
                      aria-label={`对比 ${f.brand} ${f.model}`}
                      className="h-3.5 w-3.5 cursor-pointer accent-[#da3f12]"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                      {f.brand}
                    </div>
                    <a
                      href={f.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold leading-snug decoration-accent/40 underline-offset-4 group-hover:text-accent group-hover:underline"
                    >
                      {f.model}
                    </a>
                  </td>
                  <td className="num px-2 py-2.5 text-muted">{f.year}</td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                        categoryBadge(f.category),
                      )}
                    >
                      {FRAME_CATEGORY_LABEL[f.category]}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-[11.5px] text-muted">{FRAME_MATERIAL_LABEL[f.material]}</td>
                  <td className="num px-2 py-2.5 text-right font-semibold">{fmtInt(f.frame_weight)}</td>
                  <td className="num px-2 py-2.5 text-right">{fmtInt(f.fork_weight)}</td>
                  <td className="num px-2 py-2.5 text-right text-muted">{fmtInt(frameTotal(f))}</td>
                  <td className="num px-2 py-2.5 text-right">{euro(f.price)}</td>
                  <td className="px-2 py-2.5 text-right">
                    <a
                      href={f.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`查看 ${f.brand} ${f.model} 的原始测试`}
                      className="text-muted transition-colors group-hover:text-accent"
                    >
                      ↗
                    </a>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-muted">
                  没有符合条件的车架，试试放宽筛选条件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-muted">
        车架/前叉/碗组重量为 TOUR 实验室实测值，车架重量含涂装，不同尺码与配色会有差异。
        参考价为被测整车的欧元售价，并非车架组单独售价。
      </p>

      {selectedFrames.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-surface/95 shadow-[0_-8px_30px_rgba(25,23,16,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 px-4 py-3 md:px-8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              已选 {selectedFrames.length}/4
            </span>
            <div className="flex flex-1 flex-wrap gap-2">
              {selectedFrames.map((f) => (
                <button
                  key={f.slug}
                  onClick={() => toggleSelect(f.slug)}
                  className="group inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] hover:border-line-strong"
                  title="点击移除"
                >
                  <span className="font-medium">
                    {f.brand} {f.model}
                  </span>
                  <span className="text-muted group-hover:text-accent">×</span>
                </button>
              ))}
            </div>
            <a
              href={`/frames/compare?frames=${selected.join(",")}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-5 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
            >
              开始对比 →
            </a>
          </div>
        </div>
      )}
      {selectedFrames.length > 0 && <div className="h-20" />}
    </section>
  );
}
