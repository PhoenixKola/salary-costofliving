import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";

const ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(ROOT, "data");
const RAW_DIR = path.join(DATA_DIR, "raw");
const OUT_LATEST = path.join(DATA_DIR, "latest.json");

const SOURCES = {
  instatCpiHub: "https://www.instat.gov.al/en/themes/prices/consumer-price-index/",
  instatWagesHub: "https://www.instat.gov.al/en/themes/labour-market-and-education/wages/"
};

// Put the *direct* xlsx table URLs here once we lock them (we’ll verify them in one go).
const FILES = {
  // cpiIndexXlsx: "...",
  // wageAvgXlsx: "..."
};

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function sheetRows(buf) {
  const wb = xlsx.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { header: 1, raw: true });
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(RAW_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();

  // For now we generate a valid shape so mobile can already wire to it.
  // Next step: fill FILES with the real INSTAT xlsx links and parse them.
  const payload = {
    generatedAt,
    sources: {
      instat: SOURCES,
      files: FILES
    },
    series: []
  };

  writeJson(OUT_LATEST, payload);
  console.log("Wrote", OUT_LATEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});