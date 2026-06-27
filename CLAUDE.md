# CLAUDE.md — Thinklens website

Marketing site for **Thinklens Consulting LLP** (`https://www.thinklens.in`).
Multi-page static site (18 URLs) + a custom 404. **Positioning:** a remote IT
consulting partner for staffing agencies, freelancers, HR partners, and businesses
needing long-term, short-term, or overflow capacity on short notice. **Data & BI is
the proven core specialty** (governance, ETL testing, BI, SAP/Workday, data quality);
project support, ongoing support, and training round it out. MSA / silent-sub-contractor
is now one engagement model (for agencies), not the whole thesis — keep that copy where
it describes the agency path; don't reintroduce it as the site-wide proposition.
Don't claim general-IT capabilities the business doesn't actually deliver. Live routes:

- `/` — homepage (positioning, services list, FAQ, contact)
- `/about/` — who Thinklens is, how the practice was built
- `/services/etl-testing-report-qa/` — ETL pipeline validation + BI Report QA
- `/services/sap-workday-data/` — SAP S/4HANA/ECC/MM + Workday data services
- `/services/power-bi-tableau-spotfire/` — enterprise BI delivery on the three tools
- `/services/data-governance-technical-ba/` — governance, MDM, Technical BA
- `/services/data-quality-cleanup/` — audits, dedup, schema remediation, analysis
- `/services/project-support/` — overflow / deadline / gap cover (on short notice)
- `/services/support-maintenance/` — run-the-lights monitoring, fixes, enhancements, SLAs
- `/services/training/` — remote hands-on BI/SQL/ETL/governance training
- `/case-studies/` — 3 anonymized studies (Aerospace, Biomedical, CPG); outcomes
  are intentionally qualitative — add real metrics only with owner sign-off
- `/engagement-models/` — T&M, Fixed-Scope, MSA Sub-Contracting, B2B Freelance
- `/resources/` — guides hub (top-of-funnel/AEO content) + 5 articles:
  `power-bi-vs-tableau-vs-spotfire`, `what-is-etl-testing`,
  `etl-testing-tools-checklist`, `technical-business-analyst-role`,
  `why-data-governance-matters`. Each = citable lead + `.article-prose` body
  + CTA to a service page. Add new guides under `src/pages/resources/<slug>/`
  + `src/partials/resources/<slug>/body.html`; run `scripts/gen-resource-heads.py`
  for the patterned meta/jsonld (Article + BreadcrumbList).

**Internal linking:** nav + footer link the *real* page URLs (footer is a 3-column
hub: Services / Company / On-this-site). Don't revert these to homepage-anchor-only
links — orphaned pages were a flagged SEO issue. Homepage service items also deep-link
to service pages.

**Entity signals:** `sameAs` + footer now point to the real LinkedIn *company* page
(`https://www.linkedin.com/company/thinklens-consulting/`). One audit upgrade remains:
the public email is still `thinklensconsulting@gmail.com` (kept because it's the real
working inbox). If a domain mailbox (`hello@thinklens.in`) is set up, swap it in JSON-LD
(`src/pages/home/jsonld.html`), `footer.html`, `cta.html`, `contact.html`,
`mobile-menu.html`, and `llms.txt`. Leave the `FREE_MAIL` list in `main.js` alone
(it legitimately lists `gmail.com` for lead tagging).

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
                       + page-top-vis (animated sub-page hero backdrop — added to
                       every sub-page's partials[] right before its body partial)
  partials/common/     reused by 2+ pages:   marquee, trust, cta, contact
  partials/home/       homepage-only:        hero, kinetic, about, sectors, services,
                                             why, faq
  partials/about/      /about/ body sections: intro, story, expertise
  partials/services/<slug>/body.html    one body partial per service page
  partials/case-studies/body.html       /case-studies/ body
  partials/engagement-models/body.html  /engagement-models/ body
  partials/resources/index.html         /resources/ hub (article cards)
  partials/resources/<slug>/body.html   one body partial per guide article
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

- **Contact form** → Formspree, `FORMSPREE_ID = 'xdapybyb'` in `main.js`. The submit
  handler also does **lead tagging**: appends `lead_type` (`corporate`/`free`, via the
  `FREE_MAIL` domain list) + `email_domain` to the payload, and rewrites `_subject` to
  "MSA / Partnership Enquiry — …" for MSA/Sub-Contracting enquiry types (inbox routing).
- **Cal.com booking** → "Date & Time" field in the contact form (`#dtTrigger` reveals
  `#calForm`, lazy-loads inline `#cal-inline-form`). Link: `think-lens-consulting-kui4bb/30min`,
  dark theme, `cal-brand:#007AFF`. The container hugs the iframe (dark bg, no white space).
- **Google Analytics (GA4)** → gtag.js, measurement ID `G-0L4LLVDPN7`. Lives in
  `src/head-base.html` (so it ships on every multi-page emit) and `src/404-head.html`
  (so 404 landings are tracked too). Loaded `async`; in the head verbatim, not part
  of the inlined JS. **Conversion events** fire from `main.js`: `generate_lead`
  (Formspree success — enquiry_type/region/lead_type), `book_appointment` (Cal.com
  `bookingSuccessful`), `cta_click` (delegated on `.btn`/`.trust-link`/`.sticky-cta`/
  `.nav-cta`). Every call is guarded (`typeof window.gtag === 'function'`) so the site
  works with GA blocked — keep new events behind the same guard.
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
PNG/ICO rasterized from `favicon.svg`), `og-image.{png,svg}` (homepage OG image; SVG is a
vector reference; .jpg was removed as a duplicate), `og/<slug>.png` (per-sub-page OG
images, 1200×630 — regenerate with `python3 scripts/gen-og-images.py` after adding a
page; needs `pip install --user pillow fonttools brotli`), `robots.txt`
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
