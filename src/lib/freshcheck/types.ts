// Typed report contract shared by UI and (future) server pipeline.

export type ClaimCategory =
  | "technology"
  | "api_versions"
  | "ai_models"
  | "prices"
  | "companies_leadership"
  | "news"
  | "laws_regulations"
  | "statistics"
  | "science"
  | "history";

export type Level = "low" | "medium" | "high";

export interface Claim {
  id: string;
  text: string;
  category: ClaimCategory;
  isFactual: boolean;
  timeSensitive: boolean;
  freshnessRisk: Level;
  riskReason?: string;
  needsVerification: boolean;
  sourceTypeHint?: string;
}

/** Source quality tier from a curated publisher map, never inferred from TLD alone. 1 = best. */
export type SourceTier = 1 | 2 | 3 | 4;

export interface Evidence {
  url: string;
  title: string;
  domain: string;
  /** Publisher quality (who wrote it). */
  tier: SourceTier;
  /** How on-topic this page is for the claim, 0–1 (search relevance + judge check). Separate from quality. */
  relevance: number;
  /**
   * Provenance: the origin this page reports from. If a page cites/reprints another
   * source, originKey is that source's publisher; otherwise its own publisher.
   * Independence = count of distinct originKeys, not distinct URLs.
   */
  originKey: string;
  publishedDate: string | null;
  snippet: string;
  /** What this page says about the claim. */
  stance: "supports" | "contradicts" | "neutral";
  /** True when the page documents the claim's value as it stood in the past (changelog, archive, dated release notes). */
  historical: boolean;
  retrievedAt: string;
}

export type Support = "supports" | "partially" | "contradicts" | "insufficient";

export interface Judgment {
  support: Support;
  /** Value current sources report, if different. */
  currentValue: string | null;
  whatChanged: string | null;
  /** Did dated evidence show the claim's value WAS correct at some earlier point? Requires a historical citation. */
  previouslyCorrect: "yes" | "no" | "unknown";
  uncertain: string | null;
  explanation: string;
  citedUrls: string[];
}

export type VerificationStatus =
  | "current"
  | "partially_supported"
  | "potentially_outdated"
  | "contradicted"
  | "unverified"
  | "stable";

export interface ClaimResult {
  claim: Claim;
  evidence: Evidence[];
  judgment: Judgment | null;
  confidence: Level;
  independentSources: number;
  status: VerificationStatus;
  checkedAt: string;
  error?: string;
}

export interface Report {
  id: string;
  /** When FreshCheck ran the assessment. */
  assessedAt: string;
  /** When the original AI answer was produced, if the user knows it. */
  answerDate: string | null;
  results: ClaimResult[];
  summary: ReportSummary;
  durationMs: number;
  demo: boolean;
  errors: string[];
}

export interface ReportSummary {
  total: number;
  checkable: number;
  counts: Record<VerificationStatus, number>;
  headline: string;
}
