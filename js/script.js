/* =============================================================
   MAIN.JS  — vanilla JS only, no dependencies
   ============================================================= */
'use strict';

/* ── Utilities ────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];





/* ─────────────────────────────────────────────────────────────
   HEADER — scroll behaviour
───────────────────────────────────────────────────────────── */
(function initHeader() {
  const header = $('#header');
  if (!header) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ─────────────────────────────────────────────────────────────
   ACTIVE NAV — highlight current section
───────────────────────────────────────────────────────────── */
(function initActiveNav() {
  const sections  = $$('section[id]');
  const navLinks  = $$('.nav-link');
  if (!sections.length || !navLinks.length) return;

  let ticking = false;

  function updateNav() {
    const scrollMid = window.scrollY + window.innerHeight * 0.45;

    sections.forEach(section => {
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollMid >= top && scrollMid < bottom) {
        navLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { updateNav(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver
───────────────────────────────────────────────────────────── */
(function initReveal() {
  const revealEls = $$('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const delay = parseFloat(entry.target.dataset.delay) || 0;
      entry.target.style.transitionDelay = delay + 's';
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -56px 0px',
  });

  revealEls.forEach(el => observer.observe(el));
})();


/* ─────────────────────────────────────────────────────────────
   HAMBURGER / MOBILE MENU
───────────────────────────────────────────────────────────── */
(function initMenu() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (!hamburger || !mobileMenu) return;

  function closeMenu() {
    hamburger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const willOpen = !hamburger.classList.contains('is-open');
    hamburger.classList.toggle('is-open', willOpen);
    mobileMenu.classList.toggle('is-open', willOpen);
    hamburger.setAttribute('aria-expanded', String(willOpen));
    mobileMenu.setAttribute('aria-hidden', String(!willOpen));
    document.body.style.overflow = willOpen ? 'hidden' : '';
  });

  // Close when a link is clicked
  $$('.mobile-menu__link', mobileMenu).forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();


/* ─────────────────────────────────────────────────────────────
   SMOOTH SCROLL — anchor links
───────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const target = $(href);
      if (!target) return;

      e.preventDefault();
      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '72',
        10
      );
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   CONTACT FORM — basic feedback
───────────────────────────────────────────────────────────── */
(function initForm() {
  const form = $('#contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn      = form.querySelector('button[type="submit"]');
    const original = btn.textContent;

    btn.textContent = 'Bericht verstuurd ✓';
    btn.disabled    = true;
    btn.style.cssText =
      'background:#16a34a;border-color:#16a34a;transform:none;box-shadow:none;';

    setTimeout(() => {
      btn.textContent = original;
      btn.disabled    = false;
      btn.style.cssText = '';
      form.reset();
    }, 4000);
  });
})();
