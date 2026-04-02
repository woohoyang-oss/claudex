import type { ChromeManager } from "../chrome.js";
import type { SessionStore } from "../session-store.js";

const TRACKER_PATTERNS = [
  { name: "Google Analytics / Tag Manager", match: /googletagmanager|google-analytics|gtag\/js/i },
  { name: "Meta Pixel", match: /connect\.facebook\.net|facebook\.com\/tr/i },
  { name: "Hotjar", match: /hotjar/i },
  { name: "Mixpanel", match: /mixpanel/i },
  { name: "Amplitude", match: /amplitude/i },
  { name: "Intercom", match: /intercom/i },
  { name: "Segment", match: /segment\.com|cdn\.segment/i },
  { name: "Clarity", match: /clarity\.ms/i },
  { name: "Sentry", match: /sentry/i },
];

export async function scanTrackers(manager: ChromeManager, sessions: SessionStore) {
  const page = await manager.getActivePage();
  const network = sessions.getNetworkEntries(page);

  const domScripts = await page.evaluate(() =>
    Array.from(document.scripts)
      .map((script) => script.src || "")
      .filter(Boolean)
  );

  const urls = [
    ...domScripts,
    ...network.map((entry) => entry.url),
  ];

  const findings = TRACKER_PATTERNS.map((pattern) => {
    const matches = urls.filter((url) => pattern.match.test(url));
    return matches.length > 0
      ? {
          name: pattern.name,
          count: matches.length,
          matches: Array.from(new Set(matches)).slice(0, 10),
        }
      : null;
  }).filter(Boolean);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: page.url(),
            trackerCount: findings.length,
            findings,
          },
          null,
          2
        ),
      },
    ],
  };
}
