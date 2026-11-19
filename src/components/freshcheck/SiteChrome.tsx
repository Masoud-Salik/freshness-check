import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ScanSearch } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="FreshCheck AI home">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScanSearch className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">FreshCheck</span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-primary">AI freshness intelligence</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 text-sm">
          <Link to="/" activeOptions={{ exact: true }}
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Checker
          </Link>
          <Link to="/methodology"
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Methodology
          </Link>
          <a href="https://github.com/Masoud-Salik/freshness-check" target="_blank" rel="noreferrer"
            className="ml-1 inline-flex items-center gap-1 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            GitHub <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>FreshCheck AI · Evidence before confidence.</p>
        <p>Freshness is not the same as correctness. Always inspect the linked sources.</p>
      </div>
    </footer>
  );
}
