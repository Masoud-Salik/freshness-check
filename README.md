# FreshCheck AI 🔎

**Check whether the facts in an AI-generated answer are still current.**

FreshCheck is a claim-level freshness checker. Paste an answer, review the extracted claims, choose what deserves research, and inspect the sources behind each result.

## How it works

1. Paste an answer (maximum 6,000 characters).
2. AI extracts up to 12 atomic factual claims.
3. Review the claims and select up to 8 to verify.
4. Tavily searches the web for relevant evidence.
5. The analysis model labels each source's relevance, stance and historical context.
6. Deterministic code validates citations, source quality, independence and dates before assigning a status.

## Product principles

- **Freshness is not correctness.** A claim may be wrong without ever having been correct.
- **Historical proof matters.** "Potentially outdated" requires dated historical support and later contradictory evidence.
- **Evidence dimensions stay separate.** Publisher quality, relevance and independence are not interchangeable.
- **Uncertainty is a valid result.** Weak, missing or conflicting evidence becomes unverified.
- **No false precision.** Confidence is a rule-based label, not a calibrated probability.
- **Human control.** Users can review and choose claims before spending search requests.

## Current architecture

- React 19 + TypeScript + TanStack Start.
- Server functions keep API calls and credentials out of browser code.
- Tavily Search API retrieves current web evidence.
- Lovable's managed AI gateway performs structured claim extraction and source assessment.
- Deterministic scoring lives in `src/lib/freshcheck/score.ts`.

## Lovable Secrets

Add this secret in Lovable:

| Secret | Purpose |
|---|---|
| `TAVILY_API_KEY` | Server-side Tavily search authentication |

Lovable manages `LOVABLE_API_KEY` for its AI gateway. Do not paste it into the repository or browser code. Optional model override: `FRESHCHECK_MODEL` (server-side only).

Never use `VITE_` for credentials. The browser must never receive either API key.

## Development on Windows

The repository uses Bun and commits `bun.lock`.

Install Bun, then open PowerShell:

```powershell
git clone https://github.com/Masoud-Salik/freshness-check.git
cd freshness-check
bun install --frozen-lockfile
bun run dev
```

Run checks before pushing:

```powershell
bun run lint
bun run test
bun run build
```

## Known limitations before competition submission

- Publisher tiers use a conservative starter allowlist; the map needs broader, reviewed coverage and domain-specific testing.
- Search snippets may omit important page context; high-stakes legal, medical, financial and safety claims need especially careful source review and should not be treated as professional advice.
- Registrable-domain grouping is a heuristic and should be upgraded to a Public Suffix List implementation before treating independence as definitive.
- Confidence labels are rules, not empirically calibrated probabilities. A benchmark is required before describing them as accuracy rates.
- No persistent history, accounts, export, batch checking or browser extension in the MVP.

## Competition priorities

1. Build a labeled benchmark with current, contradicted, historical and ambiguous examples.
2. Measure claim extraction precision/recall, citation correctness, outdated false-positive rate, latency and search cost.
3. Expand and review the source-quality registry.
4. Test failure states, keyboard navigation, mobile layouts and Windows desktop widths.
5. Publish only after CI and end-to-end checks pass.

---

**Don't just ask whether an AI answer sounds right. Ask whether it's still right.**
