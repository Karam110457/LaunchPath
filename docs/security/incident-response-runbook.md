# LaunchPath — Incident Response Runbook

**Purpose:** Detection, triage, containment, recovery, and communications for security incidents.

---

## 1. Detection

- **Monitoring:** Use Vercel Analytics / Logs; Supabase Dashboard (Auth, API, Logs). Set alerts for:
  - Spike in 401/403 or auth errors
  - Unusual traffic or error rates
  - Failed login spikes
- **Alerts:** Configure Vercel and Supabase alerts (e.g. email/Slack) for critical errors and quota.

---

## 2. Triage

| Severity | Examples | Action |
|----------|----------|--------|
| **Critical** | Data breach, auth bypass, active abuse | Immediate containment; involve lead + comms |
| **High** | Suspected compromise, credential leak | Contain and verify; rotate secrets; notify if user impact |
| **Medium** | Abuse (spam, scraping), dependency CVE | Plan fix; deploy; monitor |
| **Low** | Failed logins, misconfig | Fix and document |

---

## 3. Containment

- **Auth / account compromise:** Disable or reset user in Supabase Dashboard (Auth → Users). Revoke sessions if needed.
- **API abuse:** Tighten rate limits; block IP at edge (Vercel/Cloudflare) if necessary.
- **Secret leak:** Rotate immediately (Supabase anon key, service role if used, any other secrets). Revoke old keys in Supabase.
- **Dependency CVE:** Upgrade or patch; run `npm audit` and redeploy.

---

## 4. Recovery

- Restore from Supabase backups if data was corrupted or deleted.
- Verify RLS and auth flows after any auth or schema change.
- Re-enable access only after confirming fix (e.g. password reset, key rotation).

---

## 5. Communications Checklist

- [ ] Decide if user notification is required (e.g. data exposure, account compromise).
- [ ] Prepare short, factual statement (what happened, what was done, what users should do).
- [ ] Notify via email or in-app message if user data was affected.
- [ ] Document incident in internal log (date, impact, actions, follow-ups).

---

## 6. Post-Incident

- Update threat model and runbook if new abuse pattern discovered.
- Schedule review of RLS, auth, and rate limits.
- Rotate any exposed secrets and verify no residual access.
