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
const STEPS = ["Finding factual claims", "Sorting stable facts from time-sensitive ones", "Searching current sources", "Weighing the evidence"];

function Checker() {
  const [text, setText] = useState("");
  const [sampleId, setSampleId] = useState<string | null>(null);
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
    setNotice(sample ? null : "Live checking isn't connected yet, so only the sample answers produce a report right now. Your text hasn't been checked.");
    setStep(-1);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    return undefined;
  }, [step, running, sample]);

  const run = () => { setReport(null); setNotice(null); setFilter("all"); setStep(0); };
  const shown = report?.results.filter((r) => filter === "all" || r.status === filter) ?? [];

  return (
    <main className="mx-auto max-w-4xl px-5">
      <section className="pt-14 pb-8 sm:pt-20">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Freshness check for AI answers</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-medium leading-tight text-foreground sm:text-5xl">
          Can you still trust the facts in this answer today?
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Paste an AI-generated answer. We split it into claims, skip the ones that don't change, and check the rest against current sources.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          placeholder="Paste an AI-generated answer here…"
          className="min-h-48 resize-y border-0 bg-transparent p-1 text-[0.95rem] leading-relaxed shadow-none focus-visible:ring-0"
          aria-label="AI-generated answer"
        />
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Try a sample:</span>
            {SAMPLES.map((s) => (
              <button key={s.id} onClick={() => { setText(s.text); setSampleId(s.id); }}
                className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-secondary">
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">{text.length}/{MAX}</span>
            <Button onClick={run} disabled={running || text.trim().length < 20}>
              {running ? "Checking…" : "Check Freshness"}
            </Button>
          </div>
        </div>
      </section>

      {running && (
        <ol className="mt-6 space-y-2" aria-live="polite">
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
              Demo report with example data. Live checking with real sources isn't connected yet.
            </div>
            <h2 className="mt-6 text-3xl font-medium text-foreground">{report.summary.headline}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {report.summary.total} claims found · {report.summary.checkable} checked against sources · {report.summary.counts.stable} stable, not searched
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
          <p className="mt-6 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">{notice}</p>
        )}
      </div>

      {!report && !running && (
        <section className="mt-16 grid gap-6 border-t border-border pt-10 sm:grid-cols-4">
          {[
            ["1", "Extract", "Split the answer into small claims that can each be checked."],
            ["2", "Triage", "Stable facts and opinions are skipped. Time-sensitive claims go on."],
            ["3", "Research", "Look for official and independent current sources."],
            ["4", "Judge", "Compare each claim to the evidence, cite it, and say what's uncertain."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span className="font-mono text-xs text-primary">{n}</span>
              <h3 className="mt-1 text-lg font-medium text-foreground">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>
      )}

      <ClaimDetail result={open} onClose={() => setOpen(null)} />
    </main>
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
