import { ExternalLink } from "lucide-react";
import type { ClaimResult } from "@/lib/freshcheck/types";
import { CATEGORY_LABEL, LEVEL_LABEL, TIER_LABEL } from "@/lib/freshcheck/labels";
import { StatusBadge } from "./StatusBadge";

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

export function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ClaimCard({ result, onOpen }: { result: ClaimResult; onOpen: () => void }) {
  const { claim, judgment, evidence, status } = result;
  const cited = evidence.filter((e) => judgment?.citedUrls.includes(e.url)).slice(0, 3);
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={status} />
        <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[claim.category]}</span>
      </div>
      <p className="mt-4 font-mono text-[0.95rem] leading-relaxed text-foreground">“{claim.text}”</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {judgment?.explanation ?? (status === "stable" ? "Not likely to change over time, so no search was run." : "No usable evidence was found.")}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Meta label="Freshness risk" value={LEVEL_LABEL[claim.freshnessRisk]} />
        <Meta label="Confidence" value={status === "stable" ? "—" : LEVEL_LABEL[result.confidence]} />
        <Meta label="Independent sources" value={status === "stable" ? "—" : String(result.independentSources)} />
      </dl>
      {cited.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {cited.map((e) => (
            <li key={e.url} className="flex items-center gap-2 text-sm">
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <a href={e.url} target="_blank" rel="noreferrer" className="truncate text-primary underline-offset-2 hover:underline">{e.domain}</a>
              <span className="shrink-0 text-xs text-muted-foreground">· {TIER_LABEL[e.tier]}{e.publishedDate ? ` · ${e.publishedDate}` : " · undated"}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Checked {formatTime(result.checkedAt)}</span>
        <button onClick={onOpen} className="text-sm font-medium text-primary hover:underline">Details →</button>
      </div>
    </article>
  );
}
