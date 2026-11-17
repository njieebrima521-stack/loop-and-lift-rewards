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

## Remake project rules
- Frontend-only demo: all state lives in `src/lib/remake/store.tsx` (React reducer + localStorage); workflow rules are pure functions in `src/lib/remake/logic.ts` with tests in `logic.test.ts` — keep business rules there, not in pages.
- Each role has its own sidebar items in `src/components/remake/nav.ts` (sidebar shows only the active workspace); below md a role-specific `BottomNav` (MOBILE_NAV) replaces the sidebar, between md and lg the sidebar is an icon rail; switching lives in the header `AccountMenu`, and sign-up picks the starting workspace — institution groups hub, processor and admin.
- Form state seeded from the store must tolerate post-mount hydration from localStorage (derive or sync in an effect), because SSR renders seed data first.
