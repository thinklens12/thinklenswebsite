# Animation improvement plans

Self-contained implementation plans produced by the `improve-animations` motion
audit. Each is written so a separate agent (or a cheaper model) can execute it
without further context. **These are plans, not applied changes** — the source
in `src/` is untouched until a plan is executed.

## How to execute a plan

1. Open the plan file and follow its **Steps** section verbatim.
2. All motion changes here are **CSS-only** edits to `src/styles.css` (the source),
   never the generated `*/index.html` pages.
3. Rebuild after editing: `node build.js` from the repo root (inlines `styles.css`
   into all pages).
4. Run the plan's **Verification** section (mechanical greps + the feel check).

## Plans

| # | Plan | Severity | Scope | Status | Depends on |
|---|------|----------|-------|--------|------------|
| [001](001-job-details-accordion-expand.md) | Animate the careers job-details accordion expand | MEDIUM | `src/styles.css`, ~6 lines, CSS only | ✅ DONE | — |

## Recommended execution order

1. **001** — job-details accordion expand. No dependencies; safe to do first and
   in isolation. It mirrors the already-shipped FAQ accordion recipe onto the
   careers `.job` accordion (adds `interpolate-size` + a `::details-content`
   height transition + reuses the existing `faqReveal` keyframe), so the two
   accordions feel identical.

_Stamped against commit `cb8a24e`. If `src/styles.css` has drifted from the line
references a plan cites, the plan says to STOP and report rather than guess at
placement._
