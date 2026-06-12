#!/usr/bin/env node
/*
 * Thinklens site build — zero dependencies, multi-page capable.
 *
 * Reads:
 *   - src/head.html               homepage <head> (per-page; sub-pages will get their own)
 *   - src/styles.css              shared CSS (inlined into every page)
 *   - src/main.js                 shared JS  (inlined into every page)
 *   - src/partials/shared/*.html  used on every page (nav, footer, etc.)
 *   - src/partials/common/*.html  used on more than one page
 *   - src/partials/home/*.html    homepage-only sections
 *
 * Emits:
 *   - index.html        homepage
 *   - <route>/index.html  for each non-home entry in PAGES (when added)
 *   - 404.html          custom 404
 *
 * Template substitution applied to every partial:
 *   {{HOME}}       → ''  on homepage,   '/' on sub-pages  (so links like
 *                     href="{{HOME}}#about" resolve to "#about" / "/#about")
 *   {{HOME_ROOT}}  → '#' on homepage,   '/' on sub-pages  (used by the logo
 *                     so the homepage logo stays a no-op anchor and sub-page
 *                     logos jump back to /)
 *
 * Usage:  node build.js   (or: npm run build)
 *
 * Edit the source in src/, then re-run this to regenerate the output. GitHub
 * Pages serves the generated HTML directly — no CI required.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8').replace(/\s+$/g, '');

// Runs before first paint so the page starts hidden only when JS is on
// (no-JS users never see a blank page). Drives the fade-in/out transitions.
const FADE_BOOT = "<script>document.documentElement.classList.add('js-fade')</script>";

// Apply the page-route template substitutions to one chunk of HTML.
function applyTpl(content, route) {
  const isHome = route === '/';
  return content
    .replace(/\{\{HOME\}\}/g, isHome ? '' : '/')
    .replace(/\{\{HOME_ROOT\}\}/g, isHome ? '#' : '/');
}

// Read a partial by its path under src/partials/ (e.g. 'shared/nav').
const readPartial = (relPath, route) =>
  applyTpl(read('src', 'partials', relPath + '.html'), route);

// Per-page configs. The order of `partials` is the rendered body order.
// `sitemap` controls what shows up in sitemap.xml — omit to exclude a page.
// Sub-pages will be added here in subsequent steps.
const PAGES = [
  {
    route: '/',
    metaFile: 'pages/home/meta.html',
    jsonldFile: 'pages/home/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'home/hero',
      'common/marquee',
      'home/kinetic',
      'home/about',
      'home/sectors',
      'home/services',
      'home/why',
      'common/trust',
      'home/faq',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '1.0',
      changefreq: 'monthly',
      image: {
        loc: 'https://www.thinklens.in/og-image.png',
        title: 'Thinklens — Data Precision. Global Scale.',
        caption: "India's premier offshore data partner for global IT staffing agencies.",
      },
    },
  },
  {
    route: '/about/',
    metaFile: 'pages/about/meta.html',
    jsonldFile: 'pages/about/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'about/intro',
      'about/story',
      'about/expertise',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.8',
      changefreq: 'monthly',
    },
  },
  {
    route: '/services/etl-testing-report-qa/',
    metaFile: 'pages/services/etl-testing-report-qa/meta.html',
    jsonldFile: 'pages/services/etl-testing-report-qa/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'services/etl-testing-report-qa/body',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.9',
      changefreq: 'monthly',
    },
  },
  {
    route: '/services/sap-workday-data/',
    metaFile: 'pages/services/sap-workday-data/meta.html',
    jsonldFile: 'pages/services/sap-workday-data/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'services/sap-workday-data/body',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.9',
      changefreq: 'monthly',
    },
  },
  {
    route: '/services/power-bi-tableau-spotfire/',
    metaFile: 'pages/services/power-bi-tableau-spotfire/meta.html',
    jsonldFile: 'pages/services/power-bi-tableau-spotfire/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'services/power-bi-tableau-spotfire/body',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.9',
      changefreq: 'monthly',
    },
  },
  {
    route: '/services/data-governance-technical-ba/',
    metaFile: 'pages/services/data-governance-technical-ba/meta.html',
    jsonldFile: 'pages/services/data-governance-technical-ba/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'services/data-governance-technical-ba/body',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.9',
      changefreq: 'monthly',
    },
  },
  {
    route: '/services/data-quality-cleanup/',
    metaFile: 'pages/services/data-quality-cleanup/meta.html',
    jsonldFile: 'pages/services/data-quality-cleanup/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'services/data-quality-cleanup/body',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.9',
      changefreq: 'monthly',
    },
  },
  {
    route: '/case-studies/',
    metaFile: 'pages/case-studies/meta.html',
    jsonldFile: 'pages/case-studies/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'case-studies/body',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.8',
      changefreq: 'monthly',
    },
  },
  {
    route: '/engagement-models/',
    metaFile: 'pages/engagement-models/meta.html',
    jsonldFile: 'pages/engagement-models/jsonld.html',
    partials: [
      'shared/body-open',
      'shared/nav',
      'shared/mobile-menu',
      'engagement-models/body',
      'common/trust',
      'common/cta',
      'common/contact',
      'shared/footer',
      'shared/sticky-cta',
    ],
    sitemap: {
      priority: '0.8',
      changefreq: 'monthly',
    },
  },
];

// Render head from head-base.html with {{PAGE_META}} / {{PAGE_JSONLD}} substitutions.
// Replacement values are passed as functions (not strings) so any literal `$` in
// the content (e.g. `"priceRange": "$$$"` in JSON-LD) isn't interpreted as a
// String.replace pattern token like $$ or $&.
function renderHead(page) {
  const base = read('src', 'head-base.html');
  const meta = page.metaFile ? read('src', page.metaFile) : '';
  const jsonld = page.jsonldFile ? read('src', page.jsonldFile) : '';
  return base
    .replace('{{PAGE_META}}', () => meta)
    .replace('{{PAGE_JSONLD}}', () => jsonld);
}

// Render and write each page.
for (const page of PAGES) {
  const head = renderHead(page);
  const body = page.partials.map((p) => readPartial(p, page.route)).join('\n\n');

  // Assemble with array-join (never template literals) so backticks / ${...}
  // inside the CSS or JS can never interfere with the build.
  const out = [
    '<!DOCTYPE html>',
    '<!-- GENERATED FILE — do not edit directly. Edit the components in src/ and run: node build.js -->',
    '<html lang="en">',
    '<head>',
    FADE_BOOT,
    head,
    '<style>',
    read('src', 'styles.css'),
    '</style>',
    '</head>',
    '<body>',
    body,
    '<script>',
    read('src', 'main.js'),
    '</script>',
    '</body>',
    '</html>',
    '', // trailing newline
  ].join('\n');

  const isHome = page.route === '/';
  const outPath = isHome
    ? path.join(ROOT, 'index.html')
    : path.join(ROOT, page.route.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  const label = isHome ? 'index.html' : page.route.replace(/^\//, '') + 'index.html';
  console.log('Built ' + label + ' — ' + out.length + ' bytes from ' + page.partials.length + ' sections.');
}

// ── 404 page ── (reuses the shared styles.css + main.js so it matches the
// site exactly; GitHub Pages serves 404.html automatically for missing paths)
const out404 = [
  '<!DOCTYPE html>',
  '<!-- GENERATED FILE — do not edit directly. Edit src/404*.* and run: node build.js -->',
  '<html lang="en">',
  '<head>',
  FADE_BOOT,
  read('src', '404-head.html'),
  '<style>',
  read('src', 'styles.css'),
  read('src', '404.css'),
  '</style>',
  '</head>',
  '<body>',
  read('src', '404.html'),
  '<script>',
  read('src', 'main.js'),
  '</script>',
  '</body>',
  '</html>',
  '',
].join('\n');

fs.writeFileSync(path.join(ROOT, '404.html'), out404);
console.log('Built 404.html   — ' + out404.length + ' bytes.');

// ── sitemap.xml ── generated from PAGES so it never drifts from reality.
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const SITEMAP_BASE = 'https://www.thinklens.in';
const sitemapEntries = PAGES.filter((p) => p.sitemap).map((p) => {
  const sm = p.sitemap;
  const lines = [
    '  <url>',
    '    <loc>' + SITEMAP_BASE + p.route + '</loc>',
    '    <lastmod>' + todayISO() + '</lastmod>',
    '    <changefreq>' + (sm.changefreq || 'monthly') + '</changefreq>',
    '    <priority>' + sm.priority + '</priority>',
  ];
  if (sm.image) {
    lines.push('    <image:image>');
    lines.push('      <image:loc>' + sm.image.loc + '</image:loc>');
    lines.push('      <image:title>' + sm.image.title + '</image:title>');
    lines.push('      <image:caption>' + sm.image.caption + '</image:caption>');
    lines.push('    </image:image>');
  }
  lines.push('  </url>');
  return lines.join('\n');
}).join('\n');

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  sitemapEntries,
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
console.log('Built sitemap.xml — ' + PAGES.filter((p) => p.sitemap).length + ' URL' + (PAGES.filter((p) => p.sitemap).length === 1 ? '' : 's') + '.');
