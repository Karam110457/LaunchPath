# LaunchPath — Security Hardening Report

**Date:** 2026-02-07  
**Scope:** Next.js 15 (App Router) + Supabase, production-ready controls  
**Deployment target:** Vercel

---

## 1. Executive Summary

This report documents production-grade security controls implemented for LaunchPath. Controls cover secrets management, HTTP security headers, authentication/authorization, API security, data protection, dependency hygiene, abuse prevention, and file/URL safety. Residual risks and manual steps are listed so you can complete configuration (Supabase Dashboard, DNS, secrets rotation) and ongoing operations.

---

## 2. Controls Implemented

### A) Secrets & Environment

| Control | Implementation |
|--------|----------------|
| No server secrets in client | Only `NEXT_PUBLIC_*` are exposed; validated via Zod client schema. |
| Env validation at startup | Zod schemas in `src/lib/env/schema.ts`; `instrumentation.ts` calls `validateRequiredEnv()` on Node startup and throws if required vars missing. |
| Client env validation | `getClientEnv()` used by Supabase client creation; fails fast with clear error if URL or anon key missing/invalid. |
| Safe .env.example | Placeholders only; no real keys. Documented in `.env.example`. |

**Files:** `src/lib/env/schema.ts`, `src/lib/env/index.ts`, `instrumentation.ts`, `.env.example`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`.

### B) HTTP / App Security Headers

| Header | Value / behavior |
|--------|-------------------|
| Content-Security-Policy | Strict: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `frame-ancestors 'none'`, `connect-src` includes Supabase; `upgrade-insecure-requests` in production only. |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), interest-cohort=() |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload (production only) |
| X-Powered-By | Removed via `poweredByHeader: false` in next.config |

**Files:** `src/lib/security/headers.ts`, `src/lib/supabase/middleware.ts` (applies headers), `next.config.ts`.

**CSP note:** `style-src 'unsafe-inline'` is required for Next.js/Tailwind in many setups. For stricter CSP, move to nonce-based styles and document in this report.

### C) AuthN / AuthZ

| Control | Implementation |
|--------|----------------|
| Protected routes | Dashboard layout calls `requireAuth()`; unauthenticated users redirect to `/login`. |
| Role-based access | `requireRole(['admin'])` and `hasRole(user, 'admin')` in `src/lib/auth/guards.ts`; role from `user.app_metadata.role`. |
| API auth | `/api/me` uses `supabase.auth.getUser()` and returns 401 if not authenticated. |
| RLS assumptions | Documented in `docs/security/rls-policies.sql`; policies scope rows by `auth.uid()` or org. |

**Files:** `src/lib/auth/guards.ts`, `src/app/dashboard/layout.tsx`, `src/app/api/me/route.ts`, `docs/security/rls-policies.sql`.

### D) API Security

| Control | Implementation |
|--------|----------------|
| Request validation | Zod in `src/lib/api/validate.ts`: `validateBody()`, `validateQuery()`, `paginationSchema`. |
| Rate limiting | In-memory limiter in `src/lib/api/rate-limit.ts`; used in `/api/me`. For scale, replace with Vercel KV/Upstash. |
| CSRF strategy | Origin/referer check in `src/lib/security/csrf.ts`; set `NEXT_PUBLIC_APP_ORIGIN` for production. |
| Method checks | Example in `/api/me`: only GET allowed; 405 for others. |
| Error responses | `jsonErrorResponse()` returns generic messages; no stack traces or internal details. |

**Files:** `src/lib/api/validate.ts`, `src/lib/api/rate-limit.ts`, `src/lib/security/csrf.ts`, `src/app/api/me/route.ts`, `src/app/api/health/route.ts`.

### E) Data Protection

| Control | Implementation |
|--------|----------------|
| Sensitive data not logged | `src/lib/security/logger.ts`: redacts keys matching password, token, secret, authorization, cookie, api_key, email (when used as secret). |
| Centralized logger | `logger.info/warn/error/debug`; always redact before logging. |

**Encryption at rest:** Supabase encrypts data at rest. For application-level sensitive fields (e.g. PII), document use of Supabase Vault or application-level encryption in threat model and runbook.

**Files:** `src/lib/security/logger.ts`.

### F) Dependency & Supply Chain

| Control | Implementation |
|--------|----------------|
| Audit | `npm run audit` and `npm run audit:fix`. |
| Scripts | `typecheck`, `lint`, `audit`, `security-check` (typecheck + lint + audit). |
| CI | `.github/workflows/ci.yml` runs typecheck, lint, audit (informational), and build with placeholder env. |

**Files:** `package.json`, `.github/workflows/ci.yml`.

### G) Abuse / Fraud Safeguards

| Control | Implementation |
|--------|----------------|
| Honeypot | `src/lib/security/honeypot.ts`: `checkHoneypot(formData)` / `checkHoneypotFromBody(body)`; field name `website_url`. Integrate in signup/login forms. |
| Rate limiting | Applied on `/api/me`; document lockout strategy for auth endpoints in `docs/security/security-checklist.md`. |

**Files:** `src/lib/security/honeypot.ts`, `src/lib/api/rate-limit.ts`.

### H) File Upload / External Input Safety

| Control | Implementation |
|--------|----------------|
| MIME / size / extension | `src/lib/security/file-upload.ts`: `validateFile()` checks size (default 10 MB), MIME allowlist, blocked extensions (exe, js, php, etc.). |
| SSRF-safe fetch | `src/lib/security/ssrf.ts`: `validateUrlForFetch()` allows only http/https and blocks private IPs and internal hosts. |

**Files:** `src/lib/security/file-upload.ts`, `src/lib/security/ssrf.ts`.

---

## 3. Files Changed / Added

**New files:**

- `instrumentation.ts`
- `src/lib/env/schema.ts`
- `src/lib/env/index.ts`
- `src/lib/security/headers.ts`
- `src/lib/security/logger.ts`
- `src/lib/security/csrf.ts`
- `src/lib/security/honeypot.ts`
- `src/lib/security/file-upload.ts`
- `src/lib/security/ssrf.ts`
- `src/lib/auth/guards.ts`
- `src/lib/api/validate.ts`
- `src/lib/api/rate-limit.ts`
- `src/app/api/health/route.ts`
- `src/app/api/me/route.ts`
- `.github/workflows/ci.yml`
- `docs/security/security-hardening-report.md`
- `docs/security/threat-model.md`
- `docs/security/incident-response-runbook.md`
- `docs/security/security-checklist.md`
- `docs/security/rls-policies.sql`

**Modified files:**

- `next.config.ts` (poweredByHeader, env)
- `src/lib/supabase/client.ts` (use getClientEnv())
- `src/lib/supabase/server.ts` (use getClientEnv())
- `src/lib/supabase/middleware.ts` (use getClientEnv(), apply security headers)
- `src/app/dashboard/layout.tsx` (requireAuth())
- `.env.example` (placeholders and comments)
- `package.json` (scripts: typecheck, audit, security-check)
- `README.md` (Security section)

---

## 4. Before / After Risk Reduction

| Risk | Before | After |
|------|--------|--------|
| Missing env in production | Silent failures or runtime errors | Fail at startup with clear message |
| Secrets in client bundle | Possible misuse of env | Only NEXT_PUBLIC_* exposed and validated |
| Clickjacking | No frame protection | X-Frame-Options + CSP frame-ancestors |
| XSS / injection | Relied on framework defaults | CSP and nosniff; validation on API inputs |
| Unauthenticated dashboard access | Dashboard layout not enforcing auth | requireAuth() redirects to login |
| API abuse | No rate limit | Per-route rate limit; auth enforced on /api/me |
| Sensitive data in logs | console.log of full objects | Logger with redaction |
| SSRF on URL fetch | N/A (no URL fetch yet) | validateUrlForFetch() for future use |
| Dependency vulnerabilities | Ad hoc | CI runs audit; scripts for local audit |

---

## 5. Manual Steps You Must Complete

- **Supabase Dashboard:** Add production URL to Auth → URL Configuration (Redirect URLs), e.g. `https://your-app.vercel.app/**`.
- **Vercel:** Set env vars (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`); optionally `NEXT_PUBLIC_APP_ORIGIN` for CSRF.
- **Admin role:** For `requireRole(['admin'])` to work, set `app_metadata.role = 'admin'` for admin users in Supabase Auth (Dashboard or API).
- **RLS:** When you create tables, run or adapt `docs/security/rls-policies.sql` in Supabase SQL Editor.
- **Secrets rotation:** If a key is ever exposed, rotate in Supabase Dashboard (Settings → API) and update Vercel env; document in runbook.
- **DNS / TLS:** Handled by Vercel; ensure custom domain is verified for HSTS to apply as intended.

---

## 6. Residual Risks & Next Actions

| Residual risk | Mitigation / next action |
|---------------|---------------------------|
| In-memory rate limit not shared across Vercel instances | Use Vercel KV or Upstash Redis for production rate limiting. |
| Admin role not set in Supabase | In Dashboard → Auth → Users, set `app_metadata.role = 'admin'` for admin users; or use a custom claim. |
| RLS policies not yet applied | Run `docs/security/rls-policies.sql` (or adapted version) when tables exist. |
| Honeypot not on login/signup forms | Add hidden field `website_url` and call `checkHoneypot` in sign-in/up Server Actions. |
| CSP may need tuning for third-party scripts | If you add analytics or widgets, update CSP in `src/lib/security/headers.ts` and document. |
| No WAF / DDoS mitigation at edge | Rely on Vercel edge; consider Vercel Firewall or Cloudflare if needed. |

---

## 7. Security Scorecard

| Area | Status | Evidence / file | Risk if not completed |
|------|--------|------------------|------------------------|
| A) Secrets & env | Done | `src/lib/env/`, `instrumentation.ts`, `.env.example` | Runtime failures; possible secret leak |
| B) HTTP headers | Done | `src/lib/security/headers.ts`, middleware | Clickjacking, XSS, downgrade |
| C) AuthN/AuthZ | Done | `src/lib/auth/guards.ts`, dashboard layout, `/api/me` | Unauthorized access |
| D) API security | Done | `src/lib/api/validate.ts`, `rate-limit.ts`, API routes | Injection, abuse, info leak |
| E) Data protection | Done | `src/lib/security/logger.ts` | PII/token in logs |
| F) Dependencies & CI | Done | `package.json` scripts, `.github/workflows/ci.yml` | Vulnerable deps in production |
| G) Abuse safeguards | Partial | Honeypot + rate limit; lockout doc in checklist | Brute force, spam |
| H) File/URL safety | Done | `file-upload.ts`, `ssrf.ts` | Malicious uploads, SSRF |
| I) Security docs | Done | `docs/security/*.md`, `rls-policies.sql` | No runbook or RLS |
| J) DX (comments, README) | Done | README Security section, How to Verify | Hard to verify or onboard |

**Partial:** G — Honeypot and rate limit implemented; integrate honeypot into login/signup forms and add lockout (e.g. CAPTCHA or temp lock) per checklist.
