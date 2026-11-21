import type { Claim } from "./types";

export function searchPlan(claim: Claim, assessedAt: string, answerDate: string | null) {
  if (!claim.needsVerification) return [];
  const year = assessedAt.slice(0, 4);
  const hints: Record<Claim["category"], string> = {
    technology: "official documentation", api_versions: "official latest release version",
    ai_models: "official model documentation", prices: "official current pricing",
    companies_leadership: "official company leadership", news: "latest reporting",
    laws_regulations: "official legislation current law", statistics: "official latest statistics",
    science: "primary research", history: "primary historical source",
  };
  const base = claim.text.slice(0, 350);
  return [
    { query: `${base} ${hints[claim.category]} ${year}`, topic: claim.category === "news" ? "news" as const : "general" as const },
    { query: `${base} historical archive changelog ${answerDate ?? "previous dates"}`, topic: "general" as const },
  ];
}