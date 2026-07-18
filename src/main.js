document.addEventListener('DOMContentLoaded', function() {

  /* ── Page transitions: fade in on arrival, fade out on internal nav ── */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Reveal — double rAF so the opacity:0 state paints first, then transitions to 1
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('page-ready')));
  // Restore visibility when returning via back/forward (bfcache)
  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-leaving');
    document.body.classList.add('page-ready');
  });
  // Intercept only true internal page navigations (not in-page hashes/externals)
  if (!reduceMotion) {
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      if (a.target && a.target !== '_self') return;          // opens new tab/window
      if (a.hasAttribute('download')) return;                // download
      if (/^(mailto:|tel:|sms:|#)/i.test(href)) return;      // mail/tel/in-page hash
      let url;
      try { url = new URL(href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;            // external
      if (url.pathname === location.pathname) return;        // same page (hash/no change)
      e.preventDefault();
      document.body.classList.remove('page-ready');
      document.body.classList.add('page-leaving');
      setTimeout(() => { location.href = url.href; }, 320);
    });
  }

  /* ── Text-roll (slot-machine) on homepage service item names ──
     Wraps each letter in a span (+ a cloned row beneath); CSS handles the
     staggered roll on hover. Desktop/hover only — mobile keeps plain text. */
  if (window.matchMedia('(hover: hover) and (min-width: 769px)').matches) {
    document.querySelectorAll('.svc-item-name').forEach((el) => {
      if (el.dataset.tr) return;
      el.dataset.tr = '1';
      const text = el.textContent;
      const makeRow = (cloneClass) => {
        const row = document.createElement('span');
        row.className = 'tr-row' + (cloneClass ? ' ' + cloneClass : '');
        row.setAttribute('aria-hidden', 'true');
        Array.from(text).forEach((ch, i) => {
          const s = document.createElement('span');
          s.className = 'tr-letter';
          s.style.setProperty('--i', i);
          s.textContent = ch === ' ' ? ' ' : ch;
          row.appendChild(s);
        });
        return row;
      };
      const wrap = document.createElement('span');
      wrap.className = 'tr';
      wrap.setAttribute('aria-label', text);
      wrap.appendChild(makeRow(''));
      wrap.appendChild(makeRow('tr-clone'));
      el.textContent = '';
      el.appendChild(wrap);
    });
  }

  /* ── Nav scroll background ── */
  const nav = document.getElementById('nav');
  if (nav) window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 20);
  }, {passive:true});

  /* ── Scroll progress bar ── */
  const progress = document.getElementById('scrollProgress');
  if (progress) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      progress.style.transform = 'scaleX(' + p + ')';
    };
    window.addEventListener('scroll', updateProgress, {passive:true});
    window.addEventListener('resize', updateProgress, {passive:true});
    updateProgress();
  }

  /* ── Mobile menu (hamburger) ── */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    const openMenu = () => {
      document.body.classList.add('menu-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
    };
    const closeMenu = () => {
      document.body.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    };
    navToggle.addEventListener('click', () => {
      document.body.classList.contains('menu-open') ? closeMenu() : openMenu();
    });
    // Close when a menu link/CTA is tapped
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
    });
    // Auto-close if widened to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ── Sticky "Talk to us" CTA — appears past hero, hides over contact ── */
  const sticky = document.getElementById('stickyCta');
  const heroSec = document.getElementById('hero');
  const contactSec = document.getElementById('contact');
  if (sticky && heroSec && contactSec) {
    const updateSticky = () => {
      const heroPassed = heroSec.getBoundingClientRect().bottom < 0;
      const cr = contactSec.getBoundingClientRect();
      const contactInView = cr.top < window.innerHeight && cr.bottom > 0;
      sticky.classList.toggle('show', heroPassed && !contactInView);
    };
    window.addEventListener('scroll', updateSticky, {passive:true});
    window.addEventListener('resize', updateSticky, {passive:true});
    updateSticky();
  }

  /* ── Count-up animation ── */
  function countUp(el) {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const mode = el.dataset.mode;
    if (mode === 'year') { el.textContent = target; return; }
    let startTime = null;
    const duration = 1800;
    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('[data-count]').forEach(el => {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { countUp(el); io.disconnect(); }
    }, {threshold:.5});
    io.observe(el);
  });

  /* ── Scroll reveal (.r → .vis) ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('vis');
        revealObs.unobserve(e.target);
      }
    });
  }, {threshold:0, rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.r').forEach(el => revealObs.observe(el));

  /* ── Staggered card reveal ── */
  function staggerReveal(selector, delayStep) {
    const cards = document.querySelectorAll(selector);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = Array.from(cards).indexOf(e.target);
          setTimeout(() => e.target.classList.add('vis'), idx * delayStep);
          obs.unobserve(e.target);
        }
      });
    }, {threshold:.1, rootMargin:'0px 0px -40px 0px'});
    cards.forEach(c => obs.observe(c));
  }
  staggerReveal('.sector-card', 120);
  staggerReveal('.tbadge', 100);
  staggerReveal('.svc-item', 100);

  /* ── Why cards: diagonal cascade ── */
  (function() {
    const whyCards = document.querySelectorAll('.why-card');
    if (!whyCards.length) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        whyCards.forEach((c, i) => {
          setTimeout(() => c.classList.add('vis'), i * 120);
        });
        obs.disconnect();
      }
    }, {threshold:.05});
    obs.observe(whyCards[0]);
  })();

  /* ── Kinetic text light-up on scroll ── */
  const words = document.querySelectorAll('.kw');
  function updateKinetic() {
    const vh = window.innerHeight;
    const centerY = vh * 0.5;
    const fadeZone = vh * 0.32;
    words.forEach(w => {
      const r = w.getBoundingClientRect();
      const wY = r.top + r.height / 2;
      const dist = Math.abs(wY - centerY);
      const lit = dist < fadeZone;
      const isAccent = w.classList.contains('accent-word');
      if (lit) {
        w.classList.add(isAccent ? 'accent-lit' : 'lit');
        if (!isAccent) w.classList.remove('accent-lit');
        else w.classList.remove('lit');
      } else {
        w.classList.remove('lit','accent-lit');
      }
    });
  }
  window.addEventListener('scroll', updateKinetic, {passive:true});
  updateKinetic();

  /* ── Spotlight hover on sector cards (mouse-following gradient) ── */
  document.querySelectorAll('[data-spotlight]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── Magnetic button effect ── */
  const isFinePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (isFinePointer) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ── Button ripple effect ── */
  document.querySelectorAll('[data-ripple]').forEach(el => {
    el.addEventListener('click', e => {
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  /* ── GA4 event helper (no-ops when gtag is absent, e.g. blocked or local) ── */
  const track = (name, params) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  };

  /* ── CTA click tracking (delegated) ── */
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('a.btn, .trust-link, .sticky-cta, .nav-cta');
    if (!cta) return;
    track('cta_click', { label: (cta.textContent || '').trim().slice(0, 60) });
  });

  /* ── Contact: brief builder (imported "Contact Section v2" design) ──
     One unified form; three channels via the tabs. The 5-dot meter + live
     "Your brief" line update as chips/fields are filled. The primary button
     routes by channel: Send an enquiry → Formspree; Book a call → Cal.com
     inline calendar (lazy-mounted); WhatsApp Chat → wa.me with the brief
     prefilled. Smart defaults keep the meter off zero. */
  (() => {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const $ = (id) => document.getElementById(id);
    const val = (id) => ($(id) || { value: '' }).value;

    const cta = $('submitBtn'), msg = $('formMsg');
    const briefBody = $('briefBody'), calBody = $('calBody'), waBody = $('waBody');
    const progress = form.querySelector('.cx-progress');
    const waPreview = $('waPreview'), waOpen = $('waOpen');
    const tabs = [...document.querySelectorAll('.cx-tab')];
    const groups = [...form.querySelectorAll('.cx-chips')];
    const dots = $('fjDots') ? [...$('fjDots').children] : [];
    const progLabel = $('fjLabel'), briefLine = $('fjBrief');
    const msgField = $('fmessage');

    const CAL_LINK = 'think-lens-consulting-kui4bb/30min';
    const WA_BASE = 'https://wa.me/919676291788';
    const FORMSPREE_ID = 'xdapybyb';
    // Consumer mail providers — anything else is treated as a corporate domain.
    const FREE_MAIL = ['gmail.com','yahoo.com','outlook.com','hotmail.com','live.com','icloud.com','proton.me','protonmail.com','aol.com','mail.com','gmx.com','yandex.com','zoho.com','rediffmail.com'];
    let mode = 'enquiry';

    /* ── Cal.com lazy mount (only when "Book a call" is first opened) ── */
    const calForm = $('calForm'), calMount = $('cal-inline-form'), tabCall = $('tabCall');
    let scriptReady = false, mounted = false;
    const warmCal = () => {
      if (scriptReady || !calForm) return;
      scriptReady = true;
      (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
      window.Cal('init', { origin: 'https://cal.com' });
      window.Cal('ui', {
        theme: 'dark',
        cssVarsPerTheme: { dark: { 'cal-brand': '#3b7bff' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
      window.Cal('preload', { calLink: CAL_LINK });
    };
    const mountCal = () => {
      if (mounted || !calForm) return;
      mounted = true;
      warmCal();
      window.Cal('inline', {
        elementOrSelector: '#cal-inline-form',
        calLink: CAL_LINK,
        layout: 'month_view',
        config: { theme: 'dark' },
      });
      window.Cal('on', { action: 'linkReady', callback: () => {
        calForm.classList.add('is-loaded');
        const l = calMount.querySelector('.cal-loading');
        if (l) l.style.display = 'none';
      }});
      window.Cal('on', { action: 'bookingSuccessful', callback: () => {
        track('book_appointment', { method: 'cal.com' });
      }});
    };

    /* ── Chips → hidden inputs ── */
    groups.forEach((g) => {
      const multi = g.dataset.multi === '1';
      const hidden = g.querySelector('input[type="hidden"]');
      g.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => {
        if (multi) ch.classList.toggle('on');
        else { g.querySelectorAll('.chip').forEach((c) => c.classList.remove('on')); ch.classList.add('on'); }
        hidden.value = [...g.querySelectorAll('.chip.on')].map((c) => c.textContent.trim()).join(', ');
        update();
      }));
    });

    /* ── 5-dot progress + live brief line ── */
    function update() {
      const checks = [
        !!val('fname').trim(),
        !!val('femail').trim(),
        !!val('fjSkills'),
        !!val('fjStart'),
        !!(msgField && msgField.value.trim()),
      ];
      const done = checks.filter(Boolean).length, left = checks.length - done;
      dots.forEach((d, i) => d.classList.toggle('on', checks[i]));
      if (progLabel) progLabel.textContent = left === 0
        ? 'All set — ready to send'
        : left + ' quick step' + (left === 1 ? '' : 's') + ' left';
      const eng = val('fjModel'), skills = val('fjSkills'), start = val('fjStart'), region = val('fregion');
      const parts = [];
      if (eng) parts.push(eng);
      if (skills) parts.push(skills);
      if (start) parts.push('starting ' + (start === 'Just exploring' ? 'whenever — just exploring' : start));
      if (region) parts.push('for ' + region);
      if (briefLine) briefLine.textContent = parts.join(' · ');
    }
    form.addEventListener('input', update);

    /* ── Sliding "thumb" that tracks the active tab ── */
    const tabsEl = form.querySelector('.cx-tabs');
    const thumb = tabsEl ? tabsEl.querySelector('.cx-tab-thumb') : null;
    const moveThumb = (animate) => {
      if (!thumb || !tabsEl) return;
      const active = tabsEl.querySelector('.cx-tab.is-active');
      if (!active) return;
      const cr = tabsEl.getBoundingClientRect(), tr = active.getBoundingClientRect();
      const x = tr.left - cr.left - tabsEl.clientLeft;
      const y = tr.top - cr.top - tabsEl.clientTop;
      if (!animate) thumb.style.transition = 'none';
      thumb.style.width = tr.width + 'px';
      thumb.style.height = tr.height + 'px';
      thumb.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      if (!animate) { void thumb.offsetWidth; thumb.style.transition = ''; } // reflow, then re-enable
    };
    // Keep it aligned on viewport/layout changes and once fonts settle.
    window.addEventListener('resize', () => moveThumb(false), { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveThumb(false));

    /* ── Channel tabs → swap the body: enquiry form / Cal calendar / WhatsApp ── */
    const setMode = (m, animate) => {
      mode = m;
      form.dataset.mode = m;
      tabs.forEach((t) => {
        const active = t.dataset.mode === m;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      moveThumb(animate !== false);
      if (briefBody) briefBody.toggleAttribute('hidden', m !== 'enquiry');
      if (calBody) calBody.toggleAttribute('hidden', m !== 'call');
      if (waBody) waBody.toggleAttribute('hidden', m !== 'whatsapp');
      // The 5-dot meter only tracks the enquiry form — hide it for call/WhatsApp.
      if (progress) progress.toggleAttribute('hidden', m !== 'enquiry');
      if (m === 'call') mountCal();
      if (m === 'whatsapp') syncWhatsapp();
    };
    tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));
    if (tabCall) {
      tabCall.addEventListener('pointerenter', warmCal, { once: true });
      tabCall.addEventListener('focus', warmCal, { once: true });
    }

    /* ── Keep the WhatsApp preview + wa.me link in sync with the brief ── */
    function syncWhatsapp() {
      const text = waMessage();
      if (waPreview) waPreview.textContent = text;
      if (waOpen) waOpen.href = WA_BASE + '?text=' + encodeURIComponent(text);
    }
    if (waOpen) waOpen.addEventListener('click', () => {
      track('generate_lead', { method: 'whatsapp', region: val('fregion') });
    });

    /* ── Build a WhatsApp opener message from the brief ── */
    function waMessage() {
      const name = val('fname').trim(), eng = val('fjModel'), skills = val('fjSkills'),
            start = val('fjStart'), region = val('fregion');
      let m = 'Hi Thinklens — ' + (name ? name + ' here. ' : '') + "I'd like to discuss an engagement";
      const b = [];
      if (eng) b.push(eng);
      if (skills) b.push(skills);
      if (start) b.push('starting ' + start);
      if (region) b.push(region);
      if (b.length) m += ' (' + b.join(' · ') + ')';
      return m + '.';
    }

    /* ── Reset restores chip defaults + smart defaults ── */
    const origReset = form.reset.bind(form);
    form.reset = () => {
      origReset();
      groups.forEach((g) => {
        const hidden = g.querySelector('input[type="hidden"]');
        g.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', !!hidden.defaultValue && c.textContent.trim() === hidden.defaultValue));
        hidden.value = hidden.defaultValue;
      });
      update();
    };

    /* ── Enquiry submit → Formspree (Book-a-call and WhatsApp have their own
         actions in their panels) ── */
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      $('replyto').value = val('femail');
      if (!val('fregion') || !val('fenquiry')) {
        msg.style.display = 'block'; msg.style.color = '#ff6b6b';
        msg.textContent = 'Please select your region and enquiry type.'; return;
      }
      cta.textContent = 'Sending…'; cta.disabled = true; msg.style.display = 'none';
      const emailDomain = (val('femail').split('@')[1] || '').toLowerCase();
      const leadType = FREE_MAIL.includes(emailDomain) ? 'free' : 'corporate';
      const enquiryType = val('fenquiry');
      const isMsa = /^(MSA|Master Service Agreement|Sub-Contracting)/.test(enquiryType);
      form.querySelector('[name="_subject"]').value = isMsa
        ? 'MSA / Partnership Enquiry — Thinklens Website'
        : 'New Enquiry — Thinklens Website';
      const data = new FormData(form);
      data.append('lead_type', leadType);
      data.append('email_domain', emailDomain);
      try {
        const res = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
          method: 'POST', body: data, headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          track('generate_lead', { enquiry_type: enquiryType, region: val('fregion'), lead_type: leadType });
          cta.classList.add('cx-cta-ok');
          cta.textContent = '✓ Enquiry sent';
          msg.style.display = 'block'; msg.style.color = '';
          msg.textContent = "We've received your message — we'll be in touch shortly.";
          form.reset();
        } else { throw new Error('Server error'); }
      } catch (err) {
        cta.disabled = false;
        cta.textContent = 'Send Enquiry';
        msg.style.display = 'block'; msg.style.color = '#ff6b6b';
        msg.textContent = 'Something went wrong. Please email thinklensconsulting@gmail.com';
      }
    });

    setMode('enquiry', false); // place the thumb without sliding on first load
    update();
  })();

  /* ── Custom cursor (fine pointers only) ── */
  if (isFinePointer) {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    let mx = -200, my = -200;
    let rx = -200, ry = -200;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    (function animateRing() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animateRing);
    })();

    const hoverTargets = document.querySelectorAll('a, button, .sector-card, .why-card, .tbadge, .svc-item, input, select, textarea');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-active'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-active'));
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0'; ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = '1'; ring.style.opacity = '1';
    });
  } else {
    document.getElementById('cursor-dot').style.display = 'none';
    document.getElementById('cursor-ring').style.display = 'none';
  }

  /* ── Candidate Tracker (unlisted vendor intake → Formspree) ── */
  (function () {
    const form = document.getElementById('candidateForm');
    if (!form) return;
    const CT_FORMSPREE_ID = 'xdapybyb'; // shared endpoint; distinct _subject routes these
    const cta = document.getElementById('ctSubmit');
    const msg = document.getElementById('ctMsg');
    const dateInput = document.getElementById('ctDate');
    const replyto = document.getElementById('ctReplyto');

    // Default the date to today (local) unless already set.
    if (dateInput && !dateInput.value) {
      const d = new Date();
      dateInput.value = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    function showMsg(text, ok) {
      msg.style.display = 'block';
      msg.style.color = ok ? '' : '#ff6b6b';
      msg.textContent = text;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      // Native validation for the required fields.
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (replyto) replyto.value = (document.getElementById('ctEmail') || {}).value || '';

      cta.textContent = 'Submitting…';
      cta.disabled = true;
      msg.style.display = 'none';

      try {
        const res = await fetch('https://formspree.io/f/' + CT_FORMSPREE_ID, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('Server error');
        if (typeof gtag === 'function') {
          gtag('event', 'candidate_submitted', { form: 'candidate_tracker' });
        }
        cta.classList.add('ct-cta-ok');
        cta.textContent = '✓ Submitted';
        showMsg("Candidate received — we'll review and get back within one business day.", true);
        form.reset();
      } catch (err) {
        cta.disabled = false;
        cta.textContent = 'Submit candidate';
        showMsg('Something went wrong. Please email thinklensconsulting@gmail.com', false);
      }
    });
  })();

  /* ── Careers: application form (role preselect + résumé upload → Formspree) ── */
  (function () {
    const form = document.getElementById('applyForm');
    if (!form) return;

    /* ─────────────────────────────────────────────────────────────────────
       RÉSUMÉ UPLOADS — one-time setup.

       Formspree's free tier can't accept file attachments, and GitHub Pages
       has no backend to receive one. So the file goes straight from the
       browser to Cloudinary (free tier), and the resulting link is submitted
       with the application — you get a clickable résumé in the same email.

       To turn it on:
         1. Create a free account at cloudinary.com
         2. Settings → Upload → Add upload preset
              · Signing mode:  Unsigned
              · Folder:        resumes
              · (recommended)  restrict formats to pdf,doc,docx and set a
                               max file size, since unsigned presets are
                               publicly writable by anyone with the name
         3. Paste the two public identifiers below and re-run: node build.js

       Until both are filled in, the upload box hides itself and candidates
       use the "link to your résumé" field instead — the form still works.
    ───────────────────────────────────────────────────────────────────────── */
    const CV_UPLOAD = {
      cloudName: '',    // ← e.g. 'thinklens'
      uploadPreset: '', // ← e.g. 'resumes_unsigned'
    };
    const UPLOAD_READY = !!(CV_UPLOAD.cloudName && CV_UPLOAD.uploadPreset);

    const MAX_BYTES = 5 * 1024 * 1024;
    const OK_EXT = ['pdf', 'doc', 'docx'];

    const FORMSPREE_ID = 'xdapybyb';
    const cta = document.getElementById('apSubmit');
    const msg = document.getElementById('apMsg');
    const roleSel = document.getElementById('apRole');
    const drop = document.getElementById('apDrop');
    const fileIn = document.getElementById('apFile');
    const fileRow = document.getElementById('apFileRow');
    const fileName = document.getElementById('apFileName');
    const fileSize = document.getElementById('apFileSize');
    const barFill = document.getElementById('apBarFill');
    const urlField = document.getElementById('apResumeUrl');
    const linkWrap = document.getElementById('apLinkWrap');
    const linkInput = document.getElementById('apResumeLink');

    let uploading = false;

    function showMsg(text, ok) {
      msg.style.display = 'block';
      msg.style.color = ok ? '' : '#ff6b6b';
      msg.textContent = text;
    }
    const prettySize = (b) => b < 1024 * 1024
      ? Math.round(b / 1024) + ' KB'
      : (b / 1024 / 1024).toFixed(1) + ' MB';

    // Without credentials there's nowhere to put the file — hide the dropzone
    // and make the link field the primary path rather than showing a control
    // that would silently fail.
    if (!UPLOAD_READY) {
      drop.hidden = true;
      linkWrap.querySelector('label').innerHTML = 'Link to your résumé <b>*</b>';
      linkInput.placeholder = 'Google Drive, Dropbox, or LinkedIn URL';
    }

    /* ── "Apply for this role" → preselect + scroll ── */
    document.querySelectorAll('.job-apply').forEach((btn) => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        for (let i = 0; i < roleSel.options.length; i++) {
          if (roleSel.options[i].text === role) { roleSel.selectedIndex = i; break; }
        }
        document.getElementById('apply').scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'
        });
        setTimeout(() => document.getElementById('apName').focus({ preventScroll: true }), reduceMotion ? 0 : 500);
      });
    });

    /* ── File selection + upload ── */
    function resetFile() {
      fileRow.hidden = true;
      fileRow.classList.remove('is-done', 'is-err');
      barFill.style.width = '0';
      urlField.value = '';
      fileIn.value = '';
      if (UPLOAD_READY) drop.hidden = false;
    }

    function handleFile(file) {
      if (!file) return;
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (OK_EXT.indexOf(ext) === -1) {
        showMsg('Résumé must be a PDF, DOC, or DOCX file.', false); return;
      }
      if (file.size > MAX_BYTES) {
        showMsg('That file is ' + prettySize(file.size) + '. Please keep it under 5 MB.', false); return;
      }
      msg.style.display = 'none';

      drop.hidden = true;
      fileRow.hidden = false;
      fileRow.classList.remove('is-done', 'is-err');
      fileName.textContent = file.name;
      fileSize.textContent = prettySize(file.size);
      barFill.style.width = '0';

      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', CV_UPLOAD.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/' + CV_UPLOAD.cloudName + '/raw/upload');
      uploading = true;
      cta.disabled = true;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) barFill.style.width = Math.round((e.loaded / e.total) * 92) + '%';
      });
      xhr.addEventListener('load', () => {
        uploading = false;
        cta.disabled = false;
        let res = null;
        try { res = JSON.parse(xhr.responseText); } catch (err) { /* handled below */ }
        if (xhr.status >= 200 && xhr.status < 300 && res && res.secure_url) {
          urlField.value = res.secure_url;
          barFill.style.width = '100%';
          fileRow.classList.add('is-done');
        } else {
          fileRow.classList.add('is-err');
          barFill.style.width = '100%';
          showMsg("Couldn't upload that file. Please paste a link to your résumé instead.", false);
        }
      });
      xhr.addEventListener('error', () => {
        uploading = false;
        cta.disabled = false;
        fileRow.classList.add('is-err');
        barFill.style.width = '100%';
        showMsg("Couldn't upload that file. Please paste a link to your résumé instead.", false);
      });
      xhr.send(data);
    }

    if (UPLOAD_READY) {
      document.getElementById('apBrowse').addEventListener('click', (e) => { e.stopPropagation(); fileIn.click(); });
      drop.addEventListener('click', () => fileIn.click());
      fileIn.addEventListener('change', () => handleFile(fileIn.files[0]));
      document.getElementById('apFileRemove').addEventListener('click', resetFile);

      ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
        e.preventDefault(); drop.classList.add('is-over');
      }));
      ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
        e.preventDefault(); drop.classList.remove('is-over');
      }));
      drop.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
      });
    }

    /* ── Submit ── */
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (uploading) { showMsg('Your résumé is still uploading — one moment.', false); return; }
      if (!urlField.value && !linkInput.value.trim()) {
        showMsg('Please attach your résumé or paste a link to it.', false);
        linkInput.focus();
        return;
      }

      document.getElementById('apReplyto').value = document.getElementById('apEmail').value;
      cta.textContent = 'Submitting…';
      cta.disabled = true;
      msg.style.display = 'none';

      try {
        const res = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
          method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('Server error');
        if (typeof gtag === 'function') {
          gtag('event', 'application_submitted', { role: roleSel.value });
        }
        cta.classList.add('ap-cta-ok');
        cta.textContent = '✓ Application sent';
        showMsg("Thanks — we've got your application and will reply within a week.", true);
        form.reset();
        resetFile();
      } catch (err) {
        cta.disabled = false;
        cta.textContent = 'Submit application';
        showMsg('Something went wrong. Please email thinklensconsulting@gmail.com', false);
      }
    });
  })();
});
