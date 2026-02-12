# LaunchPath — Design Vision

**Goal:** Define the high-level UI/UX vision so the product feels **world-class**, **rewarding**, and **hopeful**—giving users dopamine, clarity, and a real sense of progress and results. This doc is about *feel* and *experience*, not implementation details.

---

## 1. What we're aiming for

| Feeling | What it means in the product |
|--------|------------------------------|
| **Dopamine** | Small wins feel visible and celebrated. Progress is clear. Completing a step or seeing their first system built feels like a real “yes” moment. |
| **Hope** | They leave each session thinking “I can do this.” The UI never implies they’re behind or failing—it shows a path and the next step. |
| **Results** | Artifacts (offer, build path, scripts) feel *real* and usable—not generic templates. They can see their specific system, copy it, export it, and imagine using it. |
| **World-class** | Calm, confident, premium. No clutter, no cheap patterns. Closer to Linear / Notion / Vercel / great SaaS—refined dark mode, clear hierarchy, purposeful motion. |

We’re **not** going for: gamification overload, hype, or “growth hacks.” We’re going for **earned confidence** and **tangible progress** that makes them want to come back.

---

## 2. Emotional design principles

### 2.1 One clear next step

- At any moment, **one primary action** is obvious (e.g. “Start your first system,” “Answer 2 questions,” “View your offer”).
- No “choose one of 5 things.” No overwhelming dashboards. If they have multiple options, we still highlight the **single best next step**.
- **Why:** Reduces anxiety and decision fatigue. Dopamine comes from completing that one thing, not from picking from a menu.

### 2.2 Progress is visible and honest

- They always know where they are: **Onboarding → System created → Offer → Build path → Get clients.** A simple progress indicator (steps or a slim stepper) that doesn’t lie.
- **No fake progress.** Don’t fill bars for the sake of it. Mark steps complete only when the artifact exists.
- **Why:** Real progress, visibly shown, builds trust and hope. Fake progress erodes it.

### 2.3 Completion feels like a win

- **Micro-moments:** Finishing onboarding, submitting the “few questions,” each step of “Building your system…” completing.
- **Macro-moment:** The first time they see their **full system** (offer + build path + get clients) in one place. That’s the big payoff.
- Use **subtle celebration**: a short success state (checkmark, soft confetti or glow), a clear “You’re done” or “Your system is ready,” and an obvious **next action** (“View your offer,” “Open your build path,” “Run this for 7 days”).
- **Why:** Dopamine is tied to completion. We make completions explicit and briefly rewarding.

### 2.4 Their content is the hero

- **Their** offer, **their** build path, **their** scripts—not “Sample offer” or “Example.” From day one, labels and copy should reflect *their* system (e.g. “Your offer,” “[System name]”).
- Typography and layout should make **artifacts readable and scannable** (headings, sections, copy blocks). They should want to screenshot or share.
- **Why:** When it feels like *theirs*, it feels real. Real = hope and commitment.

### 2.5 Calm, not chaotic

- **Whitespace and grouping.** Cards and sections breathe. We don’t pack every possible action above the fold.
- **Motion with purpose.** Animations (page transitions, step completion, list items) are short and reinforce state change—no decoration for its own sake.
- **Dark mode as default** (already). Deep background, emerald/teal accent, clear contrast. Feels focused and premium.
- **Why:** World-class often feels “calm and capable.” Chaos undermines hope; calm supports it.

### 2.6 Return feels welcoming

- When they come back, the **first thing they see** should orient them: “You’re in [System name]” or “Here’s your progress” or “Last time you were building your get-clients plan.”
- A **short “What to do next”** or one suggested action (e.g. “Run Sales Prep before your call”) so they don’t stare at a static dashboard.
- **Why:** Retention comes from “I know what to do here.” Welcoming return = repeat use.

---

## 3. Key moments (dopamine + hope)

| Moment | What we show / do | Emotional beat |
|--------|-------------------|----------------|
| **After onboarding** | “You’re set. Let’s build your first system.” Single CTA. Optional one-line preview: “You’ll get an offer, a build path, and a plan to get clients.” | Relief + anticipation. |
| **Before the one-shot flow** | 2–3 short questions, minimal UI. Progress: “Question 1 of 3.” No long forms. | Low friction, “this is doable.” |
| **During “Building your system”** | Step-by-step progress: “Building your offer…” → “Building your build path…” → “Building your get-clients plan…” (or streaming first artifact). No spinner in a void. | “It’s working. Something is happening for me.” |
| **First system ready** | Full-screen or prominent **success state**: “Your system is ready.” Show the three pieces (offer, build path, get clients) as cards or a compact summary. One primary CTA: “View your offer” or “See your system.” Optional subtle motion (e.g. checkmarks, soft glow). | **Big dopamine.** “I have a real thing.” |
| **First view of their offer** | Clean, readable layout. Their headline, their audience, their pricing. Copy: “This is your offer.” Edit and share available but not noisy. | Ownership + hope. |
| **System canvas (visualization)** | When we add React Flow (or similar): a **visual map** of their system (offer → build steps → acquisition). They *see* the whole thing. | Clarity + “this is real.” |
| **Return visit** | “Welcome back.” Active system name. One suggested next action. No guilt, no “you haven’t done X.” | Welcoming, not nagging. |
| **After a tool run** (e.g. Sales Prep) | Clear result: “Here’s your call prep.” Content is the hero. “Add to your system” or “Copy” obvious. | “I got something useful.” |

