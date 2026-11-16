# FreshCheck AI — Development Blueprint

## 1. Product analysis
**Problem:** AI answers mix stable facts with time-sensitive facts (versions, prices, executives, laws, statistics), and they all sound equally confident. Users can't tell which sentences have quietly gone out of date.
**Users:** developers pasting AI coding answers, analysts and writers checking AI drafts, and teams that ship LLM features and need to spot-check outputs.
**Value:** a report for each claim that keeps three things separate: how likely the claim is to go stale, what current sources say about it, and how solid that evidence is. Every verdict links to its sources.
**How it differs from a fact-checking chatbot:** no conversation and no new generated answer. It works only on the text you paste. It skips stable facts on purpose, never calls a claim "outdated" without evidence of change, and shows its reasoning.

## 2. Product decisions (MVP)
Include: paste or sample input, claim extraction, risk classification, skipping searches for stable facts and opinions, Tavily evidence, a Bifrost verdict per claim, an overall report, source links and timestamps, honest failure states, and a Methodology page.
Exclude for now: accounts, saved history, browser extension, public API, batch checks, monitoring, team workspaces, PDF export.
Hard limits: at most 12 claims and 6,000 characters per check, so cost and wait time stay predictable.

## 3. Architecture — a key correction to your proposal
Lovable builds a single TypeScript app (TanStack Start) that runs its server code at the edge. It **cannot run Python/FastAPI**. Two options:
- **A (recommended): one TypeScript app.** The UI and backend logic live in the same Lovable project. Server functions call Tavily and Bifrost. No CORS, no second deployment, and secrets stay on the server. The only extra service is Bifrost itself.
- B: Lovable frontend + separate FastAPI. More languages, two deployments, CORS, and slower to build. Pick this only if Python is required.

Bifrost is an open-source gateway you host yourself (Docker/Go). It exposes an OpenAI-compatible `/v1/chat/completions` endpoint and routes to providers set in its own config. It has to run somewhere reachable from the internet.

```text
Browser (React UI)
   |  server function call: checkFreshness(text)
   v
FreshCheck server (TanStack Start, edge)
   1. extract + classify claims ----> Bifrost ---> LLM provider(s)
   2. plan search per claim (rules + LLM hint)
   3. search evidence -------------> Tavily /search (+ /extract when needed)
   4. judge claim vs evidence -----> Bifrost (structured JSON)
   5. compute scores (deterministic code, not the LLM)
   v
Report JSON -> UI (summary + claim cards + detail drawer)

Bifrost: Docker container on Render / Fly.io / Railway, protected by a gateway key
```
Steps 3–4 run in parallel per claim, with a concurrency cap of about 4.

## 4. Technical design
**Modules (server):**
- `bifrost.ts` — one `chat({task, messages, schema})` helper. The model name comes from config per task (`EXTRACT_MODEL`, `JUDGE_MODEL`). No provider SDKs anywhere else.
- `tavily.ts` — `search({query, topic, includeDomains, timeRange, maxResults})` against `POST https://api.tavily.com/search`. Optional `/extract` for official doc pages.
- `extract.ts`, `searchPlan.ts`, `judge.ts`, `score.ts`, `pipeline.ts`.
- Validate all LLM output with zod. On invalid output, retry once, then mark the claim "unverified (analysis error)". Never invent a result.

**Search strategy by category:** docs/APIs → official domains plus a version query. Prices → vendor domain. Leadership → company site plus news. News → Tavily `topic: news` with a time range. Laws → government domains. Stats → institutional sources. Stable science, history and opinions → no search.

**Source tiers (rule-based):** official/primary (vendor docs, .gov) > institutional/academic > reputable news > other. We keep a small domain-tier map; the LLM does not decide trust.

**Data model (TypeScript types):**
```text
Claim { id, text, sourceSpan, category, isFactual, timeSensitive,
        freshnessRisk: low|medium|high, needsVerification, sourceTypeHint }
Evidence { url, title, domain, tier, publishedDate|null, snippet, retrievedAt }
Judgment { support: supports|partially|contradicts|insufficient,
           currentValue|null, whatChanged|null, explanation, citedUrls[] }
ClaimResult { claim, evidence[], judgment, confidence: low|medium|high,
              status, checkedAt }
Report { id, inputHash, claims[], summary{counts, overall}, model info,
         durationMs, errors[] }
```
**API contract:** `checkFreshness({text}) -> Report`. MVP returns everything at once and the UI shows staged progress. Streaming each claim as it finishes is a stretch goal.
**Storage:** none for the MVP (no database). We may add Lovable Cloud later to save shareable reports.

