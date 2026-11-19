// Shared, serializable report contract for the UI and the server-side verification pipeline.

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

export type SourceTier = 1 | 2 | 3 | 4;

export interface Evidence {
  url: string;
  title: string;
  domain: string;
  /** 1 = primary/official; 2 = institutional; 3 = established newsroom; 4 = unclassified. */
  tier: SourceTier;
  /** Claim-specific relevance, 0–1. */
  relevance: number;
  /** Original publisher/provenance; syndicated copies should share one originKey. */
  originKey: string;
  publishedDate: string | null;
  snippet: string;
  stance: "supports" | "contradicts" | "neutral";
  /** The page is explicitly describing a past state, not merely being old. */
  historical: boolean;
  retrievedAt: string;
}

export type Support = "supports" | "partially" | "contradicts" | "insufficient";

export interface Judgment {
  support: Support;
  currentValue: string | null;
  whatChanged: string | null;
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
  | "stable"
  | "skipped";

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
  assessedAt: string;
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
