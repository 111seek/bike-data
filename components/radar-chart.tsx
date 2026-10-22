"use client";

import { useState } from "react";

import type { Tire } from "@/lib/types";
import { cn, fmt, fmtInt, percentileOf } from "@/lib/ui";

export type RadarKey = "rr" | "grip" | "puncture" | "weight" | "thickness" | "rating";
export type Benchmark = Record<RadarKey, number[]>;

type Axis = {
  key: RadarKey;
  label: string;
  hint: string;
  higher: boolean;
  value: (t: Tire) => number | null;
  display: (t: Tire) => string;
};

export const RADAR_AXES: Axis[] = [
  {
    key: "rr",
    label: "滚阻效率",
    hint: "滚阻越低越好",
    higher: false,
    value: (t) => t.rr_high,
    display: (t) => (t.rr_high == null ? "—" : `${fmt(t.rr_high)} W`),
  },
  {
    key: "grip",
    label: "湿地抓地",
    hint: "湿地摩擦分数越高越好",
    higher: true,
    value: (t) => t.grip_avg,
    display: (t) => (t.grip_avg == null ? "—" : `${fmtInt(t.grip_avg)} 分`),
  },
  {
    key: "puncture",
    label: "防刺保护",
    hint: "胎面总防刺分数越高越好",
    higher: true,
    value: (t) => t.puncture_tread,
    display: (t) => (t.puncture_tread == null ? "—" : `${fmtInt(t.puncture_tread)} 分`),
  },
  {
    key: "weight",
    label: "轻量",
    hint: "实测重量越轻越好",
    higher: false,
    value: (t) => t.weight_measured,
    display: (t) => (t.weight_measured == null ? "—" : `${fmtInt(t.weight_measured)} g`),
  },
  {
    key: "thickness",
    label: "胎面厚度",
    hint: "胎面越厚越耐磨",
    higher: true,
    value: (t) => t.thickness_tread,
    display: (t) => (t.thickness_tread == null ? "—" : `${fmt(t.thickness_tread)} mm`),
  },
  {
    key: "rating",
    label: "综合评分",
    hint: "原始评测给出的综合评分",
    higher: true,
    value: (t) => t.rating,
    display: (t) => (t.rating == null ? "—" : `${fmt(t.rating)} / 5`),
  },
];

export const RADAR_COLORS = ["#da3f12", "#0e7490", "#7c3aed", "#b45309"];

const CX = 230;
const CY = 206;
const R = 132;
const LABEL_R = R + 20;

const ANGLES = RADAR_AXES.map((_, i) => -Math.PI / 2 + (i * Math.PI) / 3);

function point(index: number, score: number): [number, number] {
  const r = (Math.max(0, Math.min(100, score)) / 100) * R;
  return [CX + r * Math.cos(ANGLES[index]), CY + r * Math.sin(ANGLES[index])];
}

function hexPoints(scale: number): string {
  return ANGLES.map((_, i) => point(i, scale * 100).join(",")).join(" ");
}

export function radarScores(tire: Tire, benchmark: Benchmark): Array<number | null> {
  return RADAR_AXES.map((axis) => percentileOf(benchmark[axis.key], axis.value(tire), axis.higher));
}

