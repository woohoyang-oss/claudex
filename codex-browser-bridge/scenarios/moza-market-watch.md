# MOZA Market Watch

Use this scenario when you want to track imported MOZA wheel listings on Naver over time and compare them with GTGear official pricing.

## Goal

- Collect current Naver listings for `moza 레이싱휠`
- Keep only `해외` MOZA wheel products with visible review data
- Collect GTGear official MOZA wheel prices
- Compare price gaps, review-count changes, and purchase-label changes across snapshots

## Commands

```bash
bun run browser:moza:collect
bun run browser:moza:report
```

## Output

- JSON snapshots: `.runtime/market-tracker/moza/snapshots/*.json`
- Latest snapshot: `.runtime/market-tracker/moza/latest.json`
- Latest report: `.runtime/market-tracker/moza/reports/latest.md`

## Notes

- The collector tries Naver Shopping first and falls back to the general Naver search page when the shopping page shows a captcha or challenge.
- GTGear direct sales counts are not public on the site, so the report compares public review counts and purchase labels from Naver against GTGear official prices.
