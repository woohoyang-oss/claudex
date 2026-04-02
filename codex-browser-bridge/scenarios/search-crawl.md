# Search Crawl Scenario

Use this when you want to research a topic in a real browser and extract structured result data.

## Suggested flow

1. `browser_navigate` to the search page or results page.
2. `browser_wait_for` the main search results to appear.
3. `browser_extract_search_results` for a structured list of titles, links, and snippets.
4. `browser_extract_visible_links` if you want broader page navigation options.
5. `browser_screenshot` or `browser_capture_scroll_story` if visual evidence matters.

## Good use cases

- brand result checks
- competitor scans
- SERP sampling
- lightweight browser-based crawling
