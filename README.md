# FreshCheck AI 🔎

**Check whether the facts in an AI-generated answer are still up to date.**

AI answers can sound confident while relying on information that has changed: an old software version, an outdated price, a former company executive, or a statistic presented as current.

FreshCheck is a claim-level freshness assessment tool—not another chatbot. Paste an AI-generated answer, identify the facts that may change, and inspect the evidence behind every finding.

## Product principles

- **Freshness is not correctness.** A claim may be wrong today without ever having been correct.
- **Historical proof matters.** "Potentially outdated" requires dated evidence that the previous value was once accurate.
- **Evidence dimensions stay separate.** Publisher quality, relevance, and independence are not interchangeable.
- **Uncertainty is a valid result.** Weak, missing, or conflicting evidence should produce an unverified finding.
- **No false precision.** Confidence is a rule-based evidence assessment, not a calibrated probability.

## MVP workflow

1. Paste an AI-generated answer (maximum 6,000 characters).
2. Extract up to 12 factual claims.
3. Classify freshness risk and skip stable facts and opinions.
4. Search for current sources for claims that need verification.
5. Judge each claim against the collected evidence.
6. Compute confidence and status with deterministic, tested code.
7. Review a summary and claim-level evidence, including source dates and limitations.

The optional original-answer date helps put a statement into historical context.

## Current implementation status

The repository currently contains the React/TypeScript/TanStack Start interface, design system, typed report contract, demo reports, deterministic scoring rules and tests, claim-detail views, and a methodology page.

The sample reports are illustrative fixtures. **Live checking is not connected yet.** Pasted text that is not a sample is not analyzed or sent anywhere by the current preview.

## Planned integrations

- [Tavily](https://tavily.com/) — current web search and evidence retrieval.
- [Bifrost by Maxim AI](https://www.getbifrost.ai/) — OpenAI-compatible model gateway for claim extraction and evidence judgment.

The application follows a single TypeScript/TanStack Start architecture. Integration credentials belong in server-side deployment secrets and must never be committed to this repository or exposed to browser code.

### Required server-side configuration

| Variable | Purpose |
|---|---|
| `TAVILY_API_KEY` | Tavily search authentication |
| `BIFROST_URL` | Deployed Bifrost base URL |
| `BIFROST_API_KEY` | Gateway authentication |
| `EXTRACT_MODEL` | Model configured for claim extraction |
| `JUDGE_MODEL` | Model configured for evidence judgment |

Provider credentials are configured within Bifrost, not in the browser app.

## Development on Windows

Install the current Node.js LTS release and Git for Windows, then open PowerShell. The repository currently uses a Bun lockfile; the npm commands below avoid creating a competing package lock:

```powershell
git clone https://github.com/Masoud-Salik/freshness-check.git
cd freshness-check
npm install --no-package-lock
npm run dev
```

Open the local URL printed by Vite. For local server secrets, copy `.env.example` to `.env` and fill values only when the matching server integration has been implemented. `.env` is ignored by Git. Never use a `VITE_` prefix for API credentials. Useful checks before pushing changes:

```powershell
npm run lint
npm test
npm run build
```

Bun is also present in the repository lockfile; use the package manager selected by the project maintainers consistently rather than mixing lockfiles.

## Project context

FreshCheck AI was developed around the **Geek Room Global AI Hackathon 2026** challenge: building a stale-answer detector for AI applications.

## Feedback

Open an issue for bugs or improvements, especially around claim extraction, evidence relevance, source provenance, historical accuracy, and transparent failure states.

---

**Don't just ask whether an AI answer sounds right. Ask whether it's still right.**
