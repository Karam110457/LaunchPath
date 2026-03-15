# CLAUDE.md — LaunchPath

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check (tsc --noEmit)

## Database
- Always use **Supabase MCP** (`mcp__claude_ai_Supabase`) for the LaunchPath project when making schema changes, running queries, or inspecting tables
- Never write raw SQL in application code — use the Supabase JS client
- Every new table must have RLS policies — never bypass with service role unless explicitly asked
- Don't use `service_role` key in client-side code

## UI & Styling
- **Design language:** Match the agents page style — rounded cards, orange-to-purple gradient accent (`#FF8C00` → `#9D50BB`), hover lift with `-translate-y-1`, subtle shadows
- **Always support both light and dark mode.** Use `dark:` Tailwind variants. Test that new UI looks correct in both themes
- **Component library:** Use existing shadcn components from `src/components/ui/` — don't create new base components when one already exists (Card, Button, Badge, Dialog, Tabs, Select, etc.)
- **Custom components to reuse:** ShineBorder (gradient animated border), TextShimmer, BackgroundGrid, VoicePoweredOrb
- **Animations:** Reuse existing animation classes from `globals.css` before creating new ones. Keep animations CSS-only (`opacity` + `transform`) for performance — no JS-driven loading animations
- **Loading skeletons:** Every new page/route MUST have a `loading.tsx` that mirrors the page layout with `<Skeleton>` shapes. Follow the existing pattern:
  - Page container: `animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both`
  - Card/item grids: add `stagger-enter` class — children auto-stagger at 50ms intervals (capped at 8)
  - Skeleton shapes should match the real content dimensions (don't use generic rectangles)
  - Mobile: animations auto-shorten via existing media query (no extra work needed)
  - `prefers-reduced-motion`: already handled globally
- **Gradient utilities:** Use the existing CSS classes — `.gradient-text`, `.gradient-accent-bg`, `.gradient-accent-border`, `.gradient-glow-ring`
- **Icons:** Use `lucide-react` — don't install other icon libraries
- **When modifying existing pages:** Match the surrounding style, spacing, and patterns already in use on that page

## External Services
- Before integrating or updating code for external services (OpenRouter, Composio, VAPI, Twilio, WhatsApp, MCP SDK, etc.), **always check the latest documentation** via WebSearch to ensure correct API usage
- OpenRouter for user-facing agents, direct Anthropic for internal/platform AI
- Env vars for secrets — never hardcode API keys

## Code Patterns
- Next.js 15 App Router — use server components by default, `"use client"` only when needed
- Vercel AI SDK v6: `inputSchema` (not `parameters`), `stopWhen: stepCountIs(N)` (not `maxSteps`), `chunk.output` (not `chunk.result`)
- Zod v4: `z.record()` requires 2 args — `z.record(z.string(), z.unknown())`
- Don't touch Mastra workflow steps marked with `FUTURE` comments — those are placeholders by design

## Debugging
When encountering errors:
1. Read the actual error and relevant source files — don't guess
2. Form 3-5 hypotheses for root cause
3. Investigate each systematically — trace through the code, eliminate candidates
4. Identify the exact problematic code before writing any fix
5. Explain the root cause, then show the fix alongside what it replaces
6. Verify the fix doesn't break other things (run build/typecheck if in doubt)
