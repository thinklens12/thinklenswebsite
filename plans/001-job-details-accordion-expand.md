# 001 — Animate the careers job-details accordion expand

- **Status**: DONE (executed against commit 1659aa3; `src/styles.css` + rebuild)
- **Commit**: cb8a24e (planned) / 1659aa3 (executed)
- **Severity**: MEDIUM
- **Category**: Missed opportunity / cohesion (a sibling accordion already animates; this one teleports)
- **Estimated scope**: 1 file (`src/styles.css`), ~6 lines added, CSS only. Then rebuild.

## Problem

On the careers page, each job posting is a native `<details class="job">` element
(markup generated in `build.js:82`, rendered into `careers/index.html`). When a
role is expanded, the chevron rotates smoothly **but the body content snaps open
instantly** — there is no height/opacity bridge, so the panel teleports.

This is inconsistent with the FAQ accordion (`.faq-item`) one component family
over, which animates its expand cleanly. The two use the same native `<details>`
mechanism; only the FAQ got the motion treatment.

Current job CSS — the chevron animates, the body does not:

```css
/* src/styles.css:1939 — current (chevron only) */
.job-chev{
  flex:0 0 auto;width:11px;height:11px;border-right:2px solid var(--g400);
  border-bottom:2px solid var(--g400);transform:rotate(45deg) translate(-3px,-3px);
  transition:transform .3s var(--ease),border-color .3s var(--ease);
}
.job[open] .job-chev{transform:rotate(-135deg) translate(-3px,-3px);border-color:var(--accent)}
.job-body{padding:0 26px 26px;border-top:1px solid var(--border)}
```

```css
/* src/styles.css:1911 — current (the jobs container) */
.job-list{display:flex;flex-direction:column;gap:14px;margin-top:44px}
.job{
  background:var(--card);border:1px solid var(--border);border-radius:16px;
  box-shadow:var(--card-shadow);overflow:hidden;
  transition:border-color .3s var(--ease),box-shadow .3s var(--ease);
}
```

There is **no** `.job::details-content` rule anywhere in `src/styles.css` (verified:
`grep -c 'job.*details-content'` returns 0), which is why the body snaps.

**Frequency / purpose gate**: Occasional (a careers visitor expanding a role) →
eligible. Purpose = *preventing a jarring change* + cohesion with the FAQ. Passes.

## Target

Mirror the FAQ recipe exactly, so the job body expands with an eased height plus a
gentle fade/slide, identical in feel to the FAQ. Two things are required:

1. `interpolate-size:allow-keywords` must be in effect on an ancestor of `.job`,
   or `height:0 → height:auto` will not interpolate. The FAQ scopes this to its
   section (`#faq{…interpolate-size:allow-keywords}` at `src/styles.css:1412`).
   For jobs, add it to `.job-list` (an inherited property, so it reaches every
   `.job` and its `::details-content`).

2. The `::details-content` height transition + a reveal animation on `.job-body`,
   **reusing the existing `@keyframes faqReveal`** (defined at `src/styles.css:1461`
   — do NOT redefine it).

```css
/* target — add interpolate-size to the existing .job-list rule */
.job-list{
  display:flex;flex-direction:column;gap:14px;margin-top:44px;
  interpolate-size:allow-keywords;
}

/* target — new rules, placed with the other .job rules (after .job-body at :1945) */
.job::details-content{
  height:0;overflow:hidden;
  transition:height .35s var(--ease),content-visibility .35s allow-discrete;
  content-visibility:hidden;
}
.job[open]::details-content{height:auto;content-visibility:visible}
.job[open] .job-body{animation:faqReveal .4s var(--ease) .04s both}
```

```css
/* target — extend the existing reduced-motion guard at src/styles.css:2072 */
@media (prefers-reduced-motion:reduce){
  .job-apply,.ap-cta,.job-empty-cta,.job-chev{transition:none}
  .job-apply:hover,.ap-cta:hover,.job-empty-cta:hover{transform:none}
  .job::details-content{transition:none}
  .job[open] .job-body{animation:none}
}
```

Exact values, and why they are correct (not approximated): they are copied verbatim
from the working FAQ exemplar in this same stylesheet — `height .35s var(--ease)`
and `faqReveal .4s var(--ease) .04s both`. `--ease` is `cubic-bezier(.25,.1,.25,1)`
(defined `src/styles.css:63`). ~350–400ms sits within the accordion/drawer budget
(up to ~500ms). Reusing the sibling's exact timing is the point — the two
accordions should feel identical.

## Repo conventions to follow

