import { z } from "zod";
import type { Claim, Level } from "./types";

export const MAX_CHARACTERS = 6000;
export const MAX_CLAIMS = 12;
export const claimSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().min(1).max(MAX_CHARACTERS),
  category: z.enum(["technology", "api_versions", "ai_models", "prices", "companies_leadership", "news", "laws_regulations", "statistics", "science", "history"]),
  isFactual: z.boolean(), timeSensitive: z.boolean(),
  freshnessRisk: z.enum(["low", "medium", "high"]),
  needsVerification: z.boolean(),
});
export const answerSchema = z.object({
  text: z.string().trim().min(20).max(MAX_CHARACTERS),
  answerDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s && d.valueOf() <= Date.now();
  }, "Use a valid date that is not in the future").nullable(),
});
export const extractionSchema = z.object({ claims: z.array(claimSchema).max(MAX_CLAIMS) });
export const judgmentSchema = z.object({
  support: z.enum(["supports", "partially", "contradicts", "insufficient"]),
  currentValue: z.string().max(1500).nullable(), whatChanged: z.string().max(1500).nullable(),
  previouslyCorrect: z.enum(["yes", "no", "unknown"]),
  uncertain: z.string().max(1500).nullable(), explanation: z.string().max(3000),
  citedUrls: z.array(z.string().url()).max(10),
  sources: z.array(z.object({
    url: z.string().url(), stance: z.enum(["supports", "contradicts", "neutral"]),
    relevance: z.number().min(0).max(1),
    quote: z.string().max(3000),
    historicalDate: z.string().nullable(), historicalQuote: z.string().max(3000).nullable(),
    originUrl: z.string().url().nullable(),
  })).max(10),
});

const RISK: Record<Claim["category"], Level> = {
  technology: "medium", api_versions: "high", ai_models: "high", prices: "high",
  companies_leadership: "high", news: "high", laws_regulations: "medium", statistics: "medium",
  science: "low", history: "low",
};
/** The model selects a category; deterministic rules set risk and whether to search. */
export function normalizeClaim(claim: Claim): Claim {
  const risk = RISK[claim.category];
  const timeSensitive = claim.timeSensitive || risk !== "low";
  return { ...claim, freshnessRisk: risk, timeSensitive, needsVerification: claim.isFactual && timeSensitive };
}