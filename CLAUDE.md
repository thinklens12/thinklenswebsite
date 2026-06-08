# CLAUDE.md — Thinklens website

Marketing site for **Thinklens Consulting LLP** (`https://www.thinklens.in`).
Multi-page static site (6 URLs) + a custom 404. India-based offshore Data & BI
consulting partner for global IT staffing agencies. Live routes:

- `/` — homepage (positioning, services chips, FAQ, contact)
- `/about/` — who Thinklens is, how the practice was built
- `/services/etl-testing-report-qa/` — ETL pipeline validation + BI Report QA
- `/services/sap-workday-data/` — SAP S/4HANA/ECC/MM + Workday data services
- `/services/power-bi-tableau-spotfire/` — enterprise BI delivery on the three tools
- `/engagement-models/` — T&M, Fixed-Scope, MSA Sub-Contracting, B2B Freelance

## ⚠️ Most important rule

**Every `index.html`, `404.html`, and `sitemap.xml` is GENERATED. Never edit them by hand.**
Edit the source in `src/`, then run the build. Direct edits get overwritten on next build.

```bash
node build.js     # or: npm run build   → regenerates ALL pages + sitemap + 404
```

Commit **both** your `src/` change and the regenerated output files
(GitHub Pages serves the generated files from `main` root — there is **no CI build**).

## Architecture

Zero-dependency build (`build.js`) assembles components and **inlines** CSS + JS
into the output, so the deployed page makes no extra requests.

```
src/
  head-base.html       Shared <head> (charset, GA4, favicons, font preloads) with
                       {{PAGE_META}} and {{PAGE_JSONLD}} placeholders that get
                       filled per-page by build.js.
  pages/<route>/meta.html    Per-page title/description/robots/canonical/OG/Twitter.
  pages/<route>/jsonld.html  Per-page JSON-LD graph (often referencing shared
                       Organization/WebSite via @id rather than redefining them).
  styles.css           ALL css  (inlined into <style> on every page)
  main.js              ALL js   (inlined into <script> on every page)
  partials/shared/     used on every page: body-open, nav, mobile-menu, footer, sticky-cta
  partials/common/     reused by 2+ pages:   marquee, trust, cta, contact
  partials/home/       homepage-only:        hero, kinetic, about, sectors, services,
                                             why, faq
  partials/about/      /about/ body sections: intro, story, expertise
  partials/services/<slug>/body.html    one body partial per service page
  partials/engagement-models/body.html  /engagement-models/ body
  404-head.html, 404.css, 404.html   → 404 page (reuses styles.css + main.js)
build.js               walks PAGES[] → emits 1 index.html per route + sitemap.xml
                       + 404.html (also injects the js-fade boot script + a
                       "GENERATED FILE" banner)
package.json           npm run build
```

- **Multi-page capable.** `build.js` reads a `PAGES[]` array; each entry declares
  `route` (e.g. `/`, `/about/`), `headFile`, `partials[]` (in body render order), and
  an optional `sitemap` config. Homepage emits to repo-root `index.html`; sub-pages
  emit to `<route>/index.html`. The `sitemap.xml` is **generated** from `PAGES[].sitemap`
  — single source of truth, no hand edits.
- **`{{HOME}}` / `{{HOME_ROOT}}` template substitution** is applied to every partial.
  Source partials use `href="{{HOME}}#about"` so the same nav works everywhere:
  - On `/`: `{{HOME}}` → `''` → `href="#about"` (in-page scroll, unchanged behavior)
  - On `/about/`: `{{HOME}}` → `'/'` → `href="/#about"` (cross-page jump to homepage anchor)
  - Logo uses `{{HOME_ROOT}}` (`'#'` on home, `'/'` on sub-pages).
- New section on homepage? Add `src/partials/home/<name>.html` **and** add
  `'home/<name>'` to the homepage `partials[]` array in `build.js`.
