import type { Metadata } from "next";

import FrameCompareClient from "@/components/frame-compare-client";
import { getFrames } from "@/lib/frames";

export const metadata: Metadata = {
  title: "车架对比",
  description:
    "把最多 4 款公路/砾石车架放在一起：车架重量、前叉重量、碗组、合计重量、参考价格与性价比逐项对比。",
};

export default async function FrameComparePage({
  searchParams,
}: {
  searchParams: Promise<{ frames?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.frames) ? params.frames[0] : params.frames;
  const slugs = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const all = getFrames();
  const selected = slugs
    .map((slug) => all.find((f) => f.slug === slug))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  const options = all.map((f) => ({
    slug: f.slug,
    brand: f.brand,
    model: f.model,
    year: f.year,
    category: f.category,
    frame_weight: f.frame_weight,
    fork_weight: f.fork_weight,
    price: f.price,
  }));

  return <FrameCompareClient selected={selected} options={options} />;
}
