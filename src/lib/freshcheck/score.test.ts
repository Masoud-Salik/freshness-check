import { describe, expect, it } from "vitest";
import { assessClaim, computeConfidence, deriveStatus, independentOrigins, sanitizeJudgment, summarize } from "./score";
import type { Claim, Evidence, Judgment } from "./types";

const claim: Claim = {
  id: "c",
  text: "The current release is version 3.",
  category: "api_versions",
  isFactual: true,
  timeSensitive: true,
  freshnessRisk: "high",
  needsVerification: true,
};

let fixtureCounter = 0;
const ev = (overrides: Partial<Evidence> = {}): Evidence => {
  fixtureCounter += 1;
  const domain = overrides.domain ?? "primary.example";
  return {
    url: overrides.url ?? `https://${domain}/source-${fixtureCounter}`,
    title: "Evidence page",
    domain,
    tier: 1,
    relevance: 0.9,
    originKey: domain,
    publishedDate: "2026-11-10",
    snippet: "Evidence excerpt.",
    stance: "supports",
    historical: false,
    retrievedAt: "2026-11-19T00:00:00.000Z",
    ...overrides,
  };
};

const judgment = (overrides: Partial<Judgment> = {}, citedUrls: string[] = []): Judgment => ({
  support: "supports",
  currentValue: null,
  whatChanged: null,
  previouslyCorrect: "unknown",
  uncertain: null,
  explanation: "The source addresses the claim.",
  citedUrls,
  ...overrides,
});

describe("source independence", () => {
  it("counts syndicated copies as one origin", () => {
    const evidence = [
      ev({ domain: "news-a.example", originKey: "wire.example" }),
      ev({ domain: "news-b.example", originKey: "wire.example" }),
    ];
    expect(independentOrigins(evidence, "supports")).toBe(1);
  });

  it("ignores irrelevant pages", () => {
    expect(independentOrigins([ev({ relevance: 0.2 })], "supports")).toBe(0);
  });
});

describe("evidence confidence", () => {
  it("requires independent sources and at least one tier-1/2 publisher for high confidence", () => {
    const evidence = [
      ev({ originKey: "official.example", tier: 1 }),
      ev({ originKey: "publisher.example", tier: 3 }),
    ];
    expect(computeConfidence(evidence, judgment({}, evidence.map((item) => item.url)))).toBe("high");
  });

  it("does not promote multiple tier-4 domains above low confidence", () => {
    const evidence = [
      ev({ domain: "blog-a.example", tier: 4 }),
      ev({ domain: "blog-b.example", tier: 4 }),
      ev({ domain: "blog-c.example", tier: 4 }),
    ];
    expect(computeConfidence(evidence, judgment({}, evidence.map((item) => item.url)))).toBe("low");
  });

  it("caps confidence when a strong primary source disagrees", () => {
    const evidence = [
      ev({ domain: "primary-a.example", tier: 1, stance: "supports" }),
      ev({ domain: "primary-b.example", tier: 2, stance: "supports" }),
      ev({ domain: "official-counter.example", tier: 1, stance: "contradicts" }),
    ];
    expect(computeConfidence(evidence, judgment({}, evidence.slice(0, 2).map((item) => item.url)))).toBe("low");
  });

  it("does not use uncited high-quality sources to inflate confidence", () => {
    const cited = ev({ domain: "unknown.example", tier: 4 });
    const uncited = ev({ domain: "official.example", tier: 1 });
    const result = assessClaim(
      claim,
      [cited, uncited],
      judgment({}, [cited.url]),
      "2026-11-19T00:00:00.000Z",
    );
    expect(result.confidence).toBe("low");
  });
});

