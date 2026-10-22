import type { Metadata } from "next";

import CompareClient from "@/components/compare-client";
import type { Benchmark } from "@/components/radar-chart";
import { getTires } from "@/lib/data";

export const metadata: Metadata = {
  title: "轮胎对比",
  description: "把最多 4 款公路车轮胎放在一起：滚阻、湿地抓地、防刺、重量、规格逐项对比，自动标出每项最佳。",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ tires?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.tires) ? params.tires[0] : params.tires;
  const slugs = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const all = getTires();
  const selected = slugs
    .map((slug) => all.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const listed = (values: Array<number | null>) =>
    values.filter((v): v is number => v != null);

  const benchmark: Benchmark = {
    rr: listed(all.map((t) => t.rr_high)),
    grip: listed(all.map((t) => t.grip_avg)),
    puncture: listed(all.map((t) => t.puncture_tread)),
    weight: listed(all.map((t) => t.weight_measured)),
    thickness: listed(all.map((t) => t.thickness_tread)),
    rating: listed(all.map((t) => t.rating)),
  };

  const options = all.map((t) => ({
    slug: t.slug,
    brand: t.brand,
    model: t.model,
    year: t.year,
    tire_type: t.tire_type,
    rr_high: t.rr_high,
    image: t.image ?? null,
  }));

  return <CompareClient selected={selected} options={options} benchmark={benchmark} />;
}
