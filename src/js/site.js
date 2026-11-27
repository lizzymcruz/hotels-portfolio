// hotels.lizzymcruz.com: menu, commission calculator, free-review form, gentle reveals.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- mobile menu ---------- */
  const btn = $('[data-menu-btn]'), menu = $('[data-menu]');
  if (btn && menu) {
    const label = btn.querySelector('.sr');
    const open = label.textContent, closeTxt = document.documentElement.lang === 'es' ? 'Cerrar menú' : 'Close menu';
    const set = (on) => {
      btn.setAttribute('aria-expanded', on); menu.hidden = !on;
      label.textContent = on ? closeTxt : open;
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
    document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('[data-hdr]')) set(false); });
    matchMedia('(min-width: 1061px)').addEventListener('change', (m) => m.matches && set(false));
  }

  /* ---------- commission calculator ---------- */
  const form = $('[data-calc-form]');
  if (form) {
    const out = $('[data-calc-out]'), total = $('[data-calc-total]'), win = $('[data-calc-win]');
    const fmt = new Intl.NumberFormat(out.dataset.locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const val = (n) => { const i = form.elements[n]; const v = parseFloat(i.value); return Number.isFinite(v) ? Math.min(Math.max(v, +i.min), +i.max) : 0; };
    const round = (x) => (x >= 1000 ? Math.round(x / 100) * 100 : Math.round(x / 10) * 10);
    let timer;
    const calc = () => {
      const commission = val('rooms') * val('rate') * 365 * (val('occ') / 100) * (val('ota') / 100) * 0.17;
      total.textContent = fmt.format(round(commission));
      clearTimeout(timer); // announce once typing settles
      timer = setTimeout(() => { win.innerHTML = out.dataset.win.replace('{x}', fmt.format(round(commission / 5))); }, 250);
    };
    form.addEventListener('input', calc);
    form.addEventListener('change', (e) => { const i = e.target; if (i.matches('[data-calc]')) { i.value = val(i.name); calc(); } });
    $$('.step', form).forEach((b) => b.addEventListener('click', () => {
      const i = document.getElementById(b.getAttribute('aria-controls'));
      const step = +i.step || 1;
      i.value = Math.min(Math.max((parseFloat(i.value) || 0) + step * +b.dataset.step, +i.min), +i.max);
      calc();
    }));
    calc();
  }

  /* ---------- free review form: opens the visitor's email app with everything filled in ---------- */
  const rv = $('[data-review]');
  if (rv) {
    const msg = $('[data-review-msg]', rv);
    const check = (i) => {
      const err = document.getElementById(i.getAttribute('aria-describedby'));
      const v = i.value.trim();
      let m = '';
      if (!v) m = err.dataset.req;
      else if (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) m = err.dataset.bad;
      err.textContent = m; i.setAttribute('aria-invalid', m ? 'true' : 'false');
      return !m;
    };
    $$('input', rv).forEach((i) => i.addEventListener('blur', () => i.value && check(i)));
    rv.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = $$('input', rv);
      const bad = inputs.filter((i) => !check(i));
      if (bad.length) { bad[0].focus(); return; }
      const [h, s, em] = inputs.map((i) => i.value.trim());
      const body = rv.dataset.body.replace('{h}', h).replace('{s}', s).replace('{e}', em);
      msg.textContent = msg.dataset.sent;
      const a = document.createElement('a');
      a.href = `mailto:${rv.dataset.email}?subject=${encodeURIComponent(`${rv.dataset.subject}: ${h}`)}&body=${encodeURIComponent(body)}`;
      a.click();
    });
  }

  /* ---------- reveal on scroll ---------- */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const els = $$('.sec-head, .wk, .bx, .stp, .pc, .qa, .sv-row, .dc, .finds li, .fn-phones, .mk-big, .more-card, .rv, .fy, .calc, .brand-row');
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting || en.boundingClientRect.top < 0) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => { el.classList.add('rv-up'); io.observe(el); });
  }
})();
