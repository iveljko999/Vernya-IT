# 001 — Slow position drift on the dark-theme body gradient

- **Status**: DONE
- **Commit**: cfed31c
- **Severity**: LOW
- **Category**: Missed opportunities (ambient motion gap, not a correctness bug)
- **Estimated scope**: 1 file, ~12 lines added, 0 files touched beyond `css/style.css`

## Problem

`css/style.css:50` — the dark-theme body background is a static gradient, painted once and never moving:

```css
/* css/style.css:50 — current */
:root[data-theme="dark"] body {
  background: linear-gradient(150deg, #0d130f 0%, #000000 55%, #020703 100%);
}
```

This matters because it's not competing with silence — it's competing with two other motion layers on the same site (`.fluid-canvas` in `js/script.js`, full-viewport and `position: fixed` on the homepage; `.network-canvas` in `js/script.js`, scoped to `.page-hero` on subpages). On subpages, `.network-canvas` only covers the hero section (`position: absolute` inside a `position: relative` `.page-hero`, not `position: fixed`), so everything below the hero — story sections, cards, the CTA — sits on this fully static gradient for the rest of the scroll. That's the actual gap: dead, motionless real estate on a site whose whole design language (spring tab switcher, letter-swap nav, split-text reveals, two animated canvases) says "everything here is alive."

This was surfaced by `find-animation-opportunities` earlier in this session and explicitly framed as ambient/atmospheric motion, not a response to a discrete user action — it does not cleanly map to the audit's Feedback/Spatial/State/Explanation purposes. It survives anyway because it's the cheapest fix for a real, specific coverage hole (see Problem above), not decoration for its own sake.

## Target

```css
/* css/style.css — target, replacing the block at line 50 */
:root[data-theme="dark"] body {
  background: linear-gradient(150deg, #0d130f 0%, #000000 55%, #020703 100%);
  background-size: 220% 220%;
  animation: auroraDrift 26s var(--ease-spring) infinite alternate;
}

@keyframes auroraDrift {
  0%   { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}

@media (prefers-reduced-motion: reduce) {
  :root[data-theme="dark"] body {
    animation-duration: 90s;
  }
}
```

- `background-size: 220% 220%` — the gradient must be larger than the viewport so panning `background-position` reveals different parts of it instead of just re-aligning the same fixed stops (at 100% 100% size, the gradient never visually moves).
- `26s` — deliberately slow. This is Marketing/explanatory-tier motion (see AUDIT.md duration budgets — "Marketing / explanatory: can be longer"), and it's also *continuous*, unlike a one-shot UI transition, so it has to sit well under the threshold where slow motion starts reading as a stalled/loading state. Anything under ~15s reads as shimmer, not atmosphere.
- `var(--ease-spring)` — see Repo conventions below for why this token and not a new curve.
- `infinite alternate` — pans forward then reverses, so it loops without a visible jump-cut back to the start position.
- Reduced-motion path slows to `90s` rather than `animation: none` — per AUDIT.md's Accessibility rule, reduced motion means fewer/gentler animations, not zero. A ~3.5x slowdown keeps the atmosphere without any perceptible large-scale movement for motion-sensitive users.

## Repo conventions to follow

- All easing curves are defined once as custom properties on `:root` in `css/style.css:4-21` and referenced everywhere via `var(--ease-...)` — never a hand-typed `cubic-bezier(...)` inline. This repo has exactly two tokens:
  - `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1);`
  - `--ease-out: cubic-bezier(0.22, 1, 0.36, 1);`
  There is no dedicated `ease-in-out` token, which AUDIT.md's decision order would normally call for on "moving/morphing on screen." Per Hard Rule 3 (extend existing tokens, don't invent parallel ones), use `var(--ease-spring)` — it's already the repo's convention for on-screen movement elsewhere (e.g. `[data-reveal]` transitions at `css/style.css:~180`, `.switcher-panel` at `css/style.css:~600`), so it's the closest existing fit rather than adding a third curve for one rule.
