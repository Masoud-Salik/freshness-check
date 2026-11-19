import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronRight, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClaimCard } from "@/components/freshcheck/ClaimCard";
import { ClaimDetail } from "@/components/freshcheck/ClaimDetail";
import { STATUS_STYLE } from "@/components/freshcheck/StatusBadge";
import { SAMPLES } from "@/lib/freshcheck/demo";
import { STATUS_LABEL } from "@/lib/freshcheck/labels";
import { STATUS_ORDER, summarize } from "@/lib/freshcheck/score";
import { extractClaims, verifyClaims, getFreshCheckStatus } from "@/lib/freshcheck/server";
import type { Claim, ClaimResult, Report, VerificationStatus } from "@/lib/freshcheck/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FreshCheck AI — Is this AI answer still current?" },
    { name: "description", content: "Check changing facts in AI answers against current web evidence, claim by claim." },
    { property: "og:title", content: "FreshCheck AI — Is this AI answer still current?" },
    { property: "og:description", content: "A transparent freshness check with evidence for every verdict." },
  ] }),
  component: Checker,
});

const MAX = 6000;
const MAX_SELECTED = 8;

function Checker() {
  const [text, setText] = useState("");
  const [answerDate, setAnswerDate] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");
  const [busy, setBusy] = useState<"extract" | "verify" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [open, setOpen] = useState<ClaimResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFreshCheckStatus().then((status) => setReady(status.searchConfigured && status.analysisConfigured)).catch(() => setReady(false));
  }, []);

  const sample = SAMPLES.find((item) => item.text === text);
  const selectedClaims = useMemo(() => claims.filter((claim) => selected.includes(claim.id)), [claims, selected]);
  const checkable = claims.filter((claim) => claim.needsVerification).length;

  const reset = () => {
    setClaims([]);
    setSelected([]);
    setReport(null);
    setNotice(null);
    setFilter("all");
  };

  const runExtract = async () => {
    reset();
    setBusy("extract");
    try {
      const response = await extractClaims({ data: { text, answerDate: answerDate || null } });
      setClaims(response.claims);
      const defaults = response.claims.filter((claim) => claim.needsVerification).slice(0, MAX_SELECTED).map((claim) => claim.id);
      setSelected(defaults);
      if (!defaults.length) setNotice("No time-sensitive factual claims were identified. You can still review the extracted claims below.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We couldn't extract claims. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const runVerify = async () => {
    if (!selectedClaims.length) return;
    setBusy("verify");
    setReport(null);
    setNotice(null);
    setFilter("all");
    try {
      const result = await verifyClaims({ data: {
        text, answerDate: answerDate || null, claims: selectedClaims,
      } });
      const skipped = claims.filter((claim) => !selected.includes(claim.id)).map((claim) => ({
        claim, evidence: [], judgment: null, confidence: "low" as const,
        independentSources: 0, status: (claim.needsVerification ? "skipped" : "stable") as VerificationStatus, checkedAt: result.assessedAt,
      }));
      const combined = { ...result, results: [...result.results, ...skipped] };
      combined.summary = summarize(combined.results);
      setReport(combined);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The check couldn't be completed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => checked
      ? current.length < MAX_SELECTED ? [...current, id] : current
      : current.filter((value) => value !== id));
  };

  const shown = report?.results.filter((item) => filter === "all" || item.status === filter) ?? [];

  return (
    <main className="mx-auto max-w-6xl px-5">
      <section className="pt-12 pb-8 sm:pt-16">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Freshness intelligence for AI answers</p>
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Live beta</span>
        </div>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium leading-tight text-foreground sm:text-5xl">Is this AI answer still true today?</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Paste an answer. Review the factual claims. Check the ones that matter, then inspect the evidence behind every finding.</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <span className={cn("size-2 rounded-full", ready === true ? "bg-status-current" : ready === false ? "bg-status-outdated" : "bg-muted-foreground/40")} />
          {ready === true ? "Live search and analysis are configured" : ready === false ? "Live services need configuration in Lovable Secrets" : "Checking service configuration…"}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="answer-input" className="text-sm font-medium text-foreground">Paste an AI-generated answer</label>
          <span className="text-xs text-muted-foreground">Maximum {MAX.toLocaleString()} characters</span>
        </div>
        <Textarea id="answer-input" value={text}
          onChange={(event) => { setText(event.target.value.slice(0, MAX)); reset(); }}
          placeholder="Paste an answer from ChatGPT, Claude, Gemini, or another AI assistant…"
          className="min-h-56 resize-y border-0 bg-transparent p-1 text-[0.95rem] leading-relaxed shadow-none focus-visible:ring-0"
          aria-describedby="answer-help" />
        <div id="answer-help" className="mt-3 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <label htmlFor="answer-date" className="block text-xs font-medium text-muted-foreground">When was the original answer written? <span className="font-normal">(optional)</span></label>
            <input id="answer-date" type="date" value={answerDate} onChange={(event) => { setAnswerDate(event.target.value); reset(); }}
              className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <p className="text-xs text-muted-foreground">Useful for judging whether a fact changed after the answer was written.</p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{text.length.toLocaleString()}/{MAX.toLocaleString()}</span>
            <Button onClick={runExtract} disabled={!!busy || text.trim().length < 20}>
              {busy === "extract" ? <><LoaderCircle className="mr-2 size-4 animate-spin" /> Finding claims…</> : "Find claims"}
              {busy !== "extract" && <ChevronRight className="ml-2 size-4" />}
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="mr-1 text-xs text-muted-foreground">Try a sample:</span>
          {SAMPLES.map((item) => (
            <button key={item.id} onClick={() => { setText(item.text); reset(); }}
              className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors",
                sample?.id === item.id ? "border-primary bg-accent text-accent-foreground" : "border-border text-foreground hover:bg-secondary")}>
              {item.label}
            </button>
          ))}
          {sample && <button onClick={() => { const demo = sample.build(); setReport(demo); setClaims([]); setSelected([]); setNotice(null); }}
            className="ml-auto text-xs text-primary underline-offset-2 hover:underline">Preview sample report</button>}
        </div>
      </section>

      {notice && <div role="status" className="mt-5 flex gap-3 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{notice}</span>
      </div>}

      {claims.length > 0 && !report && (
        <section className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Step 2 · Review</p>
              <h2 className="mt-1 text-2xl font-medium">Choose what to verify</h2>
              <p className="mt-1 text-sm text-muted-foreground">We found {claims.length} claims. Uncheck anything you don't want searched.</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{selected.length}/{MAX_SELECTED} selected</span>
          </div>
          <div className="mt-5 space-y-2">
            {claims.map((claim) => {
              const checked = selected.includes(claim.id);
              return <label key={claim.id} className={cn("flex cursor-pointer gap-3 rounded-md border p-3 transition-colors",
                checked ? "border-primary/50 bg-accent/40" : "border-border hover:bg-secondary/50",
                !claim.needsVerification && "opacity-75")}>
                <input type="checkbox" checked={checked} onChange={(event) => toggle(claim.id, event.target.checked)}
                  disabled={!claim.needsVerification || (!checked && selected.length >= MAX_SELECTED)}
                  className="mt-1 size-4 accent-[var(--primary)]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-relaxed text-foreground">{claim.text}</span>
                  <span className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{claim.category.replaceAll("_", " ")}</span>
                    <span>·</span><span>{claim.needsVerification ? claim.freshnessRisk + " freshness risk" : "Stable / opinion — no search needed"}</span>
                  </span>
                </span>
                {!claim.needsVerification && <span className="text-xs text-muted-foreground">Auto-skipped</span>}
              </label>;
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Up to {MAX_SELECTED} claims can be checked per run. Stable facts and opinions are not searched.</p>
            <Button onClick={runVerify} disabled={!!busy || selected.length === 0}>
              {busy === "verify" ? <><LoaderCircle className="mr-2 size-4 animate-spin" /> Checking evidence…</> : <><ShieldCheck className="mr-2 size-4" /> Verify {selected.length} {selected.length === 1 ? "claim" : "claims"}</>}
            </Button>
          </div>
        </section>
      )}

      <div ref={resultsRef} className="scroll-mt-6">
        {report && (
          <section className="mt-10">
            {report.demo && <div className="rounded-md border border-status-outdated/30 bg-status-outdated-bg px-4 py-2.5 text-sm text-status-outdated">Sample report · illustrative evidence only · not a live verification</div>}
            <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{report.demo ? "Example result" : "Verification report"}</p>
                <h2 className="mt-1 text-3xl font-medium text-foreground">{report.summary.headline}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{report.summary.total} claims · {report.summary.checkable} checked · {report.summary.counts.stable} stable · {report.summary.counts.skipped} skipped · {(report.durationMs / 1000).toFixed(1)}s</p>
              </div>
              <Button variant="outline" onClick={() => { reset(); setText(""); }}><RotateCcw className="mr-2 size-4" /> New check</Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["current","potentially_outdated","contradicted","unverified"] as VerificationStatus[]).map((status) => {
                const Icon = STATUS_STYLE[status].Icon;
                return <button key={status} onClick={() => setFilter(filter === status ? "all" : status)}
                  className={cn("rounded-md border p-3 text-left transition-colors", filter === status ? "border-primary bg-accent/50" : "border-border bg-card hover:bg-secondary/50")}>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" />{STATUS_LABEL[status]}</span>
                  <span className="mt-1 block text-2xl font-medium tabular-nums">{report.summary.counts[status]}</span>
                </button>;
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All {report.summary.total}</FilterChip>
              {STATUS_ORDER.filter((status) => report.summary.counts[status] > 0).map((status) => (
                <FilterChip key={status} active={filter === status} onClick={() => setFilter(status)}>
                  {STATUS_LABEL[status]} {report.summary.counts[status]}
                </FilterChip>
              ))}
            </div>
            <div className="mt-5 grid gap-4">
              {shown.map((result) => <ClaimCard key={result.claim.id} result={result} onOpen={() => setOpen(result)} />)}
            </div>
            {report.errors.length > 0 && <p className="mt-4 text-xs text-muted-foreground">Some claims could not be checked. Those results are marked unverified; no unsupported verdict was assigned.</p>}
          </section>
        )}
      </div>
      {!claims.length && !report && (
        <section className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
          {[["01","Extract","Break the answer into atomic, checkable claims."],["02","Review","Choose which claims deserve a search."],["03","Verify","Compare evidence, dates and independent origins."]].map(([number,title,description]) => (
            <div key={number}><span className="font-mono text-xs text-primary">{number}</span><h3 className="mt-1 text-lg font-medium">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
          ))}
        </section>
      )}
      <ClaimDetail result={open} onClose={() => setOpen(null)} />
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-pressed={active}
    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
      active ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-secondary")}>{children}</button>;
}
