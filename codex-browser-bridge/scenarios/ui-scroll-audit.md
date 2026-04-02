# UI Scroll Audit Scenario

Use this when you want a visual UX/UI review from top to bottom instead of a code-only review.

## Suggested flow

1. `browser_navigate` to the page.
2. `browser_capture_scroll_story` with `sections: 4` or `sections: 5`.
3. `browser_get_dom_summary` for headings, buttons, links, and inputs.
4. `browser_extract_visible_links` if navigation density matters.
5. Summarize hierarchy, CTA consistency, section rhythm, and confusion points.

## Good use cases

- landing page design review
- mobile-first audit
- scroll funnel inspection
- evidence-based feedback for marketing pages
