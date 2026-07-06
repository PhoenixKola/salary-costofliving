import type { Language } from "../types";

export function fmtALL(n: number): string {
  return Math.round(n).toLocaleString("en-US").replace(/,/g, " ");
}

export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

export function fmtPct(n: number, digits = 1): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function fmtIndex(n: number): string {
  return n.toFixed(1);
}

export function formatGenerated(generatedAt: string | undefined, lang: Language): string {
  if (!generatedAt) return "—";
  const d = new Date(generatedAt);
  if (Number.isNaN(d.getTime())) return generatedAt;
  const locale = lang === "sq" ? "sq-AL" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_SQ = ["Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Kor", "Gus", "Sht", "Tet", "Nën", "Dhj"];

/** "03-24" -> "Mar '24"; "III/23" -> "Q3 '23" (or "T3 '23" in Albanian). */
export function fmtPeriod(t: string, lang: Language): string {
  const months = lang === "sq" ? MONTHS_SQ : MONTHS_EN;
  const m = t.match(/^(\d{2})-(\d{2})$/);
  if (m) return `${months[Number(m[1]) - 1]} '${m[2]}`;
  const q = t.match(/^(I{1,3}|IV)\/(\d{2})$/);
  if (q) {
    const num = { I: 1, II: 2, III: 3, IV: 4 }[q[1] as "I" | "II" | "III" | "IV"];
    return `${lang === "sq" ? "T" : "Q"}${num} '${q[2]}`;
  }
  return t;
}

/** Short x-axis label: "'24" for Jan / Q1, otherwise month abbreviation. */
export function fmtAxisLabel(t: string, lang: Language): string {
  const m = t.match(/^(\d{2})-(\d{2})$/);
  if (m) return `'${m[2]}`;
  const q = t.match(/^(I{1,3}|IV)\/(\d{2})$/);
  if (q) return `'${q[2]}`;
  return t;
}
