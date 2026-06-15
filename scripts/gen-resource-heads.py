#!/usr/bin/env python3
"""Generate patterned meta.html + jsonld.html for the /resources/ articles.
Body partials are hand-written. Re-runnable (overwrites head files)."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.thinklens.in/resources/"
DATE = "2026-06-15"

ARTICLES = {
    "power-bi-vs-tableau-vs-spotfire": {
        "title": "Tableau vs Power BI vs Spotfire: Which Should You Use? | Thinklens",
        "desc": "An honest comparison of Power BI, Tableau, and TIBCO Spotfire across cost, scale, governance, and skills — from a team that delivers enterprise BI on all three.",
        "headline": "Tableau vs Power BI vs Spotfire: Which Should You Use?",
        "crumb": "Tableau vs Power BI vs Spotfire",
        "ogalt": "Tableau vs Power BI vs Spotfire — comparison guide",
    },
    "what-is-etl-testing": {
        "title": "What Is ETL Testing? A Practical Guide with Examples | Thinklens",
        "desc": "What ETL testing is, why it matters, and the four test layers that prove data moved correctly from source to report — explained with examples.",
        "headline": "What Is ETL Testing, and Why Does It Matter?",
        "crumb": "What Is ETL Testing?",
        "ogalt": "What is ETL testing — a practical guide",
    },
    "etl-testing-tools-checklist": {
        "title": "ETL Testing Tools + a Source-to-Target QA Checklist | Thinklens",
        "desc": "The ETL testing tools teams actually use, plus a copy-ready source-to-target QA checklist for validating data pipelines before sign-off.",
        "headline": "ETL Testing Tools & a Source-to-Target QA Checklist",
        "crumb": "ETL Testing Tools & Checklist",
        "ogalt": "ETL testing tools and QA checklist",
    },
    "technical-business-analyst-role": {
        "title": "What Does a Technical Business Analyst Do? Role & Skills | Thinklens",
        "desc": "What a Technical Business Analyst does, the skills that make a BA 'technical,' and where a data-focused BA fits between business and engineering.",
        "headline": "What Does a Technical Business Analyst Do?",
        "crumb": "Technical Business Analyst Role",
        "ogalt": "What does a Technical Business Analyst do?",
    },
    "why-data-governance-matters": {
        "title": "Why Is Data Governance Important? (with Examples) | Thinklens",
        "desc": "What data governance controls, why regulated industries like aerospace and biomedical can't skip it, and where governance actually pays off.",
        "headline": "Why Is Data Governance Important?",
        "crumb": "Why Data Governance Matters",
        "ogalt": "Why is data governance important?",
    },
}


def esc(s):
    return s.replace("&", "&amp;")


def meta_html(slug, a):
    url = BASE + slug + "/"
    og = "https://www.thinklens.in/og/resources-" + slug + ".png"
    t, d = esc(a["title"]), esc(a["desc"])
    return f"""<title>{t}</title>
<meta name="description" content="{d}">
<meta name="author" content="Thinklens Consulting LLP">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">

<!-- ── Open Graph ── -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="Thinklens">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{og}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(a['ogalt'])}">
<meta property="og:locale" content="en_US">

<!-- ── Twitter / X ── -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{og}">
<meta name="twitter:image:alt" content="{esc(a['ogalt'])}">
"""


def jsonld_html(slug, a):
    url = BASE + slug + "/"
    og = "https://www.thinklens.in/og/resources-" + slug + ".png"
    graph = [
        {
            "@type": "Article",
            "@id": url + "#article",
            "headline": a["headline"],
            "description": a["desc"],
            "datePublished": DATE,
            "dateModified": DATE,
            "author": {"@id": "https://www.thinklens.in/#organization"},
            "publisher": {"@id": "https://www.thinklens.in/#organization"},
            "image": og,
            "mainEntityOfPage": url,
            "inLanguage": "en-US",
        },
        {
            "@type": "Organization",
            "@id": "https://www.thinklens.in/#organization",
            "name": "Thinklens Consulting LLP",
            "url": "https://www.thinklens.in/",
        },
        {
            "@type": "BreadcrumbList",
            "@id": url + "#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.thinklens.in/"},
                {"@type": "ListItem", "position": 2, "name": "Resources", "item": BASE},
                {"@type": "ListItem", "position": 3, "name": a["crumb"], "item": url},
            ],
        },
    ]
    body = {"@context": "https://schema.org", "@graph": graph}
    return ("<!-- ── Structured data (JSON-LD) ── -->\n"
            '<script type="application/ld+json">\n'
            + json.dumps(body, indent=2, ensure_ascii=False) + "\n</script>\n")


for slug, a in ARTICLES.items():
    d = os.path.join(ROOT, "src", "pages", "resources", slug)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "meta.html"), "w", encoding="utf-8") as f:
        f.write(meta_html(slug, a))
    with open(os.path.join(d, "jsonld.html"), "w", encoding="utf-8") as f:
        f.write(jsonld_html(slug, a))
    print("Wrote heads for", slug)
