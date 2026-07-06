export type LatestPoint = { t: string; v: number };

export type Series = {
  id: string;
  freq: "monthly" | "quarterly";
  unit: string;
  points: LatestPoint[];
};

export type Payload = {
  generatedAt: string;
  series: Series[];
  latest?: {
    cpiIndex?: LatestPoint | null;
    cpiYoy?: LatestPoint | null;
    wageAvg?: LatestPoint | null;
  };
};

export type Language = "en" | "sq";

export type City = "Tirana" | "Durres" | "Shkoder" | "Vlore" | "Other";
export type Lifestyle = "Basic" | "Normal" | "Comfort";
export type Household = 1 | 2 | 3 | 4;

export type BudgetScenario = {
  city: City;
  lifestyle: Lifestyle;
  household: Household;
  rent: number;
};

export type SavedScenario = BudgetScenario & {
  id: string;
  total: number;
};

/** A time-series point with a resolved date for sorting/alignment. */
export type DatedPoint = { t: string; v: number; date: Date };
