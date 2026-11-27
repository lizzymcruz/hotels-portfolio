// Static site generator for hotels.lizzymcruz.com.
// `node build.js` writes the whole site to ./public (no dependencies).
import fs from 'node:fs';
import path from 'node:path';
import { SITE, PROJECTS, ORDER, T, LEGAL } from './src/content.js';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'public');
const SRC = path.join(ROOT, 'src');
const V = Date.now().toString(36); // cache-busting for css/js
const LU_META = JSON.parse(fs.readFileSync(path.join(SRC, 'shots/lu-meta.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const other = (L) => (L === 'en' ? 'es' : 'en');

/* ---------- icons (all SVG, never text glyphs) ---------- */
const I = (d, extra = '') => `<svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;
const ICON = {
  arrow: I('<path d="M7 17 17 7M9 7h8v8"/>'),
  left: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  right: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  ext: I('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  minus: I('<path d="M5 12h14"/>'),
  menu: I('<path d="M4 8h16M4 16h16"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  mouse: I('<rect x="6.5" y="3" width="11" height="18" rx="5.5"/><path d="M12 7v3"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  linkedin: `<svg class="ic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.84-1.8 3.64-1.8 3.9 0 4.6 2.4 4.6 5.6v5.7h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.1h-4v-11Z"/></svg>`,
  whatsapp: `<svg class="ic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z"/></svg>`,
};

/* ---------- her logo, from lizzymcruz.com ---------- */
const LOGO = fs.readFileSync(path.join(SRC, 'logo.svg'), 'utf8').trim();

/* ---------- buttons ---------- */
const btn = (href, label, variant = 'dark', extra = '') =>
  `<a class="btn btn-${variant}" href="${href}"${extra}><span>${label}</span><span class="btn-ic">${ICON.arrow}</span></a>`;

const tag = (label, cls = '') => `<p class="tag ${cls}"><span class="dot" aria-hidden="true"></span>${label}</p>`;
const h2 = (parts, id, cls = '') => `<h2 id="${id}" class="h2 ${cls}">${esc(parts[0])} <span class="soft">${esc(parts[1])}</span></h2>`;
const lab = (label, cls = '') => `<p class="lab ${cls}"><span class="dot" aria-hidden="true"></span>${label}</p>`;

/* ---------- screenshots ---------- */
const SH = '/assets/shots/';
const unsplashAt = (src, factor, minW = 320) => {
  const u = new URL(src);
  const w = +u.searchParams.get('w'); const h = +u.searchParams.get('h');
  const nw = Math.max(minW, Math.min(w, Math.ceil((w * factor) / 50) * 50));
  u.searchParams.set('w', nw); if (h) u.searchParams.set('h', Math.round((h * nw) / w));
  u.searchParams.set('q', '60');
  return u.toString();
};
const pct = (n, d) => `${+((n / d) * 100).toFixed(3)}%`;

/** A screenshot of one of the demos. Lumbre's photos live on Unsplash, so its shots are a transparent
 *  overlay of the page with the real Unsplash photos placed underneath at the same positions. */
/** Width and height of a .webp file, read from its header. */
const webpSize = (file) => {
  const b = fs.readFileSync(file);
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (chunk === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  throw new Error('unknown webp ' + file);
};
const SIZE = {};
for (const f of fs.readdirSync(path.join(SRC, 'shots'))) if (f.endsWith('.webp')) SIZE[f] = webpSize(path.join(SRC, 'shots', f));

/** A screenshot of one of the demos. Lumbre's photos live on Unsplash, so its shots are a transparent
 *  overlay of the page with the real Unsplash photos placed underneath at the same positions.
 *  `defer` writes data-src instead of src, so the long full-page shots only load when needed. */
function shot(key, name, alt, { eager = false, sizes, defer = false } = {}) {
  const phone = name.startsWith('m-');
  const file = `${key}-${name}.webp`;
  const [w, h] = SIZE[file];
  const S = defer ? 'data-src' : 'src', SS = defer ? 'data-srcset' : 'srcset';
  const load = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  const small = SIZE[`${key}-${name}-800.webp`];
  const srcset = small ? ` ${SS}="${SH}${key}-${name}-800.webp 800w, ${SH}${file} ${w}w" sizes="${sizes || '(min-width: 1000px) 60vw, 92vw'}"` : '';
  const img = (cls = '') => `<img class="${cls}" ${S}="${SH}${file}"${srcset} width="${w}" height="${h}" alt="${esc(alt)}" ${load} decoding="async">`;
  if (key !== 'lu') return img('shot-img');
  const m = LU_META[`lu-${name}`];
  const layers = m.imgs.map((im) => {
    const [rl, rt, rw, rh] = im.rect; const [cl, ct, cw, ch] = im.clip;
    const factor = phone ? (rw / m.vw) * 0.55 : (rw / m.vw) * 0.8;
    return `<span class="ly" style="left:${pct(cl, m.vw)};top:${pct(ct, m.vh)};width:${pct(cw, m.vw)};height:${pct(ch, m.vh)}"><img ${S}="${esc(unsplashAt(im.src, factor))}" alt="" loading="${eager ? 'eager' : 'lazy'}" decoding="async" style="left:${pct(rl - cl, cw)};top:${pct(rt - ct, ch)};width:${pct(rw, cw)};height:${pct(rh, ch)};object-fit:${im.fit};object-position:${im.pos}"></span>`;
  }).join('');
  return `<span class="shot-layered">${layers}${img('shot-img shot-over')}</span>`;
}

/** The screen of a device. With `long`, it holds the whole home page: the first screen shows straight away,
 *  the full page loads when the visitor gets close, and they can scroll it (or hover to play it). */
function screen(key, name, alt, opts = {}) {
  if (!opts.long) return `<div class="mk-scr">${shot(key, name, alt, opts)}</div>`;
  const full = name.replace('home', 'full');
  const [w, h] = SIZE[`${key}-${full}.webp`];
  const focus = opts.interactive ? ` tabindex="0" role="region" aria-label="${esc(alt)}"` : '';
  return `<div class="mk-scr scr${opts.interactive ? ' scr-i' : ''}" data-scr${focus}><div class="scr-in">
   <span class="scr-poster">${shot(key, name, opts.interactive ? '' : alt, opts)}</span>
   <span class="scr-long" style="aspect-ratio:${w}/${h}">${shot(key, full, '', { defer: true })}</span>
  </div></div>`;
}
const browser = (key, name, alt, opts = {}) => {
  const p = PROJECTS[ORDER.find((s) => PROJECTS[s].key === key)];
  return `<div class="mk-b ${opts.cls || ''}"><div class="mk-bar" aria-hidden="true"><span class="mk-dots"><i></i><i></i><i></i></span><span class="mk-url">${p.host}</span></div>${screen(key, name, alt, opts)}</div>`;
};
const phone = (key, name, alt, opts = {}) => `<div class="mk-p ${opts.cls || ''}">${screen(key, name, alt, opts)}</div>`;

/* ---------- illustrations for the "what I found" findings ---------- */
const ILL = {
  frame: (inner) => `<svg class="ill" viewBox="0 0 384 250" aria-hidden="true" focusable="false"><rect width="384" height="250" fill="#EFEFED"/>${inner}</svg>`,
  win: (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="#2F3540" stroke-width="1.5"/><path d="M${x} ${y + 18}h${w}" stroke="#2F3540" stroke-width="1.2"/><circle cx="${x + 11}" cy="${y + 9}" r="2.5" fill="#9292C2"/><circle cx="${x + 19}" cy="${y + 9}" r="2.5" fill="#9292C2"/><circle cx="${x + 27}" cy="${y + 9}" r="2.5" fill="#9292C2"/>`,
  lines: (x, y, ws, gap = 9, c = '#C9C9CF') => ws.map((w, i) => `<rect x="${x}" y="${y + i * gap}" width="${w}" height="4" rx="2" fill="${c}"/>`).join(''),
};
const illus = (kind) => {
  const { frame, win, lines } = ILL;
  const ink = '#2F3540', lav = '#9292C2', red = '#B3261E';
  const no = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="15" fill="#fff" stroke="${red}" stroke-width="2"/><path d="M${cx - 6} ${cy - 6}l12 12M${cx + 6} ${cy - 6}l-12 12" stroke="${red}" stroke-width="2.2" stroke-linecap="round"/>`;
  switch (kind) {
    case 'contact': return frame(`${win(42, 28, 300, 194)}<rect x="56" y="58" width="130" height="90" rx="6" fill="#DCDCEB"/>${lines(200, 62, [110, 90, 100])}<rect x="200" y="96" width="126" height="18" rx="5" fill="#fff" stroke="#C9C9CF"/><rect x="200" y="120" width="126" height="18" rx="5" fill="#fff" stroke="#C9C9CF"/><rect x="200" y="144" width="126" height="34" rx="5" fill="#fff" stroke="#C9C9CF"/><rect x="200" y="186" width="70" height="20" rx="10" fill="${ink}"/>${lines(56, 162, [110, 80])}<path d="M64 192c4-6 10-6 12 0l-3 4c3 5 6 8 11 11l4-3c6 2 6 8 0 12-12 2-26-12-24-24Z" fill="none" stroke="${ink}" stroke-width="1.5"/>${no(318, 40)}`);
    case 'buried': return frame(`${win(42, 28, 300, 194)}${lines(150, 41, [22], 0)}${lines(180, 41, [22], 0)}${lines(210, 41, [22], 0)}${lines(240, 41, [22], 0)}<rect x="272" y="37" width="44" height="12" rx="6" fill="#fff" stroke="${lav}" stroke-width="1.5"/><circle cx="294" cy="43" r="16" fill="none" stroke="${lav}" stroke-width="1.5" stroke-dasharray="3 3"/>${lines(56, 41, [40], 0, ink)}<rect x="56" y="62" width="272" height="110" rx="6" fill="#DCDCEB"/>${lines(70, 182, [180, 140, 160])}<path d="M228 120h50M268 112l10 8-10 8" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".35"/>`);
    case 'phone': return frame(`<rect x="142" y="18" width="100" height="214" rx="16" fill="#fff" stroke="${ink}" stroke-width="1.5"/><rect x="152" y="34" width="80" height="50" rx="4" fill="#DCDCEB"/>${lines(152, 94, [80, 70, 76, 64, 72, 58, 78], 6)}${[0, 1, 2].map((i) => `<rect x="${152 + i * 28}" y="146" width="22" height="9" rx="2" fill="#fff" stroke="#C9C9CF"/>`).join('')}<rect x="152" y="162" width="30" height="9" rx="4" fill="${ink}"/><circle cx="168" cy="190" r="22" fill="${lav}" opacity=".35"/><circle cx="168" cy="190" r="22" fill="none" stroke="${lav}" stroke-width="1.5"/><path d="M262 70h50M262 80h34" stroke="#C9C9CF" stroke-width="4" stroke-linecap="round"/><text x="262" y="112" font-family="Google Sans, sans-serif" font-size="22" font-weight="500" fill="${ink}">9 px</text>`);
    case 'price': return frame(`${win(62, 28, 260, 194)}<rect x="76" y="58" width="232" height="90" rx="6" fill="#DCDCEB"/>${lines(76, 160, [120, 90])}<rect x="76" y="186" width="100" height="22" rx="11" fill="${ink}"/>${lines(90, 195, [72], 0, '#fff')}<rect x="232" y="174" width="76" height="36" rx="8" fill="#fff" stroke="${lav}" stroke-width="1.5"/><text x="270" y="199" text-anchor="middle" font-family="Google Sans, sans-serif" font-size="20" font-weight="500" fill="${ink}">€ ?</text>`);
    case 'same': return frame(`${[70, 214].map((x, i) => `<rect x="${x}" y="54" width="100" height="142" rx="10" fill="#fff" stroke="${ink}" stroke-width="1.5"/><rect x="${x + 12}" y="66" width="76" height="46" rx="5" fill="#DCDCEB"/>${lines(x + 12, 122, [60, 44])}<text x="${x + 50}" y="172" text-anchor="middle" font-family="Google Sans, sans-serif" font-size="22" font-weight="500" fill="${ink}">€120</text><rect x="${x + 22}" y="182" width="56" height="4" rx="2" fill="${i ? lav : '#C9C9CF'}"/>`).join('')}<path d="M184 118h16M184 128h16" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`);
    case 'slow': return frame(`${win(42, 28, 300, 194)}<rect x="56" y="58" width="272" height="110" rx="6" fill="#E4E4EA"/><circle cx="192" cy="113" r="16" fill="none" stroke="#C9C9CF" stroke-width="4"/><path d="M192 97a16 16 0 0 1 16 16" fill="none" stroke="${lav}" stroke-width="4" stroke-linecap="round"/><rect x="56" y="182" width="272" height="8" rx="4" fill="#E4E4EA"/><rect x="56" y="182" width="64" height="8" rx="4" fill="${lav}"/><text x="56" y="210" font-family="Google Sans, sans-serif" font-size="13" fill="${ink}">8.4 s</text>`);
    case 'handoff': return frame(`${win(28, 40, 170, 150)}<rect x="40" y="68" width="146" height="64" rx="5" fill="#DCDCEB"/><rect x="40" y="144" width="76" height="20" rx="10" fill="${ink}"/>${win(206, 64, 150, 150)}${lines(220, 96, [120, 100, 110, 90], 12, '#B9B9C0')}<rect x="220" y="150" width="100" height="16" rx="2" fill="#fff" stroke="#9A9AA2"/><rect x="220" y="174" width="60" height="18" rx="2" fill="#6E6E78"/><path d="M118 154c40 0 60-20 88-38" fill="none" stroke="${lav}" stroke-width="2" stroke-dasharray="4 4"/><path d="m198 112 9 3-4 9" fill="none" stroke="${lav}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
    case 'lang': return frame(`${win(42, 28, 300, 194)}<rect x="262" y="35" width="28" height="16" rx="8" fill="${ink}"/><text x="276" y="47" text-anchor="middle" font-family="Google Sans, sans-serif" font-size="10" font-weight="700" fill="#fff">ES</text><rect x="296" y="35" width="28" height="16" rx="8" fill="#fff" stroke="#C9C9CF"/><text x="310" y="47" text-anchor="middle" font-family="Google Sans, sans-serif" font-size="10" font-weight="700" fill="#9A9AA2">EN</text><path d="M298 50l24-14" stroke="${red}" stroke-width="1.6"/>${lines(56, 66, [200, 160])}<rect x="56" y="88" width="272" height="80" rx="6" fill="#DCDCEB"/><text x="56" y="194" font-family="Google Sans, sans-serif" font-size="12" fill="${ink}">Habitaciones · Rooms · Habitac…</text>`);
    default: return frame('');
  }
};

/* ---------- layout ---------- */
function head(L, { title, desc, path: p, alt, noindex, schema = [], fontsScript = false, headExtra = '' }) {
  const url = SITE.url + p;
  return `<!doctype html>
<html lang="${T[L].htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
${alt ? `<link rel="alternate" hreflang="en" href="${SITE.url + alt.en}">
<link rel="alternate" hreflang="es" href="${SITE.url + alt.es}">
<link rel="alternate" hreflang="x-default" href="${SITE.url + alt.en}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lizzy Cruz · Hotels">
<meta property="og:locale" content="${T[L].ogLocale}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE.url}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#9292C2">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/google-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/google-sans-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
${fontsScript ? '<link rel="preload" href="/assets/fonts/caveat-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>' : ''}
<link rel="stylesheet" href="/assets/css/site.css?v=${V}">
${headExtra}
<script>document.documentElement.classList.add('js')</script>
${schema.length ? `<script type="application/ld+json">${JSON.stringify(schema.length === 1 ? schema[0] : schema).replace(/</g, '\\u003c')}</script>` : ''}
</head>`;
}

function header(L, alt, onHome) {
  const t = T[L];
  const homeP = t.paths.home;
  const sec = (id) => (onHome ? `#${id}` : `${homeP}#${id}`);
  const lang = `<p class="lang" translate="no"><a href="${alt.en}" lang="en" ${L === 'en' ? 'aria-current="true"' : `hreflang="en"`} aria-label="English">EN</a><span aria-hidden="true">·</span><a href="${alt.es}" lang="es" ${L === 'es' ? 'aria-current="true"' : `hreflang="es"`} aria-label="Español">ES</a></p>`;
  return `<a class="skip" href="#main">${t.skip}</a>
<header class="hdr" data-hdr>
 <nav class="nav" aria-label="${L === 'en' ? 'Main' : 'Principal'}">
  <a class="brand" href="${homeP}" aria-label="Lizzy Cruz ${t.hotels}, ${t.home}" translate="no">${LOGO}<span class="chip">${t.hotels}</span></a>
  <ul class="nav-links" role="list">${t.nav.map(([id, label]) => `<li><a href="${sec(id)}">${label}</a></li>`).join('')}</ul>
  <div class="nav-end">${lang}${btn(sec('review'), t.cta, 'dark', ' data-nav-cta')}
   <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn><span class="sr">${t.menu}</span>${ICON.menu.replace('class="ic"', 'class="ic ic-open"')}${ICON.close.replace('class="ic"', 'class="ic ic-close"')}</button></div>
 </nav>
 <div class="menu" id="menu" hidden data-menu>
  <ul role="list">${t.nav.map(([id, label]) => `<li><a href="${sec(id)}">${label}${ICON.right}</a></li>`).join('')}</ul>
  ${btn(sec('review'), t.ctaLong, 'dark')}
 </div>
</header>`;
}

function footer(L, alt) {
  const t = T[L];
  return `<footer class="foot" aria-labelledby="foot-h">
 <div class="wrap foot-top">
  <p class="foot-h" id="foot-h">${esc(t.footH)}</p>
  <div class="foot-contact">
   <a class="foot-mail" href="mailto:${SITE.email}">${SITE.email}</a>
   <p class="foot-social">${SITE.whatsapp ? `<a href="${SITE.whatsapp}" target="_blank" rel="noopener">${ICON.whatsapp}WhatsApp<span class="sr"> ${t.newTab}</span></a>` : ''}<a href="${SITE.linkedin}" target="_blank" rel="noopener">${ICON.linkedin}LinkedIn<span class="sr"> ${t.newTab}</span></a></p>
   ${btn(SITE.main, `${t.mainSite} · lizzymcruz.com`, 'light', ' target="_blank" rel="noopener"')}
  </div>
 </div>
 <div class="wrap foot-bot">
  <p>© 2026 Lizzy Cruz · ${t.footLine}</p>
  <p class="foot-links"><a href="${t.paths.privacy}">${t.privacy}</a><a href="${t.paths.legal}">${t.legal}</a><a href="${alt[other(L)]}" lang="${other(L)}" hreflang="${other(L)}">${T[other(L)].langName}</a></p>
 </div>
</footer>`;
}

const page = (L, opts, body, onHome = false) => `${head(L, opts)}
<body${opts.bodyClass ? ` class="${opts.bodyClass}"` : ''}>
${header(L, opts.alt, onHome)}
<main id="main">
${body}
</main>
${footer(L, opts.alt)}
<script src="/assets/js/site.js?v=${V}" defer></script>
</body>
</html>`;

/* ---------- home ---------- */
function home(L) {
  const t = T[L];
  const alt = { en: T.en.paths.home, es: T.es.paths.home };
  const calcField = (name, label, val, min, max, step, unit, pre) => `<div class="cf">
   <label for="c-${name}">${label}</label>
   <div class="cf-in"><button type="button" class="step" data-step="-1" aria-label="${t.calc.less}: ${label}" aria-controls="c-${name}">${ICON.minus}</button>
    <span class="cf-box">${pre ? `<span class="unit" aria-hidden="true">${pre}</span>` : ''}<input id="c-${name}" name="${name}" type="number" inputmode="numeric" value="${val}" min="${min}" max="${max}" step="${step}" data-calc>${unit ? `<span class="unit" aria-hidden="true">${unit}</span>` : ''}</span>
    <button type="button" class="step" data-step="1" aria-label="${t.calc.more}: ${label}" aria-controls="c-${name}">${ICON.plus}</button></div>
  </div>`;
  const P = (s) => PROJECTS[s];
  const work = ORDER.map((slug, i) => {
    const p = P(slug), c = p[L];
    return `<article class="wk ${i % 2 ? 'wk-rev' : ''}" aria-labelledby="wk-${p.key}">
  <a class="wk-media" href="${t.paths.work(slug)}" tabindex="-1" aria-hidden="true"><span class="dev" data-dev>${browser(p.key, 'd-home', '', { long: true })}${phone(p.key, 'm-home', '', { cls: 'mk-p-over', long: true })}</span></a>
  <div class="wk-copy">
   <p class="wk-num"><span>0${i + 1}</span><span class="dot" aria-hidden="true"></span><span class="pill">${t.concept}</span></p>
   <h3 id="wk-${p.key}" class="h3"><a href="${t.paths.work(slug)}">${p.name}</a></h3>
   <p class="wk-meta">${c.meta}</p>
   <p class="wk-desc">${c.desc}</p>
   <ul class="chips" role="list">${c.chips.map((x) => `<li>${x}</li>`).join('')}</ul>
   <div class="btns">${btn(t.paths.work(slug), t.readCase, 'dark', ` aria-label="${t.readCase}: ${p.name}"`)}<a class="link-ext" href="${p.live}" target="_blank" rel="noopener">${t.visitLive}${ICON.ext}<span class="sr"> ${p.name} ${t.newTab}</span></a></div>
  </div>
 </article>`;
  }).join('\n');

  const schema = [{
    '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': SITE.url + '/#service', name: 'Lizzy Cruz · Websites for small hotels',
    url: SITE.url + t.paths.home, email: SITE.email, description: t.desc, areaServed: 'ES', availableLanguage: ['en', 'es'],
    founder: { '@type': 'Person', name: 'Lizzy Cruz', url: SITE.main, sameAs: [SITE.linkedin], jobTitle: 'Web designer and developer' },
    makesOffer: t.prices.map(([n, pr, d]) => ({ '@type': 'Offer', name: n, description: d, priceSpecification: { '@type': 'PriceSpecification', minPrice: +pr.replace(/\D/g, ''), priceCurrency: 'EUR' } })),
  }, {
    '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }];

  const body = `
<section class="hero" aria-labelledby="hero-h">
 <p class="hero-word" aria-hidden="true">HOTELS</p>
 <div class="wrap hero-grid">
  <div class="hero-copy">
   <p class="avail"><span class="pulse" aria-hidden="true"></span>${t.avail}</p>
   <h1 id="hero-h" class="h1">${t.heroH[0]} ${t.heroH[1]} <span class="script">${t.heroScript}</span></h1>
   <p class="hero-p">${t.heroP}</p>
   <div class="btns">${btn('#review', t.ctaLong, 'dark')}${btn('#work', t.seeWork, 'light')}</div>
  </div>
  <div class="hero-media">
   ${ORDER.map((slug, i) => { const q = PROJECTS[slug]; return `<div class="dev" data-dev id="dev-${q.key}"${i ? ' hidden' : ''}>${browser(q.key, 'd-home', `${q.name}, ${t.shot['d-home']}. ${t.scrollHint}`, { eager: !i, long: true, interactive: true, sizes: '(min-width: 1000px) 640px, 90vw' })}${phone(q.key, 'm-home', `${q.name}, ${t.shot['m-home']}. ${t.scrollHint}`, { cls: 'mk-p-over', eager: !i, long: true, interactive: true })}</div>`; }).join('')}
   <div class="dev-tabs" role="group" aria-label="${t.pickDemo}">${ORDER.map((slug, i) => `<button type="button" class="dev-tab" aria-pressed="${!i}" aria-controls="dev-${PROJECTS[slug].key}" data-dev-tab><span class="dot" aria-hidden="true" style="background:${PROJECTS[slug].accent}"></span>${PROJECTS[slug].name}</button>`).join('')}</div>
   <p class="dev-hint" aria-hidden="true">${ICON.mouse}${t.scrollTip}</p>
  </div>
 </div>
 <div class="wrap trust">
  <p class="trust-l">${t.trustLabel}</p>
  <ul role="list">${t.trust.map(([n, c]) => `<li><b>${n}</b><span>${c}</span></li>`).join('')}</ul>
 </div>
</section>

<section class="sec sec-light" aria-labelledby="pr-h">
 <div class="wrap split">
  <div>${tag(t.problemTag)}${h2(t.problemH, 'pr-h')}<p class="lede">${t.problemP}</p></div>
  <form class="calc" data-calc-form aria-labelledby="calc-h" onsubmit="return false">
   <p class="lab" id="calc-h"><span class="dot" aria-hidden="true"></span>${t.calc.h}</p>
   ${calcField('rooms', t.calc.rooms, 12, 1, 300, 1)}
   ${calcField('rate', t.calc.rate, 120, 20, 3000, 5, '', '€')}
   ${calcField('occ', t.calc.occ, 70, 5, 100, 5, '%')}
   ${calcField('ota', t.calc.ota, 60, 0, 100, 5, '%')}
   <div class="calc-out" aria-live="polite" data-calc-out data-locale="${t.calc.locale}" data-win="${esc(t.calc.win('{x}'))}">
    <p class="lab lab-dark"><span class="dot" aria-hidden="true"></span>${t.calc.result}</p>
    <p class="calc-num"><span aria-hidden="true">≈ </span><output data-calc-total>€37,500</output></p>
    <p class="calc-win" data-calc-win>${t.calc.win('€7,500')}</p>
   </div>
   <p class="calc-note">${t.calc.note}</p>
  </form>
 </div>
</section>

<section class="sec sec-grey" id="work" aria-labelledby="work-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.workTag)}<div class="sec-head-row">${h2(t.workH, 'work-h')}<p class="sec-note">${t.workNote}</p></div></div>
  <div class="work">${work}</div>
 </div>
</section>

<section class="sec sec-dark" id="services" aria-labelledby="sv-h">
 <div class="wrap">
  <div class="sv-head">${tag(t.servicesTag, 'tag-dark')}${h2(t.servicesH, 'sv-h')}</div>
  <ol class="sv" role="list">${t.services.map(([h, p, chips], i) => `<li class="sv-row"><p class="sv-num"><span>0${i + 1}</span><span class="dot" aria-hidden="true"></span></p><div><h3 class="h3">${h}</h3><p>${p}</p></div><ul class="chips chips-dark" role="list">${chips.map((c) => `<li>${c}</li>`).join('')}</ul></li>`).join('')}</ol>
 </div>
</section>

<section class="sec sec-light" aria-labelledby="pf-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.proofTag)}${h2(t.proofH, 'pf-h')}</div>
  <div class="bento">
   ${['a11y', 'speed', 'steps'].map((k) => `<div class="bx">${lab(t.proof[k][0])}<p class="bx-big">${t.proof[k][1]}</p><p>${t.proof[k][2]}</p></div>`).join('')}
   <div class="bx bx-dark bx-wide">${lab(t.proof.why[0], 'lab-dark')}<p class="bx-lead">${t.proof.why[1]}</p><p>${t.proof.why[2]}</p></div>
   <div class="bx bx-lav">${lab(t.proof.zero[0])}<p class="bx-big">${t.proof.zero[1]}</p><p>${t.proof.zero[2]}</p></div>
  </div>
 </div>
</section>

<section class="sec sec-grey" id="process" aria-labelledby="pc-h">
 <div class="wrap">
  <div class="sec-head center">${tag(t.processTag)}${h2(t.processH, 'pc-h')}</div>
  <ol class="steps" role="list">${t.process.map(([h, p], i) => `<li class="stp"><p class="stp-n" aria-hidden="true">0${i + 1}</p><h3 class="lab lab-dark"><span class="dot" aria-hidden="true"></span>${h}</h3><p>${p}</p></li>`).join('')}</ol>
 </div>
</section>

<section class="sec sec-light" id="packages" aria-labelledby="pk-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.pricesTag)}<div class="sec-head-row">${h2(t.pricesH, 'pk-h')}<p class="sec-note">${t.pricesNote}</p></div></div>
  <div class="prices">${t.prices.map(([n, pr, d, list], i) => `<article class="pc ${i === 1 ? 'pc-dark' : ''}" aria-labelledby="pk-${i}">
   <div class="pc-top"><h3 class="lab ${i === 1 ? 'lab-dark' : ''}" id="pk-${i}"><span class="dot" aria-hidden="true"></span>${n}</h3>${i === 1 ? `<span class="badge">${t.popular}</span>` : ''}</div>
   <p class="pc-price"><span>${t.from}</span> ${pr}</p>
   <p class="pc-usd">${t.approx} ${t.usd[i]}</p>
   <p class="pc-desc">${d}</p>
   <ul role="list" class="pc-list">${list.map((x) => `<li>${ICON.check}${x}</li>`).join('')}</ul>
   ${btn('#review', t.startReview, i === 1 ? 'light' : 'dark', ` aria-label="${t.startReview}: ${n}"`)}
  </article>`).join('')}</div>
 </div>
</section>

<section class="sec sec-grey" id="faq" aria-labelledby="faq-h">
 <div class="wrap faq-grid">
  <div>${tag(t.faqTag)}${h2(t.faqH, 'faq-h')}</div>
  <div class="faq">${t.faq.map(([q, a], i) => `<details class="qa"${i === 0 ? ' open' : ''}><summary><span>${q}</span><span class="qa-ic" aria-hidden="true">${ICON.plus.replace('class="ic"', 'class="ic ic-plus"')}${ICON.minus.replace('class="ic"', 'class="ic ic-minus"')}</span></summary><p>${a}</p></details>`).join('')}</div>
 </div>
</section>

<section class="sec sec-light" id="review" aria-labelledby="rv-h">
 <div class="wrap">
  <div class="rv">
   <div class="rv-copy">${tag(t.reviewTag)}<h2 class="h2" id="rv-h">${t.reviewH}</h2><p>${t.reviewP}</p></div>
   <form class="rv-form" data-review novalidate data-subject="${esc(t.form.subject)}" data-body="${esc(t.form.body('{h}', '{s}', '{e}'))}" data-email="${SITE.email}">
    <div class="rv-logo" aria-hidden="true">${LOGO}</div>
    ${[['hotel', t.form.hotel, 'text', 'organization', t.form.ph[0]], ['site', t.form.site, 'text', 'url', t.form.ph[1]], ['email', t.form.email, 'email', 'email', t.form.ph[2]]].map(([n, l, ty, ac, ph]) => `<div class="field"><label for="f-${n}">${l}</label><input id="f-${n}" name="${n}" type="${ty}" autocomplete="${ac}" placeholder="${ph}" required aria-describedby="f-${n}-err"${n === 'site' ? ' inputmode="url"' : ''}><p class="err" id="f-${n}-err" data-req="${esc(t.form.req)}" data-bad="${esc(t.form.bad)}"></p></div>`).join('')}
    <button class="btn btn-dark btn-full" type="submit"><span>${t.form.send}</span><span class="btn-ic">${ICON.arrow}</span></button>
    <p class="rv-msg" role="status" data-review-msg data-sent="${esc(t.form.sent)}"></p>
   </form>
  </div>
 </div>
</section>`;
  return page(L, { title: t.title, desc: t.desc, path: t.paths.home, alt, schema, fontsScript: true, bodyClass: 'is-home' }, body, true);
}

/* ---------- case study ---------- */
function caseStudy(L, slug) {
  const t = T[L]; const p = PROJECTS[slug]; const c = p[L];
  const idx = ORDER.indexOf(slug);
  const alt = { en: T.en.paths.work(slug), es: T.es.paths.work(slug) };
  const S = (n) => `${p.name}, ${t.shot[n]}`;
  const decisions = c.decisions.map(([h, d, img], i) => {
    const media = Array.isArray(img)
      ? `<div class="dc-phones">${img.map((n) => phone(p.key, n, S(n))).join('')}</div>`
      : browser(p.key, img, S(img), { sizes: '(min-width: 1000px) 720px, 92vw' });
    return `<div class="dc ${i % 2 ? 'dc-rev' : ''}"><div class="dc-copy"><p class="num-dot"><span>0${i + 1}</span><span class="dot" aria-hidden="true"></span></p><h3 class="h3">${h}</h3><p>${d}</p></div><div class="dc-media">${media}</div></div>`;
  }).join('');
  const more = ORDER.filter((s) => s !== slug).map((s) => {
    const q = PROJECTS[s];
    return `<a class="more-card" href="${t.paths.work(s)}">${browser(q.key, 'd-home', '', { sizes: '(min-width: 1000px) 580px, 92vw' })}<span class="more-cap"><span class="more-name"><span class="dot" aria-hidden="true"></span>${q.name}</span><span class="more-meta">${q[L].card}</span></span></a>`;
  }).join('');
  const schema = [{
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: `${p.name} · ${t.caseLabel}`, about: c.lead, url: SITE.url + t.paths.work(slug), inLanguage: L,
    author: { '@type': 'Person', name: 'Lizzy Cruz', url: SITE.main }, image: `${SITE.url}${SH}${p.key}-d-home.webp`,
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.allWork, item: SITE.url + t.paths.home + '#work' },
      { '@type': 'ListItem', position: 2, name: p.name, item: SITE.url + t.paths.work(slug) }],
  }];
  const body = `
<section class="cs-top" aria-labelledby="cs-h">
 <div class="wrap">
  <nav class="crumbs" aria-label="${L === 'en' ? 'Breadcrumb' : 'Ruta'}"><a href="${t.paths.home}#work">${ICON.left}${t.allWork}</a><span aria-hidden="true">/</span><span aria-current="page">${t.caseLabel} 0${idx + 1}</span></nav>
  <ul class="cs-tags" role="list">${c.tags.map((x) => `<li>${tag(x)}</li>`).join('')}</ul>
  <h1 class="h1 cs-h" id="cs-h">${p.name}</h1>
  <p class="cs-lead">${c.lead}</p>
  <dl class="cs-details">${c.details.map(([k, v]) => `<div class="bx"><dt class="lab"><span class="dot" aria-hidden="true"></span>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  <div class="btns">${btn(p.live, t.visit, 'dark', ' target="_blank" rel="noopener"').replace('</span><span class="btn-ic">', `<span class="sr"> ${t.newTab}</span></span><span class="btn-ic">`)}${btn(t.paths.home + '#review', t.bookCall, 'light')}</div>
 </div>
 <div class="wrap cs-hero"><div class="dev" data-dev>${browser(p.key, 'd-home', `${S('d-home')}. ${t.scrollHint}`, { eager: true, long: true, interactive: true, sizes: '(min-width: 1240px) 1060px, 92vw' })}${phone(p.key, 'm-home', `${S('m-home')}. ${t.scrollHint}`, { cls: 'mk-p-over', eager: true, long: true, interactive: true })}</div><p class="dev-hint" aria-hidden="true">${ICON.mouse}${t.scrollTip}</p></div>
</section>

<section class="sec sec-grey" aria-labelledby="ov-h">
 <div class="wrap split split-top">
  <div>${tag(t.overviewTag)}${h2(c.overviewH, 'ov-h')}<p class="lede">${c.overview}</p></div>
  <ol class="goals" role="list">${c.goals.map(([h, d], i) => `<li class="bx"><p class="num-dot"><span>0${i + 1}</span><span class="dot" aria-hidden="true"></span></p><h3 class="h4">${h}</h3><p>${d}</p></li>`).join('')}</ol>
 </div>
</section>

<section class="sec sec-light" aria-labelledby="fd-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.problemTag2)}${h2(c.problemH, 'fd-h')}</div>
  <ul class="finds" role="list">${c.findings.map(([k, h, d]) => `<li>${illus(k)}<h3 class="lab lab-lg"><span class="dot" aria-hidden="true"></span>${h}</h3><p>${d}</p></li>`).join('')}</ul>
 </div>
</section>

<section class="sec sec-grey" aria-labelledby="br-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.brandTag)}${h2(c.brandH, 'br-h')}</div>
  <div class="brand-row">
   <img class="brand-img" src="${SH}${p.key}-brand.webp" srcset="${SH}${p.key}-brand-700.webp 700w, ${SH}${p.key}-brand.webp 1400w" sizes="(min-width: 1000px) 700px, 92vw" width="1400" height="920" alt="${esc(t.brandAlt(p.name))}" loading="lazy" decoding="async">
   <div class="brand-side">
    <ul class="swatches" role="list">${c.palette.map(([n, h]) => `<li><span class="sw" style="background:${h}" aria-hidden="true"></span><b>${n}</b><span translate="no">${h}</span></li>`).join('')}</ul>
    <div class="bx type">${c.type.map(([n, d, ff]) => `<p class="type-n" style="font-family:${ff.replace(/'/g, '&#39;')}">${n}</p><p class="type-d">${d}</p>`).join('')}</div>
    <p class="brand-note">${c.brandNote}</p>
   </div>
  </div>
 </div>
</section>

<section class="sec sec-light" aria-labelledby="dc-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.decisionsTag)}${h2(t.decisionsH, 'dc-h')}</div>
  <div class="dcs">${decisions}</div>
 </div>
</section>

<section class="sec sec-dark" aria-labelledby="fn-h">
 <div class="wrap">
  <div class="sec-head center">${tag(t.finalTag, 'tag-dark')}${h2(t.finalH, 'fn-h')}</div>
  ${browser(p.key, 'd-home', S('d-home'), { cls: 'mk-big', sizes: '(min-width: 1240px) 1200px, 92vw' })}
  <div class="fn-phones">${['m-home', 'm-room', 'm-dp', 'm-book'].map((n) => phone(p.key, n, S(n))).join('')}</div>
 </div>
</section>

<section class="sec sec-light" aria-labelledby="bp-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.builtTag)}${h2(t.builtH, 'bp-h')}</div>
  <ul class="stats" role="list">${c.stats.map(([k, v, d]) => `<li class="bx">${lab(k)}<p class="bx-big">${v}</p><p>${d}</p></li>`).join('')}</ul>
  <div class="fy">
   <div>${lab(t.forYou, 'lab-dark')}<h2 class="h3">${t.forYouH}</h2><p>${t.forYouP}</p></div>
   ${btn(t.paths.home + '#review', t.ctaLong, 'light')}
  </div>
 </div>
</section>

<section class="sec sec-grey" aria-labelledby="mw-h">
 <div class="wrap">
  <div class="sec-head">${tag(t.moreWork)}<h2 class="sr" id="mw-h">${t.moreWork}</h2></div>
  <div class="more">${more}</div>
 </div>
</section>`;
  const FONTS = { al: [['Gloock', 'gloock'], ['Hanken Grotesk', 'hanken-grotesk']], az: [['Young Serif', 'young-serif'], ['Figtree', 'figtree']], lu: [['EB Garamond', 'eb-garamond'], ['Jost', 'jost']] }[p.key];
  const faces = FONTS.map(([n, f]) => `@font-face{font-family:'${n}';font-display:swap;src:url(/assets/fonts/brand/${f}-latin-400-normal.woff2) format('woff2')}`).join('');
  return page(L, { title: `${p.name} · ${t.caseLabel} · Lizzy Cruz`, headExtra: `<style>${faces}</style>`, desc: c.lead, path: t.paths.work(slug), alt, schema, bodyClass: `cs cs-${p.key}` }, body);
}

/* ---------- text pages ---------- */
function textPage(L, kind) {
  const t = T[L];
  const alt = { en: T.en.paths[kind], es: T.es.paths[kind] };
  const h = kind === 'privacy' ? t.privacyH : t.legalH;
  const body = `<section class="sec sec-light text-page" aria-labelledby="tp-h"><div class="wrap narrow">
  <nav class="crumbs" aria-label="${L === 'en' ? 'Breadcrumb' : 'Ruta'}"><a href="${t.paths.home}">${ICON.left}Lizzy Cruz · ${t.hotels}</a></nav>
  <h1 class="h2" id="tp-h">${h}</h1><p class="muted">${t.updated}: ${L === 'en' ? '27 November 2026' : '27 de noviembre de 2026'}</p>
  ${LEGAL[L][kind].map(([hh, pp]) => `<h2 class="h4">${hh}</h2><p>${pp}</p>`).join('')}
 </div></section>`;
  return page(L, { title: `${h} · Lizzy Cruz`, desc: `${h} · Lizzy Cruz · ${t.footLine}`, path: t.paths[kind], alt }, body);
}

function notFound() {
  const t = T.en, e = T.es;
  const body = `<section class="sec sec-light text-page center"><div class="wrap narrow">
  <h1 class="h2">${t.notFoundH}</h1><p class="lede">${t.notFoundP}</p>
  <div class="btns center">${btn('/', t.backHome, 'dark')}${btn('/es/', e.backHome, 'light', ' lang="es"')}</div></div></section>`;
  return page('en', { title: 'Page not found · Lizzy Cruz', desc: t.notFoundP, path: '/404', alt: { en: '/', es: '/es/' }, noindex: true }, body);
}

/* ---------- write ---------- */
const write = (p, html) => { const f = path.join(OUT, p, p.endsWith('.html') ? '' : 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const copyDir = (from, to, filter = () => true) => { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) if (filter(f)) fs.copyFileSync(path.join(from, f), path.join(to, f)); };

fs.rmSync(OUT, { recursive: true, force: true });
for (const L of ['en', 'es']) {
  write(T[L].paths.home, home(L));
  for (const s of ORDER) write(T[L].paths.work(s), caseStudy(L, s));
  write(T[L].paths.privacy, textPage(L, 'privacy'));
  write(T[L].paths.legal, textPage(L, 'legal'));
}
write('404.html', notFound());
copyDir(path.join(SRC, 'css'), path.join(OUT, 'assets/css'));
copyDir(path.join(SRC, 'js'), path.join(OUT, 'assets/js'));
copyDir(path.join(SRC, 'fonts'), path.join(OUT, 'assets/fonts'), (f) => f.endsWith('.woff2'));
copyDir(path.join(SRC, 'fonts/brand'), path.join(OUT, 'assets/fonts/brand'));
copyDir(path.join(SRC, 'shots'), path.join(OUT, 'assets/shots'), (f) => f.endsWith('.webp'));
copyDir(path.join(SRC, 'static'), OUT);
fs.copyFileSync(path.join(SRC, 'og.png'), path.join(OUT, 'assets/og.png'));
const urls = ['en', 'es'].flatMap((L) => [T[L].paths.home, ...ORDER.map((s) => T[L].paths.work(s)), T[L].paths.privacy, T[L].paths.legal]);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
console.log(`Built ${urls.length + 1} pages into public/`);
