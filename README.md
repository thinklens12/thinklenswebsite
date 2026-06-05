# Thinklens website

The marketing site for **Thinklens Consulting LLP** — `https://www.thinklens.in/`.

A single static landing page, split into editable components with a tiny
zero-dependency build step. The build inlines all CSS and JS into one
`index.html`, so the deployed page makes **no extra requests** (same
performance as a hand-written single file).

## Project structure

```
src/
  head.html              <head> meta, Open Graph, favicons, JSON-LD
  styles.css             all CSS (inlined into <style> at build time)
  main.js                all JS  (inlined into <script> at build time)
  partials/
    body-open.html       scroll-progress bar + custom cursor nodes
    nav.html             top navigation
    mobile-menu.html     hamburger / mobile menu
    hero.html            hero section
    marquee.html         scrolling capability strip
    kinetic.html         scroll-lit kinetic text
    about.html           about + animated SVG
    sectors.html         industry sectors
    services.html        services + animated flow SVG
    why.html             why-partner cards
    trust.html           compliance badges
    cta.html             mid-page call-to-action
    contact.html         contact form
    footer.html          footer + LinkedIn
    sticky-cta.html      floating "Talk to us" button
build.js                 assembles src/ -> index.html (zero dependencies)
package.json             `npm run build` -> node build.js
index.html               GENERATED — do not edit by hand
```

## Editing & building

1. Edit the relevant file in `src/` (a partial, `styles.css`, or `main.js`).
2. Regenerate the page:
   ```bash
   node build.js      # or: npm run build
   ```
3. Commit **both** your `src/` change and the regenerated `index.html`.

> `index.html` is a generated artifact but is committed to the repo because
> GitHub Pages serves it directly from the `main` branch root (no CI build).
> Always edit `src/`, never `index.html` — your changes there are overwritten
> on the next build.

## Deploying

GitHub Pages serves the repo root of `main`. Push `index.html` (plus the
`src/` sources and any assets) and Pages publishes within ~1 minute.

```bash
git add -A
git commit -m "..."
git push origin main
```

The domain is configured via `CNAME` (`www.thinklens.in`).

## Assets

Favicons, `og-image.*`, `sitemap.xml`, `robots.txt`, `site.webmanifest`, and
the Google verification file live at the repo root and are served as-is.
