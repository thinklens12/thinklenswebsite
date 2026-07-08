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

  /* ── Theme toggle (light/dark) ──
     The initial theme is set before paint by the boot script in the <head>
     (saved choice wins, else auto by local time). Here we just wire the
     button to flip + persist — which then overrides the time-based default
     on future visits. */
  (function(){
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    btn.addEventListener('click', () => {
      const next = (root.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      if (meta) meta.setAttribute('content', next === 'light' ? '#f7f8fa' : '#0a0a0a');
      try { localStorage.setItem('theme', next); } catch (e) {}
      if (typeof window.gtag === 'function') window.gtag('event', 'theme_toggle', { theme: next });
    });
  })();

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

  /* ── Contact-form mode toggle → "Send an enquiry" vs "Book a call" ──
     Only one primary button is ever visible; the Cal.com calendar is
     lazy-mounted the first time the "Book a call" tab is opened. */
  const calForm = document.getElementById('calForm');
  const calMount = document.getElementById('cal-inline-form');
  const cformTabs = document.querySelectorAll('.cform-tab');
  const tabCall = document.getElementById('tabCall');
  if (calForm && calMount && cformTabs.length) {
    const CAL_LINK = 'think-lens-consulting-kui4bb/30min';
    let scriptReady = false, mounted = false;
    // Load the embed script + preload data (safe to run before the container is shown)
    const warmCal = () => {
      if (scriptReady) return;
      scriptReady = true;
      (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
      window.Cal('init', { origin: 'https://cal.com' });
      window.Cal('ui', {
        theme: 'dark',
        cssVarsPerTheme: { dark: { 'cal-brand': '#007AFF' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
      window.Cal('preload', { calLink: CAL_LINK });
    };
    // Render the inline calendar — only once the container is visible
    const mountCal = () => {
      if (mounted) return;
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
        if (typeof window.gtag === 'function') window.gtag('event', 'book_appointment', { method: 'cal.com' });
      }});
    };
    const panels = {
      enquiry: document.getElementById('panelEnquiry'),
      call: document.getElementById('panelCall'),
      whatsapp: document.getElementById('panelWhatsapp'),
    };
    // WhatsApp mockup shows the visitor's own local time (status bar + chat row).
    const syncWaTime = () => {
      const wa = panels.whatsapp;
      if (!wa) return;
      const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const row = wa.querySelector('.wa-row-time');
      const bar = wa.querySelector('.wa-time');
      if (row) row.textContent = t;
      if (bar) bar.textContent = t.replace(/\s?[AP]M$/i, ''); // status bar has no AM/PM
    };
    const setMode = (mode) => {
      cformTabs.forEach((t) => {
        const active = t.dataset.mode === mode;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      Object.keys(panels).forEach((k) => {
        if (panels[k]) panels[k].toggleAttribute('hidden', k !== mode);
      });
      if (mode === 'call') mountCal();
      if (mode === 'whatsapp') syncWaTime();
    };
    syncWaTime();
    cformTabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));
    // Warm the script on hover/focus intent so the first open is instant
    if (tabCall) {
      tabCall.addEventListener('pointerenter', warmCal, { once: true });
      tabCall.addEventListener('focus', warmCal, { once: true });
    }
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

  /* ── Form journey: smart defaults + goal-gradient progress + build-your-engagement chips ──
     The selects ship pre-filled and the "Time & Materials" chip ships selected, so the
     progress bar never starts at 0%. Chip choices post with the form (hidden fields)
     and personalize the message hint. */
  (() => {
    const journeyForm = document.getElementById('contactForm');
    if (!journeyForm || !document.getElementById('fjFill')) return;
    const fill = document.getElementById('fjFill');
    const pctEl = document.getElementById('fjPct');
    const msgField = document.getElementById('fmessage');
    const defaultHint = msgField.placeholder;
    const groups = journeyForm.querySelectorAll('.fj-group');

    const val = (id) => (document.getElementById(id) || { value: '' }).value;
    function syncHint() {
      const model = val('fjModel'), skills = val('fjSkills'), start = val('fjStart');
      msgField.placeholder = (model || skills || start)
        ? 'e.g., We need ' + (skills || 'a senior consultant') + (model ? ' on a ' + model + ' basis' : '') + (start ? ', starting ' + (start === 'ASAP' ? start : start.toLowerCase()) : '') + ' — plus any client or pipeline context.'
        : defaultHint;
    }
    const steps = [
      () => !!val('fjModel'),
      () => !!val('fjSkills'),
      () => !!val('fregion'),
      () => !!val('fenquiry'),
      () => !!val('fname').trim(),
      () => !!val('femail').trim(),
      () => !!msgField.value.trim(),
    ];
    function update() {
      const done = steps.filter((f) => f()).length;
      const p = Math.round((done / steps.length) * 100);
      fill.style.width = p + '%';
      pctEl.textContent = p >= 100
        ? "100% — ready. Don't lose it."
        : p + '% there — ' + (steps.length - done) + ' quick ' + (steps.length - done === 1 ? 'step' : 'steps') + ' left';
    }
    groups.forEach((g) => {
      const multi = g.dataset.multi === '1';
      const hidden = g.querySelector('input[type="hidden"]');
      g.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => {
        if (multi) ch.classList.toggle('on');
        else { g.querySelectorAll('.chip').forEach((c) => c.classList.remove('on')); ch.classList.add('on'); }
        hidden.value = [...g.querySelectorAll('.chip.on')].map((c) => c.textContent.trim()).join(', ');
        syncHint(); update();
      }));
    });
    // The submit handler calls form.reset() on success — restore chips/defaults too.
    const origReset = journeyForm.reset.bind(journeyForm);
    journeyForm.reset = () => {
      origReset();
      groups.forEach((g) => {
        const hidden = g.querySelector('input[type="hidden"]');
        g.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', !!hidden.defaultValue && c.textContent.trim() === hidden.defaultValue));
        hidden.value = hidden.defaultValue;
      });
      syncHint(); update();
    };
    journeyForm.addEventListener('input', update);
    syncHint(); update();
  })();

  /* ── Form submission via Formspree ── */
  const FORMSPREE_ID = 'xdapybyb';
  // Consumer mail providers — anything else is treated as a corporate domain.
  const FREE_MAIL = ['gmail.com','yahoo.com','outlook.com','hotmail.com','live.com','icloud.com','proton.me','protonmail.com','aol.com','mail.com','gmx.com','yandex.com','zoho.com','rediffmail.com'];
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const msg = document.getElementById('formMsg');
      document.getElementById('replyto').value = document.getElementById('femail').value;
      if (!document.getElementById('fregion').value || !document.getElementById('fenquiry').value) {
        msg.style.display = 'block'; msg.style.color = '#ff6b6b';
        msg.textContent = 'Please select your region and enquiry type.'; return;
      }
      btn.textContent = 'Sending…'; btn.disabled = true; msg.style.display = 'none';
      // Lead tagging — free-mail vs corporate domain, MSA routing via subject line
      const emailDomain = (document.getElementById('femail').value.split('@')[1] || '').toLowerCase();
      const leadType = FREE_MAIL.includes(emailDomain) ? 'free' : 'corporate';
      const enquiryType = document.getElementById('fenquiry').value;
      const isMsa = /^(MSA|Master Service Agreement|Sub-Contracting)/.test(enquiryType);
      this.querySelector('[name="_subject"]').value = isMsa
        ? 'MSA / Partnership Enquiry — Thinklens Website'
        : 'New Enquiry — Thinklens Website';
      const data = new FormData(this);
      data.append('lead_type', leadType);
      data.append('email_domain', emailDomain);
      try {
        const res = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
          method: 'POST', body: data, headers: {'Accept': 'application/json'}
        });
        if (res.ok) {
          track('generate_lead', {
            enquiry_type: enquiryType,
            region: document.getElementById('fregion').value,
            lead_type: leadType,
          });
          btn.classList.add('ok');
          btn.textContent = '✓ Enquiry sent';
          msg.style.display = 'block';
          msg.style.color = '#aeaeb2';
          msg.textContent = "We've received your message — we'll be in touch shortly.";
          form.reset();
        } else { throw new Error('Server error'); }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Send Enquiry';
        msg.style.display = 'block';
        msg.style.color = '#ff6b6b';
        msg.textContent = 'Something went wrong. Please email thinklensconsulting@gmail.com';
      }
    });
  }

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

    const hoverTargets = document.querySelectorAll('a, button, .sector-card, .why-card, .tbadge, .svc-item, .cmeta, input, select, textarea');
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
});
