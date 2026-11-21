import type { Evidence, SourceTier } from "./types";
import type { z } from "zod";
import type { judgmentSchema } from "./schemas";

// Explicit publisher curation. Unknown publishers never inherit authority from their TLD.
const PUBLISHERS: Record<string, SourceTier> = {
  "react.dev": 1, "nodejs.org": 1, "typescriptlang.org": 1, "python.org": 1,
  "openai.com": 1, "anthropic.com": 1, "ai.google.dev": 1, "developers.google.com": 1,
  "microsoft.com": 1, "apple.com": 1, "aws.amazon.com": 1, "cloudflare.com": 1,
  "legislation.gov.uk": 1, "congress.gov": 1, "bls.gov": 1, "census.gov": 1,
  "who.int": 2, "worldbank.org": 2, "oecd.org": 2, "un.org": 2,
  "reuters.com": 3, "apnews.com": 3, "bbc.com": 3, "bbc.co.uk": 3,
};
export function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (!url.hostname.includes('.') || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}
export function publisherTier(domain: string): SourceTier {
  for (const [publisher, tier] of Object.entries(PUBLISHERS)) {
    if (domain === publisher || domain.endsWith(`.${publisher}`)) return tier;
  }
  return 4;
}
export function evidenceFromSearch(row: { url: string; title: string; content: string; score: number; published_date?: string | null }, retrievedAt: string): Evidence | null {
  const url = safeWebUrl(row.url);
  if (!url) return null;
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const tier = publisherTier(domain);
  return {
    url, domain, title: row.title.slice(0, 500), tier,
    // A search hit is not yet verified evidence. The judge must quote it.
    relevance: 0, originKey: tier <= 2 ? domain : "unresolved-origin",
    publishedDate: row.published_date && !Number.isNaN(Date.parse(row.published_date)) ? row.published_date : null,
    snippet: row.content.slice(0, 6000), stance: "neutral", historical: false, retrievedAt,
  };
}
type SourceAssessment = z.infer<typeof judgmentSchema>["sources"][number];
const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();
const hasQuote = (text: string, quote: string | null) => Boolean(quote && normalize(quote).length >= 30 && normalize(text).includes(normalize(quote)));

/** Accept only evidence-linked assertions; unknown provenance collapses instead of inflating independence. */
export function applySourceAssessments(evidence: Evidence[], sources: SourceAssessment[], assessedAt: string): Evidence[] {
  return evidence.map((e) => {
    const source = sources.find((s) => s.url === e.url);
    if (!source || !hasQuote(e.snippet, source.quote)) return e;
    let originKey = e.originKey;
    const origin = source.originUrl ? safeWebUrl(source.originUrl) : null;
    if (origin && e.snippet.includes(source.originUrl ?? "")) originKey = new URL(origin).hostname.replace(/^www\./, "");
    const date = source.historicalDate;
    const validHistoricalDate = Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && date < assessedAt.slice(0, 10) && (e.snippet.includes(date) || e.publishedDate?.startsWith(date)));
    const historical = validHistoricalDate && hasQuote(e.snippet, source.historicalQuote);
    return { ...e, originKey, relevance: source.relevance, stance: historical ? "neutral" : source.stance, historical };
  });
}