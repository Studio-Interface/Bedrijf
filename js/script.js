/* =============================================================
   MAIN.JS  — vanilla JS only, no dependencies
   ============================================================= */
'use strict';

/* ─────────────────────────────────────────────────────────────
   PARTICLES — animated floating background
───────────────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COUNT = 100;
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomParticle() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.5 + 0.5,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, randomParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(158, 185, 246, ${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -5)  p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5)  p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  init();
  draw();
})();

/* ─────────────────────────────────────────────────────────────
   HERO WAVE — flowing gradient line field
───────────────────────────────────────────────────────────── */
(function initHeroWave() {
  const canvas = document.getElementById('heroWave');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  const LINE_COUNT = 24;
  const POINTS = 80;
  const COLOR_A = [59, 130, 246];
  const COLOR_B = [155, 93, 229];

  let W = 0, H = 0, dpr = 1;
  let t = 0;
  let rafId = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerpColor(a, b, m) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * m),
      Math.round(a[1] + (b[1] - a[1]) * m),
      Math.round(a[2] + (b[2] - a[2]) * m),
    ];
  }

  function drawLine(i) {
    const progress = i / (LINE_COUNT - 1);
    const baseY = H * 0.5 + (progress - 0.5) * H * 0.9;

    const amp = 18 + Math.sin(progress * Math.PI) * 35;
    const freq = 0.0015 + progress * 0.0004;
    const speed = 0.0003 + progress * 0.00025;
    const phase = progress * Math.PI * 2;

    const [r, g, b] = lerpColor(COLOR_A, COLOR_B, progress);
    const edgeFade = Math.sin(progress * Math.PI);
    const alpha = 0.06 + edgeFade * 0.18;

    ctx.beginPath();
    for (let p = 0; p <= POINTS; p++) {
      const x = (p / POINTS) * W;
      const wave = Math.sin(x * freq + t * speed + phase) * amp;
      const y = baseY + wave;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (let i = 0; i < LINE_COUNT; i++) drawLine(i);
    t += 18;
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    resize();
    if (reducedMotion) {
      frame();
      cancelAnimationFrame(rafId);
      return;
    }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    resize();
  }, { passive: true });

  // Pause when hero leaves viewport
  const hero = canvas.closest('.hero');
  if (hero && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (!rafId && !reducedMotion) rafId = requestAnimationFrame(frame);
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    }, { threshold: 0 });
    io.observe(hero);
  }

  start();
})();

/* ── Utilities ────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ─────────────────────────────────────────────────────────────
   CAROUSEL — drag / swipe to scroll
───────────────────────────────────────────────────────────── */
(function initCarousel() {
  const wrapper = $('.works-carousel-wrapper');
  if (!wrapper) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let moved = false;

  function onPointerDown(e) {
    isDown = true;
    moved = false;
    startX = (e.touches ? e.touches[0].pageX : e.pageX) - wrapper.offsetLeft;
    scrollLeft = wrapper.scrollLeft;
    wrapper.classList.add('is-dragging');
  }

  function onPointerMove(e) {
    if (!isDown) return;
    const x = (e.touches ? e.touches[0].pageX : e.pageX) - wrapper.offsetLeft;
    const delta = x - startX;
    if (Math.abs(delta) > 4) moved = true;
    wrapper.scrollLeft = scrollLeft - delta;
  }

  function onPointerUp() {
    isDown = false;
    wrapper.classList.remove('is-dragging');
  }

  // Prevent click on card after a drag
  wrapper.addEventListener('click', (e) => {
    if (moved) e.preventDefault();
  }, true);

  // Mouse events
  wrapper.addEventListener('mousedown',  onPointerDown);
  window.addEventListener('mousemove',   onPointerMove);
  window.addEventListener('mouseup',     onPointerUp);

  // Touch events
  wrapper.addEventListener('touchstart', onPointerDown, { passive: true });
  wrapper.addEventListener('touchmove',  onPointerMove, { passive: true });
  wrapper.addEventListener('touchend',   onPointerUp);
})();




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
        header.classList.toggle('scrolled', window.scrollY > 0);
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
   CONTACT FORM — Web3Forms integration
