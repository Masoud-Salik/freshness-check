<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## FreshCheck AI architecture rules

- One TypeScript app (TanStack Start); no separate Python backend. Why: Lovable can't run FastAPI, and one deployment means no CORS and secrets stay server-side.
- All LLM calls go through one Bifrost helper (OpenAI-compatible endpoint), with the model name taken from config per task. Why: models can be swapped without code changes, and Bifrost is a required integration.
- Web evidence comes only from Tavily via one client module. Why: a single, auditable research path.
- Status, confidence and independence are computed by deterministic code in `src/lib/freshcheck/score.ts`, never by the LLM; changes there need tests in `score.test.ts`. Why: verdicts must be transparent and testable.
- "Potentially outdated" needs a current contradiction plus a cited historical source; a newer value alone gives "contradicted". Why: we never assume a claim was once true.
- Independence counts distinct `originKey`s (provenance), not URLs or domains; quality tier comes from a curated publisher map, not the TLD. Why: syndicated copies must not inflate confidence.
- Pipeline is orchestrated from the client: one server call to extract claims, then one call per claim (search + judge), about 3 at a time. Why: it keeps each edge request short and well under per-request subrequest and time limits (exact limits to be confirmed when Bifrost goes live).
- Keep provider transport in server-only Bifrost/Tavily modules and expose serializable results through verification.functions.ts. Why: credentials and provider error bodies must never reach browsers.
- Require exact retrieved quotes for source stances and dated quoted historical evidence; collapse unresolved third-party provenance to one origin. Why: snippet limitations must not create unsupported confidence or historical proof.
- Use a client-side three-slot claim pool with ordered partial results and a readiness check before extraction. Why: integration failures stay honest without discarding successful claims or running the whole pipeline in one request.
