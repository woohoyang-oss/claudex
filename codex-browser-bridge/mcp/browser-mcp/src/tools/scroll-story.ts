import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ChromeManager } from "../chrome.js";

export async function captureScrollStory(
  manager: ChromeManager,
  args: { outputDir?: string; sections?: number; waitMs?: number } = {}
) {
  const page = await manager.getActivePage();
  const sections = Math.max(2, Math.min(args.sections ?? 4, 8));
  const waitMs = Math.max(0, args.waitMs ?? 250);
  const baseDir =
    args.outputDir && path.isAbsolute(args.outputDir)
      ? args.outputDir
      : path.join(os.tmpdir(), `browser-mcp-scroll-${Date.now()}`);

  await fs.mkdir(baseDir, { recursive: true });

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    url: window.location.href,
    title: document.title,
  }));

  const maxOffset = Math.max(0, metrics.scrollHeight - metrics.viewportHeight);
  const checkpoints = Array.from({ length: sections }, (_, index) => {
    if (sections === 1) {
      return 0;
    }
    return Math.round((maxOffset * index) / (sections - 1));
  });

  const captures = [];

  for (let index = 0; index < checkpoints.length; index += 1) {
    const y = checkpoints[index] ?? 0;
    await page.evaluate((nextY) => window.scrollTo({ top: nextY, behavior: "instant" }), y);
    if (waitMs > 0) {
      await page.waitForTimeout(waitMs);
    }

    const outputPath = path.join(baseDir, `${String(index + 1).padStart(2, "0")}-y${y}.png`);
    await page.screenshot({ path: outputPath, fullPage: false });

    captures.push({
      index: index + 1,
      y,
      outputPath,
    });
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: metrics.url,
            title: metrics.title,
            outputDir: baseDir,
            sections,
            viewport: {
              width: metrics.viewportWidth,
              height: metrics.viewportHeight,
            },
            captures,
          },
          null,
          2
        ),
      },
    ],
  };
}
