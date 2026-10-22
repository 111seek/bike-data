export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const TIRE_TYPE_LABEL: Record<string, string> = {
  TLR: "真空胎",
  TT: "开口胎",
  TU: "管胎",
  Tubeless: "真空胎",
  "Tube-Type": "开口胎",
  Tubular: "管胎",
};

export const TIRE_TYPE_HINT: Record<string, string> = {
  TLR: "Tubeless Ready · 无内胎",
  TT: "Tube Type · 需内胎",
  TU: "Tubular · 管胎",
};

export const TUBE_LABEL: Record<string, string> = {
  None: "无内胎",
  Butyl: "丁基内胎",
  Latex: "乳胶内胎",
  TPU: "TPU 内胎",
};

export const PRICE_LABEL: Record<string, string> = {
  "Very Low": "极低",
  Low: "低",
  Med: "中",
  High: "高",
  "High+": "高+",
  "Very High": "极高",
  "Premium": "旗舰",
};

export const VERDICT_LABEL: Record<string, string> = {
  "Highly Recommended": "强烈推荐",
  Recommended: "推荐",
  "Somewhat Recommended": "值得一看",
  "Not Recommended": "不推荐",
};

export const BEAD_LABEL: Record<string, string> = {
  Folding: "折叠胎唇",
  Wire: "钢丝胎唇",
};

export const PRESSURE_LABEL: Record<string, string> = {
  medium: "中胎压",
  high: "高胎压",
  extra_high: "超高胎压",
  ultra_high: "极高胎压",
};

export const PRESSURE_NOTE: Record<string, string> = {
  medium: "66–54 psi（视胎宽）",
  high: "88–72 psi（视胎宽）",
  extra_high: "110–90 psi（视胎宽）",
  ultra_high: "132–108 psi（视胎宽）",
};

/** Field labels that the source site gates behind its Pro membership. */
export const PRO_FIELD_LABEL: Record<string, string> = {
  made_in: "产地",
  height_measured: "实测高度",
  circumference: "轮胎周长",
  thickness_sidewall: "胎侧厚度",
  casing_width: "未安装胎体宽度",
  tread_width: "未安装胎面宽度",
  tread_cover: "胎面覆盖率",
  score_sidewall: "胎侧防刺总分",
  force_sharp_tread: "胎面尖锐物穿刺力",
  force_blunt_tread: "胎面钝器穿刺力",
  force_sharp_sidewall: "胎侧尖锐物穿刺力",
  force_blunt_sidewall: "胎侧钝器穿刺力",
  wet_center: "湿地抓地（中心）",
  wet_edge: "湿地抓地（边缘）",
  medium: "滚阻（中胎压）",
  high: "滚阻（高胎压）",
  extra_high: "滚阻（超高胎压）",
  ultra_high: "滚阻（极高胎压）",
};

export function proFieldLabel(key: string): string {
  const stripped = key.replace(/^(spec|measurement|rr|puncture|grip)\./, "");
  return PRO_FIELD_LABEL[stripped] ?? PRO_FIELD_LABEL[key] ?? stripped.replace(/_/g, " ");
}

export function fmt(n: number | null | undefined, digits = 1, dash = "—"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return dash;
  return n.toFixed(digits);
}

export function fmtInt(n: number | null | undefined, dash = "—"): string {
  if (n === null || n === undefined) return dash;
  return Math.round(n).toLocaleString("zh-CN");
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export type Tone = "great" | "good" | "ok" | "warn" | "muted";

export const toneText: Record<Tone, string> = {
  great: "text-emerald-700",
  good: "text-teal-700",
  ok: "text-amber-700",
  warn: "text-orange-700",
  muted: "text-stone-400",
};

export const toneBg: Record<Tone, string> = {
  great: "bg-emerald-500",
  good: "bg-teal-500",
  ok: "bg-amber-500",
  warn: "bg-orange-500",
  muted: "bg-stone-300",
};

export function rrTone(v: number | null | undefined): Tone {
  if (v == null) return "muted";
  if (v <= 10) return "great";
  if (v <= 13) return "good";
  if (v <= 17) return "ok";
  return "warn";
}

export function gripTone(v: number | null | undefined): Tone {
  if (v == null) return "muted";
  if (v >= 85) return "great";
  if (v >= 75) return "good";
  if (v >= 65) return "ok";
  return "warn";
}

export function punctureTone(v: number | null | undefined): Tone {
  if (v == null) return "muted";
  if (v >= 80) return "great";
  if (v >= 60) return "good";
  if (v >= 40) return "ok";
  return "warn";
}

export function weightTone(v: number | null | undefined): Tone {
  if (v == null) return "muted";
  if (v <= 240) return "great";
  if (v <= 280) return "good";
  if (v <= 330) return "ok";
  return "warn";
}

/** Share of tires that perform worse than `value` (0–100). */
export function percentileOf(
  values: Array<number | null | undefined>,
  value: number | null | undefined,
  higherIsBetter: boolean,
): number | null {
  if (value == null) return null;
  const arr = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (arr.length < 2) return null;
  const worse = higherIsBetter ? arr.filter((v) => v < value).length : arr.filter((v) => v > value).length;
  return Math.min(99, Math.round((worse / (arr.length - 1)) * 100));
}

export function bestWorst(
  values: Array<number | null | undefined>,
  higherIsBetter: boolean,
): { best: number | null; worst: number | null } {
  const arr = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (!arr.length) return { best: null, worst: null };
  return higherIsBetter
    ? { best: Math.max(...arr), worst: Math.min(...arr) }
    : { best: Math.min(...arr), worst: Math.max(...arr) };
}

export function barPercent(
  value: number | null | undefined,
  min: number,
  max: number,
  higherIsBetter: boolean,
): number {
  if (value == null) return 0;
  if (max === min) return 50;
  const ratio = (value - min) / (max - min);
  const pct = higherIsBetter ? ratio : 1 - ratio;
  return Math.max(4, Math.min(100, Math.round(pct * 100)));
}

export function ratingStars(rating: number | null | undefined): string {
  if (rating == null) return "—";
  const full = Math.floor(rating);
  const half = rating - full >= 0.25;
  return "★".repeat(full) + (half ? "☆" : "");
}

export const FRAME_CATEGORY_LABEL: Record<string, string> = {
  race: "竞速",
  aero: "气动",
  endurance: "耐力",
  gravel: "砾石",
  allroad: "全地形",
  cyclocross: "公路越野",
};

export const FRAME_MATERIAL_LABEL: Record<string, string> = {
  carbon: "碳纤维",
  aluminium: "铝合金",
  steel: "钢",
  titanium: "钛合金",
};

export function euro(n: number | null | undefined): string {
  if (n == null) return "—";
  return `€${n.toLocaleString("en-US")}`;
}

export function frameTotal(frame: { frame_weight: number; fork_weight: number }): number {
  return frame.frame_weight + frame.fork_weight;
}

export function pricePerGram(price: number | null, frameWeight: number | null): number | null {
  if (price == null || frameWeight == null || frameWeight === 0) return null;
  return Math.round((price / frameWeight) * 10) / 10;
}

export function slugLabel(slug: string): string {
  return slug.replace(/-/g, " ");
}
