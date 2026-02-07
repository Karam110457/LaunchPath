# LaunchPath

Production-ready Next.js 15 (App Router) SaaS starter with TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Stack

- **Next.js 15+** — App Router, React Server Components, Turbopack
- **TypeScript** — Strict mode
- **Tailwind CSS v4** — Utility-first styling
- **shadcn/ui** — Accessible components (New York style)
- **Supabase** — Auth, database, realtime (project created via Supabase MCP)

## Supabase project

- **Project:** LaunchPath  
- **Region:** eu-west-1  
- **URL:** `https://zpsavoyotyqlnepqkwkj.supabase.co`

Create a `.env.local` from `.env.example` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

`.env.local` is pre-filled with the LaunchPath project values for local development.

## Getting started

```bash
# Install dependencies (already done if you scaffolded)
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── (auth)/          # Auth route group: login, signup
│   ├── dashboard/        # Protected app area (add auth checks)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/               # shadcn components
├── lib/
│   ├── api/             # validate.ts, rate-limit.ts
│   ├── auth/            # guards.ts (requireAuth, requireRole)
│   ├── env/             # Zod env schema and getClientEnv
│   ├── security/        # headers, logger, csrf, honeypot, file-upload, ssrf
│   ├── supabase/
│   └── utils.ts
├── types/
│   └── database.ts       # Generated Supabase types (update via CLI)
└── middleware.ts        # Auth session refresh
```

## Auth

- **Client:** `import { createClient } from "@/lib/supabase/client"`
- **Server:** `import { createClient } from "@/lib/supabase/server"` (async)
- Middleware refreshes the session on each request.

Configure providers and sign-in/sign-up in the [Supabase Dashboard](https://supabase.com/dashboard) → Authentication.

## Database types

`src/types/database.ts` is generated from your Supabase schema. Regenerate after schema changes:

```bash
npx supabase gen types typescript --project-id zpsavoyotyqlnepqkwkj > src/types/database.ts
```

Or use the Supabase MCP “generate typescript types” action.

## Security controls implemented

- **Secrets & env:** Zod-validated env (server + client); startup check in `instrumentation.ts`; only `NEXT_PUBLIC_*` exposed to client.
- **Headers:** CSP, X-Frame-Options, HSTS (prod), X-Content-Type-Options, Referrer-Policy, Permissions-Policy (see `src/lib/security/headers.ts`).
- **Auth:** Protected dashboard via `requireAuth()`; role helpers `requireRole()` / `hasRole()` in `src/lib/auth/guards.ts`.
- **API:** Request validation (Zod), rate limiting (in-memory; use Vercel KV/Upstash for scale), consistent error responses (`src/lib/api/validate.ts`, `rate-limit.ts`).
- **Data:** Central logger with redaction for tokens/passwords (`src/lib/security/logger.ts`).
- **Abuse:** Honeypot helper for forms (`src/lib/security/honeypot.ts`); SSRF-safe URL validation (`src/lib/security/ssrf.ts`); file validation (`src/lib/security/file-upload.ts`).
- **CI:** `.github/workflows/ci.yml` runs typecheck, lint, audit, and build.

Full details: `docs/security/security-hardening-report.md`. Checklist: `docs/security/security-checklist.md`.

### How to verify

1. **Env:** Remove or invalidate `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, run `npm run dev` — app should fail at startup with a clear validation error.
2. **Headers:** Open DevTools → Network → select a document request → check Response Headers for `content-security-policy`, `x-frame-options`, `strict-transport-security` (on production).
3. **Auth:** Open `/dashboard` while logged out — should redirect to `/login`.
4. **API:** `GET /api/me` without auth — 401. With auth — 200 and user payload.
5. **Security checks:** Run `npm run security-check` (typecheck + lint + audit).

## Scripts

| Command    | Description          |
| ---------- | -------------------- |
| `npm run dev`   | Start dev server     |
| `npm run build` | Production build    |
| `npm run start` | Start production    |
| `npm run lint`  | Run ESLint          |
| `npm run typecheck` | TypeScript check |
| `npm run audit` | Dependency audit    |
| `npm run security-check` | typecheck + lint + audit |

## Adding shadcn components

```bash
npx shadcn@latest add <component-name>
```

## Deploy

- **Vercel:** Connect the repo; add the same env vars as in `.env.local` (no `NEXT_PUBLIC_*` secrets in client code).
- Ensure Supabase URL is allowed in your Supabase project’s allowed redirect/site URLs for auth.
