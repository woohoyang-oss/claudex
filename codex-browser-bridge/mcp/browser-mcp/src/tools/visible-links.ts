import type { ChromeManager } from "../chrome.js";

export async function extractVisibleLinks(
  manager: ChromeManager,
  args: { limit?: number; sameOriginOnly?: boolean } = {}
) {
  const page = await manager.getActivePage();
  const limit = args.limit ?? 20;

  const links = await page.evaluate(
    ({ limit, sameOriginOnly }) => {
      const origin = window.location.origin;
      const isVisible = (element: Element) => {
        const style = window.getComputedStyle(element as HTMLElement);
        const rect = (element as HTMLElement).getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      return Array.from(document.querySelectorAll("a[href]"))
        .filter((node) => isVisible(node))
        .map((node) => {
          const href = (node as HTMLAnchorElement).href;
          return {
            text: node.textContent?.trim() || "",
            href,
          };
        })
        .filter((item) => item.href)
        .filter((item) => (sameOriginOnly ? item.href.startsWith(origin) : true))
        .filter((item, index, array) => array.findIndex((entry) => entry.href === item.href) === index)
        .slice(0, limit);
    },
    { limit, sameOriginOnly: args.sameOriginOnly ?? false }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: page.url(),
            count: links.length,
            links,
          },
          null,
          2
        ),
      },
    ],
  };
}
