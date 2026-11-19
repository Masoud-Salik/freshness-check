import type { ClaimCategory, Level, SourceTier, VerificationStatus } from "./types";

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  current: "Current and supported",
  partially_supported: "Partially supported",
  potentially_outdated: "Potentially outdated",
  contradicted: "Contradicted",
  unverified: "Unverified",
  stable: "Stable — not searched",
  skipped: "Skipped by you",
};

export const STATUS_SHORT: Record<VerificationStatus, string> = {
  current: "Supported",
  partially_supported: "Partial",
  potentially_outdated: "Outdated?",
  contradicted: "Contradicted",
  unverified: "Unverified",
  stable: "Stable",
  skipped: "Skipped",
};

export const CATEGORY_LABEL: Record<ClaimCategory, string> = {
  technology: "Technology",
  api_versions: "APIs & versions",
  ai_models: "AI models",
  prices: "Prices & availability",
  companies_leadership: "Companies & leadership",
  news: "News & events",
  laws_regulations: "Laws & regulations",
  statistics: "Statistics",
  science: "Science",
  history: "History",
};

export const LEVEL_LABEL: Record<Level, string> = { low: "Low", medium: "Medium", high: "High" };
export const TIER_LABEL: Record<SourceTier, string> = {
  1: "Official / primary",
  2: "Institutional",
  3: "Reputable news",
  4: "Other / unclassified",
};
