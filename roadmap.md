# FreshCheck AI — competition roadmap

## Implemented in the live-engine branch
- [x] Windows-first desktop layout and clearer navigation
- [x] Guided two-stage workflow: extract claims, then review/select before search
- [x] Up to 12 extracted claims and 8 selected claims per run
- [x] Server-only Tavily and managed AI gateway requests
- [x] Bounded request timeouts and three-way claim concurrency
- [x] Deterministic source-quality, citation, relevance and confidence checks
- [x] Conservative outdated verdict requiring dated historical support and later contradiction
- [x] Separate stable and user-skipped statuses
- [x] Sample reports explicitly labeled as examples

## Must complete before competition submission
- [ ] Run Windows CI: lint, tests, build
- [ ] Add integration tests with mocked Tavily and AI gateway responses
- [ ] Add real end-to-end test in Lovable preview with Tavily secret configured
- [ ] Upgrade origin grouping to Public Suffix List (avoid false source independence)
- [ ] Expand and manually review source-quality registry by topic/country
- [ ] Add extraction and judgment benchmark with labeled ground truth
- [ ] Measure precision, recall, citation validity, false-outdated rate, latency and cost
- [ ] Add robust distributed rate limiting and abuse controls
- [ ] Add retry policy for transient upstream errors, respecting request budgets
- [ ] Improve date extraction and conflicting-date handling
- [ ] Keyboard/screen-reader audit and Windows 1280/1440/1920 QA
- [ ] Privacy copy and clear data-retention policy
- [ ] Publish methodology and benchmark results

## Explicitly out of MVP scope
Accounts, saved history, browser extension, public API, batch jobs, monitoring, team workspaces and PDF export.
