import type {
  Claim,
  ClaimResult,
  Evidence,
  Judgment,
  Level,
  ReportSummary,
  VerificationStatus,
} from "./types";

/** Minimum relevance for a source to influence a verdict or confidence. */
export const RELEVANCE_MIN = 0.5;

const usable = (e: Evidence) =>
  Number.isFinite(e.relevance) && e.relevance >= RELEVANCE_MIN;

export function independentOrigins(evidence: Evidence[], stance: Evidence["stance"]): number {
  return new Set(
    evidence
      .filter((e) => usable(e) && e.stance === stance && e.originKey.trim())
      .map((e) => e.originKey.toLowerCase()),
  ).size;
}

/** Return the strongest publisher tier per independent origin, not per URL. */
function bestTierByOrigin(evidence: Evidence[], stance: Evidence["stance"]): number[] {
  const tiers = new Map<string, number>();
  for (const item of evidence) {
    if (!usable(item) || item.stance !== stance || !item.originKey.trim()) continue;
    const origin = item.originKey.toLowerCase();
    tiers.set(origin, Math.min(tiers.get(origin) ?? 5, item.tier));
  }
  return [...tiers.values()];
}

function baseConfidence(evidence: Evidence[], stance: Evidence["stance"]): Level {
  const tiers = bestTierByOrigin(evidence, stance);
  if (tiers.length === 0) return "low";
  const hasPrimaryOrInstitutional = tiers.some((tier) => tier <= 2);
  const hasReputablePublisher = tiers.some((tier) => tier <= 3);

  // Multiple low-quality pages are not a substitute for reliable evidence.
  if (tiers.length >= 2 && hasPrimaryOrInstitutional) return "high";
  if (hasPrimaryOrInstitutional || (tiers.length >= 2 && hasReputablePublisher)) return "medium";
  return "low";
}

/**
 * Confidence is deterministic and conservative:
 * - quality and independence both matter;
 * - tier-4 sources alone always remain low;
 * - strong opposing primary/institutional evidence prevents a high-confidence verdict;
 * - partial findings need credible evidence on both sides.
 */
export function computeConfidence(evidence: Evidence[], judgment: Judgment | null): Level {
  if (!judgment || judgment.support === "insufficient") return "low";

  if (judgment.support === "partially") {
    const supports = baseConfidence(evidence, "supports");
    const contradicts = baseConfidence(evidence, "contradicts");
    if (supports === "low" || contradicts === "low") return "low";
    return supports === "high" && contradicts === "high" ? "high" : "medium";
  }

  const side: Evidence["stance"] = judgment.support === "contradicts" ? "contradicts" : "supports";
  const other: Evidence["stance"] = side === "supports" ? "contradicts" : "supports";
  const confidence = baseConfidence(evidence, side);
  const opposition = bestTierByOrigin(evidence, other);

  if (opposition.some((tier) => tier <= 2)) return "low";
  if (opposition.length > 0 && confidence === "high") return "medium";
  return confidence;
}

function isDatedBefore(date: string | null, reference: string): boolean {
  if (!date) return false;
  const parsed = Date.parse(date);
  const boundary = Date.parse(reference);
  return Number.isFinite(parsed) && Number.isFinite(boundary) && parsed < boundary;
}

/**
 * Allow only citations that exist, are relevant, and actually support the model's
 * selected finding. Historical truth is derived in code, never accepted from prose.
 */
