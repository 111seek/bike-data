import type { MetadataRoute } from "next";

import { brandSlug, getBrands, getTires } from "@/lib/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/frames", "/frames/compare", "/rankings", "/brands", "/compare", "/about"].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const tires = getTires().map((t) => ({
    url: `${BASE}/tires/${t.slug}`,
    lastModified: t.detail?.published ? new Date(t.detail.published) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const brands = getBrands().map((b) => ({
    url: `${BASE}/brands/${brandSlug(b.brand)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...staticPages, ...tires, ...brands];
}
