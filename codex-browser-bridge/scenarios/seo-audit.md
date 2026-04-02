# SEO Audit Scenario

Use this when you want a browser-grounded SEO review of a page or landing flow.

## Suggested flow

1. `browser_navigate` to the target page.
2. `browser_get_page_metadata` to inspect title, description, canonical, robots, OG tags, and language.
3. `browser_get_dom_summary` to inspect headings and visible structure.
4. `browser_capture_scroll_story` to capture top, middle, and lower sections.
5. If relevant, compare a root page and a commerce or campaign landing page.

## Good use cases

- brand page SEO checks
- launch page QA
- root domain vs subdomain comparison
- metadata regression review
