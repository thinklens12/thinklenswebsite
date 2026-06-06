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

  /* ── Form submission via Formspree ── */
  const FORMSPREE_ID = 'xdapybyb';
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
      try {
        const res = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
          method: 'POST', body: new FormData(this), headers: {'Accept': 'application/json'}
        });
        if (res.ok) {
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
