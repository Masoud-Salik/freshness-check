import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold text-foreground">FreshCheck</span>
          <span className="font-mono text-xs uppercase tracking-widest text-primary">AI</span>
        </Link>
        <nav className="flex gap-5 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
            Checker
          </Link>
          <Link to="/methodology" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-4xl px-5 py-8 text-xs text-muted-foreground">
        FreshCheck AI checks whether facts are still current. It doesn't guarantee they're true. Always open the linked sources.
      </div>
    </footer>
  );
}
