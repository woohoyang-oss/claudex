import type { ChromeManager } from "../chrome.js";

export async function getPageMetadata(manager: ChromeManager) {
  const page = await manager.getActivePage();

  const metadata = await page.evaluate(() => {
    const read = (selector: string, attr = "content") =>
      document.querySelector(selector)?.getAttribute(attr) ?? null;

    const title = document.title ?? "";
    const description =
      read('meta[name="description"]') ||
      read('meta[property="og:description"]') ||
      read('meta[name="twitter:description"]');

    return {
      url: window.location.href,
      title,
      lang: document.documentElement.lang || null,
      canonical: read('link[rel="canonical"]', "href"),
      robots: read('meta[name="robots"]'),
      description,
      ogTitle: read('meta[property="og:title"]'),
      ogDescription: read('meta[property="og:description"]'),
      ogImage: read('meta[property="og:image"]'),
      h1: Array.from(document.querySelectorAll("h1"))
        .map((node) => node.textContent?.trim() || "")
        .filter(Boolean)
        .slice(0, 5),
    };
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(metadata, null, 2),
      },
    ],
  };
}
