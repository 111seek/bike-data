import type { Metadata } from "next";
import Link from "next/link";

import { getTires } from "@/lib/data";
import type { Tire } from "@/lib/types";
import {
  TIRE_TYPE_LABEL,
  barPercent,
  bestWorst,
  cn,
  fmt,
  fmtInt,
  gripTone,
  punctureTone,
  rrTone,
  toneBg,
  toneText,
  weightTone,
} from "@/lib/ui";

export const metadata: Metadata = {
  title: "排行榜",
  description: "公路车轮胎滚阻、湿地抓地、防刺与重量榜单，数据来自第三方实验室实测。",
};

function RankSection({
  id,
  index,
  title,
  description,
  tires,
  pick,
  unit,
  digits,
  higherIsBetter,
  toneOf,
  note,
  limit = 12,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  tires: Tire[];
  pick: (t: Tire) => number | null;
  unit: string;
  digits: number;
  higherIsBetter: boolean;
  toneOf: (v: number | null) => keyof typeof toneBg;
  note: string;
  limit?: number;
}) {
  const values = tires.map(pick);
  const range = bestWorst(values, higherIsBetter);
  const list = tires
    .filter((t) => pick(t) != null)
    .sort((a, b) =>
      higherIsBetter ? (pick(b) ?? 0) - (pick(a) ?? 0) : (pick(a) ?? 999) - (pick(b) ?? 999),
    )
    .slice(0, limit);

  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="num text-[11px] font-semibold text-accent">{index}</span>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-[11.5px] text-muted">{description}</p>
          </div>
        </div>
        <span className="num text-[11px] text-muted">
          区间 {digits > 0 ? fmt(range.best, digits) : fmtInt(range.best)}–
          {digits > 0 ? fmt(range.worst, digits) : fmtInt(range.worst)} {unit}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {list.map((t, i) => {
          const value = pick(t)!;
          const low = higherIsBetter ? (range.worst ?? value) : (range.best ?? value);
          const high = higherIsBetter ? (range.best ?? value) : (range.worst ?? value);
          const pct = barPercent(value, low, high, higherIsBetter);
          return (
            <Link
              key={t.slug}
              href={`/tires/${t.slug}`}
              className="group grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line/60 px-4 py-2.5 transition-colors last:border-0 hover:bg-paper sm:grid-cols-[32px_minmax(0,1.1fr)_minmax(80px,1fr)_auto]"
            >
              <span className={cn("num text-[11px]", i < 3 ? "font-semibold text-accent" : "text-muted")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[10px] uppercase tracking-[0.1em] text-muted">{t.brand}</span>
                <span className="block truncate text-[12.5px] font-medium group-hover:text-accent">{t.model}</span>
              </span>
              <span className="hidden items-center gap-2 sm:flex">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span className={cn("block h-full rounded-full", toneBg[toneOf(value)])} style={{ width: `${pct}%` }} />
                </span>
                <span className="w-14 text-right text-[10px] text-muted">{TIRE_TYPE_LABEL[t.tire_type]}</span>
              </span>
              <span className={cn("num text-right text-[13px] font-semibold", toneText[toneOf(value)])}>
                {digits > 0 ? fmt(value, digits) : fmtInt(value)}
                <span className="ml-1 text-[9px] font-normal text-muted">{unit}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-[10.5px] leading-5 text-muted">{note}</p>
    </section>
  );
}

export default function RankingsPage() {
  const tires = getTires();

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8 md:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Leaderboards</p>
      <h1 className="mt-1 text-[32px] font-bold tracking-tight md:text-[42px]">排行榜</h1>
      <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted">
        把 {tires.length} 款公路车轮胎按单项能力排序。没有全能冠军——滚阻最低的胎往往防刺最差，
        先想清楚你最常骑的路况，再看榜。
      </p>

      <nav className="sticky top-16 z-20 mt-6 flex gap-1.5 overflow-x-auto border-y border-line bg-paper/95 py-2.5 backdrop-blur">
        {[
          { href: "#rr", label: "滚阻最低" },
          { href: "#grip", label: "抓地最强" },
          { href: "#puncture", label: "防刺最好" },
          { href: "#weight", label: "重量最轻" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] text-ink-soft hover:border-ink hover:text-ink"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-14">
        <RankSection
          id="rr"
          index="01"
          title="滚阻最低"
          description="高胎压下，单胎在 28.8 km/h、42.5 kg 负载时的功率损耗"
          tires={tires}
          pick={(t) => t.rr_high}
          unit="W"
          digits={1}
          higherIsBetter={false}
          toneOf={rrTone}
          note="滚阻每降低约 3 W，在 30 km/h 时大约相当于节省 10 W 踩踏功率。竞赛与计时赛优先看这项，但请同时留意抓地与防刺。"
          limit={15}
        />

        <RankSection
          id="grip"
          index="02"
          title="湿地抓地最强"
          description="静态湿地摩擦测试，分数 = 摩擦系数 × 100"
          tires={tires}
          pick={(t) => t.grip_avg}
          unit="分"
          digits={0}
          higherIsBetter
          toneOf={gripTone}
          note="仅统计做过抓地测试的轮胎（部分 2021 年前的老款没有该数据）。高分胎在湿滑路面制动和压弯更有把握，但通常滚阻略高。"
        />

        <RankSection
          id="puncture"
          index="03"
          title="防刺最好"
          description="胎面总防刺分数：尖锐物穿刺力 + 钝器穿刺力 + 胎体厚度"
          tires={tires}
          pick={(t) => t.puncture_tread}
          unit="分"
          digits={0}
          higherIsBetter
          toneOf={punctureTone}
          note="通勤、长途与烂路优先看防刺。高防刺通常意味着更厚的胎体和更高的滚阻，这是物理规律，不是调校能绕开的。"
        />

        <RankSection
          id="weight"
          index="04"
          title="重量最轻"
          description="称重实测重量，单位克"
          tires={tires}
          pick={(t) => t.weight_measured}
          unit="g"
          digits={0}
          higherIsBetter={false}
          toneOf={weightTone}
          note="轻量有利于爬坡与加速，但也要看气密性、耐磨和防刺。真空胎还需额外计算自补液重量。"
        />
      </div>

      <div className="mt-14 rounded-xl border border-line bg-surface p-5 text-[11.5px] leading-6 text-muted">
        <p>
          榜单只反映实验室条件下的相对表现。实际路感还会受到轮圈内宽、胎压、内胎/自补液、体重与路面粗糙度影响。
          完整测试方法见 <Link href="/about" className="text-accent hover:underline">关于数据</Link>。
        </p>
      </div>
    </main>
  );
}
