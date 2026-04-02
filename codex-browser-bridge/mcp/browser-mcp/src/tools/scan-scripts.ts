import type { ChromeManager } from "../chrome.js";

export async function scanScripts(
  manager: ChromeManager,
  args: { limit?: number; includeInline?: boolean } = {}
) {
  const page = await manager.getActivePage();
  const limit = args.limit ?? 50;

  const result = await page.evaluate(
    ({ limit, includeInline }) => {
      const entries = Array.from(document.scripts).map((script, index) => {
        const text = script.textContent?.trim() || "";
        return {
          index,
          src: script.src || null,
          type: script.type || null,
          async: script.async,
          defer: script.defer,
          inline: !script.src,
          textPreview: !script.src && includeInline ? text.slice(0, 240) : null,
        };
      });

      const filtered = includeInline ? entries : entries.filter((entry) => !entry.inline);

      return {
        url: window.location.href,
        title: document.title,
        count: filtered.length,
        scripts: filtered.slice(0, limit),
      };
    },
    { limit, includeInline: args.includeInline ?? false }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
