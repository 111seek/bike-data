import fs from "node:fs";
import path from "node:path";

import type { Frame, FrameDataset } from "./types";

let cache: FrameDataset | null = null;

export function getFrameDataset(): FrameDataset {
  if (!cache) {
    const file = path.join(process.cwd(), "data", "frames.json");
    cache = JSON.parse(fs.readFileSync(file, "utf-8")) as FrameDataset;
  }
  return cache;
}

export function getFrames(): Frame[] {
  return getFrameDataset().frames;
}

export function getFrame(slug: string): Frame | undefined {
  return getFrames().find((frame) => frame.slug === slug);
}

export function getFrameStats() {
  const frames = getFrames();
  const brands = new Set(frames.map((f) => f.brand));
  const lightest = [...frames].sort((a, b) => a.frame_weight - b.frame_weight)[0];
  const cheapest = frames.filter((f) => f.price != null).sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
  const newest = Math.max(...frames.map((f) => f.year));
  const avgFrame = Math.round(frames.reduce((sum, f) => sum + f.frame_weight, 0) / frames.length);
  const avgFork = Math.round(frames.reduce((sum, f) => sum + f.fork_weight, 0) / frames.length);
  return {
    count: frames.length,
    brandCount: brands.size,
    lightest,
    cheapest,
    newest,
    avgFrame,
    avgFork,
    generatedAt: getFrameDataset().generated_at,
    sourceName: getFrameDataset().source_name,
    note: getFrameDataset().note,
  };
}
