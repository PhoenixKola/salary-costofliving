import type {
  BudgetScenario,
  City,
  DatedPoint,
  Household,
  LatestPoint,
  Lifestyle,
  Payload,
  Series
} from "../types";

// ---------------------------------------------------------------------------
// Period parsing
// ---------------------------------------------------------------------------

const ROMAN_Q: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

/** "01-17" (monthly) or "III/23" (quarterly, mapped to the quarter's last month). */
export function parsePeriod(t: string): Date | null {
  const m = t.match(/^(\d{2})-(\d{2})$/);
  if (m) return new Date(2000 + Number(m[2]), Number(m[1]) - 1, 1);
  const q = t.match(/^(I{1,3}|IV)\/(\d{2})$/);
  if (q) return new Date(2000 + Number(q[2]), ROMAN_Q[q[1]] * 3 - 1, 1);
  return null;
}

export function toDated(points: LatestPoint[]): DatedPoint[] {
  return points
    .map((p) => {
      const date = parsePeriod(p.t);
      return date ? { ...p, date } : null;
    })
    .filter((p): p is DatedPoint => p !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---------------------------------------------------------------------------
// Series access
// ---------------------------------------------------------------------------

export function getSeries(payload: Payload | null, id: string): Series | null {
  return payload?.series?.find((s) => s.id === id) ?? null;
}

export function getCpiSeries(payload: Payload | null): DatedPoint[] {
  const s = getSeries(payload, "CPI_TOTAL_INDEX");
  return s ? toDated(s.points) : [];
}

export function getWageSeries(payload: Payload | null): DatedPoint[] {
  const s = getSeries(payload, "WAGE_AVG_GROSS_ALL");
  return s ? toDated(s.points) : [];
}

// ---------------------------------------------------------------------------
// Derived series
// ---------------------------------------------------------------------------

/** Year-over-year % change computed from a monthly index series. */
export function yoySeries(cpi: DatedPoint[]): DatedPoint[] {
  const byKey = new Map(cpi.map((p) => [`${p.date.getFullYear()}-${p.date.getMonth()}`, p.v]));
  return cpi
    .map((p) => {
      const prev = byKey.get(`${p.date.getFullYear() - 1}-${p.date.getMonth()}`);
      if (prev === undefined || prev === 0) return null;
      return { ...p, v: (p.v / prev - 1) * 100 };
    })
    .filter((p): p is DatedPoint => p !== null);
}

/** CPI value at (or nearest before) a given date. */
function cpiAt(cpi: DatedPoint[], date: Date): number | null {
  let best: DatedPoint | null = null;
  for (const p of cpi) {
    if (p.date.getTime() <= date.getTime()) best = p;
    else break;
  }
  return best?.v ?? null;
}

export type RealWagePoint = DatedPoint & { nominal: number; nominalIndex: number };

/**
 * Real (inflation-adjusted) wage index. Both nominal and real are indexed to
 * 100 at the first wage observation, so the gap between the two lines is the
 * cumulative inflation bite.
 */
export function realWageSeries(wage: DatedPoint[], cpi: DatedPoint[]): RealWagePoint[] {
  if (wage.length === 0 || cpi.length === 0) return [];
  const out: RealWagePoint[] = [];
  let baseReal: number | null = null;
  const baseNominal = wage[0].v;
  for (const w of wage) {
    const c = cpiAt(cpi, w.date);
    if (c === null || c === 0) continue;
    const real = w.v / c;
    if (baseReal === null) baseReal = real;
    out.push({
      t: w.t,
      date: w.date,
      v: (real / baseReal) * 100,
      nominal: w.v,
      nominalIndex: (w.v / baseNominal) * 100
    });
  }
  return out;
}

/** % change between the last point and the point ~1 year earlier. */
export function yoyDelta(series: DatedPoint[]): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const target = new Date(last.date.getFullYear() - 1, last.date.getMonth(), 1).getTime();
  let prev: DatedPoint | null = null;
  let bestDist = Infinity;
  for (const p of series.slice(0, -1)) {
    const dist = Math.abs(p.date.getTime() - target);
    if (dist < bestDist) {
      bestDist = dist;
      prev = p;
    }
  }
  if (!prev || prev.v === 0) return null;
  return (last.v / prev.v - 1) * 100;
}

/** Slice a series to the last N years (null = all). */
export function sliceYears<T extends DatedPoint>(series: T[], years: number | null): T[] {
  if (years === null || series.length === 0) return series;
  const last = series[series.length - 1].date;
  const cutoff = new Date(last.getFullYear() - years, last.getMonth(), 1).getTime();
  return series.filter((p) => p.date.getTime() >= cutoff);
}

// ---------------------------------------------------------------------------
// Budget model
// ---------------------------------------------------------------------------

export const BASE_NON_RENT: Record<Lifestyle, number> = {
  Basic: 28000,
  Normal: 42000,
  Comfort: 60000
};

export const CITY_MULT: Record<City, number> = {
  Tirana: 1.15,
  Durres: 1.05,
  Shkoder: 0.95,
  Vlore: 1.0,
  Other: 0.95
};

export const HOUSEHOLD_MULT: Record<Household, number> = {
  1: 1.0,
  2: 1.55,
  3: 1.95,
  4: 2.3
};

/** Share of non-rent spend per category (sums to 1). */
export const CATEGORY_SHARES = {
  food: 0.42,
  utilities: 0.17,
  transport: 0.14,
  other: 0.27
} as const;

export type BudgetBreakdown = {
  nonRent: number;
  total: number;
  categories: { key: "rent" | keyof typeof CATEGORY_SHARES; amount: number }[];
};

export function calcBudget(s: BudgetScenario): BudgetBreakdown {
  const rent = Number.isFinite(s.rent) ? s.rent : 0;
  const nonRent = BASE_NON_RENT[s.lifestyle] * CITY_MULT[s.city] * HOUSEHOLD_MULT[s.household];
  return {
    nonRent,
    total: nonRent + rent,
    categories: [
      { key: "rent", amount: rent },
      { key: "food", amount: nonRent * CATEGORY_SHARES.food },
      { key: "utilities", amount: nonRent * CATEGORY_SHARES.utilities },
      { key: "transport", amount: nonRent * CATEGORY_SHARES.transport },
      { key: "other", amount: nonRent * CATEGORY_SHARES.other }
    ]
  };
}
