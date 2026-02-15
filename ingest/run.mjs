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

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].map((x) => String(x ?? "").trim().toLowerCase());
    if (r.includes("code") && r.includes("groups")) return i;
  }
  return -1;
}

function extractSeriesFromTable(rows, rowNameMatch) {
  const h = findHeaderRow(rows);
  if (h === -1) return null;

  const header = rows[h].map((x) => String(x ?? "").trim());
  const dataRows = rows.slice(h + 1);

  const idxCode = header.findIndex((c) => c.trim().toLowerCase() === "code");
  const idxGroups = header.findIndex((c) => c.trim().toLowerCase() === "groups");

  const timeCols = [];
  for (let i = 0; i < header.length; i++) {
    if (i === idxCode || i === idxGroups) continue;
    const label = header[i];
    if (!label) continue;
    timeCols.push({ i, label });
  }

  const row = dataRows.find((r) => {
    const g = String(r[idxGroups] ?? "").trim().toLowerCase();
    return g === rowNameMatch.toLowerCase();
  });

  if (!row) return null;

  const points = timeCols
    .map(({ i, label }) => {
      const v = row[i];
      const num = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
      if (!Number.isFinite(num)) return null;
      return { t: label, v: num };
    })
    .filter(Boolean);

  if (!points.length) return null;
  return points;
}

function extractWageSeries(rows) {
  const h = rows.findIndex((r) => r.some((x) => String(x ?? "").toLowerCase().includes("përshkrimi")));
  if (h === -1) return null;

  const header = rows[h].map((x) => String(x ?? "").trim());
  const idxDesc = header.findIndex((c) => c.toLowerCase().includes("përshkrimi") || c.toLowerCase().includes("pershkrimi"));
  const timeCols = header
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c && /[iv]+\/\d{2}/i.test(c));

  const dataRows = rows.slice(h + 1);

  const pickRow = (needle) =>
    dataRows.find((r) => String(r[idxDesc] ?? "").trim().toLowerCase() === needle.toLowerCase());

  const avg = pickRow("Average gross monthly wage per employee") || pickRow("Paga mesatare mujore bruto për punonjës");
  if (!avg) return null;

  const points = timeCols
    .map(({ i, c }) => {
      const v = avg[i];
      const num = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
      if (!Number.isFinite(num)) return null;
      return { t: c, v: num };
    })
    .filter(Boolean);

  if (!points.length) return null;
  return points;
}

function latestPoint(points) {
  return points[points.length - 1];
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
  const cpiIndexTotal = extractSeriesFromTable(cpiIndexRows, "Total");

  const cpiYoyBuf = await download(FILES.cpiAnnualChange);
  fs.writeFileSync(path.join(RAW_DIR, "cpi-annual-change.xlsx"), cpiYoyBuf);
  const cpiYoyRows = toRows(cpiYoyBuf);
  const cpiYoyTotal = extractSeriesFromTable(cpiYoyRows, "Total");

  const wageBuf = await download(FILES.wageAvgAndMin);
  fs.writeFileSync(path.join(RAW_DIR, "wage-avg-min.xlsx"), wageBuf);
  const wageRows = toRows(wageBuf);
  const wageAvg = extractWageSeries(wageRows);

  const series = [];

  if (cpiIndexTotal) {
    series.push({
      id: "CPI_TOTAL_INDEX",
      freq: "monthly",
      unit: "index",
      points: cpiIndexTotal
    });
  }

  if (cpiYoyTotal) {
    series.push({
      id: "CPI_TOTAL_YOY_PCT",
      freq: "monthly",
      unit: "percent",
      points: cpiYoyTotal
    });
  }

  if (wageAvg) {
    series.push({
      id: "WAGE_AVG_GROSS_ALL",
      freq: "quarterly",
      unit: "ALL",
      points: wageAvg
    });
  }

  const payload = {
    generatedAt,
    sources: { hubs: SOURCES, files: FILES },
    latest: {
      cpiIndex: cpiIndexTotal ? latestPoint(cpiIndexTotal) : null,
      cpiYoy: cpiYoyTotal ? latestPoint(cpiYoyTotal) : null,
      wageAvg: wageAvg ? latestPoint(wageAvg) : null
    },
    series
  };

  writeJson(OUT_LATEST, payload);
  console.log("Wrote", OUT_LATEST, "series:", series.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});