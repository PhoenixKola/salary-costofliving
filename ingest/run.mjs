import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";

const ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(ROOT, "data");
const RAW_DIR = path.join(DATA_DIR, "raw");
const OUT_LATEST = path.join(DATA_DIR, "latest.json");

const SOURCES = {
  cpiHub: "https://www.instat.gov.al/en/themes/prices/consumer-price-index/",
  wageHub: "https://www.instat.gov.al/en/themes/labour-market-and-education/wages/"
};

const FILES = {
  cpiIndex: "https://www.instat.gov.al/media/dw0fggvs/tab-3.xlsx",
  cpiMonthlyChange: "https://www.instat.gov.al/media/ianljo4o/tab-4.xlsx",
  cpiAnnualChange: "https://www.instat.gov.al/media/yhwf4pvd/tab-5.xlsx",
  wageAvgAndMin: "https://www.instat.gov.al/media/nnmcdq1f/tab-5.xlsx"
};

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function toRows(buf) {
  const wb = xlsx.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { header: 1, raw: true });
}

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isMonthLabel(s) {
  return /^\d{2}-\d{2}$/.test(String(s ?? "").trim());
}

function isQuarterLabel(s) {
  const t = String(s ?? "").trim();
  return /^[iv]{1,3}\/\d{2}$/i.test(t) || /^iv\/\d{2}$/i.test(t);
}

function findCpiHeaderRow(rows) {
  const CODE_KEYS = new Set(["code", "kodi"]);
  const GROUP_KEYS = new Set(["groups", "grupet", "group", "grupi"]);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const cells = row.map(norm);

    const hasCode = cells.some((c) => CODE_KEYS.has(c));
    const hasGroups = cells.some((c) => GROUP_KEYS.has(c));
    const hasManyMonths = row.filter((c) => isMonthLabel(c)).length >= 6;

    if (hasManyMonths && (hasCode || hasGroups)) return r;
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const hasManyMonths = row.filter((c) => isMonthLabel(c)).length >= 6;
    if (hasManyMonths) return r;
  }

  return -1;
}

function extractCpiTotalSeries(rows) {
  const h = findCpiHeaderRow(rows);
  if (h === -1) return null;

  const header = rows[h].map((x) => String(x ?? "").trim());
  const headerNorm = header.map(norm);

  const codeIdx = headerNorm.findIndex((c) => c === "code" || c === "kodi");
  const groupsIdx = headerNorm.findIndex((c) => c === "groups" || c === "grupet" || c === "group" || c === "grupi");

  const timeCols = [];
  for (let i = 0; i < header.length; i++) {
    if (i === codeIdx || i === groupsIdx) continue;
    const lab = header[i];
    if (isMonthLabel(lab)) timeCols.push({ i, lab: String(lab).trim() });
  }

  if (!timeCols.length) return null;

  const dataRows = rows.slice(h + 1);

  const isTotalRow = (row) => {
    const code = codeIdx >= 0 ? norm(row[codeIdx]) : "";
    const grp = groupsIdx >= 0 ? norm(row[groupsIdx]) : "";
    return (
      code === "000000" ||
      grp === "total" ||
      grp.includes("total") ||
      grp === "gjithsej" ||
      grp.includes("gjithsej")
    );
  };

  const row = dataRows.find(isTotalRow);
  if (!row) return null;

  const points = timeCols
    .map(({ i, lab }) => {
      const v = row[i];
      const num = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
      if (!Number.isFinite(num)) return null;
      return { t: lab, v: num };
    })
    .filter(Boolean);

  return points.length ? points : null;
}

function findWageHeaderRow(rows) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const cells = row.map(norm);
    const hasDesc =
      cells.some((c) => c.includes("pershkrimi")) ||
      cells.some((c) => c.includes("per shkrimi")) ||
      cells.some((c) => c.includes("pershkrim")) ||
      cells.some((c) => c.includes("description"));
    const hasQuarters = row.filter((c) => isQuarterLabel(c)).length >= 4;
    if (hasDesc && hasQuarters) return r;
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const hasQuarters = row.filter((c) => isQuarterLabel(c)).length >= 4;
    if (hasQuarters) return r;
  }

  return -1;
}

function extractWageAvgSeries(rows) {
  const h = findWageHeaderRow(rows);
  if (h === -1) return null;

  const header = rows[h].map((x) => String(x ?? "").trim());
  const headerNorm = header.map(norm);

  const descIdx = headerNorm.findIndex(
    (c) => c.includes("pershkrimi") || c.includes("description")
  );

  const timeCols = header
    .map((c, i) => ({ c: String(c ?? "").trim(), i }))
    .filter(({ c }) => isQuarterLabel(c));

  if (!timeCols.length) return null;

  const dataRows = rows.slice(h + 1);

  const avgNeedles = [
    "average gross monthly wage per employee",
    "paga mesatare mujore bruto per punonjes",
    "paga mesatare mujore bruto per punonjesit",
    "paga mesatare mujore bruto"
  ];

  const row = dataRows.find((r) => {
    const cell = descIdx >= 0 ? norm(r[descIdx]) : norm(r[0]);
    return avgNeedles.some((n) => cell.includes(n));
  });

  if (!row) return null;

  const points = timeCols
    .map(({ i, c }) => {
      const v = row[i];
      const num = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
      if (!Number.isFinite(num)) return null;
      return { t: c, v: num };
    })
    .filter(Boolean);

  return points.length ? points : null;
}

function last(points) {
  return points[points.length - 1] ?? null;
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

async function main() {
  fs.mkdirSync(RAW_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();

  const cpiIndexBuf = await download(FILES.cpiIndex);
  fs.writeFileSync(path.join(RAW_DIR, "cpi-index.xlsx"), cpiIndexBuf);
  const cpiIndexRows = toRows(cpiIndexBuf);
  const cpiIndexTotal = extractCpiTotalSeries(cpiIndexRows);

  const cpiYoyBuf = await download(FILES.cpiAnnualChange);
  fs.writeFileSync(path.join(RAW_DIR, "cpi-annual-change.xlsx"), cpiYoyBuf);
  const cpiYoyRows = toRows(cpiYoyBuf);
  const cpiYoyTotal = extractCpiTotalSeries(cpiYoyRows);

  const wageBuf = await download(FILES.wageAvgAndMin);
  fs.writeFileSync(path.join(RAW_DIR, "wage-tab-5.xlsx"), wageBuf);
  const wageRows = toRows(wageBuf);
  const wageAvg = extractWageAvgSeries(wageRows);

  const series = [];

  if (cpiIndexTotal) {
    series.push({ id: "CPI_TOTAL_INDEX", freq: "monthly", unit: "index", points: cpiIndexTotal });
  }

  if (cpiYoyTotal) {
    series.push({ id: "CPI_TOTAL_YOY_PCT", freq: "monthly", unit: "percent", points: cpiYoyTotal });
  }

  if (wageAvg) {
    series.push({ id: "WAGE_AVG_GROSS_ALL", freq: "quarterly", unit: "ALL", points: wageAvg });
  }

  const payload = {
    generatedAt,
    sources: { hubs: SOURCES, files: FILES },
    latest: {
      cpiIndex: cpiIndexTotal ? last(cpiIndexTotal) : null,
      cpiYoy: cpiYoyTotal ? last(cpiYoyTotal) : null,
      wageAvg: wageAvg ? last(wageAvg) : null
    },
    series
  };

  writeJson(OUT_LATEST, payload);
  console.log("Wrote", OUT_LATEST, "series:", series.length);
  console.log("Latest:", payload.latest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});