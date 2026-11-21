import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatBifrost, bifrostConfigured } from "./bifrost.server";
import { searchTavily } from "./tavily.server";
import { VerificationError } from "./http.server";
import { answerSchema, claimSchema, extractionSchema, judgmentSchema, normalizeClaim } from "./schemas";
import { searchPlan } from "./searchPlan";
import { applySourceAssessments } from "./evidence";
import { assessClaim } from "./score";
import type { Claim, ClaimResult } from "./types";

function safeError(error: unknown) {
  return error instanceof VerificationError ? error.message : "Verification could not finish. No verdict was invented; please retry.";
}

/** Public MVP: returns configuration booleans only, never secret values or endpoint details. */
export const verificationReadiness = createServerFn({ method: "GET" }).handler(async () => ({
  tavily: Boolean(process.env['TAVILY_API_KEY']), bifrost: bifrostConfigured(),
}));

/** A bounded, fixed search lets the owner test Tavily before Bifrost exists. */
export const testTavilyConnection = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const evidence = await searchTavily("React latest release official react.dev", "general", new Date().toISOString());
    return { sources: evidence.slice(0, 3).map((e) => ({ url: e.url, title: e.title })), error: null };
  } catch (error) { return { sources: [], error: safeError(error) }; }
});

export const extractClaims = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => answerSchema.parse(input))
  .handler(async ({ data }): Promise<{ claims: Claim[]; error: string | null }> => {
    try {
      if (!process.env['TAVILY_API_KEY'] || !bifrostConfigured()) throw new VerificationError("Live checking needs both Tavily and Bifrost configured. Your answer has not been analyzed.");
      const result = await chatBifrost("extract", `Extract at most 12 small checkable claims from the provided AI answer. Do not invent or rewrite facts. text must be an exact contiguous quote from the answer. Skip requests, instructions, and pure opinions. Return {"claims":[{"id":"c1","text":"exact quote","category":"technology|api_versions|ai_models|prices|companies_leadership|news|laws_regulations|statistics|science|history","isFactual":true,"timeSensitive":true,"freshnessRisk":"low|medium|high","needsVerification":true}]}. For established science or settled history, set timeSensitive false unless the sentence expressly claims a changing/current measurement. Empty claims is allowed.`, { ...data, assessedAt: new Date().toISOString() }, extractionSchema);
      if (result.claims.some((c) => !data.text.includes(c.text))) throw new VerificationError("Claim extraction did not preserve the original answer. Please retry; no report was generated.");
      return { claims: result.claims.map((c, i) => normalizeClaim({ ...c, id: `c${i + 1}` })), error: null };
    } catch (error) { return { claims: [], error: safeError(error) }; }
  });

const claimRequest = z.object({ claim: claimSchema, answerDate: answerSchema.shape.answerDate });
export const verifyClaim = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => claimRequest.parse(input))
  .handler(async ({ data }): Promise<ClaimResult> => {
    const claim = normalizeClaim(data.claim);
    const checkedAt = new Date().toISOString();
    if (!claim.needsVerification) return assessClaim(claim, [], null, checkedAt);
    let evidence: ClaimResult["evidence"] = [];
    try {
      const plans = searchPlan(claim, checkedAt, data.answerDate);
      // Two searches maximum, sequential; every claim is its own short server request.
      for (const plan of plans) {
        const hits = await searchTavily(plan.query, plan.topic, checkedAt);
        for (const hit of hits) if (!evidence.some((e) => e.url === hit.url)) evidence.push(hit);
      }
      if (!evidence.length) throw new VerificationError("No usable web evidence was found for this claim.");
      const raw = await chatBifrost("judge", `Judge the claim against ONLY supplied web snippets as of assessedAt. Do not use memory as evidence. A recently published page is not automatically current. A historical value is not evidence of the current value. Return exactly {"support":"supports|partially|contradicts|insufficient","currentValue":null,"whatChanged":null,"previouslyCorrect":"yes|no|unknown","uncertain":null,"explanation":"short explanation","citedUrls":["supplied URL"],"sources":[{"url":"supplied URL","stance":"supports|contradicts|neutral","relevance":0.0,"quote":"exact snippet quote at least 30 characters","historicalDate":null,"historicalQuote":null,"originUrl":null}]}. Use strings instead of null when known. Each stance needs an exact quote, not a paraphrase. previouslyCorrect=yes requires a cited historical source that explicitly documents the claim's former value with a past YYYY-MM-DD date and historicalQuote, at least 30 characters, copied exactly. Never infer previous correctness just because a different current value exists. Only set originUrl if a URL explicitly appears in the snippet identifying its original source; otherwise null. Use insufficient when snippets cannot establish a current verdict. Do not produce confidence, status or scores.`, { claim, answerDate: data.answerDate, assessedAt: checkedAt, evidence: evidence.map((e) => ({ url: e.url, title: e.title, snippet: e.snippet, publishedDate: e.publishedDate })) }, judgmentSchema);
      evidence = applySourceAssessments(evidence, raw.sources, checkedAt);
      const { sources: _sources, ...judgment } = raw;
      return assessClaim(claim, evidence, judgment, checkedAt);
    } catch (error) {
      return { ...assessClaim(claim, evidence, null, checkedAt), error: safeError(error) };
    }
  });