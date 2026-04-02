import type { ChromeManager } from "../chrome.js";

export async function extractSearchResults(
  manager: ChromeManager,
  args: { limit?: number } = {}
) {
  const page = await manager.getActivePage();
  const limit = args.limit ?? 10;

  const results = await page.evaluate(({ limit }) => {
    const candidates = Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => {
        const href = (anchor as HTMLAnchorElement).href;
        const titleNode =
          anchor.querySelector("h3") ||
          anchor.closest("div")?.querySelector("h3") ||
          anchor.querySelector("[role='heading']");
        const title =
          titleNode?.textContent?.trim() ||
          anchor.textContent?.trim() ||
          "";
        const snippetContainer =
          anchor.closest("div")?.parentElement?.querySelector("span, div[data-sncf]") ||
          anchor.closest("div")?.querySelector("span");
        const snippet = snippetContainer?.textContent?.trim() || "";

        return {
          title,
          href,
          snippet,
        };
      })
      .filter((item) => item.href.startsWith("http"))
      .filter((item) => item.title)
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => entry.href === item.href && entry.title === item.title) === index
      );

    return candidates.slice(0, limit);
  }, { limit });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: page.url(),
            count: results.length,
            results,
          },
          null,
          2
        ),
      },
    ],
  };
}
