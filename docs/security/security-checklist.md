# LaunchPath — Security Checklist (PRD-Aligned)

Use before every release, and monthly for ongoing operations.

---

## Pre-Launch (Do Before First Users)

### Environment & Secrets
- [ ] All env vars set in Vercel; no secrets in repo. `.env.example` has placeholders only.
- [ ] `OPENAI_API_KEY` set in Vercel (server-only).
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set in Vercel (server-only).
- [ ] `NEXT_PUBLIC_APP_ORIGIN` set to production URL for CSRF checks.
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in app code; only for migrations/admin if needed.

### Supabase
- [ ] RLS enabled on ALL user-facing tables: `user_profiles`, `blueprints`, `blueprint_versions`, `user_credits`, `credit_ledger`, `chat_messages`, `generations`.
- [ ] `decrement_credits` and `refill_credits` RPC functions created (from `rls-policies.sql`).
- [ ] Auth redirect URLs configured in Dashboard (production domain).
- [ ] Email verification enabled in Supabase Auth (prevents trial abuse via throwaway emails).
- [ ] Rate limiting on Supabase Auth (Dashboard → Auth → Rate Limits).

### AI Security
- [ ] Every AI API route calls `checkPromptInjection()` before sending to provider.
- [ ] Every AI API route uses `sanitizeAiInput()` to cap input length.
- [ ] Every AI API route uses `anchorSystemPrompt()` to wrap system instructions.
- [ ] Every AI API route uses `sanitizeAiOutput()` before returning to client.
- [ ] `TOKEN_BUDGETS` set per generation type to cap max_tokens.
- [ ] System prompts are never stored in database or returned in API responses.

### Credit System
- [ ] `checkCredits()` is called BEFORE every AI generation.
- [ ] `decrementCredits()` is called AFTER successful generation (atomic RPC).
- [ ] `PAID_ONLY_FEATURES` gate blocks trial users from advanced tools.
- [ ] No direct UPDATE policy on `user_credits` for authenticated role.
- [ ] `credit_ledger` has no INSERT/UPDATE/DELETE for authenticated role (server-only writes).

### Auth & Access
- [ ] Dashboard layout calls `requireAuth()`.
- [ ] All API routes that handle user data enforce auth (return 401 if not authenticated).
- [ ] Blueprint queries always scoped by `auth.uid()` (RLS enforces this).
- [ ] Admin routes use `requireRole(['admin'])`.

### HTTP Security
- [ ] Security headers verified in production (CSP, HSTS, X-Frame-Options) via browser DevTools.
- [ ] `poweredByHeader: false` in next.config.

### Abuse Prevention
- [ ] Honeypot field on signup form.
- [ ] Rate limiting on `/api/generate/*` routes (at least 10/min per user).
- [ ] Rate limiting on auth endpoints.
- [ ] Stripe webhook signature verified before processing.

---

## Brute-Force / Lockout Strategy

| Layer | Implementation |
|-------|----------------|
| IP rate limit | Per-IP limit on login attempts (e.g. 5/minute) |
| Account lockout | After 10 failed attempts, require email verification or CAPTCHA |
| CAPTCHA | Optional Cloudflare Turnstile on login/signup (integration point in honeypot module) |
| Monitoring | Alert on spike of `auth.failed_login` audit events |

---

## Ongoing (Monthly or After Major Changes)

- [ ] Run `npm run security-check` (typecheck + lint + audit). Fix high/critical findings.
- [ ] Review Supabase Auth and API logs for anomalies.
- [ ] Check AI provider usage dashboard for unexpected cost spikes.
- [ ] Verify RLS policies still match current schema (new tables need new policies).
- [ ] Rotate secrets if any compromise is suspected.
- [ ] Review and update `docs/security/threat-model.md` if new features are added.
- [ ] Test credit system: verify credits can't be manipulated via client requests.
- [ ] Review AI output samples for system prompt leakage.

---

## Before Each Feature Release

- [ ] New API route? → Add auth, rate limit, Zod validation, audit logging.
- [ ] New table? → Add RLS policies. Verify with `get_advisors` (security).
- [ ] New AI generation type? → Add to `TOKEN_BUDGETS`, `CREDIT_COSTS`, prompt injection check.
- [ ] New env var? → Add to `schema.ts`. If secret, verify it's NOT `NEXT_PUBLIC_*`.
