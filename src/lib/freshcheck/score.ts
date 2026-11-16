import type {
  Claim,
  ClaimResult,
  Evidence,
  Judgment,
  Level,
  ReportSummary,
  VerificationStatus,
} from "./types";

/** Minimum relevance for a page to count as evidence at all. */
export const RELEVANCE_MIN = 0.5;

const usable = (e: Evidence) => e.relevance >= RELEVANCE_MIN;

/** Distinct origins among usable evidence with a given stance. Syndicated copies collapse to one. */
export function independentOrigins(evidence: Evidence[], stance: Evidence["stance"]): number {
  return new Set(evidence.filter((e) => usable(e) && e.stance === stance).map((e) => e.originKey)).size;
}

/** Best (lowest number) tier among usable evidence of a stance, per origin. */
function bestTier(evidence: Evidence[], stance: Evidence["stance"]): number {
  const tiers = evidence.filter((e) => usable(e) && e.stance === stance).map((e) => e.tier);
  return tiers.length ? Math.min(...tiers) : 5;
}

/**
 * Verification confidence, computed in code from evidence (not an LLM probability).
 * Looks at the side the judgment lands on, and penalises strong opposing evidence.
 */
export function computeConfidence(evidence: Evidence[], judgment: Judgment | null): Level {
  if (!judgment || judgment.support === "insufficient") return "low";
  const side: Evidence["stance"] = judgment.support === "contradicts" ? "contradicts" : "supports";
  const other: Evidence["stance"] = side === "supports" ? "contradicts" : "supports";
  const origins = independentOrigins(evidence, side);
  const tier = bestTier(evidence, side);
  const strongOpposition = bestTier(evidence, other) <= 2;
  if (origins === 0) return "low";
  if (strongOpposition) return origins >= 2 && tier <= 2 ? "medium" : "low";
  if (origins >= 2 && tier <= 2) return "high";
  if (tier <= 2 || origins >= 2) return "medium";
  return "low";
}

/** Drop cited URLs that aren't in the evidence set; no valid citation -> insufficient. */
export function sanitizeJudgment(j: Judgment, evidence: Evidence[]): Judgment {
  const urls = new Set(evidence.map((e) => e.url));
  const cited = j.citedUrls.filter((u) => urls.has(u));
  if (cited.length === 0 && j.support !== "insufficient") {
    return { ...j, citedUrls: [], support: "insufficient", previouslyCorrect: "unknown" };
  }
  // "previously correct" only holds if a cited page is actually historical evidence.
  const hasHistorical = evidence.some((e) => e.historical && cited.includes(e.url));
  const previouslyCorrect = j.previouslyCorrect === "yes" && !hasHistorical ? "unknown" : j.previouslyCorrect;
  return { ...j, citedUrls: cited, previouslyCorrect };
}

export function deriveStatus(claim: Claim, judgment: Judgment | null, confidence: Level): VerificationStatus {
  if (!claim.needsVerification) return "stable";
  if (!judgment || judgment.support === "insufficient") return "unverified";
  if (judgment.support === "supports") return confidence === "low" ? "unverified" : "current";
  if (judgment.support === "partially") return "partially_supported";
  // contradicts
  if (confidence === "low") return "unverified";
  // Outdated only when dated evidence shows the claim was once correct. A newer value alone is not enough.
  return judgment.previouslyCorrect === "yes" ? "potentially_outdated" : "contradicted";
}

export function assessClaim(
  claim: Claim,
  evidence: Evidence[],
  rawJudgment: Judgment | null,
  checkedAt: string,
): ClaimResult {
  const judgment = rawJudgment ? sanitizeJudgment(rawJudgment, evidence) : null;
  const confidence = computeConfidence(evidence, judgment);
  const side = judgment?.support === "contradicts" ? "contradicts" : "supports";
  return {
    claim,
    evidence,
    judgment,
    confidence: claim.needsVerification ? confidence : "high",
    independentSources: independentOrigins(evidence, side),
    status: deriveStatus(claim, judgment, confidence),
    checkedAt,
  };
}

export const STATUS_ORDER: VerificationStatus[] = [
  "contradicted",
  "potentially_outdated",
  "partially_supported",
  "unverified",
  "current",
  "stable",
];

export function summarize(results: ClaimResult[]): ReportSummary {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<VerificationStatus, number>;
  results.forEach((r) => counts[r.status]++);
  const checkable = results.length - counts.stable;
  const problems = counts.contradicted + counts.potentially_outdated;
  let headline = `${counts.current} of ${checkable} checkable claims hold up today`;
  if (checkable === 0) headline = "No time-sensitive claims needed checking";
  else if (problems > 0) headline += ` — ${problems} need${problems === 1 ? "s" : ""} attention`;
  return { total: results.length, checkable, counts, headline };
}