export function radarAverage(tire: Tire, benchmark: Benchmark): number | null {
  const scores = radarScores(tire, benchmark).filter((v): v is number => v != null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export default function RadarChart({
  tires,
  benchmark,
}: {
  tires: Tire[];
  benchmark: Benchmark;
}) {
  const [active, setActive] = useState<number | null>(null);

  const series = tires.map((tire, index) => ({
    tire,
    color: RADAR_COLORS[index % RADAR_COLORS.length],
    scores: radarScores(tire, benchmark),
    average: radarAverage(tire, benchmark),
  }));

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">Radar</p>
            <h2 className="mt-0.5 text-[18px] font-bold tracking-tight">六维雷达</h2>
          </div>
          <p className="text-[10.5px] text-muted">百分位 · 越靠外越强</p>
        </div>
        <p className="mt-1 text-[11.5px] text-muted">
          每个轴是该维度在全部 {benchmark.rr.length} 款轮胎中的百分位。悬停图例卡片可单独高亮一条轮胎。
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="mx-auto w-full max-w-[600px]">
          <svg
            viewBox="0 0 460 415"
            role="img"
            aria-label="所选轮胎的六维雷达图"
            className="mx-auto block w-full"
          >
            {/* grid rings */}
            {[0.25, 0.5, 0.75, 1].map((k) => (
              <polygon
                key={k}
                points={hexPoints(k)}
                fill={k === 1 ? "#faf9f5" : "none"}
                stroke={k === 1 ? "#cfc8b9" : "#e4dfd4"}
                strokeWidth={k === 1 ? 1.2 : 1}
              />
            ))}

            {/* axes */}
            {ANGLES.map((angle, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={CX + R * Math.cos(angle)}
                y2={CY + R * Math.sin(angle)}
                stroke="#e4dfd4"
                strokeWidth={1}
              />
            ))}

            {/* scale labels along the top axis */}
            {[25, 50, 75].map((v) => (
              <text
                key={v}
                x={CX + 4}
                y={CY - (v / 100) * R + 3}
                fontSize={8.5}
                fill="#8f8a7e"
                stroke="#faf9f5"
                strokeWidth={3}
                paintOrder="stroke"
                className="num"
              >
                {v}
              </text>
            ))}

            {/* series */}
            {series.map((s, idx) => {
              const pts = s.scores.map((score, i) => point(i, score ?? 0));
              const dimmed = active != null && active !== idx;
              return (
                <g
                  key={s.tire.slug}
                  opacity={dimmed ? 0.18 : 1}
                  className="transition-opacity duration-200"
                >
                  <polygon
                    points={pts.map((p) => p.join(",")).join(" ")}
                    fill={s.color}
                    fillOpacity={0.12}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                  {pts.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={3.2} fill="#fff" stroke={s.color} strokeWidth={2}>
                      <title>
                        {`${s.tire.brand} ${s.tire.model} · ${RADAR_AXES[i].label}：${RADAR_AXES[i].display(
                          s.tire,
                        )} · 超过 ${s.scores[i] ?? 0}% 的轮胎`}
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}

            {/* axis labels */}
            {ANGLES.map((angle, i) => {
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              const x = CX + LABEL_R * cos;
              const y = CY + LABEL_R * sin;
              const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
              const dy = sin < -0.5 ? -6 : sin > 0.5 ? 14 : 4;
              return (
                <text
                  key={i}
                  x={x}
                  y={y + dy}
                  textAnchor={anchor}
                  fontSize={12}
                  fontWeight={600}
                  fill="#3c3a32"
                >
                  {RADAR_AXES[i].label}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="space-y-2.5">
          {series.map((s, i) => (
            <div
              key={s.tire.slug}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                active === i ? "border-ink/30 bg-paper" : "border-line bg-surface",
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.1em] text-muted">{s.tire.brand}</div>
                <div className="truncate text-[12px] font-medium">{s.tire.model}</div>
              </div>
              <div className="text-right">
                <div className="num text-[20px] font-bold leading-none" style={{ color: s.color }}>
                  {s.average ?? "—"}
                </div>
                <div className="mt-0.5 text-[9px] text-muted">六维均分</div>
              </div>
            </div>
          ))}
          <p className="rounded-xl border border-dashed border-line-strong bg-paper/60 p-3 text-[10.5px] leading-5 text-muted">
            P 值表示强于全库多少比例的轮胎：P92 即强于 92%。缺测维度在雷达图中按 0 绘制，且不计入均分；均分仅为六维百分位的算术平均，不代表绝对性能。
          </p>
        </div>
      </div>

      <div className="table-scroll overflow-x-auto border-t border-line bg-paper/40">
        <table className="w-full min-w-[420px] border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b border-line/70 text-left text-[10px] uppercase tracking-wider text-muted">
              <th className="w-[110px] px-4 py-2 font-semibold">维度</th>
              {series.map((s) => (
                <th key={s.tire.slug} className="px-3 py-2 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="normal-case tracking-normal text-ink-soft">{s.tire.model}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RADAR_AXES.map((axis, i) => (
              <tr key={axis.key} className="border-b border-line/50 last:border-0">
                <th className="px-4 py-2 text-left font-normal text-ink-soft" title={axis.hint}>
                  {axis.label}
                </th>
                {series.map((s) => {
                  const score = s.scores[i];
                  return (
                    <td key={s.tire.slug} className="px-3 py-2">
                      <span className="num">{axis.display(s.tire)}</span>
                      <span className="ml-1.5 text-[10px] text-muted">
                        {score == null ? "缺测" : `P${score}`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