- Dark-theme-only overrides are already scoped with the `:root[data-theme="dark"] <selector>` pattern throughout this file (e.g. `.grain`, `.card-link`, `.btn-outline` all have `:root[data-theme="dark"] ...` blocks). Follow that exact selector shape — do not use a `.dark` class or `[data-theme=dark]` without the `:root` prefix, it won't match the attribute the theme switcher sets (`js/theme.js` sets `document.documentElement.dataset.theme`, i.e. the attribute lives on `<html>`/`:root`).
- Exemplar for the reduced-motion pattern already in this file: `js/script.js` reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` for the two canvas animations and slows their internal time step rather than stopping them outright — same "gentler, not zero" philosophy, just expressed in JS instead of a media query since those are canvas loops.

## Steps

1. Open `css/style.css`. Locate the existing rule at line 50:
   ```css
   :root[data-theme="dark"] body {
     background: linear-gradient(150deg, #0d130f 0%, #000000 55%, #020703 100%);
   }
   ```
2. Add two lines inside that same rule block (`background-size` and `animation`), so it reads exactly as shown in the Target section's first block. Do not change the gradient's colors, angle, or stops — only add the two new properties.
3. Immediately after that rule's closing `}`, add the new `@keyframes auroraDrift { ... }` block exactly as shown in Target.
4. Immediately after the keyframes block, add the `@media (prefers-reduced-motion: reduce) { ... }` block exactly as shown in Target.
5. Do not touch the light-theme `body` rule (`css/style.css:39-48`) — this animation is dark-theme only, scoped entirely by the `:root[data-theme="dark"]` selector already wrapping the target rule.

## Boundaries

- Do NOT touch `js/script.js`, `js/theme.js`, or any HTML file — this is a pure CSS addition to one existing rule plus two new blocks immediately after it.
- Do NOT modify the light-theme background, the `--bg` / `--bg-soft` tokens, or any other `:root[data-theme="dark"]` override block in the file.
- Do NOT change `.fluid-canvas` or `.network-canvas` — they're explicitly out of scope per the original request ("the static dark gradient background itself, not the canvases").
- Do NOT introduce a new easing token or hand-typed `cubic-bezier(...)` — use `var(--ease-spring)` as specified.
- If the rule at `css/style.css:50` doesn't match the current-code excerpt in Problem (e.g. the gradient stops have changed since commit `cfed31c`), STOP and report the drift instead of guessing at how to merge the change.

## Verification

- **Mechanical**: no build step exists (static HTML/CSS/JS site) — verify by opening any page in a browser with dark theme active (default theme, or click the moon icon in the footer `.theme-switch`) and confirming no CSS parse errors in DevTools console.
- **Feel check**:
  - Load any page in dark theme, scroll to a section below the hero (e.g. the values grid on `about.html`, or the service blocks on `services.html`) and watch the background for at least 15–20 seconds — confirm you can perceive the gradient slowly shifting position without it ever looking like it's "loading" or flickering.
  - Confirm the motion is barely noticeable in peripheral vision while reading page content — it should not draw the eye or compete with foreground text/cards.
  - In DevTools Rendering panel, set `prefers-reduced-motion: reduce` and confirm the drift is still present but dramatically slower (near-imperceptible over a normal page-view session), not stopped entirely.
  - In DevTools Elements panel, confirm the computed `background-size` on `body` is `220% 220%` and `animation-duration` is `26s` (or `90s` under reduced motion) — not falling back to the light theme's static `var(--bg)`.
  - Switch to light theme via the footer toggle and confirm the animation and `background-size` do not apply — light theme's `body` background must remain the flat, static `var(--bg)`.
- **Done when**: the dark-theme body background visibly drifts over a ~26s cycle, reverses smoothly (no jump-cut), is confirmed absent/unaffected in light theme, and is confirmed present-but-slowed under `prefers-reduced-motion: reduce`.
