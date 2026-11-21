# FreshCheck AI roadmap

## Windows-first product polish
- [x] Desktop-first checker layout with wider reading canvas and clearer navigation
- [x] Explicit original-answer date field (optional) for historical context
- [x] Honest demo/live status: pasted non-sample text is never presented as checked
- [x] Character limit and claim limit communicated before a check
- [ ] Desktop QA at 1280px, 1440px and 1920px; keyboard-only and screen-reader pass

## Live verification
- [ ] Connect live checker and prepare the secure Tavily key form (current request)
- [ ] Bifrost live — user confirmed not deployed; requires deployed gateway URL, gateway key and configured model provider
- [ ] Claim extraction via Bifrost with schema validation and 12-claim cap
- [ ] Tavily evidence search, search planning and source provenance — requires server-side Tavily secret
- [ ] Per-claim judging, citation allow-list validation and deterministic scoring
- [ ] Partial results, timeouts, retries, rate-limit messaging and request budget
- [ ] Evaluation dataset, false-outdated metric and published methodology results
- [ ] Publish after live-path and failure-mode QA

## MVP scope
No accounts, saved history, browser extension, public API, batch jobs, monitoring, team workspaces or PDF export in the first release.
