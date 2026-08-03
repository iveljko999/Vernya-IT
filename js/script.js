// ---------- footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- nav scroll state ----------
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

// ---------- mobile menu ----------
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  mobileMenu.classList.remove('open');
}));

// ---------- random letter-swap hover (nav links) ----------
const letterSwap = (function letterSwapModule() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const STAGGER = 30;  // ms between each letter's start
  const OUT_MS = 150;  // matches .is-out transition duration
  const HOLD_MS = 70;  // how long the decoy letter is shown
  const bound = new WeakSet();

  function wrap(el) {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'swap-letter';
      span.textContent = ch;
      span.dataset.final = ch;
      el.appendChild(span);
    });
  }

  function flipTo(span, char, onDone) {
    span.classList.add('is-out');
    clearTimeout(span._swapTimeout);
    span._swapTimeout = setTimeout(() => {
      span.textContent = char;
      span.classList.remove('is-out');
      if (onDone) onDone();
    }, OUT_MS);
  }

  function run(el) {
    el.querySelectorAll('.swap-letter').forEach((span, i) => {
      const final = span.dataset.final;
      if (final === ' ') return;
      const decoy = CHARS[Math.floor(Math.random() * CHARS.length)];
      clearTimeout(span._swapTimeout);
      clearTimeout(span._holdTimeout);
      span._holdTimeout = setTimeout(() => {
        flipTo(span, decoy, () => {
          span._holdTimeout = setTimeout(() => {
            flipTo(span, final);
          }, HOLD_MS);
        });
      }, i * STAGGER);
    });
  }

  function init() {
    document.querySelectorAll('.nav-links a').forEach((a) => {
      wrap(a);
      if (!bound.has(a)) {
        a.addEventListener('mouseenter', () => run(a));
        bound.add(a);
      }
    });
  }

  init();
  return { init };
})();

// ---------- scroll progress bar ----------
(function scrollProgress() {
  const bar = document.querySelector('.scroll-progress span');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrolled / max : 0})`;
  }, { passive: true });
})();

// ---------- split-text word reveal ----------
const splitText = (function splitTextModule() {
  const splitIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.dataset.splitRevealed = 'true';
        entry.target.querySelectorAll('.split-word').forEach((w) => w.classList.add('in-view'));
        splitIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  function build(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'split-word';
      span.style.setProperty('--wd', `${i * 45}ms`);
      span.textContent = word;
      el.appendChild(span);
      el.appendChild(document.createTextNode(i < words.length - 1 ? ' ' : ''));
    });
    if (el.dataset.splitRevealed) {
      el.querySelectorAll('.split-word').forEach((w) => w.classList.add('in-view'));
    } else {
      splitIO.observe(el);
    }
  }

  function init() {
    document.querySelectorAll('[data-split]').forEach(build);
  }

  init();
  return { init };
})();

// ---------- scroll reveal ----------
const revealEls = document.querySelectorAll('[data-reveal]');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const siblings = [...el.parentElement.querySelectorAll('[data-reveal]')];
      const index = siblings.indexOf(el);
      el.style.transitionDelay = `${Math.min(index, 4) * 90}ms`;
      el.classList.add('in-view');
      io.unobserve(el);
    }
  });
}, { threshold: 0.2 });
revealEls.forEach(el => io.observe(el));

// ---------- animated counters ----------
const counters = document.querySelectorAll('[data-counter]');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.counter, 10);
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  });
}, { threshold: 0.6 });
counters.forEach(el => counterIO.observe(el));

// ---------- custom cursor ----------
const cursorDot = document.getElementById('cursorDot');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let cursorX = mouseX, cursorY = mouseY;
const isCoarse = window.matchMedia('(pointer: coarse)').matches;

if (!isCoarse) {
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;
    cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a, button, [data-tilt]').forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('hover'));
  });
}

// ---------- magnetic buttons ----------
if (!isCoarse) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

// ---------- card tilt ----------
if (!isCoarse) {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${-py * 8}deg) rotateY(${px * 10}deg) translateY(-4px)`;
      const glow = card.querySelector('.card-glow');
      if (glow) {
        glow.style.left = `${e.clientX - r.left - 110}px`;
        glow.style.top = `${e.clientY - r.top - 110}px`;
      }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---------- fluid gradient background (canvas blobs) ----------