export function sanitizeJudgment(
  judgment: Judgment,
  evidence: Evidence[],
  answerDate: string | null = null,
  checkedAt = new Date().toISOString(),
): Judgment {
  const evidenceByUrl = new Map(evidence.map((item) => [item.url, item]));
  const citedUrls = [...new Set(judgment.citedUrls)].filter((url) => {
    const item = evidenceByUrl.get(url);
    return Boolean(item && usable(item));
  });
  const cited = citedUrls.map((url) => evidenceByUrl.get(url)!);

  const hasSupport = cited.some((item) => item.stance === "supports");
  const hasContradiction = cited.some((item) => item.stance === "contradicts");
  const alignmentIsValid =
    judgment.support === "insufficient" ||
    (judgment.support === "supports" && hasSupport) ||
    (judgment.support === "contradicts" && hasContradiction) ||
    (judgment.support === "partially" && hasSupport && hasContradiction);

  if (!alignmentIsValid || cited.length === 0) {
    return {
      ...judgment,
      support: "insufficient",
      previouslyCorrect: "unknown",
      citedUrls: [],
    };
  }

  const historicalSupport = cited.some(
    (item) =>
      item.historical &&
      item.stance === "supports" &&
      isDatedBefore(item.publishedDate, answerDate ?? checkedAt),
  );

  const historicalContradiction = cited.some(
    (item) =>
      item.historical &&
      item.stance === "contradicts" &&
      isDatedBefore(item.publishedDate, answerDate ?? checkedAt),
  );

  const newerContradiction = cited.some((item) => {
    if (item.stance !== "contradicts" || !item.publishedDate) return false;
    const boundary = answerDate ?? (
      cited
        .filter((candidate) => candidate.historical && candidate.stance === "supports" && candidate.publishedDate)
        .map((candidate) => candidate.publishedDate!)
        .sort()[0] ?? ""
    );
    return boundary ? Date.parse(item.publishedDate) > Date.parse(boundary) : false;
  });

  let previouslyCorrect: Judgment["previouslyCorrect"] = "unknown";
  if (historicalSupport && newerContradiction) previouslyCorrect = "yes";
  else if (historicalContradiction && !historicalSupport) previouslyCorrect = "no";

  return { ...judgment, previouslyCorrect, citedUrls };
}

export function deriveStatus(
  claim: Claim,
  judgment: Judgment | null,
  confidence: Level,
): VerificationStatus {
  if (!claim.needsVerification) return "stable";
  if (!judgment || judgment.support === "insufficient" || confidence === "low") return "unverified";
  if (judgment.support === "supports") return "current";
  if (judgment.support === "partially") return "partially_supported";
  return judgment.previouslyCorrect === "yes" ? "potentially_outdated" : "contradicted";
}

export function assessClaim(
  claim: Claim,
  evidence: Evidence[],
  rawJudgment: Judgment | null,
  checkedAt: string,
  answerDate: string | null = null,
): ClaimResult {
  const judgment = rawJudgment
    ? sanitizeJudgment(rawJudgment, evidence, answerDate, checkedAt)
    : null;
  // Crucially, uncited and irrelevant pages cannot inflate confidence.
  const citedEvidence = judgment
    ? judgment.citedUrls.map((url) => evidence.find((item) => item.url === url)!).filter(Boolean)
    : [];
  const confidence = computeConfidence(citedEvidence, judgment);
  const side: Evidence["stance"] = judgment?.support === "contradicts" ? "contradicts" : "supports";
  const independentSources =
    judgment?.support === "partially"
      ? new Set(citedEvidence.map((item) => item.originKey.toLowerCase())).size
      : independentOrigins(citedEvidence, side);

  return {
    claim,
    evidence,
    judgment,
    confidence: claim.needsVerification ? confidence : "high",
    independentSources,
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
  "skipped",
];

export function summarize(results: ClaimResult[]): ReportSummary {
  const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0])) as Record<VerificationStatus, number>;
  results.forEach((result) => counts[result.status]++);
  const checkable = results.length - counts.stable - counts.skipped;
  const problems = counts.contradicted + counts.potentially_outdated;
  let headline = `${counts.current} of ${checkable} checked claims are supported today`;
  if (checkable === 0) headline = "No claims needed verification";
  else if (problems > 0) headline += ` — ${problems} need${problems === 1 ? "s" : ""} attention`;
  return { total: results.length, checkable, counts, headline };
}
