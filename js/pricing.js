// ============================================================
// EDITABLE CONFIG — change prices/discounts here, nothing else
// needs to change for the UI or math to stay correct.
// ============================================================

const SERVICES = [
  {
    id: 'web',
    nameKey: 'svc.web.title',
    descKey: 'pricing.svc.web.desc',
    price: 20, // EUR / month, "starting at"
    startingAt: true,
    icon: '<rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  },
  {
    id: 'mobile',
    nameKey: 'svc.mobile.title',
    descKey: 'pricing.svc.mobile.desc',
    price: 20,
    startingAt: true,
    icon: '<rect x="6" y="2" width="12" height="20" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M11 19h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  },
  {
    id: 'uiux',
    nameKey: 'svc.uiux.title',
    descKey: 'pricing.svc.uiux.desc',
    price: 20,
    startingAt: true,
    icon: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M8 13c1 1.5 2.5 2 4 2s3-.5 4-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 9.5h.01M15 9.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  },
  {
    id: 'support',
    nameKey: 'pricing.svc.support.title',
    descKey: 'pricing.svc.support.desc',
    price: 20,
    startingAt: true,
    icon: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  },
  {
    id: 'ai',
    nameKey: 'pricing.svc.ai.title',
    descKey: 'pricing.svc.ai.desc',
    price: 20, // "starting at" estimate. Set to null to switch this card to pure "Custom Quote" mode.
    startingAt: true,
    excludeFromDiscount: true, // AI Consulting's price never counts toward the bundle % — business rule, independent of the price shown.
    icon: '<path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  },
];

// Bundle discount by number of services selected (AI Consulting counts
// toward the tier, but its own price is never discounted — see calc()).
const DISCOUNT_TIERS = { 1: 0, 2: 0.10, 3: 0.15, 4: 0.20, 5: 0.25 };

// Extra discount applied on top of the bundle discount when billed annually.
const ANNUAL_DISCOUNT = 0.10;

// ============================================================
// State + calculation
// ============================================================

const state = {
  selected: new Set(),
  billing: 'monthly', // 'monthly' | 'annual'
};

function calc() {
  const selectedServices = SERVICES.filter((s) => state.selected.has(s.id));
  const fixed = selectedServices.filter((s) => !(s.excludeFromDiscount || s.price === null));
  const estimated = selectedServices.filter((s) => s.excludeFromDiscount || s.price === null);

  const fixedSubtotal = fixed.reduce((sum, s) => sum + s.price, 0);
  const estimatedSubtotal = estimated.reduce((sum, s) => sum + (s.price || 0), 0);

  const count = selectedServices.length;
  const bundlePct = DISCOUNT_TIERS[count] || 0;
  const bundleSavings = fixedSubtotal * bundlePct;
  const afterBundle = fixedSubtotal - bundleSavings;

  const annualPct = state.billing === 'annual' ? ANNUAL_DISCOUNT : 0;
  const annualSavings = afterBundle * annualPct;
  const finalFixed = afterBundle - annualSavings;

  const hasCustomOnly = estimated.some((s) => s.price === null);
  const hasEstimate = estimated.length > 0;

  return {
    selectedServices,
    count,
    fixedSubtotal,
    estimatedSubtotal,
    bundlePct,
    bundleSavings,
    annualPct,
    annualSavings,
    totalSavings: bundleSavings + annualSavings,
    total: finalFixed + estimatedSubtotal,
    hasEstimate,
    hasCustomOnly,
    isMaxBundle: count === SERVICES.length,
  };
}

// ============================================================
// Rendering
// ============================================================

function t(key) {
  return (window.I18N && window.I18N[document.documentElement.lang] && window.I18N[document.documentElement.lang][key]) || key;
}

function fmt(n) {
  return '€' + Math.round(n).toLocaleString('en-US');
}

function renderCards() {
  const grid = document.getElementById('serviceGrid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map((s) => {
    const priceLabel = s.price === null
      ? t('pricing.customQuote')
      : (s.startingAt ? `${t('pricing.startingAt')} ${fmt(s.price)}${t('pricing.perMo')}` : `${fmt(s.price)}${t('pricing.perMo')}`);
    return `
      <button type="button" class="pricing-card" data-service="${s.id}" data-reveal role="switch" aria-checked="false">
        <span class="pricing-card-check" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${s.icon}</svg>
        </div>
        <h3 data-i18n="${s.nameKey}">${t(s.nameKey)}</h3>
        <p class="pricing-card-desc" data-i18n="${s.descKey}">${t(s.descKey)}</p>
        <p class="pricing-card-price">${priceLabel}</p>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.pricing-card').forEach((card) => {
    card.addEventListener('click', () => toggleService(card.dataset.service));
  });

  if (window.VernyaAnim) window.VernyaAnim.scrollReveal.init();
}

function toggleService(id) {
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);
  update();
}

// Smooth number tween — same easing family the rest of the site uses
// for its animated counters.
function tweenNumber(el, from, to, duration = 320) {
  cancelAnimationFrame(el._tweenRaf);
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * eased);
    if (p < 1) el._tweenRaf = requestAnimationFrame(step);
  }
  el._tweenRaf = requestAnimationFrame(step);
}

let lastTotal = 0;
let badgeShown = false;

function update() {
  const r = calc();

  document.querySelectorAll('.pricing-card').forEach((card) => {
    const isSelected = state.selected.has(card.dataset.service);
    card.classList.toggle('is-selected', isSelected);
    card.setAttribute('aria-checked', String(isSelected));
  });

  const summary = document.getElementById('summaryPanel');
  const emptyState = document.getElementById('summaryEmpty');
  const body = document.getElementById('summaryBody');
  if (summary) summary.classList.toggle('has-selection', r.count > 0);
  if (emptyState) emptyState.style.display = r.count > 0 ? 'none' : 'block';
  if (body) body.style.display = r.count > 0 ? 'block' : 'none';

  // selected list
  const listEl = document.getElementById('summaryList');
  if (listEl) {
    listEl.innerHTML = r.selectedServices.map((s) => {
      const line = s.price === null
        ? t('pricing.customQuote')
        : (s.startingAt ? `~${fmt(s.price)}${t('pricing.perMo')}` : `${fmt(s.price)}${t('pricing.perMo')}`);
      return `<li><span class="key">"${t(s.nameKey)}"</span><span class="val">${line}</span></li>`;
    }).join('');
  }

  const subtotalEl = document.getElementById('summarySubtotal');
  if (subtotalEl) tweenNumber(subtotalEl, parseFloat(subtotalEl.dataset.raw || 0), r.fixedSubtotal + r.estimatedSubtotal);
  if (subtotalEl) subtotalEl.dataset.raw = r.fixedSubtotal + r.estimatedSubtotal;

  const discountRow = document.getElementById('summaryDiscountRow');
  const discountPctEl = document.getElementById('summaryDiscountPct');
  const savingsEl = document.getElementById('summarySavings');
  const totalPct = r.bundlePct + r.annualPct - r.bundlePct * r.annualPct;
  if (discountRow) discountRow.style.display = totalPct > 0 ? 'flex' : 'none';
  if (discountPctEl) discountPctEl.textContent = Math.round(totalPct * 100 + 1e-9) + '%';
  if (savingsEl) tweenNumber(savingsEl, parseFloat(savingsEl.dataset.raw || 0), r.totalSavings);
  if (savingsEl) savingsEl.dataset.raw = r.totalSavings;

  const noteEl = document.getElementById('summaryNote');
  if (noteEl) noteEl.style.display = r.hasEstimate ? 'block' : 'none';

  const totalEl = document.getElementById('summaryTotal');
  if (totalEl) {
    tweenNumber(totalEl, lastTotal, r.total);
    lastTotal = r.total;
  }

  const badge = document.getElementById('bestValueBadge');
  if (badge) {
    if (r.isMaxBundle && !badgeShown) {
      badge.classList.add('is-visible', 'pop');
      badgeShown = true;
      setTimeout(() => badge.classList.remove('pop'), 500);
    } else if (!r.isMaxBundle) {
      badge.classList.remove('is-visible');
      badgeShown = false;
    }
  }

  const cta = document.getElementById('pricingCta');
  if (cta) {
    const wantsQuote = r.hasCustomOnly || (state.selected.has('ai') && SERVICES.find((s) => s.id === 'ai').excludeFromDiscount);
    cta.disabled = r.count === 0;
    cta.querySelector('span').textContent = r.count === 0
      ? t('pricing.cta.select')
      : (wantsQuote ? t('pricing.cta.quote') : t('pricing.cta.subscribe'));
  }

  const mobileBarTotal = document.getElementById('mobileBarTotal');
  if (mobileBarTotal) mobileBarTotal.textContent = r.count > 0 ? fmt(r.total) + t('pricing.perMo') : t('pricing.cta.select');
}

function initBillingToggle() {
  document.querySelectorAll('.billing-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.billing = btn.dataset.billing;
      document.querySelectorAll('.billing-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
      update();
    });
  });
}

function initMobileDrawer() {
  const bar = document.getElementById('mobileSummaryBar');
  const drawer = document.getElementById('summaryPanel');
  if (!bar || !drawer) return;
  bar.querySelector('.mobile-bar-expand')?.addEventListener('click', () => {
    drawer.classList.toggle('is-drawer-open');
  });
  drawer.querySelector('.summary-close')?.addEventListener('click', () => {
    drawer.classList.remove('is-drawer-open');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('serviceGrid')) return;
  renderCards();
  initBillingToggle();
  initMobileDrawer();
  update();
  window.addEventListener('vernya:langchange', () => { renderCards(); update(); });
});
