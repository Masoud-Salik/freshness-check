// Demo data only. Fictional products/companies so nothing here asserts real-world facts.
import { assessClaim, summarize } from "./score";
import type { Claim, Evidence, Judgment, Report } from "./types";

const NOW = "2026-11-16T16:00:00Z";
const c = (o: Partial<Claim> & Pick<Claim, "id" | "text" | "category">): Claim => ({
  isFactual: true, timeSensitive: true, freshnessRisk: "high", needsVerification: true, ...o,
});
const e = (o: Partial<Evidence> & Pick<Evidence, "url" | "title" | "domain">): Evidence => ({
  tier: 1, relevance: 0.9, originKey: o.domain, publishedDate: null, snippet: "", stance: "supports",
  historical: false, retrievedAt: NOW, ...o,
});
const j = (o: Partial<Judgment> & Pick<Judgment, "explanation" | "citedUrls">): Judgment => ({
  support: "supports", currentValue: null, whatChanged: null, previouslyCorrect: "unknown", uncertain: null, ...o,
});

export interface Sample { id: string; label: string; text: string; build: () => Report }

function report(id: string, items: ReturnType<typeof assessClaim>[]): Report {
  return { id, assessedAt: NOW, answerDate: null, results: items, summary: summarize(items), durationMs: 18400, demo: true, errors: [] };
}

const mixedText = `To get started, install fetchkit 3.2, which is the latest release. Call the /v1/orders endpoint to list orders. Acme Cloud's Starter plan costs $20 per month and includes 50 GB of storage. Acme's CEO is Dana Ruiz. Under the 2024 Northland Data Act, companies must report breaches within 72 hours. Remember that water boils at 100°C at sea level. Honestly, fetchkit is the nicest HTTP library around.`;

