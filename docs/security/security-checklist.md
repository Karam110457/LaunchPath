# LaunchPath — Security Checklist

Use before launch and on a recurring (e.g. monthly) basis.

---

## Pre-Launch

- [ ] All env vars set in Vercel (no secrets in repo). `.env.example` has placeholders only.
- [ ] Supabase URL and anon key are correct; no service_role key in app code or client.
- [ ] RLS enabled on all user/org tables; policies applied from `docs/security/rls-policies.sql` (or adapted).
- [ ] Auth redirect URLs in Supabase Dashboard include production domain (e.g. `https://yourapp.vercel.app/**`).
- [ ] `NEXT_PUBLIC_APP_ORIGIN` set in production for CSRF/origin checks if using `validateOrigin()`.
- [ ] Honeypot (and optional Turnstile/reCAPTCHA) on sign-up and login forms.
- [ ] Rate limiting on auth and sensitive API routes; consider Vercel KV/Upstash for production.
- [ ] Security headers verified (CSP, X-Frame-Options, HSTS in production) via browser devtools or curl.
- [ ] `npm run security-check` passes; CI green.

---

## Brute-Force / Lockout Strategy (Auth)

- **Rate limit:** Apply per-IP (and per-email if desired) limits on login/sign-up (e.g. 5–10 per minute).
- **Lockout:** Optional: after N failed attempts, require CAPTCHA or temporary lockout (e.g. 15 min). Implement in auth API or Supabase Edge Function and document in runbook.
- **Monitoring:** Alert on spike of failed logins.

---

## Ongoing (Monthly or After Major Changes)

- [ ] Run `npm audit` and address high/critical; review and upgrade dependencies.
- [ ] Review Supabase Auth and API logs for anomalies.
- [ ] Confirm RLS policies still match product (new tables, new roles).
- [ ] Rotate or verify secrets (Supabase keys, any webhook secrets); document rotation in runbook.
- [ ] Review incident runbook and update if needed.