describe("citation and status safety", () => {
  it("rejects citations that do not support a support verdict", () => {
    const contradiction = ev({ stance: "contradicts" });
    const clean = sanitizeJudgment(
      judgment({ support: "supports" }, [contradiction.url]),
      [contradiction],
    );
    expect(clean.support).toBe("insufficient");
    expect(clean.citedUrls).toEqual([]);
  });

  it("does not label a low-confidence partial result as partially supported", () => {
    const evidence = [ev({ tier: 4, stance: "supports" }), ev({ tier: 4, stance: "contradicts" })];
    const result = assessClaim(
      claim,
      evidence,
      judgment({ support: "partially" }, evidence.map((item) => item.url)),
      "2026-11-19T00:00:00.000Z",
    );
    expect(result.status).toBe("unverified");
  });

  it("historical support does not count as current opposition to an outdated verdict", () => {
    const historical = ev({ domain: "old.example", stance: "supports", historical: true, publishedDate: "2025-01-01" });
    const current = ev({ domain: "new.example", stance: "contradicts", publishedDate: "2026-10-01" });
    const verdict = judgment({ support: "contradicts" }, [historical.url, current.url]);
    expect(computeConfidence([historical, current], verdict)).toBe("high");
  });

  it("requires dated historical support and later contradiction for outdated", () => {
    const historical = ev({
      domain: "archive.example",
      stance: "supports",
      historical: true,
      publishedDate: "2025-02-10",
    });
    const current = ev({
      domain: "official.example",
      stance: "contradicts",
      publishedDate: "2026-09-10",
    });
    const result = assessClaim(
      claim,
      [historical, current],
      judgment({
        support: "contradicts",
        previouslyCorrect: "yes",
        currentValue: "version 4",
      }, [historical.url, current.url]),
      "2026-11-19T00:00:00.000Z",
      "2025-06-01",
    );
    expect(result.status).toBe("potentially_outdated");
  });

  it("requires historical evidence to predate the supplied answer date", () => {
    const historical = ev({
      stance: "supports",
      historical: true,
      publishedDate: "2026-08-10",
    });
    const current = ev({
      domain: "official.example",
      stance: "contradicts",
      publishedDate: "2026-10-10",
    });
    const result = assessClaim(
      claim,
      [historical, current],
      judgment({ support: "contradicts", previouslyCorrect: "yes" }, [historical.url, current.url]),
      "2026-11-19T00:00:00.000Z",
      "2026-05-01",
    );
    expect(result.status).toBe("contradicted");
  });

  it("a newer value without historical proof is contradicted, not outdated", () => {
    const current = [
      ev({ domain: "official-a.example", stance: "contradicts" }),
      ev({ domain: "official-b.example", stance: "contradicts", tier: 2 }),
    ];
    const result = assessClaim(
      claim,
      current,
      judgment({ support: "contradicts", previouslyCorrect: "yes" }, current.map((item) => item.url)),
      "2026-11-19T00:00:00.000Z",
    );
    expect(result.status).toBe("contradicted");
  });

  it("low-confidence contradiction is unverified", () => {
    const evidence = [ev({ tier: 4, stance: "contradicts" })];
    expect(
      assessClaim(claim, evidence, judgment({ support: "contradicts" }, [evidence[0]!.url]), "2026-11-19T00:00:00.000Z").status,
    ).toBe("unverified");
  });

  it("uncited judgments become unverified", () => {
    const evidence = [ev()];
    const result = assessClaim(
      claim,
      evidence,
      judgment({}, ["https://not-retrieved.example/fake"]),
      "2026-11-19T00:00:00.000Z",
    );
    expect(result.status).toBe("unverified");
  });
});

it("summary excludes stable and skipped claims from the checked count", () => {
  const stable = assessClaim({ ...claim, needsVerification: false }, [], null, "2026-11-19T00:00:00.000Z");
  const skipped = {
    claim,
    evidence: [],
    judgment: null,
    confidence: "low" as const,
    independentSources: 0,
    status: "skipped" as const,
    checkedAt: "2026-11-19T00:00:00.000Z",
  };
  const unverified = assessClaim(claim, [], null, "2026-11-19T00:00:00.000Z");
  const summary = summarize([stable, skipped, unverified]);
  expect(summary.checkable).toBe(1);
  expect(summary.counts.skipped).toBe(1);
  expect(summary.counts.unverified).toBe(1);
});
