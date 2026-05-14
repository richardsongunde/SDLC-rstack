# rstack Design System — Richardson Gunde

> **Status:** Confirmed — amber + dark mode + tight density (Linear-style).
> This file is read by agents when generating any UI for rstack projects.

---

## Product Context

- **What this is:** A personal AI engineering workspace and teaching platform
- **Who it's for:** Richardson Gunde + developers learning to build AI systems in 2026
- **Space:** Developer tools (peers: Linear, Warp, Zed, Raycast)
- **Voice:** Builder-first. Not a dashboard product. Not a SaaS landing page.

---

## Aesthetic Direction

**Direction:** Industrial / Utilitarian — function-first, density over decoration.
The CLI heritage is the brand. Code is the personality. No gradients trying to look like a startup.

**Reference:** Warp terminal, Linear, formulae.brew.sh — tools built for people who care about craft.

**Decoration level:** Minimal. Noise/grain texture on dark surfaces for materiality.
No shadows trying to look 3D. No rounded corners trying to look friendly.

**Mood:** Serious tool built by someone who cares whether it works.

---

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / Hero | Satoshi | Black 900 | 48–72px |
| Body | DM Sans | Regular 400 / Medium 500 | 16px |
| UI / Labels | DM Sans | Semibold 600 | 14px |
| Code / Data | JetBrains Mono | Regular 400 / Medium 500 | 14px |
| Captions | JetBrains Mono | Regular 400 | 12px |

**Loading:** Fontshare for Satoshi, Google Fonts for DM Sans + JetBrains Mono.
**Monospace is prominent** — not hidden in code blocks. It IS the personality.

---

## Color

**Mode:** Dark mode default. Light mode available but secondary.

**Primary accent:** Amber — reads as "terminal cursor," warm, energetic.

```css
/* Dark mode */
--accent:          #F59E0B;   /* amber-500 */
--accent-text:     #FBBF24;   /* amber-400 */
--bg-base:         #0C0C0C;   /* near-black */
--bg-surface:      #141414;   /* cards, panels */
--bg-elevated:     #1A1A1A;   /* hover states */
--border:          #262626;   /* subtle borders */
--text-primary:    #FAFAFA;
--text-secondary:  #A1A1AA;   /* zinc-400 */
--text-muted:      #52525B;   /* zinc-600 */

/* Semantic */
--success:  #22C55E;
--warning:  #F59E0B;
--error:    #EF4444;
--info:     #3B82F6;
```

**Light mode:** Warm stone base `#FAFAF9`, white surfaces, amber-600 for accent.

**Rule:** Amber is rare and meaningful. Data gets the color; chrome stays neutral.

---

## Spacing

**Base unit:** 4px

| Token | Value | Use |
|-------|-------|-----|
| `2xs` | 2px | micro gaps |
| `xs` | 4px | tight spacing |
| `sm` | 8px | component padding |
| `md` | 16px | section gaps |
| `lg` | 24px | group spacing |
| `xl` | 32px | major sections |
| `2xl` | 48px | page sections |
| `3xl` | 64px | hero spacing |

**Density:** Tight — Linear-style. Information-dense, no wasted whitespace. Every pixel earns its place.

---

## Layout

- **Grid:** 12 columns at lg+, 4 columns at md, 1 at mobile
- **Max content width:** 1200px (6xl)
- **Border radius:**
  - Cards/panels: 12px (lg)
  - Buttons/inputs: 8px (md)
  - Badges/pills: 9999px (full)
  - Skill bars / progress: 4px (sm)

---

## Motion

**Principle:** Minimal-functional. Only transitions that aid comprehension.

| Easing | Use |
|--------|-----|
| `ease-out` (`cubic-bezier(0.16,1,0.3,1)`) | Entering elements |
| `ease-in` | Exiting elements |
| `ease-in-out` | Moving elements |

| Duration | Use |
|----------|-----|
| 50–100ms | Micro (hover states, focus rings) |
| 150ms | Short (tooltips, dropdowns) |
| 250ms | Medium (panels, modals) |
| 400ms | Long (page transitions) |

**Animated elements:** Skill bars (600ms ease-out fill), live feed dots (2s pulse), hover states (150ms).

---

## Component Conventions

**Buttons:**
- Primary: amber background, dark text, 8px radius
- Secondary: surface background, amber border, amber text
- Destructive: error-colored, always requires confirmation

**Code blocks:**
- Dark surface `#141414`, JetBrains Mono, amber syntax highlights
- Explicit copy button, top-right

**Status badges:**
- Dot + label pattern
- `DONE` → success green
- `BLOCKED` → error red
- `NEEDS_CONTEXT` → warning amber
- `IN_PROGRESS` → info blue

**Tables:**
- JetBrains Mono for data cells
- Zebra striping in `#141414` / `#1A1A1A`
- Sticky header with amber bottom border

---

## What NOT to Do

- No purple gradients (generic AI aesthetic)
- No Inter or Roboto (overused, no character)
- No bouncing loading animations (cheap)
- No card grids as the primary layout (surface-level SaaS)
- No modal stacks (use panels or inline expansion)
- No unsolicited dark patterns (fake urgency, FOMO)

---

> **Confirmed:** Amber accent, dark mode default, tight density.
> Update this file with `rstack-config set design_confirmed true` once deployed.
