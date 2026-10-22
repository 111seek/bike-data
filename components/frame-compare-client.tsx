"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Frame } from "@/lib/types";
import {
  FRAME_CATEGORY_LABEL,
  FRAME_MATERIAL_LABEL,
  cn,
  euro,
  fmtInt,
  frameTotal,
} from "@/lib/ui";

type Option = Pick<
  Frame,
  "slug" | "brand" | "model" | "year" | "category" | "frame_weight" | "fork_weight" | "price"
>;

type Row = {
  group: string;
  label: string;
  value: (f: Frame) => string;
  numeric?: (f: Frame) => number | null;
  better?: "lower" | "higher";
};

const ROWS: Row[] = [
  { group: "基本", label: "品牌", value: (f) => f.brand },
  { group: "基本", label: "型号", value: (f) => f.model },
  { group: "基本", label: "年份", value: (f) => String(f.year), numeric: (f) => f.year },
  { group: "基本", label: "类型", value: (f) => FRAME_CATEGORY_LABEL[f.category] },
  { group: "基本", label: "材质", value: (f) => FRAME_MATERIAL_LABEL[f.material] },
  { group: "基本", label: "测试日期", value: (f) => f.tested_at },

  {
    group: "重量",
    label: "车架",
    value: (f) => `${fmtInt(f.frame_weight)} g`,
    numeric: (f) => f.frame_weight,
    better: "lower",
  },
  {
    group: "重量",
    label: "前叉",
    value: (f) => `${fmtInt(f.fork_weight)} g`,
    numeric: (f) => f.fork_weight,
    better: "lower",
  },
  {
    group: "重量",
    label: "碗组",
    value: (f) => (f.headset_weight == null ? "—" : `${fmtInt(f.headset_weight)} g`),
    numeric: (f) => f.headset_weight,
    better: "lower",
  },
  {
    group: "重量",
    label: "车架 + 前叉",
    value: (f) => `${fmtInt(frameTotal(f))} g`,
    numeric: (f) => frameTotal(f),
    better: "lower",
  },

  {
    group: "价格",
    label: "整车参考价",
    value: (f) => euro(f.price),
    numeric: (f) => f.price,
    better: "lower",
  },
];

const GROUPS = ["基本", "重量", "价格"];

export default function FrameCompareClient({
  selected,
  options,
}: {
  selected: Frame[];
  options: Option[];
}) {
  const router = useRouter();
  const slugs = selected.map((f) => f.slug);

  function go(next: string[]) {
    router.push(next.length ? `/frames/compare?frames=${next.join(",")}` : "/frames/compare");
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Frame compare</p>
          <h1 className="mt-1 text-[30px] font-bold tracking-tight md:text-[40px]">车架对比</h1>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted">
            最多同时对比 4 款车架。重量与价格为 TOUR 实测/参考值；每行较轻或较便宜的一格会以绿色标出。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value=""
            onChange={(e) => add(e.target.value)}
            disabled={selected.length >= 4}
            className="h-10 max-w-[280px] rounded-lg border border-line bg-surface px-3 text-[12px] text-ink-soft outline-none focus:border-ink disabled:opacity-50"
          >
            <option value="">＋ 添加车架…</option>
            {brands.map((brand) => (
              <optgroup key={brand} label={brand}>
                {options
                  .filter((o) => o.brand === brand)
                  .map((o) => (
                    <option key={o.slug} value={o.slug} disabled={slugs.includes(o.slug)}>
                      {o.model} · {o.year} · {fmtInt(o.frame_weight)} g
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
          <h2 className="mt-4 text-[16px] font-semibold">还没有选择车架</h2>
          <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-6 text-muted">
            从上方下拉框添加，或先在车架库里勾选。也可以从这几款最轻的车架开始：
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {options
              .slice()
              .sort((a, b) => a.frame_weight - b.frame_weight)
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
          <Link
            href="/frames"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-ink px-5 text-[12.5px] font-semibold text-paper hover:bg-accent"
          >
            去车架库挑选 →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {selected.map((f) => (
              <div key={f.slug} className="relative overflow-hidden rounded-xl border border-line bg-surface p-4">
                <button
                  onClick={() => go(slugs.filter((s) => s !== f.slug))}
                  aria-label={`移除 ${f.model}`}
                  className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-[13px] text-muted hover:border-ink hover:text-ink"
                >
                  ×
                </button>
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted">{f.brand}</div>
                <a
                  href={f.source_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-0.5 block pr-5 text-[13px] font-semibold leading-snug hover:text-accent"
                >
                  {f.model}
                </a>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="num text-[26px] font-bold leading-none">{fmtInt(f.frame_weight)}</span>
                  <span className="text-[10px] text-muted">g 车架</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1 text-[10.5px] text-muted">
                  <span>前叉 {fmtInt(f.fork_weight)} g</span>
                  <span className="text-right">{euro(f.price)}</span>
                </div>
                <div className="mt-1 text-[10px] text-muted">
                  {FRAME_CATEGORY_LABEL[f.category]} · {FRAME_MATERIAL_LABEL[f.material]} · {f.year}
                </div>
              </div>
            ))}
            {selected.length < 4 && (
              <div className="hidden items-center justify-center rounded-xl border border-dashed border-line-strong p-4 text-center text-[11.5px] text-muted lg:flex">
                还可以再加 {4 - selected.length} 款
              </div>
            )}
          </div>

          <div className="table-scroll mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[620px] table-fixed border-collapse text-[12.5px]">
              <colgroup>
                <col style={{ width: 170 }} />
                {selected.map((f) => (
                  <col key={f.slug} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-r border-line bg-paper px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                    项目
                  </th>
                  {selected.map((f) => (
                    <th key={f.slug} className="border-b border-line px-3 py-3 text-left">
                      <a href={f.source_url} target="_blank" rel="noreferrer noopener" className="text-[12px] font-semibold hover:text-accent">
                        {f.model}
                      </a>
                      <div className="mt-0.5 text-[10px] font-normal text-muted">
                        {f.brand} · {f.year}
                      </div>
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

          <p className="mt-3 text-[11px] leading-5 text-muted">
            重量为 TOUR 实验室实测（车架含涂装），参考价为被测整车欧元售价，不是车架组单独售价。
            不同尺码、配色与配件会让重量有几十克浮动。
          </p>
        </>
      )}
    </main>
  );
}

function FragmentGroup({ group, rows, selected }: { group: string; rows: Row[]; selected: Frame[] }) {
  return (
    <>
      <tr>
        <td
          colSpan={selected.length + 1}
          className="sticky left-0 z-10 border-b border-line bg-paper px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
        >
          {group}
        </td>
      </tr>
      {rows.map((row) => {
        const nums = selected.map((f) => (row.numeric ? row.numeric(f) : null));
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
            {selected.map((f, i) => {
              const isBest = best != null && nums[i] === best;
              return (
                <td
                  key={f.slug}
                  className={cn("num px-3 py-2.5", isBest ? "bg-flag-soft font-semibold text-flag" : "text-ink")}
                >
                  {row.value(f)}
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
