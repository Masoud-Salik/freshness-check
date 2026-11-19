import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClaimCard } from "@/components/freshcheck/ClaimCard";
import { ClaimDetail } from "@/components/freshcheck/ClaimDetail";
import { STATUS_STYLE } from "@/components/freshcheck/StatusBadge";
import { SAMPLES } from "@/lib/freshcheck/demo";
import { STATUS_LABEL } from "@/lib/freshcheck/labels";
import { STATUS_ORDER } from "@/lib/freshcheck/score";
import type { ClaimResult, Report, VerificationStatus } from "@/lib/freshcheck/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreshCheck AI — Is this AI answer still current?" },
      { name: "description", content: "Paste an AI-generated answer and see which facts still hold up today, with sources for every verdict." },
      { property: "og:title", content: "FreshCheck AI — Is this AI answer still current?" },
      { property: "og:description", content: "Claim-by-claim freshness checks for AI answers, with evidence and source links." },
    ],
  }),
  component: Checker,
});

const MAX = 6000;
const MAX_CLAIMS = 12;
const STEPS = ["Finding factual claims", "Sorting stable facts from time-sensitive ones", "Searching current sources", "Weighing the evidence"];

function Checker() {
  const [text, setText] = useState("");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [answerDate, setAnswerDate] = useState("");
  const [step, setStep] = useState(-1);
  const [report, setReport] = useState<Report | null>(null);
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<ClaimResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const running = step >= 0;
  const sample = SAMPLES.find((s) => s.id === sampleId && s.text === text);

  useEffect(() => {
    if (!running) return;
    if (step < STEPS.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 650);
      return () => clearTimeout(t);
    }
    setReport(sample ? sample.build() : null);
    setNotice(sample ? null : "Live checking isn't connected yet. Your text has not been checked, and no report has been generated. Try a sample to explore the report format.");
    setStep(-1);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    return undefined;
  }, [step, running, sample]);

  const run = () => {
    setReport(null);
    setNotice(null);
    setFilter("all");
    if (!sample) {
      setNotice("Live checking is not available yet. Your answer has not been submitted or analyzed. Choose a sample to preview a clearly labeled example report.");
      return;
    }
    setStep(0);
  };

  const chooseSample = (id: string, sampleText: string) => {
    setText(sampleText);
    setSampleId(id);
    setReport(null);
    setNotice(null);
  };

  const shown = report?.results.filter((r) => filter === "all" || r.status === filter) ?? [];

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pt-12 pb-8 sm:pt-16">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Freshness check for AI answers</p>
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">MVP preview</span>
        </div>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium leading-tight text-foreground sm:text-5xl">
          Can you still trust the facts in this answer today?
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Paste an AI-generated answer. FreshCheck is designed to separate stable facts from claims that may have changed, then show the evidence behind each finding.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="answer-input" className="text-sm font-medium text-foreground">AI-generated answer</label>
          <span className="text-xs text-muted-foreground">Up to {MAX.toLocaleString()} characters · {MAX_CLAIMS} claims per check</span>
        </div>
        <Textarea
          id="answer-input"
          value={text}
          onChange={(e) => { setText(e.target.value.slice(0, MAX)); setSampleId(null); setReport(null); setNotice(null); }}
          placeholder="Paste an answer from ChatGPT, Claude, Gemini, or another AI assistant…"
          className="min-h-56 resize-y border-0 bg-transparent p-1 text-[0.95rem] leading-relaxed shadow-none focus-visible:ring-0"
          aria-label="AI-generated answer"
          aria-describedby="answer-help"
        />
        <div id="answer-help" className="mt-3 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <label htmlFor="answer-date" className="block text-xs font-medium text-muted-foreground">When was the original answer generated? <span className="font-normal">(optional)</span></label>
            <input id="answer-date" type="date" value={answerDate} onChange={(e) => setAnswerDate(e.target.value)}
              className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <p className="text-xs text-muted-foreground">Helps distinguish information that was once accurate from information that may never have been accurate.</p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className={cn("font-mono text-xs tabular-nums", text.length >= MAX ? "text-status-outdated" : "text-muted-foreground")}>{text.length.toLocaleString()}/{MAX.toLocaleString()}</span>
            <Button onClick={run} disabled={running || text.trim().length < 20}>
              {running ? "Preparing preview…" : "Check freshness"}
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="mr-1 text-xs text-muted-foreground">Explore an example:</span>
          {SAMPLES.map((s) => (
            <button key={s.id} onClick={() => chooseSample(s.id, s.text)}
              aria-pressed={sampleId === s.id}
              className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors",
                sampleId === s.id ? "border-primary bg-accent text-accent-foreground" : "border-border text-foreground hover:bg-secondary")}>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {running && (
        <ol className="mt-6 space-y-2 rounded-lg border border-border bg-card p-4" aria-live="polite" aria-label="Demo analysis progress">
          <li className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Previewing the report flow — sample data only</li>
          {STEPS.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-3 text-sm", i < step ? "text-foreground" : i === step ? "text-primary" : "text-muted-foreground/60")}>
              <span className={cn("size-1.5 rounded-full", i <= step ? "bg-primary" : "bg-border", i === step && "animate-pulse")} />
              {s}
            </li>
          ))}
        </ol>
      )}

      <div ref={resultsRef} className="scroll-mt-6">
        {report && (
          <section className="mt-10">
            <div className="rounded-md border border-status-outdated/30 bg-status-outdated-bg px-4 py-2.5 text-sm text-status-outdated">
              Sample report with illustrative evidence. It is not a live search and must not be treated as a current verification.
            </div>
            <h2 className="mt-6 text-3xl font-medium text-foreground">{report.summary.headline}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {report.summary.total} claims found · {report.summary.checkable} checked in this example · {report.summary.counts.stable} stable, not searched
              {answerDate ? ` · Original answer: ${answerDate}` : ""}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All {report.summary.total}</FilterChip>
              {STATUS_ORDER.filter((s) => report.summary.counts[s] > 0).map((s) => {
                const { Icon } = STATUS_STYLE[s];
                return (
                  <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
                    <Icon className={cn("size-3.5", STATUS_STYLE[s].cls.split(" ")[1])} aria-hidden />
                    {STATUS_LABEL[s]} {report.summary.counts[s]}
                  </FilterChip>
                );
              })}
            </div>
            <div className="mt-6 grid gap-4">
              {shown.map((r) => <ClaimCard key={r.claim.id} result={r} onOpen={() => setOpen(r)} />)}
            </div>
          </section>
        )}
        {notice && (
          <div role="status" className="mt-6 rounded-md border border-border bg-muted px-4 py-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Live verification is not connected yet</p>
            <p className="mt-1">{notice}</p>
          </div>
        )}
      </div>

      {!report && !running && (
        <>
          <section className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-4">
            {[
              ["1", "Extract", "Split the answer into small claims that can each be checked."],
              ["2", "Triage", "Stable facts and opinions are skipped. Time-sensitive claims go on."],
              ["3", "Research", "Look for relevant, authoritative and independent current sources."],
              ["4", "Judge", "Compare claims with evidence, cite sources, and explain uncertainty."],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span className="font-mono text-xs text-primary">{n}</span>
                <h3 className="mt-1 text-lg font-medium text-foreground">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </section>
          <section className="mt-10 rounded-lg border border-border bg-secondary/40 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Build status</p>
                <h2 className="mt-1 text-lg font-medium text-foreground">A transparent preview, not a fake live checker</h2>
              </div>
              <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">Integrations pending</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatusItem title="Interface & sample reports" detail="Ready for product review" complete />
              <StatusItem title="Tavily web evidence" detail="Connect server-side API key" />
              <StatusItem title="AI claim analysis" detail="Connect the Bifrost gateway" />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Your pasted text stays in this page in the current preview. No live search or AI analysis happens until the backend integrations are configured.</p>
          </section>
        </>
      )}

      <ClaimDetail result={open} onClose={() => setOpen(null)} />
    </main>
  );
}

function StatusItem({ title, detail, complete = false }: { title: string; detail: string; complete?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", complete ? "bg-status-current" : "bg-muted-foreground/40")} />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <p className="mt-1 pl-4 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
        active ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-secondary")}>
      {children}
    </button>
  );
}
