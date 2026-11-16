import type { ClaimResult } from "@/lib/freshcheck/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TIER_LABEL } from "@/lib/freshcheck/labels";
import { StatusBadge } from "./StatusBadge";
import { formatTime } from "./ClaimCard";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-4">
      <h3 className="mb-1.5 font-sans text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

const PRIOR = { yes: "Yes. Dated sources show it was once correct.", no: "No. Sources suggest it was never correct.", unknown: "Not established. No dated evidence either way." };

export function ClaimDetail({ result, onClose }: { result: ClaimResult | null; onClose: () => void }) {
  return (
    <Sheet open={!!result} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {result && (
          <>
            <SheetHeader className="text-left">
              <StatusBadge status={result.status} className="w-fit" />
              <SheetTitle className="font-serif text-xl">Why this verdict</SheetTitle>
              <SheetDescription>Checked {formatTime(result.checkedAt)}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              <Section title="What the answer said"><p className="font-mono">“{result.claim.text}”</p></Section>
              <Section title="What current sources say">{result.judgment?.currentValue ?? (result.judgment?.support === "supports" ? "Same as the answer." : "No clear current value found.")}</Section>
              <Section title="What changed">{result.judgment?.whatChanged ?? "Nothing identified."}</Section>
              {result.status !== "stable" && <Section title="Was it ever correct?">{PRIOR[result.judgment?.previouslyCorrect ?? "unknown"]}</Section>}
              <Section title="What remains uncertain">{result.judgment?.uncertain ?? "Nothing flagged."}</Section>
              <Section title="Reasoning">{result.judgment?.explanation ?? "No search was needed for this claim."}</Section>
              {result.evidence.length > 0 && (
                <Section title={`All sources (${result.evidence.length})`}>
                  <ul className="space-y-3">
                    {result.evidence.map((e) => (
                      <li key={e.url} className="rounded-md border border-border p-3">
                        <a href={e.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{e.title}</a>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {e.domain} · {TIER_LABEL[e.tier]} · {e.publishedDate ?? "undated"} · {e.stance}
                          {e.historical && " · historical"}
                          {e.originKey !== e.domain && ` · repeats ${e.originKey}`}
                          {e.relevance < 0.5 && " · low relevance"}
                        </p>
                        {e.snippet && <p className="mt-2 text-sm text-muted-foreground">{e.snippet}</p>}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