const mixed = (): Report => {
  const ev1 = [
    e({ url: "https://fetchkit.dev/changelog", title: "fetchkit changelog", domain: "fetchkit.dev", publishedDate: "2026-10-02", stance: "contradicts", snippet: "4.0.0 (2026-10-02): new streaming API. 3.2.0 (2025-03-11)…" }),
    e({ url: "https://registry.example/pkg/fetchkit", title: "fetchkit — package registry", domain: "registry.example", tier: 2, publishedDate: "2026-10-02", stance: "contradicts", snippet: "Latest version: 4.0.1" }),
    e({ url: "https://fetchkit.dev/changelog#3.2.0", title: "fetchkit 3.2.0 release notes", domain: "fetchkit.dev", publishedDate: "2025-03-11", stance: "neutral", historical: true, snippet: "3.2.0 released 2025-03-11 (latest at the time)." }),
  ];
  const ev2 = [
    e({ url: "https://docs.acme.example/api/orders", title: "Orders API reference", domain: "docs.acme.example", publishedDate: "2026-08-20", stance: "supports", snippet: "GET /v1/orders — list orders. /v2/orders is in beta." }),
    e({ url: "https://devblog.example/acme-orders", title: "Using Acme's orders API", domain: "devblog.example", tier: 4, originKey: "docs.acme.example", publishedDate: "2026-09-01", stance: "supports", snippet: "Per Acme's docs, GET /v1/orders lists orders." }),
  ];
  const ev3 = [
    e({ url: "https://acme.example/pricing", title: "Acme Cloud pricing", domain: "acme.example", stance: "neutral", publishedDate: null, snippet: "Starter — $20/mo · 25 GB storage" }),
  ];
  const ev4 = [
    e({ url: "https://acme.example/about/leadership", title: "Leadership — Acme", domain: "acme.example", stance: "contradicts", publishedDate: "2026-07-01", snippet: "Chief Executive Officer: Sam Okafor" }),
    e({ url: "https://wire.example/acme-names-okafor", title: "Acme names Sam Okafor CEO", domain: "wire.example", tier: 3, stance: "contradicts", publishedDate: "2026-06-28", snippet: "…Okafor succeeds Dana Ruiz, who led the company since 2019." }),
    e({ url: "https://news-mirror.example/acme-ceo", title: "Acme gets new CEO", domain: "news-mirror.example", tier: 4, originKey: "wire.example", stance: "contradicts", publishedDate: "2026-06-29", snippet: "Reprinted from Wire: Okafor succeeds Ruiz…" }),
    e({ url: "https://acme.example/press/2019-ruiz", title: "Acme appoints Dana Ruiz as CEO (2019)", domain: "acme.example", stance: "neutral", historical: true, publishedDate: "2019-04-02", snippet: "Acme today appointed Dana Ruiz as Chief Executive Officer." }),
  ];
  const ev5 = [
    e({ url: "https://forum.example/thread/991", title: "Breach deadlines?", domain: "forum.example", tier: 4, relevance: 0.6, stance: "contradicts", snippet: "I think it's 48 hours now?" }),
  ];
  const a = [
    assessClaim(c({ id: "1", text: "fetchkit 3.2 is the latest release.", category: "api_versions", sourceTypeHint: "Official changelog / package registry" }), ev1,
      j({ support: "contradicts", currentValue: "4.0.1", whatChanged: "Major version 4.0 shipped in October 2026.", previouslyCorrect: "yes", explanation: "The official changelog and the package registry both list 4.x as the current version. The dated 3.2.0 release notes show 3.2 was the latest in March 2025, so the claim was once true.", citedUrls: [ev1[0].url, ev1[1].url, ev1[2].url] }), NOW),
    assessClaim(c({ id: "2", text: "The /v1/orders endpoint lists orders.", category: "api_versions", freshnessRisk: "medium" }), ev2,
      j({ support: "supports", explanation: "The official API reference documents GET /v1/orders. The blog post repeats the same docs, so it is not counted as a second independent source.", uncertain: "A /v2 endpoint is in beta and may replace v1 later.", citedUrls: [ev2[0].url, ev2[1].url] }), NOW),
    assessClaim(c({ id: "3", text: "Acme Cloud's Starter plan costs $20 per month and includes 50 GB of storage.", category: "prices" }), ev3,
      j({ support: "partially", currentValue: "$20/mo, 25 GB", whatChanged: "The price matches; the storage figure does not.", explanation: "The vendor's pricing page confirms $20/month but lists 25 GB, not 50 GB. Nothing shows 50 GB was ever offered, so we don't call it outdated.", uncertain: "The pricing page has no date.", citedUrls: [ev3[0].url] }), NOW),
    assessClaim(c({ id: "4", text: "Acme's CEO is Dana Ruiz.", category: "companies_leadership" }), ev4,
      j({ support: "contradicts", currentValue: "Sam Okafor", whatChanged: "Leadership changed in June 2026.", previouslyCorrect: "yes", explanation: "The company's leadership page and a wire report name Sam Okafor. A 2019 company press release confirms Dana Ruiz was CEO before. The mirror site reprints the wire story and is not counted separately.", citedUrls: ev4.map((x) => x.url) }), NOW),
    assessClaim(c({ id: "5", text: "Under the 2024 Northland Data Act, companies must report breaches within 72 hours.", category: "laws_regulations", freshnessRisk: "medium", sourceTypeHint: "Government legislation site" }), ev5,
      j({ support: "contradicts", explanation: "The only result found is a forum post that guesses a different deadline. That isn't strong enough to judge either way.", uncertain: "No official source for the Act was found.", citedUrls: [ev5[0].url] }), NOW),
    assessClaim(c({ id: "6", text: "Water boils at 100°C at sea level.", category: "science", timeSensitive: false, freshnessRisk: "low", needsVerification: false }), [], null, NOW),
  ];
  return report("demo-mixed", a);
};

const apiText = `fetchkit 3.2 is the latest version. Use the /v1/orders endpoint to list orders.`;
const api = (): Report => {
  const r = mixed();
  return report("demo-api", r.results.slice(0, 2));
};

const companyText = `Acme's CEO is Dana Ruiz. Acme Cloud's Starter plan costs $20 per month and includes 50 GB of storage.`;
const company = (): Report => {
  const r = mixed();
  return report("demo-company", [r.results[3], r.results[2]]);
};

export const SAMPLES: Sample[] = [
  { id: "mixed", label: "Mixed answer", text: mixedText, build: mixed },
  { id: "api", label: "Developer docs", text: apiText, build: api },
  { id: "company", label: "Company facts", text: companyText, build: company },
];
