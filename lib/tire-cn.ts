import type { Tire } from "./types";

/** Common Chinese names for the brands in the dataset. */
export const BRAND_CN: Record<string, string> = {
  Continental: "马牌",
  Vittoria: "维多利亚",
  Pirelli: "倍耐力",
  Schwalbe: "世文",
  Michelin: "米其林",
  Specialized: "闪电",
  Tufo: "图福",
  Veloflex: "天鹅",
  Hutchinson: "哈金森",
  Panaracer: "松下",
  Challenge: "挑战",
  Goodyear: "固特异",
  Cadex: "捷安特 Cadex",
  Bontrager: "崔克 Bontrager",
  Zipp: "速联 Zipp",
  Maxxis: "玛吉斯",
  Enve: "ENVE",
  Mavic: "马威克",
  Silca: "Silca",
  Wolfpack: "狼群",
  "Rene Herse": "雷内·赫斯",
  IRC: "IRC",
  Clement: "克莱门特",
  Vredestein: "弗雷德斯坦",
};

/** Model families: longest / most specific patterns first. */
const SERIES: Array<[RegExp, string]> = [
  [/^grand prix 5000 all season/i, "GP5000 全季节"],
  [/^grand prix 5000/i, "GP5000"],
  [/^grand prix 4 season/i, "GP 4 Season"],
  [/^grand prix 4000/i, "GP 4000"],
  [/^grand prix tt/i, "GP TT"],
  [/^grand prix/i, "GP"],
  [/^gator hardshell|^gatorskin/i, "鳄鱼皮"],
  [/^ultra sport/i, "Ultra Sport"],
  [/^corsa pro speed/i, "科萨 Pro Speed"],
  [/^corsa n\.?ext/i, "科萨 N.EXT"],
  [/^corsa control/i, "科萨 Control"],
  [/^corsa speed/i, "科萨 Speed"],
  [/^corsa g\+/i, "科萨 G+"],
  [/^open corsa/i, "Open Corsa"],
  [/^corsa/i, "科萨"],
  [/^rubino pro/i, "鲁比诺 Pro"],
  [/^rubino/i, "鲁比诺"],
  [/^zaffiro/i, "蓝宝石"],
  [/^p zero/i, "P Zero"],
  [/^cinturato/i, "辛图拉托"],
  [/^pro one/i, "Pro One"],
  [/^durano/i, "杜拉诺"],
  [/^lugano/i, "卢加诺"],
  [/^one\b/i, "One"],
  [/^power all season/i, "Power 全季节"],
  [/^power endurance/i, "Power 耐力"],
  [/^power time/i, "Power Time"],
  [/^power cup/i, "Power Cup"],
  [/^power road/i, "Power Road"],
  [/^power competition/i, "Power Competition"],
  [/^power/i, "Power"],
  [/^comtura prima/i, "康图拉 Prima"],
  [/^comtura/i, "康图拉"],
  [/^fusion/i, "Fusion"],
  [/^agilest/i, "Agilest"],
  [/^criterium/i, "Criterium"],
  [/^strada/i, "Strada"],
  [/^eagle f1/i, "鹰 F1"],
  [/^tangente/i, "Tangente"],
  [/^s-works mondo|^mondo/i, "Mondo"],
  [/^turbo cotton/i, "Turbo Cotton"],
  [/^s-works turbo/i, "S-Works Turbo"],
  [/^turbo/i, "Turbo"],
  [/^aeolus/i, "风神 Aeolus"],
  [/^ses/i, "SES"],
  [/^record/i, "Record"],
  [/^aero cotton/i, "Aero Cotton"],
  [/^cotton/i, "Cotton"],
  [/^aero \d+/i, "Aero"],
  [/^blackbird/i, "黑鸟"],
  [/^protocol/i, "Protocol"],
  [/^re-?fuse/i, "Re-Fuse"],
  [/^yksion/i, "Yksion"],
  [/^fortezza/i, "堡垒"],
  [/^pista/i, "Pista"],
  [/^pro 4 endurance/i, "Pro 4 耐力"],
  [/^pro 4/i, "Pro 4"],
  [/^pro 5/i, "Pro 5"],
  [/^dynamic/i, "Dynamic"],
  [/^ridearmor/i, "RideArmor"],
  [/^race (a|d|l)\b/i, "Race"],
  [/^road race/i, "Road Race"],
  [/^ironman/i, "Ironman"],
  [/^competition/i, "Competition"],
];

const TYPE_SUFFIX: Record<string, string> = {
  TLR: "真空胎",
  TT: "开口胎",
  TU: "管胎",
};

function positioning(model: string): string {
  const m = model.toLowerCase();

  if (/corsa (pro )?speed|pro one tt|raceday|\brecord\b|time trial|\btt\b|\btubular tt\b/.test(m)) {
    return "计时赛";
  }
  if (
    /all season|4 season|\b4s\b|endurance|durano|gator|cinturato|re-?fuse|fortezza|all weather|strada lgg|mondo|krylion|lithion/.test(
      m,
    )
  ) {
    return "耐力";
  }
  if (/ultra sport|dynamic|lugano|zaffiro|rubino|ridearmor|high road|padrone|\bone\b|ironman/.test(m)) {
    return "训练";
  }
  if (
    /pro|corsa|cup|\brs\b|rsl|blackbird|protocol|agilest|prima|race|eagle f1|p zero|competition|aero 111|criterium|speed|cotton/.test(
      m,
    )
  ) {
    return "竞赛";
  }
  return "综合";
}

export function tireSeriesCn(model: string): string | null {
  for (const [pattern, name] of SERIES) {
    if (pattern.test(model)) return name;
  }
  return null;
}

export function tireCnNote(
  tire: Pick<Tire, "brand" | "model" | "tire_type"> & { rr_high?: number | null },
): string {
  const brand = BRAND_CN[tire.brand] ?? tire.brand;
  const series = tireSeriesCn(tire.model);
  let pos = positioning(tire.model);
  // 没有系列关键词时，用滚阻给一个粗略定位：≤10.5W 竞赛，≤15W 综合，其余训练。
  if (pos === "综合" && tire.rr_high != null) {
    pos = tire.rr_high <= 10.5 ? "竞赛" : tire.rr_high <= 15 ? "综合" : "训练";
  }
  const suffix = TYPE_SUFFIX[tire.tire_type] ?? "胎";
  const head = series ? `${brand} ${series}` : brand;
  return `${head} · ${pos}${suffix}`;
}