- New sub-page? Add a new entry to `PAGES[]` with its own `metaFile`,
  `jsonldFile`, `partials[]`, and `sitemap` config. Per-page head fragments live
  under `src/pages/<route>/`. Per-page body partials live under `src/partials/<route>/`.
  Sub-pages reuse `.page-top` / `.page-h1` / `.page-deck` for the intro and
  `.page-section` (+ optional `.alt` modifier) / `.exp-grid` / `.exp-card` for
  body sections — no new CSS unless you genuinely need it.
- **`$$$` gotcha** in JSON-LD (`"priceRange": "$$$"`) — `String.replace()` interprets
  `$$` as a literal `$` in the replacement string, eating one `$`. `build.js`
  works around this by passing the replacement as a function (functions skip the
  pattern interpretation). Don't switch back to the string form.
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
- **Favicons are transparent** (alpha 0 background). The SVG is the source of truth; PNGs
  + `.ico` are rasterized from it. If you regenerate them, keep the background transparent
  — don't bake a white tile back in (iOS will mask the apple-touch icon to whatever
  background it's pinned on).

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
- **Google Analytics (GA4)** → gtag.js, measurement ID `G-0L4LLVDPN7`. Lives in
  `src/head-base.html` (so it ships on every multi-page emit) and `src/404-head.html`
  (so 404 landings are tracked too). Loaded `async`; in the head verbatim, not part
  of the inlined JS.
- **Google Search Console** verified — keep `google5ea61d290b4d5cc5.html` in the repo root.

## SEO

Each page needs mutual reinforcement across **meta + JSON-LD + visible copy** — meta alone
is keyword stuffing, and `<meta name="keywords">` is ignored by Google (removed from this
site, don't add it back). The real entity-graph wins are in JSON-LD:

- **Homepage** (`src/pages/home/jsonld.html`) holds the canonical graph: `Organization`,
  `ProfessionalService` (with `OfferCatalog`), `FAQPage`, `WebSite`. This is where
  `knowsAbout` lives — flat list of capabilities (Data Governance, Technical BA,
  ETL Testing, Report QA, Data Stewardship, Power BI, Tableau, TIBCO Spotfire,
  SAP S/4HANA / ECC / MM, Workday Data, SQL). Add new capabilities here when
  claimed elsewhere on the site.
- **`OfferCatalog`** — every claimed service has a corresponding `Offer` entry, and
  each `Offer.itemOffered` has a `url` pointing to its dedicated page where one
  exists. Wire new pages by adding `url` here so Google can follow Offer → Service → page.
- **Sub-pages** (`src/pages/<route>/jsonld.html`) reference `Organization` and
  `WebSite` via `@id` (don't redefine them — Google merges by `@id`). Each adds a
  page-specific entity (`Service` / `AboutPage` / `WebPage`) and a `BreadcrumbList`.
- **`FAQPage` is homepage-only.** Google requires the schema to match a visible FAQ
  on the same page; don't add it to sub-pages without also adding the FAQ section.

Visible support on the homepage lives in the **services chips**
(`src/partials/home/services.html`) and the **engagement-types line** in contact.
On sub-pages the body partials provide the visible evidence. Don't add a capability
to any JSON-LD without a visible mention somewhere on the same page — Google's
helpful-content system demotes claims with no on-page evidence. And don't claim
capabilities the business doesn't actually deliver.

## Root assets (served as-is)

`CNAME` (www.thinklens.in), favicons (`favicon.*`, `apple-touch-icon.png` — all transparent
PNG/ICO rasterized from `favicon.svg`), `og-image.{png,svg}` (PNG is the canonical OG
image; SVG is a vector reference; .jpg was removed as a duplicate), `robots.txt`
(hand-edited — explicit AI-crawler Allow/Disallow blocks), `llms.txt` (hand-edited —
AI-discovery file; **update when adding sub-pages**), `site.webmanifest`,
`google5ea61d290b4d5cc5.html` (Search Console — keep it). **`sitemap.xml` is
GENERATED by `build.js`** — don't hand-edit.

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
