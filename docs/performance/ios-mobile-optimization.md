# iOS / Mobile Performance Optimizations

This document lists the performance optimizations applied for mobile and iOS Safari, with brief reasoning based on common best practices.

## Research summary

- **Passive event listeners**: Scroll/touch handlers must use `{ passive: true }` so the browser can scroll immediately without waiting for JS. Our header scroll listener already uses this.
- **Backdrop-filter / filter: blur()**: Very expensive on iOS Safari; causes jank during scroll. Avoid or disable on small screens.
- **Containment**: `contain: layout style paint` limits layout/paint to an element so the browser can skip work. Combined with `content-visibility: auto`, below-the-fold content can be skipped until near the viewport.
- **GPU compositing**: Fixed/sticky elements can be promoted to their own layer with `transform: translateZ(0)` so scrolling the page doesn’t repaint the header.
- **Touch**: `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` improve touch responsiveness and remove the default tap flash.
- **Animations**: Long durations and delays on mobile make “content loads in late” feel worse; shortening them (or disabling) reduces perceived jank.
- **Fonts**: `font-display: swap` (or `optional` for non-critical) avoids invisible text (FOIT). Next.js `next/font` handles preload and display.

## Implemented optimizations

| Area | What we do | Why |
|------|------------|-----|
| **Scroll listener** | `window.addEventListener("scroll", ..., { passive: true })` in Header | Lets iOS start scrolling without waiting for our handler. |
| **Backdrop-blur** | Disabled on mobile (`max-md`); solid/semi-opaque backgrounds only | `backdrop-filter: blur()` is costly and causes scroll jank on iOS. |
| **Background blur orbs** | Hidden on mobile in `BackgroundGrid`; replaced with a simple gradient | Large `filter: blur()` layers are very expensive on iOS. |
| **Section containment** | `contain: layout style paint` on `#problem`, `#solution`, `#why`, `#faq` on mobile | Limits layout/paint scope so the browser can optimize. |
| **content-visibility** | `content-visibility: auto` + `contain-intrinsic-block-size: 600px` on those sections on mobile | Browser can skip painting off-screen content until near viewport; intrinsic size reduces layout shift. |
| **Fixed header layer** | `transform: translateZ(0)` on the fixed `<header>` | Promotes header to its own compositor layer so main scroll doesn’t repaint it. |
| **Touch** | `touch-action: manipulation` on body; `-webkit-tap-highlight-color: transparent` on html | Smoother touch scrolling; no default tap highlight flash. |
| **Animations** | On mobile/touch: `animation-duration: 0.25s`, `animation-delay: 0s` for `animate-in` | Short, immediate animations reduce “content pops in late” feeling. |
| **Fonts** | `next/font` with `display: "swap"` for local Tiempos | Avoids FOIT; Next.js handles preload. |

## Files touched

- `src/app/globals.css` – touch, containment, content-visibility, animation overrides.
- `src/components/waitlist/Header.tsx` – passive scroll listener, `translateZ(0)` on header, no blur on mobile when scrolled.
- `src/components/ui/background-grid.tsx` – blur orbs hidden on mobile; gradient fallback.
- `src/components/waitlist/Hero.tsx`, `WaitlistForm.tsx`, `Trust.tsx` – backdrop-blur only from `md` up.

## Optional follow-ups

- **Lazy hydration**: If more client components are added below the fold, consider `dynamic(..., { ssr: false })` for non-critical UI.
- **Preload critical font**: If LCP is dominated by the hero headline, ensure the serif font is preloaded (Next.js `localFont` already does this when used in layout).
- **Monitor Core Web Vitals**: Use Next.js Speed Insights or Chrome DevTools (mobile profile) to check LCP, INP, CLS on real devices.
