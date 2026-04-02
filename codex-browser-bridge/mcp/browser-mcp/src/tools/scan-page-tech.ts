import type { ChromeManager } from "../chrome.js";

export async function scanPageTech(manager: ChromeManager) {
  const page = await manager.getActivePage();

  const result = await page.evaluate(() => {
    const globalScope = window as unknown as Record<string, unknown>;
    const scripts = Array.from(document.scripts).map((script) => ({
      src: script.src || null,
      inline: !script.src,
      type: script.type || null,
    }));

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((link) => ({
      href: (link as HTMLLinkElement).href,
    }));

    const metaGenerator =
      document.querySelector('meta[name="generator"]')?.getAttribute("content") || null;

    const globalsToCheck = [
      "gtag",
      "dataLayer",
      "ga",
      "fbq",
      "mixpanel",
      "amplitude",
      "hj",
      "Intercom",
      "analytics",
      "__NEXT_DATA__",
      "__APOLLO_STATE__",
      "__NUXT__",
      "React",
      "Vue",
    ];

    const detectedGlobals = globalsToCheck
      .filter((name) => typeof globalScope[name] !== "undefined")
      .map((name) => ({
        name,
        type: typeof globalScope[name],
      }));

    const techHints = new Set<string>();
    const html = document.documentElement.outerHTML;

    if (html.includes("__NEXT_DATA__")) techHints.add("Next.js");
    if (html.includes("id=\"__nuxt\"") || html.includes("__NUXT__")) techHints.add("Nuxt");
    if (html.includes("data-reactroot") || typeof globalScope.React !== "undefined") {
      techHints.add("React");
    }
    if (html.includes("data-v-") || typeof globalScope.Vue !== "undefined") {
      techHints.add("Vue");
    }
    if (metaGenerator) techHints.add(`generator:${metaGenerator}`);

    return {
      url: window.location.href,
      title: document.title,
      metaGenerator,
      globals: detectedGlobals,
      scriptCount: scripts.length,
      stylesheetCount: stylesheets.length,
      scripts: scripts.slice(0, 40),
      stylesheets: stylesheets.slice(0, 20),
      techHints: Array.from(techHints),
    };
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
