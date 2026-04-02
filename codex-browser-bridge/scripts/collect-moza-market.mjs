#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const runtimeRoot = process.env.MOZA_TRACKER_DIR ?? path.join(repoRoot, ".runtime", "market-tracker", "moza");
const snapshotsDir = path.join(runtimeRoot, "snapshots");
const latestPath = path.join(runtimeRoot, "latest.json");
const cdpUrl = process.env.BROWSER_MCP_CDP_URL ?? "http://127.0.0.1:9222";
const naverQuery = process.env.MOZA_QUERY ?? "moza 레이싱휠";
const gtgearQuery = process.env.MOZA_GTGEAR_QUERY ?? "MOZA";

const playwrightModuleUrl = pathToFileURL(
  path.join(repoRoot, "codex-browser-bridge", "mcp", "browser-mcp", "node_modules", "playwright", "index.mjs")
).href;
const { chromium } = await import(playwrightModuleUrl);

async function main() {
  await fs.mkdir(snapshotsDir, { recursive: true });

  const browser = await chromium.connectOverCDP(cdpUrl);
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = context.pages()[0] ?? (await context.newPage());

  try {
    const naver = await collectNaver(page, naverQuery);
    const gtgear = await collectGtgear(page, gtgearQuery);
    const snapshot = buildSnapshot({ naver, gtgear });

    const collectedAt = new Date(snapshot.collectedAt);
    const snapshotId = collectedAt.toISOString().replaceAll(":", "-");
    const snapshotPath = path.join(snapshotsDir, `${snapshotId}.json`);

    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
    await fs.writeFile(latestPath, JSON.stringify(snapshot, null, 2));

    console.log(
      JSON.stringify(
        {
          savedTo: snapshotPath,
          latest: latestPath,
          importedCount: snapshot.naver.imported.length,
          officialNaverCount: snapshot.naver.official.length,
          gtgearCount: snapshot.gtgear.products.length,
          comparisons: snapshot.comparisons.length,
          usedFallback: snapshot.naver.usedFallback,
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

async function collectNaver(page, query) {
  const shoppingUrl = `https://search.shopping.naver.com/search/all?where=all&frm=NVSCTAB&query=${encodeURIComponent(query)}`;
  const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;

  let usedFallback = false;

  await page.goto(shoppingUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4500);

  const needsFallback = await page.evaluate(() => {
    const bodyText = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim();
    return Boolean(
      document.querySelector('input[name="captcha"]') ||
        bodyText.includes("Please enter the Answer.") ||
        /challenge/i.test(location.href)
    );
  });

  if (needsFallback) {
    usedFallback = true;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);
  }

  const raw = await page.evaluate(() => {
    const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
    const sections = Array.from(document.querySelectorAll("section"))
      .map((section) => {
        const sectionText = normalize(section.textContent);
        if (!sectionText.includes("네이버 가격비교") && !sectionText.includes("네이버플러스 스토어")) {
          return null;
        }

        const label = sectionText.includes("네이버 가격비교") ? "네이버 가격비교" : "네이버플러스 스토어";
        const items = Array.from(section.querySelectorAll("li"))
          .map((item) => {
            const text = normalize(item.textContent);
            if (!/MOZA/i.test(text) || !/\d[\d,]*원/.test(text)) {
              return null;
            }

            const anchors = Array.from(item.querySelectorAll("a"))
              .map((anchor) => ({
                text: normalize(anchor.textContent),
                href: anchor.href || null,
              }))
              .filter((entry) => entry.text || entry.href);

            const titleAnchor =
              anchors.find((entry) => /MOZA/i.test(entry.text)) ??
              anchors.find((entry) => entry.href && !/javascript:/i.test(entry.href)) ??
              null;

            return {
              section: label,
              text,
              title: titleAnchor?.text ?? "",
              href: titleAnchor?.href ?? null,
              sellerAnchor:
                anchors.find(
                  (entry) =>
                    entry.text &&
                    entry.text !== titleAnchor?.text &&
                    !entry.text.includes("가성비") &&
                    !entry.text.includes("재구매") &&
                    !entry.text.includes("공식")
                )?.text ?? null,
            };
          })
          .filter(Boolean);

        return {
          section: label,
          items,
        };
      })
      .filter(Boolean);

    return {
      url: location.href,
      title: document.title,
      sections,
    };
  });

  const cards = raw.sections.flatMap((section) =>
    section.items.map((item) => parseNaverCard(item)).filter((item) => item && isWheelProduct(item.title))
  );
  const dedupedCards = dedupeCards(cards);

  return {
    url: raw.url,
    title: raw.title,
    usedFallback,
    imported: dedupedCards.filter((item) => item.overseas),
    official: dedupedCards.filter((item) => !item.overseas),
    cards: dedupedCards,
  };
}

async function collectGtgear(page, query) {
  const urls = [
    `https://gtgear.co.kr/product/search.html?keyword=${encodeURIComponent(query)}`,
    "https://gtgear.co.kr/",
  ];
  const collected = [];

  for (const url of urls) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(4000);

    const raw = await page.evaluate(() => {
      const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
      return Array.from(document.querySelectorAll("li"))
        .map((item) => {
          const text = normalize(item.textContent);
          if (!/MOZA/i.test(text) || !/원/.test(text)) {
            return null;
          }

          return {
            text,
            title:
              normalize(item.querySelector(".name")?.textContent) ||
              normalize(item.querySelector("a")?.textContent) ||
              "",
            href: item.querySelector("a")?.href || null,
          };
        })
        .filter(Boolean);
    });

    collected.push(...raw);
  }

  const products = dedupeCards(
    collected.map((item) => parseGtgearCard(item)).filter((item) => item && isWheelProduct(item.title))
  );

  return {
    url: urls[0],
    products,
  };
}

function parseNaverCard(item) {
  const text = item.text;
  const title = item.title || text;

  let rating = null;
  let reviewCount = null;
  let match = text.match(/(\d+(?:\.\d+)?)\((\d+)\)/);
  if (match) {
    rating = Number(match[1]);
    reviewCount = Number(match[2]);
  } else {
    match = text.match(/(\d+(?:\.\d+)?)(\d+)구매/);
    if (match) {
      rating = Number(match[1]);
      reviewCount = Number(match[2]);
    }
  }

  const purchaseLabel = firstMatch(text, /구매\s*([0-9+]+)/);
  const favoriteLabel = firstMatch(text, /찜\s*([0-9+]+)/);

  return {
    source: "naver",
    section: item.section,
    title,
    href: item.href,
    seller:
      item.sellerAnchor ||
      firstMatch(text, /(지티기어공식|지티기어|알트업|파블 스토어|에밀리 씨엔|크로켓Croket|크로켓|라엘글로벌|Daddy)/) ||
      null,
    overseas: text.includes("해외"),
    official: title.includes("[국내정발]") || text.includes("지티기어"),
    ad: text.includes("광고"),
    price: parseCurrency(firstMatch(text, /(\d[\d,]*)원/)),
    couponPrice: parseCurrency(firstMatch(text, /쿠폰 할인가\s*([\d,]+)원/)),
    shippingPrice: text.includes("배송비무료")
      ? 0
      : parseCurrency(firstMatch(text, /배송비\s*([\d,]+)원/)),
    rating,
    reviewCount,
    purchaseLabel,
    purchaseCount: purchaseLabel ? Number(purchaseLabel.replace("+", "")) : null,
    favoriteLabel,
    favoriteCount: favoriteLabel ? Number(favoriteLabel.replace("+", "")) : null,
    modelKey: extractModelKey(title),
    rawText: text,
  };
}

function parseGtgearCard(item) {
  const text = item.text;
  const title = item.title || text;
  return {
    source: "gtgear",
    title,
    href: item.href,
    seller: "지티기어",
    official: true,
    soldOut: text.includes("SOLD OUT"),
    price: parseCurrency(firstMatch(text, /판매가\s*:\s*([\d,]+)원/)),
    originalPrice: parseCurrency(firstMatch(text, /소비자가\s*:\s*([\d,]+)원/)),
    discountPercent: parseInteger(firstMatch(text, /(\d+)%/)),
    modelKey: extractModelKey(title),
    rawText: text,
  };
}

function buildSnapshot({ naver, gtgear }) {
  const gtgearByModel = groupFirst(gtgear.products, "modelKey");
  const officialNaverByModel = groupFirst(naver.official.filter((item) => item.official), "modelKey");
  const importedReviewLeaders = groupMax(
    naver.imported.filter((item) => Number.isFinite(item.reviewCount)),
    "modelKey",
    (item) => item.reviewCount ?? 0
  );
  const importedCheapest = groupMin(
    naver.imported.filter((item) => Number.isFinite(item.price)),
    "modelKey",
    (item) => item.couponPrice ?? item.price ?? Number.MAX_SAFE_INTEGER
  );

  const modelKeys = Array.from(
    new Set(
      [
        ...Object.keys(gtgearByModel),
        ...Object.keys(officialNaverByModel),
        ...Object.keys(importedReviewLeaders),
        ...Object.keys(importedCheapest),
      ].filter(Boolean)
    )
  ).sort();

  const comparisons = modelKeys.map((modelKey) => {
    const gtgearProduct = gtgearByModel[modelKey] ?? null;
    const officialNaverProduct = officialNaverByModel[modelKey] ?? null;
    const importLeader = importedReviewLeaders[modelKey] ?? null;
    const importCheapest = importedCheapest[modelKey] ?? null;
    const importPrice = importCheapest?.couponPrice ?? importCheapest?.price ?? null;
    const gtgearPrice = gtgearProduct?.price ?? null;
    const officialNaverPrice = officialNaverProduct?.couponPrice ?? officialNaverProduct?.price ?? null;

    return {
      modelKey,
      importLeader,
      importCheapest,
      officialNaverProduct,
      gtgearProduct,
      importPrice,
      officialPrice: gtgearPrice ?? officialNaverPrice,
      priceGapVsGtgear:
        Number.isFinite(importPrice) && Number.isFinite(gtgearPrice) ? importPrice - gtgearPrice : null,
      priceGapVsOfficialNaver:
        Number.isFinite(importPrice) && Number.isFinite(officialNaverPrice)
          ? importPrice - officialNaverPrice
          : null,
      reviewGapVsOfficialNaver:
        Number.isFinite(importLeader?.reviewCount) && Number.isFinite(officialNaverProduct?.reviewCount)
          ? importLeader.reviewCount - officialNaverProduct.reviewCount
          : null,
    };
  });

  return {
    collectedAt: new Date().toISOString(),
    query: naverQuery,
    naver,
    gtgear,
    comparisons,
  };
}

function dedupeCards(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.modelKey ?? item.title}|${item.seller ?? ""}|${item.source}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }

    const existingScore =
      (existing.reviewCount ?? 0) * 1000000 +
      (existing.purchaseCount ?? 0) * 1000 +
      (existing.couponPrice ? 100 : 0);
    const nextScore =
      (item.reviewCount ?? 0) * 1000000 + (item.purchaseCount ?? 0) * 1000 + (item.couponPrice ? 100 : 0);

    if (nextScore > existingScore) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

function groupFirst(items, key) {
  return Object.fromEntries(items.filter((item) => item[key]).map((item) => [item[key], item]));
}

function groupMax(items, key, score) {
  const map = {};
  for (const item of items) {
    const value = item[key];
    if (!value) continue;
    if (!map[value] || score(item) > score(map[value])) {
      map[value] = item;
    }
  }
  return map;
}

function groupMin(items, key, score) {
  const map = {};
  for (const item of items) {
    const value = item[key];
    if (!value) continue;
    if (!map[value] || score(item) < score(map[value])) {
      map[value] = item;
    }
  }
  return map;
}

function firstMatch(value, pattern) {
  return value.match(pattern)?.[1] ?? null;
}

function parseCurrency(value) {
  if (!value) return null;
  return Number(value.replaceAll(",", ""));
}

function parseInteger(value) {
  if (!value) return null;
  return Number(value);
}

function extractModelKey(title) {
  const upper = title.toUpperCase().replace(/\s+/g, " ");
  const patterns = [
    /\bR21\b/,
    /\bR16\b/,
    /\bR12(?:\s+V2)?\b/,
    /\bR9(?:\s+V3)?\b/,
    /\bR5\b/,
    /\bR3\b/,
    /\bFSR2\b/,
    /\bKS(?:\s+GT)?\b/,
    /\bCS PRO\b/,
    /\bREVUELTO\b/,
  ];

  for (const pattern of patterns) {
    const match = upper.match(pattern);
    if (match) {
      return match[0].replace(/\s+/g, " ").trim();
    }
  }

  return upper.includes("MOZA") ? upper.slice(0, 48) : null;
}

function isWheelProduct(title) {
  const upper = title.toUpperCase();
  const include =
    /(R3|R5|R9|R12|R16|R21|FSR2|REVUELTO|KS|CS PRO|스티어링 휠|휠베이스|레이싱 휠|심 레이싱 휠|올인원패키지|풀키트|휠 패키지|DD 심 레이싱 휠 베이스)/.test(
      title
    );
  const exclude =
    /(거치대|핸드브레이크|시프터|러더|비행|어댑터|허브 키트|대시보드|클램프|인버전|익스텐션|브레이크 킷|페달 인버전|패들 애드온|로드셀 페달)/.test(
      title
    );
  return include && !exclude;
}

await main();
