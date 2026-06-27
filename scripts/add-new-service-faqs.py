#!/usr/bin/env python3
"""One-shot: append visible FAQ + matching FAQPage JSON-LD to the 3 NEW service
pages (project-support, support-maintenance, training) for parity with the
older 5. Run ONCE. Visible text and schema text come from one source so they
match (Google requires the FAQ schema to mirror visible on-page content)."""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.thinklens.in/services/"

FAQS = {
    "project-support": [
        ("How quickly can you start?",
         "On short notice — often within days for pre-vetted skills. A short scoping call defines the work, tools, and finish line, and we ramp on your existing stack with no re-platforming."),
        ("What engagement terms do you use for overflow?",
         "Time & Materials for evolving scope, or Fixed-Scope for defined deliverables. Overflow is meant to be easy to start and easy to end — no long-term commitment required."),
        ("Will you work behind our brand?",
         "Yes. For staffing agencies we deliver silently behind your brand and never compete for your client; for businesses and freelancers we slot into your team and process."),
    ],
    "support-maintenance": [
        ("What do you support?",
         "Mainly the data and BI stack — Power BI, Tableau, and Spotfire dashboards, ETL pipelines, and warehouses (including SAP and Workday feeds) — plus the adjacent IT systems that keep them fed and running."),
        ("How does pricing work for support?",
         "Typically a retainer or block of hours with agreed response times, so urgent issues get urgent attention and routine requests are scheduled. We size it to your actual volume."),
        ("Do you offer SLAs?",
         "Yes — clear severity levels and response windows agreed up front. We only commit to what we can reliably support, and we'll tell you when something is out of scope."),
    ],
    "training": [
        ("What can you train our team on?",
         "Power BI, Tableau, and TIBCO Spotfire; SQL and data fundamentals; ETL testing and report QA; and data governance and the Technical BA role — pitched at your team's current level."),
        ("How is training delivered?",
         "Remotely — as a focused half- or full-day workshop, a multi-day bootcamp, or ongoing enablement with office hours — built around your own data and use cases wherever possible."),
        ("Who teaches the sessions?",
         "Consultants who deliver the same work in production, so examples are real-world and questions get straight answers — not generic slides."),
    ],
}


def visible_faq(qas):
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
    return ('\n<!-- ── FAQ structured data (mirrors visible FAQ) ── -->\n'
            '<script type="application/ld+json">\n'
            + json.dumps(node, indent=2, ensure_ascii=False) + '\n</script>\n')


for slug, qas in FAQS.items():
    body = os.path.join(ROOT, "src", "partials", "services", slug, "body.html")
    jsonld = os.path.join(ROOT, "src", "pages", "services", slug, "jsonld.html")
    with open(body, "a", encoding="utf-8") as f:
        f.write(visible_faq(qas))
    with open(jsonld, "a", encoding="utf-8") as f:
        f.write(faq_jsonld(slug, qas))
    print("Added FAQ for", slug)
