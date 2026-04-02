#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const runtimeRoot = process.env.MOZA_TRACKER_DIR ?? path.join(repoRoot, ".runtime", "market-tracker", "moza");
const snapshotsDir = path.join(runtimeRoot, "snapshots");
const reportsDir = path.join(runtimeRoot, "reports");
const latestReportPath = path.join(reportsDir, "latest.md");

await fs.mkdir(reportsDir, { recursive: true });

const snapshots = await loadSnapshots();
if (snapshots.length === 0) {
  console.error("No MOZA market snapshots found. Run the collector first.");
  process.exit(1);
}

const latest = snapshots.at(-1);
const previous = snapshots.at(-2) ?? null;
const lines = [];

lines.push("# MOZA Market Watch");
lines.push("");
lines.push(`- Collected: ${latest.collectedAt}`);
lines.push(`- Query: ${latest.query}`);
lines.push(`- Imported listings with reviews: ${latest.naver.imported.filter((item) => (item.reviewCount ?? 0) > 0).length}`);
lines.push(`- GTGear wheel products tracked: ${latest.gtgear.products.length}`);
lines.push(`- Naver fallback used: ${latest.naver.usedFallback ? "yes" : "no"}`);
lines.push("");

lines.push("## Imported Review Leaders");
lines.push("");
for (const item of latest.naver.imported.filter((entry) => (entry.reviewCount ?? 0) > 0).sort(sortByReviews)) {
  const prev = findPrevious(previous, item);
  lines.push(
    `- ${item.modelKey ?? item.title}: ${formatPrice(item.couponPrice ?? item.price)} / 리뷰 ${item.reviewCount ?? "-"} / 평점 ${item.rating ?? "-"} / 구매 ${item.purchaseLabel ?? "-"} / 판매처 ${item.seller ?? "-"}${formatDeltas(prev, item)}`
  );
}

lines.push("");
lines.push("## GTGear Comparison");
lines.push("");
for (const comparison of latest.comparisons) {
  const gtgear = comparison.gtgearProduct;
  const imported = comparison.importLeader ?? comparison.importCheapest;
  if (!gtgear || !imported) continue;

  lines.push(
    `- ${comparison.modelKey}: 해외 ${formatPrice(comparison.importPrice)} vs GTGear ${formatPrice(gtgear.price)} (${formatGap(comparison.priceGapVsGtgear)}) / 해외 리뷰 ${imported.reviewCount ?? "-"} / 해외 구매 ${imported.purchaseLabel ?? "-"}`
  );
}

await fs.writeFile(latestReportPath, `${lines.join("\n")}\n`);

console.log(
  JSON.stringify(
    {
      report: latestReportPath,
      latestCollectedAt: latest.collectedAt,
      snapshots: snapshots.length,
    },
    null,
    2
  )
);

async function loadSnapshots() {
  const entries = await fs.readdir(snapshotsDir, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const records = [];
  for (const file of files) {
    const content = await fs.readFile(path.join(snapshotsDir, file), "utf8");
    records.push(JSON.parse(content));
  }
  return records;
}

function sortByReviews(a, b) {
  return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
}

function findPrevious(previous, current) {
  if (!previous) return null;
  return previous.naver.imported.find(
    (item) => item.modelKey === current.modelKey && item.seller === current.seller && item.title === current.title
  );
}

function formatDeltas(previous, current) {
  if (!previous) return "";
  const parts = [];
  const currentPrice = current.couponPrice ?? current.price;
  const previousPrice = previous.couponPrice ?? previous.price;
  if (Number.isFinite(currentPrice) && Number.isFinite(previousPrice) && currentPrice !== previousPrice) {
    parts.push(`가격 ${signed(currentPrice - previousPrice)}원`);
  }
  if (Number.isFinite(current.reviewCount) && Number.isFinite(previous.reviewCount) && current.reviewCount !== previous.reviewCount) {
    parts.push(`리뷰 ${signed(current.reviewCount - previous.reviewCount)}`);
  }
  if (Number.isFinite(current.purchaseCount) && Number.isFinite(previous.purchaseCount) && current.purchaseCount !== previous.purchaseCount) {
    parts.push(`구매 ${signed(current.purchaseCount - previous.purchaseCount)}`);
  }
  return parts.length ? ` / 변화 ${parts.join(", ")}` : "";
}

function formatPrice(value) {
  return Number.isFinite(value) ? `${value.toLocaleString("ko-KR")}원` : "-";
}

function formatGap(value) {
  if (!Number.isFinite(value)) return "차이 미확인";
  return value === 0 ? "동일" : `${signed(value)}원`;
}

function signed(value) {
  return value > 0 ? `+${value.toLocaleString("ko-KR")}` : value.toLocaleString("ko-KR");
}
