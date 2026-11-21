import { createFileRoute } from "@tanstack/react-router";
import { StatusBadge } from "@/components/freshcheck/StatusBadge";
import type { VerificationStatus } from "@/lib/freshcheck/types";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — FreshCheck AI" },
      { name: "description", content: "How FreshCheck AI separates freshness risk, evidence support and confidence, and what its limits are." },
      { property: "og:title", content: "Methodology — FreshCheck AI" },
      { property: "og:description", content: "Definitions, thresholds and limitations behind every FreshCheck verdict." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Methodology,
});

const STATUSES: [VerificationStatus, string][] = [
  ["current", "Current sources support the claim with at least medium confidence."],
  ["partially_supported", "Part of the claim matches current sources and part doesn't, or the claim is too broad."],
  ["potentially_outdated", "Current sources contradict the claim with at least medium confidence, AND dated sources show it was once correct. Even then we say “potentially”: the original answer's date is usually unknown."],
  ["contradicted", "Current sources contradict the claim with at least medium confidence, but nothing shows it was ever correct. A newer value alone doesn't prove the old one was once true."],
  ["unverified", "Evidence is missing, too weak, or conflicting. This is a normal, honest result, not a failure."],
  ["stable", "Unlikely to change over time (established science, settled history). Not searched."],
];

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 text-2xl font-medium text-foreground">{children}</h2>;
}

function Methodology() {
  return (
    <main className="mx-auto max-w-2xl px-5 pt-14 text-[0.95rem] leading-relaxed text-foreground">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">Methodology</p>
      <h1 className="mt-3 text-4xl font-medium">How a verdict is reached</h1>
      <p className="mt-4 text-muted-foreground">
        FreshCheck checks whether facts are still current. It is not a general fact-checker and it doesn't answer questions. Every verdict links to the sources it rests on.
      </p>

      <H>Three separate measures</H>
      <dl className="mt-4 space-y-4">
        <div><dt className="font-medium">Freshness risk</dt><dd className="text-muted-foreground">How likely this kind of claim is to change. It's set by category: low for science and history, medium for statistics, laws and company facts, high for versions, prices, AI models, news and leadership. It tells us whether to search, not whether the claim is right.</dd></div>
        <div><dt className="font-medium">Evidence support</dt><dd className="text-muted-foreground">Whether the sources we found support, partly support or contradict the claim, or are insufficient. A verdict must cite sources we actually retrieved. If it cites anything else, the citation is dropped and the claim becomes unverified.</dd></div>
        <div><dt className="font-medium">Verification confidence</dt><dd className="text-muted-foreground">How solid that evidence is. It's computed by fixed rules, not by the AI. <b>High</b>: at least two independent sources agree, one of them official or institutional, with no strong source disagreeing. <b>Medium</b>: one official/institutional source, or two independent lesser ones. <b>Low</b>: anything weaker.</dd></div>
      </dl>

      <H>What each status means</H>
      <ul className="mt-4 space-y-4">
        {STATUSES.map(([s, d]) => (
          <li key={s}><StatusBadge status={s} /><p className="mt-1.5 text-muted-foreground">{d}</p></li>
        ))}
      </ul>

      <H>Quality, relevance and independence are kept apart</H>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
        <li><b className="text-foreground">Quality</b> is about who published it: official/primary, institutional, reputable news, or other. We use a curated list of publishers. A web address ending in .gov or .edu alone doesn't make a source trustworthy.</li>
        <li><b className="text-foreground">Relevance</b> is about whether the page is actually about this claim. Off-topic pages are ignored however good the publisher.</li>
        <li><b className="text-foreground">Independence</b> uses explicit source attribution in retrieved snippets. Primary and institutional publishers use their own origin unless attribution identifies another source. Other pages with unresolved provenance share one unknown origin, so untraced copies cannot inflate confidence.</li>
        <li>Newer isn't automatically better. Dates help decide what is current, but a recent page can still be wrong.</li>
      </ul>

      <H>Dates</H>
      <p className="mt-4 text-muted-foreground">
        Each report records when the check ran. If you know when the original answer was written, it is recorded too. Without that date we can't say an answer was right “at the time”, which is why outdated verdicts say “potentially”.
      </p>

      <H>Overall result</H>
      <p className="mt-4 text-muted-foreground">
        We show counts for each status and one headline: how many checkable claims hold up today. We don't give a single 0–100 score, because it would blur these separate measures together.
      </p>

      <H>Limitations</H>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
        <li>Confidence levels are rule-based labels, not tested probabilities.</li>
        <li>Search can miss the best source, rank old pages highly, or find nothing for niche topics.</li>
        <li>Claims are extracted by AI and can be split or worded imperfectly.</li>
        <li>Paywalled, very new, or non-English sources are often missed.</li>
        <li>Research uses up to two Tavily searches per time-sensitive claim: current evidence and historical context. Exact quoted snippets are required before a source contributes to a verdict.</li>
        <li>Historical proof needs a past date present in the retrieved evidence and a quoted historical passage. Search snippets may omit that proof; in those cases a claim is not labeled potentially outdated.</li>
        <li>The curated publisher list is deliberately small. Unlisted publishers receive the lowest quality tier; unknown provenance is handled conservatively.</li>
      </ul>
      <p className="mt-8 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        Live checks use Tavily for web evidence and Bifrost for claim extraction and judging, with fixed rules computing statuses. Both services must be configured. Sample reports are explicitly labeled; evaluation metrics have not yet been published.
      </p>
    </main>
  );
}
