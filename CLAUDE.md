# CLAUDE.md — Thinklens website

Marketing site for **Thinklens Consulting LLP** (`https://www.thinklens.in`).
Single static landing page + a custom 404. India-based offshore data partner
(data governance, BI modernization, data quality) for global IT staffing agencies.

## ⚠️ Most important rule

**`index.html` and `404.html` are GENERATED. Never edit them by hand.**
Edit the source in `src/`, then run the build. Direct edits get overwritten.

```bash
node build.js     # or: npm run build   → regenerates index.html AND 404.html
```

Commit **both** your `src/` change and the regenerated `index.html` / `404.html`
(GitHub Pages serves the generated files from `main` root — there is **no CI build**).

## Architecture

Zero-dependency build (`build.js`) assembles components and **inlines** CSS + JS
into the output, so the deployed page makes no extra requests.

```
src/
  head.html            <head> meta, Open Graph, JSON-LD, favicons, font preloads
  styles.css           ALL css  (inlined into <style>)
  main.js              ALL js   (inlined into <script>)
  partials/*.html      15 body sections, ordered by SECTIONS[] in build.js:
                       body-open, nav, mobile-menu, hero, marquee, kinetic, about,
                       sectors, services, why, trust, cta, contact, footer, sticky-cta
  404-head.html, 404.css, 404.html   → 404 page (reuses styles.css + main.js)
build.js               src/ → index.html + 404.html (also injects the js-fade boot
                       script + a "GENERATED FILE" banner)
package.json           npm run build
```

- New section? Add `src/partials/<name>.html` **and** add `<name>` to `SECTIONS` in `build.js`.
- Section markers `<!-- ══ NAME ══ -->` live inside each partial.

## Conventions

- **One brand blue: `--accent #007AFF`** (Apple blue). `--accent-deep #006FE6` is used
  ONLY as a fill behind white text (buttons), for WCAG AA contrast. Never reintroduce
  other blues (e.g. `#3395ff`, `#66b3ff`) on solid text.
- **Dark-mode first.** Meets **WCAG 2.1 AA** text contrast — small/label text uses
  `--g400`, not `--g500`/`--g600` (those fail at small sizes). Keep it that way.
- **Self-hosted fonts** in `/fonts/` (`inter.woff2`, `plusjakarta.woff2` — latin variable,
  SIL OFL). Declared via `@font-face` + `font-display:swap` in `styles.css`, preloaded in
  the heads. **No Google Fonts** — don't add the `<link>` back.
- Brand spec: `Thinklens-Brand-Guidelines.docx` (Plus Jakarta Sans display, Inter body).
- `prefers-reduced-motion` is respected; keep new animations behind it.

## Behaviors (all in `src/main.js`, guarded so they no-op when absent)

Nav scroll bg · page transitions (fade in/out via `.js-fade`/`.page-ready`/`.page-leaving`) ·
scroll progress bar · mobile hamburger menu · sticky "Talk to us" CTA · count-ups ·
scroll reveals (`.r`→`.vis`) · kinetic text · magnetic buttons (`[data-magnetic]`) ·
ripple (`[data-ripple]`) · custom cursor (fine pointers only).

## Integrations

- **Contact form** → Formspree, `FORMSPREE_ID = 'xdapybyb'` in `main.js`.
- **Cal.com booking** → "Date & Time" field in the contact form (`#dtTrigger` reveals
  `#calForm`, lazy-loads inline `#cal-inline-form`). Link: `think-lens-consulting-kui4bb/30min`,
  dark theme, `cal-brand:#007AFF`. The container hugs the iframe (dark bg, no white space).
- **Google Analytics (GA4)** → gtag.js, measurement ID `G-0L4LLVDPN7`. Lives in the
  `<head>` of BOTH `src/head.html` and `src/404-head.html` (so 404 landings are tracked too).
  Loaded `async`; it's in the head verbatim (not part of the inlined JS).

## Root assets (served as-is)

`CNAME` (www.thinklens.in), favicons (`favicon.*`, `apple-touch-icon.png`),
`og-image.{png,jpg,svg}`, `sitemap.xml`, `robots.txt`, `site.webmanifest`,
`google5ea61d290b4d5cc5.html` (Search Console — keep it).

## Local preview

```bash
python3 -m http.server 8765 --directory /Users/spdinesh/Documents/thinklens_main
```
Always pass `--directory` explicitly (a bare server can bind to the wrong cwd and serve a
stale file). Note: a backgrounded/hidden preview tab freezes CSS transitions at opacity 0
and returns black screenshots — that's an environment artifact, not a bug.

## Deploy

```bash
git add -A && git commit -m "…" && git push origin main   # Pages auto-publishes (~1 min)
```
