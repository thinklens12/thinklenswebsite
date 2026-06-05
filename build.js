#!/usr/bin/env node
/*
 * Thinklens site build — zero dependencies.
 *
 * Assembles the component partials in src/ into a single, fully-inlined
 * index.html at the repo root (CSS and JS are inlined, so the deployed page
 * makes no extra requests — same performance as the original single file).
 *
 * Usage:  node build.js   (or: npm run build)
 *
 * Edit the source in src/, then re-run this to regenerate index.html.
 * GitHub Pages serves the generated index.html directly — no CI required.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8').replace(/\s+$/g, '');

// Body sections, in render order.
const SECTIONS = [
  'body-open', 'nav', 'mobile-menu', 'hero', 'marquee', 'kinetic', 'about',
  'sectors', 'services', 'why', 'trust', 'cta', 'contact', 'footer', 'sticky-cta',
];

const body = SECTIONS.map((name) => read('src', 'partials', name + '.html')).join('\n\n');

// Assemble with array-join (never template literals) so backticks / ${...}
// inside the CSS or JS can never interfere with the build.
const out = [
  '<!DOCTYPE html>',
  '<!-- GENERATED FILE — do not edit directly. Edit the components in src/ and run: node build.js -->',
  '<html lang="en">',
  '<head>',
  read('src', 'head.html'),
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

fs.writeFileSync(path.join(ROOT, 'index.html'), out);
console.log('Built index.html — ' + out.length + ' bytes from ' + SECTIONS.length + ' sections.');
