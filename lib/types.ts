export type BuyLink = { text: string; href: string };

export type PressureReading = { watts: number | null; crr: number | null };

export type TireSpecs = {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  tire_type?: string | null;
  supplied_by?: string | null;
  condition?: string | null;
  mileage?: string | null;
  price_range?: string | null;
  buy_at?: BuyLink[];
  mpn?: string | null;
  ean?: string | null;
  tpi?: string | null;
  compound?: string | null;
  bead?: string | null;
  etrto?: string | null;
  size_inch?: string | null;
  width_spec?: number | null;
  weight_spec?: number | null;
  max_pressure?: number | null;
  made_in?: string | null;
  available_sizes?: string[] | null;
};

export type TireMeasurements = {
  weight_spec?: number | null;
  weight_measured?: number | null;
  weight_system?: number | null;
  width_measured?: number | null;
  height_measured?: number | null;
  circumference?: number | null;
  thickness_tread?: number | null;
  thickness_sidewall?: number | null;
  casing_width?: number | null;
  tread_width?: number | null;
  tread_cover?: number | null;
};

export type TirePuncture = {
  score_tread?: number | null;
  score_sidewall?: number | null;
  force_sharp_tread?: number | null;
  force_blunt_tread?: number | null;
  thickness_tread?: number | null;
  force_sharp_sidewall?: number | null;
  force_blunt_sidewall?: number | null;
  thickness_sidewall?: number | null;
};

export type TireGrip = {
  wet_avg?: number | null;
  wet_center?: number | null;
  wet_edge?: number | null;
};

export type TireDetail = {
  published: string | null;
  author: string | null;
  rating: number | null;
  verdict: string | null;
  image: string | null;
  description: string | null;
  specs: TireSpecs;
  measurements: TireMeasurements;
  rr: Partial<Record<"medium" | "high" | "extra_high" | "ultra_high", PressureReading>>;
  puncture: TirePuncture;
  grip: TireGrip;
  pro_gated: string[];
};

export type Tire = {
  slug: string;
  brand: string;
  model: string;
  review_title: string;
  url: string;
  year: number | null;
  tire_type: string;
  inner_tube: string | null;
  price_range: string | null;
  buy_at: BuyLink[];
  width_spec: number | null;
  width_measured: number | null;
  weight_spec: number | null;
  weight_measured: number | null;
  rr_medium: number | null;
  rr_high: number | null;
  rr_extra_high: number | null;
  rr_ultra_high: number | null;
  grip_avg: number | null;
  grip_center: number | null;
  grip_edge: number | null;
  puncture_tread: number | null;
  puncture_sidewall: number | null;
  thickness_tread: number | null;
  thickness_sidewall: number | null;
  rating: number | null;
  image?: string | null;
  detail: TireDetail | null;
};

export type Dataset = {
  source: string;
  scraped_at: string;
  count: number;
  tires: Tire[];
};

/** Subset passed to client components for the explorer table. */
export type TireRow = Pick<
  Tire,
  | "slug"
  | "brand"
  | "model"
  | "year"
  | "tire_type"
  | "inner_tube"
  | "price_range"
  | "width_spec"
  | "width_measured"
  | "weight_spec"
  | "weight_measured"
  | "rr_high"
  | "grip_avg"
  | "puncture_tread"
  | "thickness_tread"
  | "rating"
  | "image"
> & { tpi: string | null; compound: string | null; etrto: string | null; published: string | null };
