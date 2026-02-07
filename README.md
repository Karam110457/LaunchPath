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
│   ├── supabase/
│   │   ├── client.ts     # Browser client (Client Components)
│   │   ├── server.ts     # Server client (RSC, Server Actions)
│   │   └── middleware.ts # Session refresh in middleware
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

## Scripts

| Command    | Description          |
| ---------- | -------------------- |
| `npm run dev`   | Start dev server     |
| `npm run build` | Production build    |
| `npm run start` | Start production    |
| `npm run lint`  | Run ESLint          |

## Adding shadcn components

```bash
npx shadcn@latest add <component-name>
```

## Deploy

- **Vercel:** Connect the repo; add the same env vars as in `.env.local` (no `NEXT_PUBLIC_*` secrets in client code).
- Ensure Supabase URL is allowed in your Supabase project’s allowed redirect/site URLs for auth.
