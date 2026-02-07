# LaunchPath — Threat Model

**Version:** 1.0  
**Last updated:** 2026-02-07

---

## 1. Assets

| Asset | Description | Sensitivity |
|-------|-------------|-------------|
| User accounts (Supabase Auth) | Identity, email, auth tokens | High |
| User-generated content | Data stored in Supabase (e.g. projects, settings) | Medium–High |
| API keys / env (server) | NEXT_PUBLIC_* only in client; server env for secrets | High (server-only) |
| Session cookies | Supabase auth cookies (httpOnly, SameSite) | High |

---

## 2. Trust Boundaries

- **Browser ↔ Next.js (Vercel):** Untrusted client. All input validated; auth required for protected routes and sensitive API.
- **Next.js ↔ Supabase:** Trusted (we control both). Use anon key in app; service role only in back-office or migrations if ever needed.
- **Next.js ↔ third-party APIs:** Treat as untrusted; validate responses and use SSRF-safe URL validation when fetching.

---

## 3. Threat Actors

| Actor | Goal | Relevant threats |
|-------|-----|-------------------|
| External attacker | Access accounts, exfiltrate data, abuse API | Auth bypass, IDOR, injection, SSRF |
| Automated abuse | Spam, credential stuffing, scraping | Rate limit, honeypot, bot detection |
| Malicious user | Abuse other users or org data | RLS, role checks, audit logging |
| Supply chain | Compromise via dependencies | Audit, lockfiles, CI checks |

---

## 4. Abuse Cases (and Mitigations)

| Abuse case | Mitigation |
|------------|------------|
| Access dashboard without logging in | requireAuth() in dashboard layout; 401 on /api/me |
| Access another user’s data | RLS policies scope by auth.uid(); API never returns other users’ data |
| Brute-force login | Rate limit auth endpoints; document lockout in checklist |
| Sign-up / contact form spam | Honeypot; optional Turnstile/reCAPTCHA |
| Inject script via input | CSP; Zod validation; no eval of user input |
| SSRF via URL parameter | validateUrlForFetch() before any server-side fetch |
| Leak secrets in logs | Central logger with redaction |
| Dependency compromise | npm audit, CI, review upgrades |

---

## 5. Assumptions

- Supabase Auth is the source of truth for identity; RLS is enabled on all user/org tables.
- Only NEXT_PUBLIC_* env vars are safe in client; no server secrets in client bundle.
- Vercel provides TLS and edge; HSTS is applied in production.
- Admin role is set via Supabase (app_metadata.role or equivalent).
