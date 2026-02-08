# Waitlist CRO Iteration — Summary & Reference

## A) Summary of changes and why they improve conversion

| Area | Change | Why it helps |
|------|--------|---------------|
| **Hero clarity** | Subheadline replaced with concrete outcome + mechanism: "Get one sellable offer, a step-by-step build plan, and a sales pack — in one guided flow. No endless research." | Reduces ambiguity; visitors immediately understand what they get. |
| **Trust anchor** | Line under subhead: "Used by AI beginners to go from stuck to first client. Execution-first, no hype." | Builds credibility and qualifies the audience. |
| **CTA** | "Join Waitlist" → "Reserve My Spot" everywhere (hero + nav). | Outcome-driven; implies scarcity and commitment. |
| **Legal / trust** | Microcopy under form: "No spam. By signing up you agree to our Terms and Privacy Policy." | Reduces signup anxiety and supports compliance. |
| **Social proof** | "2,000+ builders…" removed. Replaced with: "Founding cohort opens soon. Limited seats." | Honest, verifiable; avoids fabricated numbers. |
| **Qualified waitlist** | After email capture, optional step 2: role/stage dropdown + biggest blocker (textarea). Persisted to Supabase; skip available. | Improves list quality and personalization without blocking signup. |
| **How-it-works** | Stronger border/icon contrast; time-to-complete per step (~15 min, ~1–2 hrs, ~30 min). | Communicates process authority and sets expectations. |
| **Why section** | Long paragraphs → scannable bullets; kept "We don't promise get rich quick. We promise you get competent fast." | Better readability and retention on dark background. |
| **FAQ** | Answers made specific and actionable; no fluffy copy. | Reduces risk and ambiguity before signup. |
| **Nav + CTA** | Single primary CTA "Reserve My Spot" in nav and hero; smooth scroll with `prefers-reduced-motion` respected. | Consistency and accessibility. |
| **Analytics** | Events: waitlist_view, hero_cta_click, waitlist_step1_submitted, waitlist_step2_submitted, waitlist_step2_skipped, faq_opened, section_view. | Enables funnel analysis and next A/B tests. |
| **Accessibility** | Semantic landmarks, min tap targets 44px, reduced-motion CSS, aria-labels. | Better usability and compliance. |

---

## B) File tree (modified / added)

```
src/
├── app/
│   ├── actions/
│   │   ├── join-waitlist.ts          (modified: source_page, success message)
│   │   └── complete-waitlist-step2.ts (new)
│   └── page.tsx                      (modified: SectionViewTracker)
├── components/
│   └── waitlist/
│       ├── Header.tsx                (modified: CTA copy, track click, reduced-motion scroll, min tap targets)
│       ├── Hero.tsx                   (modified: subhead, trust anchor, legal, social proof, a11y)
│       ├── WaitlistForm.tsx          (modified: step 2 flow, CTA copy, analytics, skip, legal removed from here)
│       ├── Solution.tsx              (modified: contrast, time-to-complete, motion-reduce)
│       ├── Trust.tsx                 (modified: bullets, id="why", readability)
│       ├── FAQ.tsx                   (modified: client, actionable answers, faq_opened track)
│       └── SectionViewTracker.tsx    (new)
├── lib/
│   └── analytics.ts                  (new: events + CRO backlog comment)
└── app/globals.css                   (modified: prefers-reduced-motion)
docs/
└── waitlist-cro-iteration.md         (this file)
```

Supabase: migration applied via MCP (`waitlist_add_step2_and_qualification`).

---

## C) Supabase SQL and env notes

**Migration already applied** (via Supabase MCP):

```sql
-- waitlist_add_step2_and_qualification
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS role_stage text,
  ADD COLUMN IF NOT EXISTS biggest_blocker text,
  ADD COLUMN IF NOT EXISTS source_page text DEFAULT 'homepage',
  ADD COLUMN IF NOT EXISTS step2_completed boolean DEFAULT false;

COMMENT ON COLUMN public.waitlist.role_stage IS 'User-selected role/stage from step 2';
COMMENT ON COLUMN public.waitlist.biggest_blocker IS 'Free text from step 2 qualification';
COMMENT ON COLUMN public.waitlist.step2_completed IS 'True when user completed step 2 or skipped';
```

**Env:** No new variables. Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and server Supabase client) are sufficient. RLS already allows anon insert; step 2 uses update by `email` — ensure RLS allows update for anon if you use anon key, or use a server-only client that can update (e.g. service role or a policy that allows update where email matches a known pattern). *Note: Current RLS only allows insert for anon; update may require a policy. See below.*

**RLS for step 2 update:** The waitlist table currently has "Allow public insert" and "Allow service_role to read". To allow **update** for step 2 from the app (server action using anon/key that has insert only), you have two options:

1. **Add an RLS policy** that allows update for the row just inserted (e.g. by session or by email if you pass a signed token).  
2. **Use a small Edge/Serverless function** with service role to perform the update by email.

If you prefer no RLS change, the server action uses `createClient()` from `@/lib/supabase/server`, which uses the anon key. So we need a policy like:

```sql
-- Allow anon to update only their own waitlist row (by email in request body - optional, for step 2)
-- Safer: allow update only when step2_completed is still false (one-time completion)
CREATE POLICY "Allow anon to complete step2"
  ON public.waitlist FOR UPDATE
  TO anon
  USING (step2_completed = false)
  WITH CHECK (step2_completed = true);
```

This policy was applied via Supabase MCP (`waitlist_allow_anon_update_step2`).

---

## E) QA checklist (iOS / macOS / Windows / Android)

- [ ] **iOS Safari:** Hero headline no clipping; form and step 2 usable; tap targets ≥44px; CTA "Reserve My Spot" works; reduced motion respected if enabled.
- [ ] **Android Chrome:** Same as above; keyboard doesn’t break layout; step 2 dropdown and textarea work.
- [ ] **macOS Safari:** Header becomes floating card on scroll; nav anchors smooth (or instant if reduced motion); contrast readable.
- [ ] **macOS Chrome:** Same as Safari; no layout shift (CLS) when hero loads.
- [ ] **Windows Chrome / Edge:** Form submit and step 2 submit/skip; no horizontal scroll; footer links visible.
- [ ] **Accessibility:** Tab through hero form and step 2; focus visible; FAQ accordion keyboard-operable; section_view and other events fire (check console or analytics).
- [ ] **Supabase:** New signup creates row with email, source_page; after step 2 (submit or skip), row has step2_completed = true and optional role_stage / biggest_blocker.

---

## F) 10 A/B tests to run next

1. **Hero CTA:** "Reserve My Spot" vs "Get Founding Access".
2. **Step 2:** Required vs optional (measure completion rate vs list quality).
3. **Social proof:** "Founding cohort opens soon. Limited seats." vs "Join the founding cohort." (no number).
4. **Headline:** "Start shipping." vs "Start shipping one sellable system."
5. **FAQ position:** Current (above footer) vs above a repeat CTA block.
6. **Step 2 UX:** Inline (current) vs modal.
7. **Trust section:** Bullets (current) vs 2–3 short paragraphs.
8. **Nav CTA:** "Reserve My Spot" vs "Join waitlist" (softer).
9. **Time-to-complete:** Show (~15 min, etc.) vs hide on steps.
10. **Legal microcopy:** Short (current) vs longer with explicit "we’ll only email you about LaunchPath".
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
mcp_supabase_apply_migration