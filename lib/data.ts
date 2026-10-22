import fs from "node:fs";
import path from "node:path";

import type { Dataset, Tire, TireRow } from "./types";

let cache: Dataset | null = null;

export function getDataset(): Dataset {
  if (!cache) {
    const file = path.join(process.cwd(), "data", "tires.json");
    cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Dataset;
  }
  return cache;
}

export function getTires(): Tire[] {
  return getDataset().tires;
}

export function getTire(slug: string): Tire | undefined {
  return getTires().find((tire) => tire.slug === slug);
}

export function toRow(tire: Tire): TireRow {
  const specs = tire.detail?.specs;
  return {
    slug: tire.slug,
    brand: tire.brand,
    model: tire.model,
    year: tire.year,
    tire_type: tire.tire_type,
    inner_tube: tire.inner_tube,
    price_range: tire.price_range,
    width_spec: tire.width_spec,
    width_measured: tire.width_measured,
    weight_spec: tire.weight_spec,
    weight_measured: tire.weight_measured,
    rr_high: tire.rr_high,
    grip_avg: tire.grip_avg,
    puncture_tread: tire.puncture_tread,
    thickness_tread: tire.thickness_tread,
    rating: tire.rating,
    image: tire.image ?? null,
    tpi: specs?.tpi ?? null,
    compound: specs?.compound ?? null,
    etrto: specs?.etrto ?? null,
    published: tire.detail?.published ?? null,
  };
}

export function getRows(): TireRow[] {
  return getTires().map(toRow);
}

export function getBrands(): Array<{
  brand: string;
  count: number;
  avgRr: number | null;
  bestRr: number | null;
  models: Tire[];
}> {
  const map = new Map<string, Tire[]>();
  for (const tire of getTires()) {
    const list = map.get(tire.brand) ?? [];
    list.push(tire);
    map.set(tire.brand, list);
  }
  return [...map.entries()]
    .map(([brand, models]) => {
      const rrs = models.map((m) => m.rr_high).filter((v): v is number => v != null);
      return {
        brand,
        count: models.length,
        avgRr: rrs.length ? rrs.reduce((a, b) => a + b, 0) / rrs.length : null,
        bestRr: rrs.length ? Math.min(...rrs) : null,
        models: models.sort((a, b) => (a.rr_high ?? 999) - (b.rr_high ?? 999)),
      };
    })
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
}

export function brandSlug(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getStats() {
  const tires = getTires();
  const brands = new Set(tires.map((t) => t.brand));
  const rrs = tires.map((t) => t.rr_high).filter((v): v is number => v != null);
  const fastest = tires
    .filter((t) => t.rr_high != null)
    .sort((a, b) => (a.rr_high ?? 999) - (b.rr_high ?? 999))[0];
  const newestYear = Math.max(...tires.map((t) => t.year ?? 0));
  const latest = tires
    .filter((t) => t.detail?.published)
    .sort((a, b) => (b.detail?.published ?? "").localeCompare(a.detail?.published ?? ""))[0];
  const gripCount = tires.filter((t) => t.grip_avg != null).length;
  return {
    count: tires.length,
    brandCount: brands.size,
    fastest,
    fastestRr: rrs.length ? Math.min(...rrs) : null,
    newestYear,
    latestPublished: latest?.detail?.published ?? null,
    gripCount,
    scrapedAt: getDataset().scraped_at,
    source: getDataset().source,
  };
}

/** Tires close to `tire` in rolling resistance, same type, similar width. */
export function getSimilar(tire: Tire, limit = 6): Tire[] {
  const width = tire.width_measured ?? tire.width_spec ?? 28;
  return getTires()
    .filter(
      (t) =>
        t.slug !== tire.slug &&
        t.rr_high != null &&
        Math.abs((t.width_measured ?? t.width_spec ?? 28) - width) <= 3,
    )
    .sort(
      (a, b) =>
        Math.abs((a.rr_high ?? 999) - (tire.rr_high ?? 0)) -
        Math.abs((b.rr_high ?? 999) - (tire.rr_high ?? 0)),
    )
    .slice(0, limit);
}