## 5. Scoring methodology (transparent, rule-based)
- **Freshness risk:** by category (low: science/history; medium: stats, laws, company facts; high: versions, prices, AI models, news, leadership). The LLM can raise it one level with a stated reason.
- **Evidence support:** the LLM's label, which must cite URLs it was actually given. A citation not in the evidence set is dropped. If no valid citation remains, the claim becomes "insufficient".
- **Verification confidence (computed in code):** high = 2+ independent domains agree, including tier 1–2, with no tier 1–2 contradiction. Medium = 1 good source, or minor conflict. Low = only tier 4 sources, no dates, or conflicting sources.
- **Status mapping:**
  - stable + not searched → *Stable information*
  - supports + confidence ≥ medium → *Current and supported*
  - partially → *Partially supported*
  - contradicts + confidence ≥ medium + a newer value found → *Potentially outdated* (the claim was once true) or *Contradicted* (no sign it was ever true)
  - contradicts with low confidence, or insufficient → *Unverified*
- **Overall:** show counts first. Headline = "X of Y checkable claims hold up today", plus the most serious problem. No single 0–100 score. If we show one, it is labelled "share of checked claims supported" — a ratio, not a probability.
- The Methodology page says plainly that the labels are not calibrated probabilities.

## 6. UI/UX
Style: calm and editorial, with a warm off-white background, ink text, one deep teal accent, and distinct (not loud) status colors. Every status always has an icon and a text label. Serif headings, sans-serif body, monospace for claim text. No gradients, no chat bubbles.
Screens:
1. **Checker (/)**: headline, one-line pitch, a large text box with a character counter, "Check Freshness", 3 sample answers (API, company, mixed), and a 4-step "how it works" strip.
2. **Results** (same page, below the input): summary bar with counts per status, a filter by status, and claim cards (claim, category, risk, status, short evidence summary, up to 3 sources with tier and date, checked time).
3. **Claim detail drawer**: original claim / what sources say now / what changed / what's uncertain / full source list.
4. **Methodology (/methodology)**: pipeline, definitions, thresholds, limitations.
The layout works on mobile first; claim cards stack.

## 7. Team (3 people)
- **Member 1 (JS/Tailwind) — UI owner:** screens, components, states, samples, Methodology page.
- **Member 2 — pipeline owner:** prompts, zod schemas, judge, scoring, eval dataset and script.
- **Member 3 — integrations and ops owner:** Bifrost deployment and config, Tavily client, search planning, error handling, deployment, integrating everything.
Workflow: GitHub sync from Lovable, `main` protected, feature branches, small PRs with one reviewer who is not the author. AI-written code needs a human summary in the PR. Unit tests for `score.ts` and `searchPlan.ts` are required.

## 8. Roadmap
1. **Foundation:** design system, Checker UI with mock report. *Test:* samples render all six statuses.
2. **Bifrost live:** deploy the container, add secrets, `ping` server function. *Test:* a real model reply through Bifrost (logs show the request).
3. **Extraction:** real claims from samples. *Test:* eval extraction precision/recall on 10 answers.
4. **Tavily evidence:** search planning and source tiers. *Test:* stable claims make 0 searches; top-3 relevance checked by hand.
5. **Judge + scoring:** full pipeline. *Test:* unit tests for status mapping; eval accuracy.
6. **Hardening:** timeouts, retries, partial results when one claim fails, rate-limit messages. *Test:* kill Bifrost or Tavily and check the UI degrades honestly.
7. **Detail drawer + Methodology + publish.**
8. **Eval report:** publish the numbers on the Methodology page.

## 9. Deployment
- App: published from Lovable (free hosting). Vercel isn't needed.
- Bifrost: Docker on Render free/starter or Fly.io. Free tiers sleep, so the first request can take 30–60 s. Keep it warm before demos, or pay about $5–7/month.
- Secrets (server only): `TAVILY_API_KEY`, `BIFROST_URL`, `BIFROST_API_KEY`. Provider keys (e.g. OpenAI) live only in Bifrost's config.
- Cost per answer: about 1 extraction call + up to 12 judge calls + up to 12 Tavily searches. Target under $0.05 with a small model.

## 10. Evaluation
Dataset: 30–40 hand-labelled claims across 6 buckets (stable, correct-but-outdated, wrong-but-recent, conflicting, unverifiable, needs-multiple-sources), with the expected status and date checked.
Metrics: extraction precision and recall, status accuracy, **false-outdated rate (main metric, target < 5%)**, source relevance@3, p50/p95 latency, cost per answer.
Demo honesty: show the eval table, include one case where the tool correctly says "Unverified", and show the Bifrost and Tavily logs live.

## 11. Risks
Irrelevant or old search results → domain filters, dates, judge told to return "insufficient". Hallucinated verdicts → citation check plus code-computed confidence. Edge request time limits → concurrency cap, claim limit, a timeout per claim. Bifrost hosting cold starts → paid tier or warm-up. Rate limits → clear message plus partial report. Scope creep → the exclusion list above.

## 12. Open questions (assumptions in brackets)
1. OK to drop FastAPI and use one TypeScript app? [Yes — option A]
2. Where will Bifrost run, and which LLM provider/key will sit behind it? [Render + OpenAI small model]
3. Do you already have Tavily and provider API keys? [You will add them]
4. Save shareable report links? [No for MVP]

After approval, step 1: the design system, the Checker and Results UI with realistic mock data, and the typed report contract — before any external calls.