───────────────────────────────────────────────────────────── */
(function initForm() {
  const form = $('#contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;

    // Prepare form data
    const formData = new FormData(form);
    formData.append('access_key', 'c16ee694-71d8-4812-8f3f-9260bbe9bf72');

    // Show loading state
    btn.textContent = 'Verstuuren...';
    btn.disabled = true;

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Success state
        btn.textContent = 'Bericht verstuurd ✓';
        btn.style.cssText =
          'background:#16a34a;border-color:#16a34a;transform:none;box-shadow:none;';
        form.reset();

        // Reset after 4 seconds
        setTimeout(() => {
          btn.textContent = original;
          btn.style.cssText = '';
          btn.disabled = false;
        }, 4000);
      } else {
        // Error from API
        btn.textContent = 'Fout bij verzenden';
        btn.style.cssText =
          'background:#dc2626;border-color:#dc2626;transform:none;box-shadow:none;';

        setTimeout(() => {
          btn.textContent = original;
          btn.style.cssText = '';
          btn.disabled = false;
        }, 4000);
      }
    } catch (error) {
      // Network error
      btn.textContent = 'Verbindingsfout';
      btn.style.cssText =
        'background:#dc2626;border-color:#dc2626;transform:none;box-shadow:none;';

      setTimeout(() => {
        btn.textContent = original;
        btn.style.cssText = '';
        btn.disabled = false;
      }, 4000);
    }
  });
})();


/* ─────────────────────────────────────────────────────────────
   EXPERTISE CARDS — custom tilt (pointer follow)
───────────────────────────────────────────────────────────── */
(function initExpertiseTilt() {
  const cards = [...document.querySelectorAll('.expertise .tilt-card')];
  if (!cards.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reducedMotion || !canHover) return;

  const MAX_ROTATION = 10;
  const FOLLOW_SMOOTHNESS = 0.14;
  const RESET_SMOOTHNESS = 0.18;
  const HOVER_LIFT = 6;
  const HOVER_SCALE = 1.01;

  cards.forEach((card) => {
    let currentRX = 0;
    let currentRY = 0;
    let targetRX = 0;
    let targetRY = 0;
    let isHovering = false;
    let frameId = null;

    function paintTransform() {
      const lift = isHovering ? HOVER_LIFT : 0;
      const scale = isHovering ? HOVER_SCALE : 1;

      card.style.transform =
        `perspective(900px) rotateX(${currentRY.toFixed(3)}deg) rotateY(${currentRX.toFixed(3)}deg) translateY(${-lift}px) scale(${scale})`;
    }

    function animate() {
      const smoothness = isHovering ? FOLLOW_SMOOTHNESS : RESET_SMOOTHNESS;
      currentRX += (targetRX - currentRX) * smoothness;
      currentRY += (targetRY - currentRY) * smoothness;

      const needsMoreFrames =
        Math.abs(targetRX - currentRX) > 0.02 ||
        Math.abs(targetRY - currentRY) > 0.02;

      paintTransform();

      if (needsMoreFrames || isHovering) {
        frameId = requestAnimationFrame(animate);
      } else {
        frameId = null;
        card.style.transform = '';
      }
    }

    function queueAnimation() {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(animate);
    }

    card.addEventListener('pointerenter', () => {
      isHovering = true;
      queueAnimation();
    });

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const nx = x * 2 - 1;
      const ny = y * 2 - 1;

      targetRX = nx * MAX_ROTATION;
      targetRY = -ny * MAX_ROTATION;
      queueAnimation();
    });

    card.addEventListener('pointerleave', () => {
      isHovering = false;
      targetRX = 0;
      targetRY = 0;
      queueAnimation();
    });
  });
})();

/* ─────────────────────────────────────────────────────────────
   LOADING SCREEN — fade out after page load
───────────────────────────────────────────────────────────── */
(function initLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (!loadingScreen) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loadingScreen.classList.add('hide');
    }, 2500);
  });

  // Fallback if page load takes too long
  setTimeout(() => {
    if (!loadingScreen.classList.contains('hide')) {
      loadingScreen.classList.add('hide');
    }
  }, 4000);
})();

/* ─────────────────────────────────────────────────────────────
   PAGE TRANSITIONS — fade effect when leaving page
───────────────────────────────────────────────────────────── */
(function initPageTransitions() {
  // Create page transition overlay
  const transition = document.createElement('div');
  transition.className = 'page-transition';
  document.body.appendChild(transition);

  // Handle external links from portfolio
  const portfolioLinks = document.querySelectorAll('a[href^="http"]');

  portfolioLinks.forEach(link => {
    // Skip if link opens in new tab
    if (link.target === '_blank') {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Show transition overlay
        transition.classList.add('active');
        
        // Navigate after transition starts
        setTimeout(() => {
          window.location.href = href;
        }, 300);
        
        e.preventDefault();
      });
    }
  });

  // Handle back button transitions
  window.addEventListener('pageshow', (event) => {
    transition.classList.remove('active');
  });

  window.addEventListener('pagehide', (event) => {
    transition.classList.add('active');
  });
})();
