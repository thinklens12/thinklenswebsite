#!/usr/bin/env python3
"""One-shot: append a visible FAQ section + matching FAQPage JSON-LD to each
service page. Run once; the content then lives in the partials/jsonld files.

Visible answer text (HTML, & escaped) and JSON-LD text (plain &) are generated
from the same source strings so they always match — Google requires the FAQ
schema to mirror visible on-page content.
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# slug -> list of (question, answer) in plain text (no HTML entities)
FAQS = {
    "etl-testing-report-qa": [
        ("What does your ETL testing process cover?",
         "End-to-end pipeline validation — source-to-target reconciliation, transformation-logic unit tests, referential-integrity and regression suites, and data-quality gates — typically reaching 95%+ test coverage against documented acceptance criteria before sign-off."),
        ("Which BI tools do you run Report QA against?",
         "Power BI, Tableau, and TIBCO Spotfire. We validate DAX and calculated-field measures, row-level security, drill-through paths, and visual accuracy against known totals."),
        ("How do you engage and price ETL testing?",
         "As a silent sub-contractor under your MSA, on Time & Materials or Fixed-Scope terms. Pre-vetted testers can typically start within 1–2 weeks of a signed SOW."),
    ],
    "power-bi-tableau-spotfire": [
        ("Do you cover Power BI, Tableau, and Spotfire with one team?",
         "Yes. We run a single senior bench across all three; each consultant has 5+ years on a primary platform plus working fluency in another, so there is no delivery gap when a client switches tools."),
        ("Can you modernize or migrate legacy reports?",
         "Yes — we re-platform SSRS, Cognos, BusinessObjects, or older Tableau onto your client's current BI tool with parity testing, so users notice only the performance improvement."),
        ("Do you support embedded or white-label BI?",
         "Yes — Power BI Embedded, Tableau JS API, and Spotfire JavaScript API integrations into client-facing portals, designed for agency partners who white-label the work."),
    ],
    "data-governance-technical-ba": [
        ("What does your data governance service include?",
         "Stewardship frameworks (ownership, RACI, business glossaries), master data management with survivorship rules, policy and source-to-report lineage mapped to GDPR, HIPAA, and SOC 2, and quality KPIs published on a stewardship dashboard."),
        ("What makes your Technical BAs technical?",
         "They query source systems themselves, draft data models and source-to-target mappings, and prototype in SQL, Power BI, Tableau, or Spotfire — so engineering builds from validated specs, not guesses."),
        ("Do you handle SAP and Workday master data?",
         "Yes — golden-record and survivorship rules across SAP MM and Workday worker-data domains, with documented lineage and change control."),
    ],
    "data-quality-cleanup": [
        ("What does a data cleanup engagement involve?",
         "Audit and profiling ranked by business impact, deduplication with domain-tuned match rules and survivorship logic, schema remediation via staged migrations, and standardization with validation rules wired in at entry."),
        ("Is your deduplication reversible?",
         "Yes — merges run with full before/after lineage and agreed survivorship rules; the process is reversible, never destructive."),
        ("Can you prepare data for an SAP or Workday migration?",
         "Yes — cleanup is scoped for what's next (SAP S/4HANA, Workday, or warehouse consolidation) so the new system goes live on data that has already been through quarantine."),
    ],
    "sap-workday-data": [
        ("Which SAP areas do you cover?",
         "SAP S/4HANA (migration testing and data validation), ECC (steady-state stewardship and reporting), and MM (material-master cleanup and harmonization), plus cross-SAP master-data governance frameworks."),
        ("What Workday data work do you do?",
         "Workday RaaS and EIB reporting integrations into Snowflake, BigQuery, or Synapse; worker, position, and org stewardship and reconciliation; and downstream HR and workforce BI in Power BI, Tableau, or Spotfire."),
        ("How do engagements start?",
         "With a signed one-page scope brief before kickoff, pairing a Technical BA with a hands-on data engineer, delivered under your MSA."),
    ],
}

BASE = "https://www.thinklens.in/services/"


def visible_faq(slug, qas):
    items = []
    for q, a in qas:
        items.append(
            '      <details class="faq-item">\n'
            '        <summary class="faq-q">' + html.escape(q) + '</summary>\n'
            '        <div class="faq-a">\n'
            '          <p>' + html.escape(a) + '</p>\n'
            '        </div>\n'
            '      </details>'
        )
    return (
        '\n\n<!-- ══════════ FAQ (visible — mirrors FAQPage JSON-LD) ══════════ -->\n'
        '<section id="faq" class="page-section" aria-labelledby="faqHeading">\n'
        '  <div class="wrap">\n'
        '    <div class="faq-head">\n'
        '      <span class="eyebrow r">Frequently Asked</span>\n'
        '      <h2 id="faqHeading" class="section-h2 r">Questions,<br><span class="a">answered.</span></h2>\n'
        '    </div>\n'
        '    <div class="faq-list r">\n'
        + '\n\n'.join(items) + '\n'
        '    </div>\n'
        '  </div>\n'
        '</section>\n'
    )


def faq_jsonld(slug, qas):
    node = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": BASE + slug + "/#faq",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in qas
        ],
    }
    return (
        '\n<!-- ── FAQ structured data (mirrors visible FAQ) ── -->\n'
        '<script type="application/ld+json">\n'
        + json.dumps(node, indent=2, ensure_ascii=False) + '\n'
        '</script>\n'
    )


for slug, qas in FAQS.items():
    body = os.path.join(ROOT, "src", "partials", "services", slug, "body.html")
    jsonld = os.path.join(ROOT, "src", "pages", "services", slug, "jsonld.html")
    with open(body, "a", encoding="utf-8") as f:
        f.write(visible_faq(slug, qas))
    with open(jsonld, "a", encoding="utf-8") as f:
        f.write(faq_jsonld(slug, qas))
    print("Updated FAQ for", slug)
