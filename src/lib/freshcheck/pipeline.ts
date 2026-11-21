import { assessClaim, summarize } from "./score";
import type { Claim, ClaimResult, Report } from "./types";

export async function buildLiveReport(
  claims: Claim[], answerDate: string | null,
  verify: (claim: Claim) => Promise<ClaimResult>,
  onProgress: (completed: number, total: number) => void,
  startedAt: number,
): Promise<Report> {
  const results: ClaimResult[] = [];
  let next = 0;
  let completed = 0;
  const assessedAt = new Date().toISOString();
  await Promise.all(Array.from({ length: Math.min(3, claims.length) }, async () => {
    while (next < claims.length) {
      const claim = claims[next++];
      if (!claim) return;
      let result: ClaimResult;
      try { result = await verify(claim); }
      catch { result = { ...assessClaim(claim, [], null, assessedAt), error: "This claim could not be checked. Please retry." }; }
      results.push(result);
      onProgress(++completed, claims.length);
    }
  }));
  const ordered = claims.flatMap((c) => results.filter((r) => r.claim.id === c.id));
  return {
    id: crypto.randomUUID(), assessedAt, answerDate, results: ordered,
    summary: summarize(ordered), durationMs: Date.now() - startedAt, demo: false,
    errors: ordered.flatMap((r) => r.error ? [r.error] : []),
  };
}