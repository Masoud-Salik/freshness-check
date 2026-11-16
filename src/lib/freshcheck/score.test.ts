import { describe, expect, it } from "vitest";
import { assessClaim, computeConfidence, deriveStatus, independentOrigins, summarize } from "./score";
import type { Claim, Evidence, Judgment } from "./types";

const claim: Claim = {
  id: "c", text: "x", category: "api_versions", isFactual: true, timeSensitive: true,
  freshnessRisk: "high", needsVerification: true,
};
const ev = (o: Partial<Evidence>): Evidence => ({
  url: o.url ?? `https://${o.domain ?? "a.com"}/${Math.random()}`, title: "", domain: "a.com", tier: 1,
  relevance: 0.9, originKey: o.domain ?? "a.com", publishedDate: null, snippet: "", stance: "supports",
  historical: false, retrievedAt: "", ...o,
});
const j = (o: Partial<Judgment>, urls: string[]): Judgment => ({
  support: "supports", currentValue: null, whatChanged: null, previouslyCorrect: "unknown",
  uncertain: null, explanation: "", citedUrls: urls, ...o,
});

describe("independence", () => {
  it("two pages repeating the same origin count once", () => {
    const e = [ev({ domain: "news1.com", originKey: "vendor.com" }), ev({ domain: "news2.com", originKey: "vendor.com" })];
    expect(independentOrigins(e, "supports")).toBe(1);
  });
  it("irrelevant pages do not count", () => {
    expect(independentOrigins([ev({ relevance: 0.2 })], "supports")).toBe(0);
  });
});

describe("confidence", () => {
  it("high needs 2 independent origins incl. tier 1-2", () => {
    const e = [ev({ originKey: "a" }), ev({ originKey: "b", tier: 3 })];
    expect(computeConfidence(e, j({}, []))).toBe("high");
  });
  it("syndicated copies of one tier-4 page stay low", () => {
    const e = [ev({ originKey: "blog", tier: 4 }), ev({ originKey: "blog", tier: 4 })];
    expect(computeConfidence(e, j({}, []))).toBe("low");
  });
});

describe("status", () => {
  it("stable claims skip verification", () => {
    expect(deriveStatus({ ...claim, needsVerification: false }, null, "low")).toBe("stable");
  });
  it("newer value without historical proof is contradicted, not outdated", () => {
    const e = [ev({ stance: "contradicts", originKey: "a" }), ev({ stance: "contradicts", originKey: "b" })];
    const r = assessClaim(claim, e, j({ support: "contradicts", previouslyCorrect: "yes" }, [e[0].url]), "");
    expect(r.status).toBe("contradicted");
  });
  it("contradiction + cited historical evidence is potentially outdated", () => {
    const e = [
      ev({ stance: "contradicts", originKey: "a" }), ev({ stance: "contradicts", originKey: "b" }),
      ev({ stance: "neutral", originKey: "a", historical: true }),
    ];
    const r = assessClaim(claim, e, j({ support: "contradicts", previouslyCorrect: "yes" }, [e[0].url, e[2].url]), "");
    expect(r.status).toBe("potentially_outdated");
  });
  it("low-confidence contradiction is unverified", () => {
    const e = [ev({ stance: "contradicts", tier: 4 })];
    expect(assessClaim(claim, e, j({ support: "contradicts" }, [e[0].url]), "").status).toBe("unverified");
  });
  it("uncited verdict becomes unverified", () => {
    expect(assessClaim(claim, [ev({})], j({}, ["https://made-up.com"]), "").status).toBe("unverified");
  });
});

it("summary excludes stable claims from checkable count", () => {
  const s = summarize([
    assessClaim({ ...claim, needsVerification: false }, [], null, ""),
    assessClaim(claim, [], null, ""),
  ]);
  expect(s.checkable).toBe(1);
  expect(s.counts.unverified).toBe(1);
});