---

## 4. Visual and tonal direction

### 4.1 Brand alignment (waitlist → app)

- **Dark, focused.** Deep background (oklch 0.10), emerald/teal primary. Matches waitlist.
- **Serif for big moments:** Headlines and “hero” copy (e.g. “Your system is ready”) can use Tiempos/serif—warm, editorial, not cold.
- **Sans (Geist) for UI:** Buttons, labels, nav, body. Clean and readable.
- **One accent color** (primary) for CTAs, progress, success. Don’t multiply accent colors; we’re not a rainbow dashboard.

### 4.2 World-class references (vibe, not copy)

- **Linear:** Calm, fast, clear hierarchy. No clutter. Actions are obvious.
- **Notion:** Content-first. Blocks and sections that feel editable and “theirs.”
- **Vercel:** Dark, confident, technical-but-approachable. Good empty states.
- **Stripe Dashboard:** Clear progress, clear outcomes. Trust and clarity.

We’re not copying any of them; we’re in the same **league**: premium, purposeful, calm.

### 4.3 What we avoid

- **Hype or desperation.** No “You’re 90% there!” or fake urgency.
- **Gamification overload.** No points, badges, or streaks unless they’re minimal and honest (e.g. “3 systems created” as a fact, not a game).
- **Cluttered dashboards.** No 10 cards and 5 CTAs fighting for attention.
- **Generic content.** No “Lorem offer” or “Example build path.” Use their data or clear empty states (“Your offer will appear here after you run Build my system”).

---

## 5. Concrete UI patterns

### 5.1 Empty states

- **Friendly, directional.** “You don’t have a system yet” → one CTA: “Build your first system.” Short line: “We’ll create your offer, build path, and plan to get clients in one go.”
- No dead ends. Every empty state has **one next action**.

### 5.2 Progress and steppers

- **Stepper or steps** for: Onboarding (e.g. 3–5 steps), “Build my system” flow (e.g. Questions → Building → Ready).
- **Minimal design:** Step name + done/current/upcoming. No heavy graphics unless we want one hero illustration for “Your system is ready.”

### 5.3 Success / completion states

- **Short and clear.** “Your system is ready” or “Offer saved.” Optional: soft checkmark animation, brief glow on primary CTA.
- **Next action** is the main button. Don’t leave them with “OK” only—give “View your offer” or “See your system.”

### 5.4 Artifact pages (offer, build path, get clients)

- **Content first.** Their content in a readable layout (sections, headings, copy blocks).
- **Actions secondary:** Edit, Share, Export in a header or secondary area. Not competing with the content.
- **Ownership language:** “Your offer,” “[System name] – Build path.”

### 5.5 System canvas (when we add it)

- **Visual = clarity.** Nodes for offer, build phases, acquisition phases. Edges show flow. Clean, not noisy.
- **Interact lightly:** Click to jump to that artifact. It’s a map of *their* system, not a diagram for its own sake.

### 5.6 Chat and return visits

- **Chat:** Feels like a focused thread. Context is clear (“You’re in [System name]”). Suggested actions (e.g. “Regenerate build path,” “Run Sales Prep”) as chips or buttons so they’re one tap.
- **Return:** Header or banner: “Back in [System name].” One suggested next action. Rest of the app is familiar (same nav, same structure).

---

## 6. Motion and responsiveness

- **Purposeful motion.** Page transitions short (200–300ms). Step completion: brief check or progress fill. List/item appear: light stagger if it helps scan.
- **Respect reduced motion.** Honor `prefers-reduced-motion`; don’t rely on animation for critical info.
- **Responsive:** Desktop-first, but **read view** (offer, build path, get clients) works on mobile so they can check their system on the go. Buttons and CTAs remain tappable and legible.

---

## 7. Summary: the experience we're building

- **Dopamine:** Clear steps, visible progress, and a real “Your system is ready” moment. Completions feel like wins.
- **Hope:** One next step at a time. Their content is the hero. No guilt, no fake progress. Return is welcoming.
- **Results:** Artifacts that feel real and theirs. Export, share, visualize. They can imagine using this in the real world.
- **World-class:** Calm, dark, premium. Clear hierarchy, purposeful motion, no clutter. In the same league as the best product dashboards.

Design every screen and flow with these four in mind: **dopamine, hope, results, world-class.**
