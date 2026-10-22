import type { Metadata } from "next";
import Link from "next/link";

import FrameExplorer from "@/components/frame-explorer";
import { getFrameStats, getFrames } from "@/lib/frames";
import { FRAME_CATEGORY_LABEL, euro, fmtInt } from "@/lib/ui";

export const metadata: Metadata = {
  title: "车架数据库",
  description:
    "49 款公路与砾石车架的实测重量：车架、前叉、碗组、参考价格、品牌与年份，支持筛选、排序和并排对比。数据来自 TOUR Magazin 实验室测试。",
};

export default function FramesPage() {
  const frames = getFrames();
  const stats = getFrameStats();

  return (
    <main>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] dotted-grid opacity-30 [mask-image:linear-gradient(to_left,black,transparent)] lg:block" />
        <div className="relative mx-auto max-w-[1320px] px-4 pb-10 pt-12 md:px-8 md:pt-14">
          <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Frame Lab
            <span className="text-line-strong">/</span>
            <span>车架实测</span>
          </p>

          <div className="mt-4 grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0">
              <h1 className="text-[38px] font-bold leading-[1.06] tracking-[-0.03em] md:text-[54px]">
                车架，也要
                <br />
                称过才算数<span className="text-accent">。</span>
              </h1>
              <p className="mt-5 max-w-xl text-[13.5px] leading-7 text-ink-soft">
                收录 {stats.count} 款公路与砾石车架的实验室实测重量：车架、前叉、碗组，以及被测整车的参考价格。
                所有数字来自 TOUR Magazin 的测试台，不是厂商宣传页上的「约」。
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#frames"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
                >
                  浏览车架库 <span aria-hidden>↓</span>
                </a>
                <Link
                  href="/frames/compare"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-line-strong bg-surface px-5 text-[13px] font-semibold text-ink transition-colors hover:border-ink"
                >
                  打开对比页 <span aria-hidden>→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
                  车架重量区间
                </h2>
                <span className="num text-[11px] text-muted">含涂装 · g</span>
              </div>
              <div className="mt-5 flex items-end gap-1.5">
                {[
                  {
                    label: "最轻",
                    value: stats.lightest?.frame_weight,
                    name: stats.lightest ? `${stats.lightest.brand} ${stats.lightest.model}` : "",
                  },
                  { label: "平均", value: stats.avgFrame, name: "全库平均" },
                  {
                    label: "最重",
                    value: Math.max(...frames.map((f) => f.frame_weight)),
                    name: (() => {
                      const heaviest = [...frames].sort((a, b) => b.frame_weight - a.frame_weight)[0];
                      return heaviest ? `${heaviest.brand} ${heaviest.model}` : "";
                    })(),
                  },
                ].map((item) => (
                  <div key={item.label} className="flex-1">
                    <div className="num text-[22px] font-semibold leading-none">
                      {fmtInt(item.value)}
                    </div>
                    <div className="mt-1 text-[10.5px] text-muted">{item.label}</div>
                    <div className="mt-0.5 truncate text-[10px] text-muted/80">{item.name}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-5 text-muted">
                最轻的是 {stats.lightest?.brand} {stats.lightest?.model}，实测{" "}
                {fmtInt(stats.lightest?.frame_weight)} g（{stats.lightest?.year}）。
              </p>
            </div>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
            {[
              { label: "收录车架", value: fmtInt(stats.count), unit: "款" },
              { label: "覆盖品牌", value: fmtInt(stats.brandCount), unit: "个" },
              { label: "平均车架重量", value: fmtInt(stats.avgFrame), unit: "g" },
              {
                label: "最便宜整车",
                value: euro(stats.cheapest?.price),
                unit: "",
                accent: true,
              },
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

      <div className="mx-auto max-w-[1320px] px-4 pt-10 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">全部车架</h2>
            <p className="mt-1 text-[12px] text-muted">
              按车架、前叉或合计重量排序 · 勾选最多 4 款对比 · 点击型号查看原始测试
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(FRAME_CATEGORY_LABEL).map(([key, label]) => (
              <span key={key} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-muted">
                {label}
              </span>
            ))}
          </div>
        </div>

        <FrameExplorer frames={frames} />
      </div>

      <section className="mx-auto mt-16 max-w-[1320px] px-4 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {[
            {
              n: "01",
              title: "重量怎么称的",
              body: "车架、前叉与碗组分别称重，车架重量含涂装。不同尺码、配色与配件会让数字有几十克浮动，跨车架比较时请把这一误差考虑进去。",
            },
            {
              n: "02",
              title: "价格是什么价",
              body: "表里的参考价是 TOUR 测试的那台整车的欧元售价，不是车架组单独售价。车架组通常明显更便宜，具体以品牌当地报价为准。",
            },
            {
              n: "03",
              title: "为什么收录这些",
              body: "优先选择 2022 年以后、有完整车架/前叉称重数据的公路与砾石车，覆盖竞速、气动、耐力、全地形与公路越野。",
            },
          ].map((card) => (
            <div key={card.n} className="bg-surface p-6">
              <span className="num text-[11px] font-semibold text-accent">{card.n}</span>
              <h3 className="mt-3 text-[16px] font-semibold">{card.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-soft">{card.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-muted">
          数据来源：TOUR Magazin（tour-magazin.de）的实验室测试。本站为非官方整理，版权归原作者所有。
          测试条件与完整数据请以原始文章为准。
        </p>
      </section>
    </main>
  );
}