- **This is a zero-dependency static build.** Edit `src/styles.css` (the source);
  never hand-edit the generated `careers/index.html` or other root `index.html`
  files — they are overwritten by `node build.js`, which inlines `styles.css` into
  every page.
- **Easing tokens** live in `:root` at `src/styles.css:63-65`: `--ease`,
  `--spring`, `--slow-spring`. Use `--ease` here (it is what the FAQ uses). Do not
  invent a new curve.
- **Exemplar to imitate — the FAQ accordion**, `src/styles.css:1447-1463`:

  ```css
  .faq-item::details-content{
    height:0;overflow:hidden;
    transition:height .35s var(--ease),content-visibility .35s allow-discrete;
    content-visibility:hidden;
  }
  .faq-item[open]::details-content{height:auto;content-visibility:visible}
  .faq-item[open] .faq-a{animation:faqReveal .4s var(--ease) .04s both}
  @keyframes faqReveal{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
  ```

  The job version targets `.job` / `.job-body` instead of `.faq-item` / `.faq-a`,
  and **shares the same `faqReveal` keyframe** — do not add a second keyframe.
- `.job` already has `overflow:hidden` (`src/styles.css:1914`), which is required so
  the collapsing body clips cleanly — no change needed there.

## Steps

1. **`src/styles.css:1911`** — in the existing `.job-list` rule, append
   `interpolate-size:allow-keywords;` (so the resulting rule is the four-declaration
   version shown under Target). Nothing else in that rule changes.
2. **`src/styles.css` — immediately after the `.job-body` declaration at line 1945**
   — add the three new rules from Target: `.job::details-content`,
   `.job[open]::details-content`, and `.job[open] .job-body`. Do **not** create a new
   `@keyframes` — `faqReveal` already exists at `:1461`.
3. **`src/styles.css:2072`** — inside the existing
   `@media (prefers-reduced-motion:reduce)` block that already lists
   `.job-apply,.ap-cta,.job-empty-cta,.job-chev`, add the two lines
   `.job::details-content{transition:none}` and `.job[open] .job-body{animation:none}`.
4. **Rebuild**: run `node build.js` from the repo root so the new CSS is inlined
   into all 19 pages (it prints one `Built …` line per page and finishes with
   `Built sitemap.xml — 19 URLs.`).

## Boundaries

- Do NOT touch `build.js` or the job markup — motion is pure CSS; the existing
  `<details>/<summary>/.job-body` structure needs no change.
- Do NOT touch the FAQ rules (`src/styles.css:1444-1466`) or the `faqReveal`
  keyframe — reuse it, do not duplicate or modify it.
- Do NOT hand-edit any generated `*/index.html` — only `src/styles.css`, then rebuild.
- Do NOT add new easing tokens, durations, or dependencies. Use `--ease` and the
  existing keyframe only.
- If the code at any cited line does not match the excerpt above (drift since commit
  `cb8a24e`), STOP and report rather than improvising placement.

## Verification

- **Mechanical**:
  - `node build.js` → succeeds, ends with `Built sitemap.xml — 19 URLs.`
  - `grep -c 'job::details-content' careers/index.html` → `2` (the transition rule +
    the `[open]` rule inlined).
  - `grep -c 'interpolate-size:allow-keywords' careers/index.html` → `2` (the
    pre-existing `#faq` scope is not on the careers page, so this counts the FAQ's
    only on pages that have it; on `careers/index.html` expect `1` from the new
    `.job-list` rule — confirm it is present).
  - `grep -c '@keyframes faqReveal' careers/index.html` → `1` (keyframe reused, not
    duplicated).
- **Feel check**: `node build.js`, then serve locally (`.claude/launch.json` →
  server name `thinklens`, port 8770) and open `/careers/`:
  - Expand a role. The body should **grow open with an eased height and a slight
    fade/slide**, not snap. It should feel identical to the FAQ accordion on the
    homepage (`/#faq`) — open one of each and compare.
  - Rapidly toggle the same role open/closed. Because this is a CSS transition (not a
    keyframe replay), the height should **retarget smoothly from its current value**,
    never restart from zero or jump.
  - In DevTools → Animations panel, set playback to 10% and confirm the height
    interpolates continuously (not a step) and the chevron rotation stays in sync.
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload, expand a
    role: the body should appear **instantly with no height animation and no
    fade/slide**, while the content itself is still fully shown (movement dropped,
    not the content).
- **Done when**: the job accordion expand is visually indistinguishable in feel from
  the FAQ accordion, it is interruptible under rapid toggling, and reduced-motion
  removes the movement while keeping the content readable.
