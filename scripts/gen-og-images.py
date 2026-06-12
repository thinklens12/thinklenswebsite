#!/usr/bin/env python3
"""Generate per-page OG images (1200x630) for thinklens.in sub-pages.

Renders the brand fonts (fonts/*.woff2, converted to TTF on the fly) on the
site's dark background with the Apple-blue accent. The homepage keeps its
designed og-image.png — this script only covers sub-pages.

Usage:  python3 scripts/gen-og-images.py     (re-run after adding a page below)
Deps:   pip install --user pillow fonttools brotli
"""
import os
import tempfile

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'og')

W, H = 1200, 630
SS = 2  # supersample factor for crisp text
BG = (10, 10, 10)          # --bg
WHITE = (255, 255, 255)
GREY = (142, 142, 147)     # --g400
ACCENT = (0, 122, 255)     # --accent

# slug -> (title lines, subtitle)
PAGES = {
    'about': (['About', 'Thinklens.'], 'Data made simple. Compliance made easy.'),
    'services-etl-testing-report-qa': (['ETL Testing &', 'Report QA.'], 'Pipelines you can sign off on — offshore.'),
    'services-sap-workday-data': (['SAP & Workday', 'Data Services.'], 'S/4HANA · ECC · MM · Workday — stewarded offshore.'),
    'services-power-bi-tableau-spotfire': (['Power BI. Tableau.', 'Spotfire.'], 'Enterprise BI delivery at Fortune 500 standards.'),
    'services-data-governance-technical-ba': (['Data Governance &', 'Technical BA.'], 'Govern the data. Bridge the business.'),
    'services-data-quality-cleanup': (['Data Quality &', 'Cleanup.'], 'Messy data in. Clean answers out.'),
    'case-studies': (['Proof, not', 'promises.'], 'Aerospace · Biomedical · CPG — anonymized under NDA.'),
    'engagement-models': (['Engagement', 'Models.'], 'T&M · Fixed Scope · MSA Sub-Contracting · B2B Freelance.'),
}


def woff2_to_ttf(woff2_path):
    f = TTFont(woff2_path)
    f.flavor = None
    out = tempfile.NamedTemporaryFile(suffix='.ttf', delete=False)
    f.save(out.name)
    return out.name


def load(ttf, size, weight):
    font = ImageFont.truetype(ttf, size)
    try:  # variable fonts — pick the weight axis instance
        font.set_variation_by_axes([weight])
    except OSError:
        pass
    return font


def main():
    os.makedirs(OUT, exist_ok=True)
    jakarta = woff2_to_ttf(os.path.join(ROOT, 'fonts', 'plusjakarta.woff2'))
    inter = woff2_to_ttf(os.path.join(ROOT, 'fonts', 'inter.woff2'))

    f_brand = load(jakarta, 34 * SS, 800)
    f_title = load(jakarta, 86 * SS, 800)
    f_sub = load(inter, 30 * SS, 400)
    f_url = load(inter, 26 * SS, 500)

    for slug, (title_lines, subtitle) in PAGES.items():
        img = Image.new('RGB', (W * SS, H * SS), BG)
        d = ImageDraw.Draw(img)

        # soft accent glow, upper right (drawn as layered transparent ellipses)
        glow = Image.new('L', (W * SS, H * SS), 0)
        gd = ImageDraw.Draw(glow)
        cx, cy, r = int(W * SS * 0.92), int(H * SS * 0.12), int(380 * SS)
        for i in range(r, 0, -8 * SS):
            gd.ellipse([cx - i, cy - i, cx + i, cy + i], fill=int(26 * (1 - i / r)))
        img = Image.composite(Image.new('RGB', img.size, ACCENT), img, glow)
        d = ImageDraw.Draw(img)

        margin = 80 * SS
        # brand row: blue dot + wordmark
        d.ellipse([margin, margin + 8 * SS, margin + 22 * SS, margin + 30 * SS], fill=ACCENT)
        d.text((margin + 38 * SS, margin), 'Thinklens', font=f_brand, fill=WHITE)

        # title block, vertically centered-ish
        y = int(H * SS * 0.34)
        for i, line in enumerate(title_lines):
            # last title line gets the accent color (mirrors the site's .a spans)
            fill = ACCENT if i == len(title_lines) - 1 else WHITE
            d.text((margin, y), line, font=f_title, fill=fill)
            y += int(100 * SS)

        d.text((margin, y + 16 * SS), subtitle, font=f_sub, fill=GREY)

        # footer url + accent underline
        d.rectangle([margin, H * SS - 96 * SS, margin + 56 * SS, H * SS - 90 * SS], fill=ACCENT)
        d.text((margin, H * SS - 78 * SS), 'thinklens.in', font=f_url, fill=GREY)

        img = img.resize((W, H), Image.LANCZOS)
        path = os.path.join(OUT, slug + '.png')
        img.save(path, optimize=True)
        print('Wrote', os.path.relpath(path, ROOT), img.size)


if __name__ == '__main__':
    main()