(function fluidBackground() {
  const canvas = document.getElementById('fluid');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = [
    ['0,255,102', 0.16],  // neon green
    ['0,204,82', 0.13],   // deeper green
    ['0,255,140', 0.11],  // bright mint
    ['10,10,10', 0.05],   // ink, for depth
  ];

  const blobs = colors.map((c, i) => ({
    color: c[0],
    alpha: c[1],
    baseX: 0.15 + Math.random() * 0.7,
    baseY: 0.1 + Math.random() * 0.6,
    r: 0.28 + Math.random() * 0.16,
    speed: 0.00025 + i * 0.00008,
    phase: Math.random() * Math.PI * 2,
    driftX: 0.12 + Math.random() * 0.08,
    driftY: 0.1 + Math.random() * 0.08,
  }));

  let targetMx = 0.5, targetMy = 0.35;
  let mx = 0.5, my = 0.35;
  window.addEventListener('mousemove', (e) => {
    targetMx = e.clientX / window.innerWidth;
    targetMy = e.clientY / window.innerHeight;
  }, { passive: true });

  let t = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    t += reduceMotion ? 0.15 : 1;
    mx += (targetMx - mx) * 0.02;
    my += (targetMy - my) * 0.02;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    blobs.forEach((b) => {
      const angle = t * b.speed + b.phase;
      const x = (b.baseX + Math.sin(angle) * b.driftX + (mx - 0.5) * 0.06) * w;
      const y = (b.baseY + Math.cos(angle * 0.8) * b.driftY + (my - 0.5) * 0.06) * h;
      const r = b.r * Math.max(w, h) * (0.9 + Math.sin(angle * 1.3) * 0.08);

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${b.color}, ${b.alpha})`);
      grad.addColorStop(1, `rgba(${b.color}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ---------- service switcher (spring-physics tab indicator) ----------
(function serviceSwitcher() {
  const tabs = document.querySelectorAll('.switcher-tab');
  const indicator = document.querySelector('.switcher-indicator');
  const panels = document.querySelectorAll('.switcher-panel');
  if (!tabs.length || !indicator) return;

  // simple critically-damped-ish spring integrator
  let pos = { x: 0, w: 0 };
  let vel = { x: 0, w: 0 };
  let target = { x: 0, w: 0 };
  const stiffness = 210;
  const damping = 24;
  let last = performance.now();
  let settled = true;

  function measure(tab) {
    return { x: tab.offsetLeft, w: tab.offsetWidth };
  }

  function setTarget(tab) {
    target = measure(tab);
    settled = false;
    if (settled === false) requestAnimationFrame(tick);
  }

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.032);
    last = now;

    const fx = -stiffness * (pos.x - target.x) - damping * vel.x;
    const fw = -stiffness * (pos.w - target.w) - damping * vel.w;
    vel.x += fx * dt;
    vel.w += fw * dt;
    pos.x += vel.x * dt;
    pos.w += vel.w * dt;

    indicator.style.transform = `translateX(${pos.x}px)`;
    indicator.style.width = `${pos.w}px`;

    const settledNow = Math.abs(pos.x - target.x) < 0.3 && Math.abs(pos.w - target.w) < 0.3
      && Math.abs(vel.x) < 0.5 && Math.abs(vel.w) < 0.5;
    if (!settledNow) {
      requestAnimationFrame(tick);
    } else {
      pos.x = target.x; pos.w = target.w;
      indicator.style.transform = `translateX(${pos.x}px)`;
      indicator.style.width = `${pos.w}px`;
      settled = true;
    }
  }

  function activate(tabName, tab) {
    tabs.forEach((t) => {
      t.classList.toggle('is-active', t === tab);
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
    });
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tabName));
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activate(tab.dataset.tab, tab);
      last = performance.now();
      setTarget(tab);
    });
  });

  function init() {
    const activeTab = document.querySelector('.switcher-tab.is-active') || tabs[0];
    const m = measure(activeTab);
    pos = { x: m.x, w: m.w };
    target = { x: m.x, w: m.w };
    indicator.style.transform = `translateX(${pos.x}px)`;
    indicator.style.width = `${pos.w}px`;
  }

  // wait for fonts/layout to settle before measuring
  window.addEventListener('load', init);
  if (document.readyState === 'complete') init();
  window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.switcher-tab.is-active') || tabs[0];
    last = performance.now();
    setTarget(activeTab);
  });
})();

// ---------- circuit network animation (subpages) ----------
(function networkBackground() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  let w, h, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    w = canvas.width = rect.width * dpr;
    h = canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = 46;
  const LINK_DIST = 0.16;
  const nodes = Array.from({ length: COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00035,
    vy: (Math.random() - 0.5) * 0.00035,
    r: 1.4 + Math.random() * 1.8,
  }));

  let mx = -1, my = -1;
  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    mx = (e.clientX - rect.left) / rect.width;
    my = (e.clientY - rect.top) / rect.height;
  });
  wrap.addEventListener('mouseleave', () => { mx = -1; my = -1; });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step() {
    ctx.clearRect(0, 0, w, h);
    const unit = Math.max(w, h);

    nodes.forEach((n) => {
      if (!reduceMotion) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;

        if (mx >= 0) {
          const dx = n.x - mx, dy = n.y - my;
          const d = Math.hypot(dx, dy);
          if (d < 0.14 && d > 0.0001) {
            const f = (0.14 - d) * 0.0015;
            n.x += (dx / d) * f;
            n.y += (dy / d) * f;
          }
        }
      }
    });

    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.5;
          ctx.strokeStyle = `rgba(10,10,10,${alpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x * w, n.y * h, n.r * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff66';
      ctx.shadowColor = 'rgba(0,255,102,0.8)';
      ctx.shadowBlur = 6 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(step);
  }
  step();
})();

// ---------- expose for i18n reinit ----------
window.VernyaAnim = { letterSwap, splitText };
