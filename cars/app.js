import { STR, LANGS } from './i18n.js';
import { BRAND_PATHS, brandKey } from './brands.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = (area) => ({
  get(k, d) { try { const v = area.getItem('md_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { area.setItem('md_' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  del(k) { try { area.removeItem('md_' + k); } catch { /* storage blocked */ } },
});
let local, session;
try { local = store(localStorage); session = store(sessionStorage); } catch { local = session = store({ getItem: () => null, setItem() {}, removeItem() {} }); }

// IndexedDB key/value store (falls back to memory if the browser blocks it).
const db = (() => {
  const mem = new Map();
  let p;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open('masterdrive', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = (mode, fn) => open().then(d => new Promise((res, rej) => {
    const q = fn(d.transaction('kv', mode).objectStore('kv'));
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  }));
  return {
    get: k => tx('readonly', s => s.get(k)).catch(() => mem.get(k)),
    set: (k, v) => tx('readwrite', s => s.put(v, k)).catch(() => mem.set(k, v)),
    del: k => tx('readwrite', s => s.delete(k)).catch(() => mem.delete(k)),
  };
})();

const ICON = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  car: '<path d="M3 14l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 9l2 5v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3z"/>',
  trips: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  star: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>',
  seat: '<path d="M7 18v3M17 18v3M5 14h14v4H5zM7 14V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  cube: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  crown: '<path d="m2 18 2-11 5 5 3-7 3 7 5-5 2 11z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
  star2: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
};
const icon = (n, extra = '') => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${ICON[n]}</svg>`;

const LOCALES = { en: 'en-US', th: 'th-TH', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR', ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ar: 'ar-AE', hi: 'hi-IN', vi: 'vi-VN', id: 'id-ID' };
// Approximate display rates from USD; prices are stored in USD.
const RATES = { USD: 1, EUR: 0.92, GBP: 0.78, THB: 33.5, JPY: 150, KRW: 1380, CNY: 7.15, INR: 84, BRL: 5.5, RUB: 90, AED: 3.67, VND: 25500, IDR: 16200, AUD: 1.52, SGD: 1.33 };
const CUR_BY_LANG = { en: 'USD', th: 'THB', es: 'EUR', fr: 'EUR', de: 'EUR', it: 'EUR', pt: 'BRL', ru: 'RUB', ja: 'JPY', ko: 'KRW', zh: 'CNY', ar: 'AED', hi: 'INR', vi: 'VND', id: 'IDR' };
const BODY_TYPES = ['sedan', 'suv', 'sports', 'hatch', 'pickup', 'van'];
const FUELS = ['gas', 'diesel', 'hybrid', 'ev'];
const INSURANCE_PER_DAY = 19;
const APR = 0.059;
const DAY = 86400000;

const S = {
  lang: 'en', cur: 'USD', theme: 'dark',
  published: null, cat: { cars: [], staff: [] }, draft: false, stale: false, synced: false,
  trips: [], user: null, view: 'browse',
  f: { q: '', mode: 'rent', body: 'all', fuel: 'all', sort: 'popular', brand: 'all', saved: false },
  saved: new Set(), from: null, to: null, feat: 0, featCar: null,
  thumbs: new Map(),
};
let stage = null;
const stageReady = import('./viewer.js').then(m => { stage = new m.CarStage(); return stage; }).catch(err => { console.warn('3D unavailable', err); return null; });

function t(k, v) {
  const dict = STR[S.lang] || {};
  const count = v && (v._c ?? (typeof v.n === 'number' ? v.n : null));
  if (count != null) {
    const rule = k + '_' + new Intl.PluralRules(locale()).select(count);
    if (dict[rule] || (!dict[k] && STR.en[rule])) k = rule;
  }
  let s = dict[k] ?? STR.en[k] ?? k;
  if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => (v[n] ?? m));
  return s;
}
const locale = () => LOCALES[S.lang] || 'en-US';
const money = usd => new Intl.NumberFormat(locale(), { style: 'currency', currency: S.cur, maximumFractionDigits: 0 }).format((usd || 0) * RATES[S.cur]);
const num = n => new Intl.NumberFormat(locale()).format(n);
const fmtDate = d => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
const isoDay = d => new Date(d - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const carName = c => `${c.make} ${c.model}`;
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('on'), 2800);
}

/* ---------- Crypto helpers for staff passphrases ---------- */
const b64 = bytes => btoa(String.fromCharCode(...bytes));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function hashPass(pass, saltB64) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, key, 256);
  return { salt: b64(salt), hash: b64(new Uint8Array(bits)) };
}
async function sha1(text) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const utf8b64 = s => { const bytes = new TextEncoder().encode(s); let out = ''; for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(out); };

/* ---------- Data ---------- */
async function loadData() {
  let pub = { version: 1, updatedAt: 0, staff: [], cars: [] };
  try {
    const r = await fetch('catalog.json', { cache: 'no-cache' });
    if (r.ok) pub = await r.json();
  } catch { /* offline: service worker or draft covers it */ }
  pub.staff = pub.staff || [];
  pub.cars = pub.cars || [];
  S.published = pub;
  const d = await db.get('draft');
  if (d && d.data) {
    if (d.synced && (pub.updatedAt || 0) > (d.base || 0)) {
      await db.del('draft');
      S.cat = structuredClone(pub);
    } else {
      S.cat = d.data;
      S.draft = !d.synced;
      S.synced = !!d.synced;
      S.stale = !d.synced && (pub.updatedAt || 0) > (d.base || 0);
    }
  } else {
    S.cat = structuredClone(pub);
  }
  S.trips = (await db.get('trips')) || [];
  const sid = session.get('user');
  S.user = S.cat.staff.find(p => p.id === sid) || null;
}

async function commit(msg) {
  S.cat.updatedAt = Date.now();
  S.draft = true;
  S.synced = false;
  await db.set('draft', { base: S.published.updatedAt || 0, data: S.cat });
  if (msg) toast(msg);
  renderAll();
}

async function discardDraft() {
  await db.del('draft');
  S.cat = structuredClone(S.published);
  S.draft = S.stale = S.synced = false;
  if (S.user && !S.cat.staff.some(p => p.id === S.user.id)) logout();
  else S.user = S.cat.staff.find(p => p.id === S.user?.id) || null;
  S.thumbs.clear();
  renderAll();
}

/* ---------- Settings: language and currency ---------- */
function initPrefs() {
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  S.lang = local.get('lang', STR[nav] ? nav : 'en');
  S.cur = local.get('cur', CUR_BY_LANG[S.lang] || 'USD');
  S.saved = new Set(local.get('saved', []));
  S.from = isoDay(Date.now() + DAY);
  S.to = isoDay(Date.now() + 4 * DAY);
  $('#sel-lang').innerHTML = LANGS.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('');
  $('#sel-cur').innerHTML = Object.keys(RATES).map(c => `<option value="${c}">${c}</option>`).join('');
  $('#sel-lang').onchange = e => {
    S.lang = e.target.value;
    local.set('lang', S.lang);
    if (!local.get('curPicked', false)) S.cur = CUR_BY_LANG[S.lang] || S.cur;
    renderAll();
  };
  $('#sel-cur').onchange = e => { S.cur = e.target.value; local.set('cur', S.cur); local.set('curPicked', true); renderAll(); };
}

function applyI18n() {
  const html = document.documentElement;
  html.lang = S.lang;
  html.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', el.title); });
  $('#sel-lang').value = S.lang;
  $('#sel-cur').value = S.cur;
  $('#hero-title').innerHTML = esc(t('heroTitle')).replace(/\*(.+?)\*/, '<em>$1</em>');
  document.title = `MasterDrive – ${t('tagline')}`;
}

// Brand logo (Simple Icons) or a lettered badge for brands without one.
function brandMark(make) {
  const path = BRAND_PATHS[brandKey(make)];
  if (path) return `<svg class="logo-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  const letters = String(make || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 3).toUpperCase();
  return `<span class="monogram" aria-hidden="true"><span>${esc(letters)}</span></span>`;
}

/* ---------- Navigation ---------- */
function renderNav() {
  const active = S.trips.filter(x => x.status !== 'cancelled').length;
  const items = [['browse', 'car', t('navBrowse')], ['trips', 'trips', t('navTrips')], ['admin', S.user ? 'shield' : 'lock', S.user ? t('navAdmin') : t('navOwner')]];
  const html = items.map(([v, ic, label]) =>
    `<a href="#/${v}" class="${S.view === v ? 'on' : ''}" aria-label="${esc(label)}">${icon(ic)}<span>${esc(label)}</span>${v === 'trips' && active ? `<span class="count">${active}</span>` : ''}</a>`).join('');
  $('#nav').innerHTML = html;
  $('#tabbar').innerHTML = html;
}

function route() {
  const [v, id] = location.hash.replace(/^#\/?/, '').split('/');
  if (v === 'car' && id) {
    if (!$('#view-' + S.view)?.classList.contains('on')) setView('browse');
    openCar(decodeURIComponent(id));
    return;
  }
  if ($('#dlg-car').open) closeCarDialog(true);
  setView(['browse', 'trips', 'admin'].includes(v) ? v : 'browse');
}
function setView(v) {
  S.view = v;
  $$('.view').forEach(el => el.classList.toggle('on', el.id === 'view-' + v));
  renderNav();
  if (v === 'trips') renderTrips();
  if (v === 'admin') renderAdmin();
  mountHero();
  window.scrollTo({ top: 0 });
}

/* ---------- Browse ---------- */
const modelKind = c => (c.body === 'sports' ? 'sports' : 'sedan');
const thumbKey = c => `${modelKind(c)}|${(c.colors || [])[0]}`;
const priceHtml = c => (S.f.mode === 'buy'
  ? money(c.price)
  : `${money(c.rentPerDay)}<span>${esc(t('perDay'))}</span>`);

function renderFilters() {
  $('#seg-mode').innerHTML = [['rent', 'trips', t('modeRent')], ['buy', 'check', t('modeBuy')]]
    .map(([k, ic, l]) => `<button type="button" data-mode="${k}" class="${S.f.mode === k ? 'on' : ''}">${icon(ic)} ${esc(l)}</button>`).join('');
  $$('[data-rent-only]').forEach(el => { el.hidden = S.f.mode !== 'rent'; });
  const today = isoDay(Date.now());
  Object.assign($('#f-from'), { min: today, value: S.from });
  Object.assign($('#f-to'), { min: S.from, value: S.to });
  const counts = {};
  S.cat.cars.forEach(c => { counts[c.make] = (counts[c.make] || 0) + 1; });
  const makes = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  $('#brands').innerHTML = [`<button class="brand-chip ${S.f.brand === 'all' ? 'on' : ''}" data-brand="all">${icon('car')} ${esc(t('allBrands'))}</button>`,
    ...makes.map(m => `<button class="brand-chip ${S.f.brand === m ? 'on' : ''}" data-brand="${esc(m)}">${brandMark(m)} ${esc(m)}</button>`)].join('');
  $('#chips-body').innerHTML = ['all', ...BODY_TYPES]
    .map(k => `<button class="chip ${S.f.body === k ? 'on' : ''}" data-body="${k}">${esc(t(k === 'all' ? 'bodyAll' : 'body_' + k))}</button>`).join('')
    + `<button class="chip fav ${S.f.saved ? 'on' : ''}" data-saved>${icon('heart')} ${esc(t('savedOnly'))}</button>`;
  $('#sel-fuel').innerHTML = ['all', ...FUELS].map(k => `<option value="${k}">${esc(t(k === 'all' ? 'fuelAll' : 'fuel_' + k))}</option>`).join('');
  $('#sel-fuel').value = S.f.fuel;
  $('#sel-sort').innerHTML = ['popular', 'priceLow', 'priceHigh', 'newest'].map(k => `<option value="${k}">${esc(t('sort_' + k))}</option>`).join('');
  $('#sel-sort').value = S.f.sort;
}

function filteredCars() {
  const { q, mode, body, fuel, sort, brand, saved } = S.f;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = S.cat.cars.filter(c =>
    (mode === 'rent' ? c.forRent : c.forSale) &&
    (brand === 'all' || c.make === brand) &&
    (body === 'all' || c.body === body) &&
    (fuel === 'all' || c.fuel === fuel) &&
    (!saved || S.saved.has(c.id)) &&
    words.every(w => `${c.make} ${c.model} ${c.year} ${t('body_' + c.body)} ${t('fuel_' + c.fuel)}`.toLowerCase().includes(w)));
  const price = c => (mode === 'buy' ? c.price : c.rentPerDay);
  const by = {
    popular: (a, b) => (b.available - a.available) || (b.trips || 0) - (a.trips || 0),
    priceLow: (a, b) => price(a) - price(b),
    priceHigh: (a, b) => price(b) - price(a),
    newest: (a, b) => b.year - a.year || (b.trips || 0) - (a.trips || 0),
  }[sort];
  return list.sort(by);
}

function cardImage(c) {
  if (c.photos && c.photos.length) return `<img class="photo" src="${esc(c.photos[0])}" alt="${esc(carName(c))}" loading="lazy">`;
  const key = thumbKey(c);
  if (S.thumbs.get(key)) return `<img class="render" src="${S.thumbs.get(key)}" alt="${esc(carName(c))}">`;
  return `<img class="render" data-thumb="${esc(c.id)}" alt="${esc(carName(c))}" hidden><div class="shimmer"></div>`;
}

function renderGrid() {
  const cars = filteredCars();
  $('#count').textContent = t('results', { n: num(cars.length), _c: cars.length });
  if (!cars.length) {
    $('#grid').innerHTML = `<div class="empty">${icon('search')}<p>${esc(t('noResults'))}</p></div>`;
    renderShowcase();
    return;
  }
  $('#grid').innerHTML = cars.map(c => {
    const badges = [
      c.fuel === 'ev' && `<span class="badge ev">${icon('bolt')} ${esc(t('fuel_ev'))}</span>`,
      c.photos?.length && `<span class="badge">${icon('camera')} ${esc(t('realPhotos'))} · ${num(c.photos.length)}</span>`,
      !c.available && `<span class="badge off">${esc(t('unavailable'))}</span>`,
    ].filter(Boolean).join('');
    return `
    <article class="card" data-id="${esc(c.id)}" tabindex="0" role="button" aria-label="${esc(carName(c))}">
      <div class="card-top"><span class="brand-line">${brandMark(c.make)}${esc(c.make)} · ${esc(c.year)}</span>
        <span class="rating">${icon('star')}${(c.rating || 5).toFixed(1)}</span></div>
      <h3>${esc(c.model)}</h3>
      <div class="meta">
        <span>${icon('seat')}${esc(t('seatsN', { n: c.seats }))}</span>
        <span>${icon('gear')}${esc(t('trans_' + c.transmission))}</span>
        <span>${icon(c.fuel === 'ev' ? 'bolt' : 'fuel')}${esc(t('fuel_' + c.fuel))}</span>
      </div>
      ${badges ? `<div class="badges">${badges}</div>` : ''}
      <div class="card-media">${cardImage(c)}</div>
      <div class="card-foot">
        <div><small>${esc(t(S.f.mode === 'buy' ? 'buyFor' : 'rentFrom'))}</small><b>${priceHtml(c)}</b></div>
        <div class="card-acts">
          <button class="icon-btn heart ${S.saved.has(c.id) ? 'on' : ''}" data-save="${esc(c.id)}" aria-pressed="${S.saved.has(c.id)}" aria-label="${esc(t('saveCar'))}">${icon('heart')}</button>
          <span class="go" aria-hidden="true">${icon('arrow')}</span>
        </div>
      </div>
    </article>`;
  }).join('');
  renderShowcase();
  queueThumbs();
}

let thumbBusy = false;
async function queueThumbs() {
  if (thumbBusy) return;
  thumbBusy = true;
  const st = await stageReady;
  try {
    let el;
    while ((el = $('img[data-thumb]'))) {
      const car = S.cat.cars.find(c => c.id === el.dataset.thumb);
      el.removeAttribute('data-thumb');
      if (!car || !st) { el.nextElementSibling?.classList.contains('shimmer') && el.nextElementSibling.remove(); continue; }
      const key = thumbKey(car);
      if (!S.thumbs.has(key)) {
        S.thumbs.set(key, await st.snapshot(car, car.colors?.[0]).catch(() => ''));
      }
      $$(`[data-id="${CSS.escape(car.id)}"] img.render`).forEach(img => {
        if (S.thumbs.get(key)) { img.src = S.thumbs.get(key); img.hidden = false; }
        img.removeAttribute('data-thumb');
        img.nextElementSibling?.classList.contains('shimmer') && img.nextElementSibling.remove();
      });
    }
  } finally { thumbBusy = false; }
}

/* Hero showcase: a live 3D car on the lime card, cycling through the current results. */
function showcaseCars() {
  const list = filteredCars().filter(c => c.available);
  return list.length ? list : S.cat.cars.filter(c => c.available);
}
function renderShowcase() {
  const list = showcaseCars();
  if (!list.length) return;
  S.feat = ((S.feat || 0) % list.length + list.length) % list.length;
  const c = list[S.feat];
  S.featCar = c;
  $('#show-ghost').textContent = c.model.split(/\s+/)[0];
  $('#show-name').innerHTML = `<small>${brandMark(c.make)}${esc(c.make)}</small><b>${esc(c.model)}</b>`;
  $('#show-price').innerHTML = `<small>${esc(t(S.f.mode === 'buy' ? 'buyFor' : 'rentFrom'))}</small>${priceHtml(c)}`;
  $('#show-open').href = '#/car/' + encodeURIComponent(c.id);
  mountHero();
}
async function mountHero() {
  const host = $('#hero-host');
  const st = await stageReady;
  if (!st || !S.featCar || S.view !== 'browse' || $('#dlg-car').open) return;
  const car = S.featCar;
  await st.show(car, car.colors?.[0]).catch(() => null);
  if (S.featCar !== car || $('#dlg-car').open || S.view !== 'browse') return;
  st.setMode('ext');
  st.autoRotate = true;
  st.setTouch('pan-y');
  st.setFraming(1.15);
  if (st.host !== host) { st.unmount(); st.mount(host); }
}

function bindBrowse() {
  $('#q').addEventListener('input', e => { S.f.q = e.target.value; renderGrid(); });
  $('#seg-mode').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) { S.f.mode = b.dataset.mode; renderFilters(); renderGrid(); } });
  $('#brands').addEventListener('click', e => { const b = e.target.closest('[data-brand]'); if (b) { S.f.brand = b.dataset.brand; S.feat = 0; renderFilters(); renderGrid(); } });
  $('#chips-body').addEventListener('click', e => {
    const b = e.target.closest('[data-body]');
    if (b) S.f.body = b.dataset.body;
    else if (e.target.closest('[data-saved]')) S.f.saved = !S.f.saved;
    else return;
    S.feat = 0;
    renderFilters();
    renderGrid();
  });
  $('#sel-fuel').onchange = e => { S.f.fuel = e.target.value; renderGrid(); };
  $('#sel-sort').onchange = e => { S.f.sort = e.target.value; renderGrid(); };
  $('#f-from').onchange = e => {
    S.from = e.target.value || S.from;
    if (S.to <= S.from) S.to = isoDay(new Date(S.from).getTime() + 3 * DAY);
    renderFilters();
  };
  $('#f-to').onchange = e => { if (e.target.value > S.from) S.to = e.target.value; renderFilters(); };
  $('#finder').onsubmit = e => { e.preventDefault(); $('#brands').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  $('#show-prev').onclick = () => { S.feat--; renderShowcase(); };
  $('#show-next').onclick = () => { S.feat++; renderShowcase(); };
  $('#show-open').onclick = e => { e.preventDefault(); if (S.featCar) { S.pushedCar = true; location.hash = '#/car/' + encodeURIComponent(S.featCar.id); } };
  const open = e => {
    const save = e.target.closest('[data-save]');
    if (save) {
      e.stopPropagation();
      const id = save.dataset.save;
      S.saved.has(id) ? S.saved.delete(id) : S.saved.add(id);
      local.set('saved', [...S.saved]);
      save.classList.toggle('on', S.saved.has(id));
      save.setAttribute('aria-pressed', S.saved.has(id));
      if (S.f.saved) renderGrid();
      return;
    }
    const card = e.target.closest('.card');
    if (!card || (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    S.pushedCar = true;
    location.hash = '#/car/' + encodeURIComponent(card.dataset.id);
  };
  $('#grid').addEventListener('click', open);
  $('#grid').addEventListener('keydown', open);
}

/* ---------- Car detail ---------- */
const C = { car: null, color: null, tab: '3d', mode: 'ext', photo: 0, deal: 'rent', from: null, to: null, ins: true, down: 20, term: 60, payFull: false, spin: true };

function openCar(id) {
  const car = S.cat.cars.find(c => c.id === id);
  if (!car) { location.replace('#/browse'); return; }
  // Open on the deal the shopper picked in the finder (Rent or Buy) when the car offers it.
  const deal = (S.f.mode === 'buy' ? car.forSale : car.forRent) ? S.f.mode : (car.forRent ? 'rent' : 'buy');
  Object.assign(C, {
    car, color: car.colors?.[0] || '#c8ccd2', tab: car.photos?.length ? 'photos' : '3d', mode: 'ext', photo: 0,
    deal, from: S.from, to: S.to, ins: true, down: 20, term: 60, payFull: false, spin: true,
  });
  renderCar();
  const dlg = $('#dlg-car');
  if (!dlg.open) dlg.showModal();
  syncStage();
}

function renderCar() {
  const c = C.car;
  const photos = c.photos || [];
  const is3d = C.tab === '3d';
  $('#car-sheet').innerHTML = `
    <div class="stage ${is3d ? (C.mode === 'int' ? 'inside' : '') : 'photos'}" id="car-stage">
      <div class="ghost">${esc(c.model.split(/\s+/)[0])}</div>
      <div class="stage-top">
        <div class="seg">
          <button data-tab="3d" class="${is3d ? 'on' : ''}">${icon('cube')} ${esc(t('tab3d'))}</button>
          <button data-tab="photos" class="${is3d ? '' : 'on'}">${icon('camera')} ${esc(t('tabPhotos'))} (${num(photos.length)})</button>
        </div>
        ${is3d ? `<div class="seg">
          <button data-vmode="ext" class="${C.mode === 'ext' ? 'on' : ''}">${esc(t('exterior'))}</button>
          <button data-vmode="int" class="${C.mode === 'int' ? 'on' : ''}">${esc(t('interior'))}</button>
        </div>` : ''}
      </div>
      <div class="stage-host" id="stage-host"></div>
      <div class="gallery ${is3d ? '' : 'on'}" id="gallery"></div>
      ${is3d ? `<div class="stage-note">${esc(t('model3dNote'))}</div>
      <div class="stage-bottom">
        <div class="swatches" role="radiogroup" aria-label="${esc(t('color'))}">${(c.colors || []).map(col =>
          `<button class="sw ${col === C.color ? 'on' : ''}" style="background:${esc(col)}" data-color="${esc(col)}" role="radio" aria-checked="${col === C.color}" aria-label="${esc(col)}"></button>`).join('')}</div>
        <div class="round-acts">
          ${C.mode === 'ext' ? `<button class="icon-btn ${C.spin ? 'on' : ''}" data-spin aria-pressed="${C.spin}" title="${esc(t('spin360'))}" aria-label="${esc(t('spin360'))}">${icon('rotate')}</button>` : ''}
          <button class="icon-btn ${S.saved.has(c.id) ? 'on' : ''}" data-save-car aria-pressed="${S.saved.has(c.id)}" title="${esc(t('saveCar'))}" aria-label="${esc(t('saveCar'))}">${icon('heart')}</button>
        </div>
      </div>` : ''}
    </div>
    <div class="panel" id="car-panel"></div>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  renderGallery();
  renderCarPanel();
  const sheet = $('#car-sheet');
  sheet.onclick = e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { C.tab = tab.dataset.tab; renderCar(); syncStage(); return; }
    const vm = e.target.closest('[data-vmode]');
    if (vm) { C.mode = vm.dataset.vmode; renderCar(); syncStage(); return; }
    const sw = e.target.closest('[data-color]');
    if (sw) {
      C.color = sw.dataset.color;
      stage?.setColor(C.color);
      $$('.sw', sheet).forEach(b => { b.classList.toggle('on', b === sw); b.setAttribute('aria-checked', b === sw); });
      return;
    }
    if (e.target.closest('[data-spin]')) { C.spin = !C.spin; if (stage) stage.autoRotate = C.spin; renderCar(); syncStage(); return; }
    if (e.target.closest('[data-save-car]')) {
      S.saved.has(c.id) ? S.saved.delete(c.id) : S.saved.add(c.id);
      local.set('saved', [...S.saved]);
      renderCar(); syncStage(); renderGrid();
      return;
    }
    if (e.target.closest('[data-close]')) closeCarDialog();
  };
}

async function syncStage() {
  const host = $('#stage-host');
  const st = await stageReady;
  if (!$('#dlg-car').open) return;
  if (C.tab !== '3d' || !host) { if (st?.host && !st.host.isConnected || st?.host?.closest('#dlg-car')) st.unmount(); return; }
  if (!st) { host.innerHTML = `<div class="empty" style="margin:80px 20px;color:inherit">${esc(t('no3d'))}</div>`; return; }
  const car = C.car;
  await st.show(car, C.color).catch(() => null);
  if (!$('#dlg-car').open || C.car !== car || C.tab !== '3d' || !host.isConnected) return;
  st.setMode(C.mode);
  st.autoRotate = C.spin;
  st.setTouch('none');
  st.setFraming(0.55);
  if (st.host !== host) { st.unmount(); st.mount(host); }
}

function renderGallery() {
  const photos = C.car.photos || [];
  const g = $('#gallery');
  if (!photos.length) {
    g.innerHTML = `<div class="empty" style="margin:auto">${icon('camera')}<p>${esc(t('noPhotos'))}</p></div>`;
    return;
  }
  C.photo = Math.min(C.photo, photos.length - 1);
  g.innerHTML = `<div class="main"><img src="${esc(photos[C.photo])}" alt="${esc(carName(C.car))}" data-zoom></div>
    <div class="thumbs">${photos.map((p, i) => `<button class="${i === C.photo ? 'on' : ''}" data-ph="${i}"><img src="${esc(p)}" alt="" loading="lazy"></button>`).join('')}</div>`;
  g.onclick = e => {
    const b = e.target.closest('[data-ph]');
    if (b) { C.photo = +b.dataset.ph; renderGallery(); }
    if (e.target.closest('[data-zoom]')) openLightbox(photos, C.photo);
  };
}

function rentDays() { return Math.max(1, Math.round((new Date(C.to) - new Date(C.from)) / DAY)); }
function quote() {
  const c = C.car;
  if (C.deal === 'rent') {
    const days = rentDays();
    const base = c.rentPerDay * days;
    const ins = C.ins ? INSURANCE_PER_DAY * days : 0;
    return { days, base, ins, total: base + ins, due: base + ins };
  }
  const down = C.payFull ? c.price : Math.round(c.price * C.down / 100);
  const P = c.price - down, r = APR / 12, n = C.term;
  const monthly = P > 0 ? P * r / (1 - Math.pow(1 + r, -n)) : 0;
  return { total: c.price, down, monthly, due: down };
}

function renderCarPanel() {
  const c = C.car;
  const q = quote();
  const today = isoDay(Date.now());
  const specs = [
    ['gauge', num(c.hp), t('hp')],
    ['seat', num(c.seats), t('seats')],
    c.fuel === 'ev' ? ['bolt', `${num(c.rangeKm)} km`, t('range')] : ['fuel', t('fuel_' + c.fuel), t('fuel')],
    ['gear', t('trans_' + c.transmission), t('transmission')],
  ];
  const dealTabs = [c.forRent && ['rent', t('rent')], c.forSale && ['buy', t('buy')]].filter(Boolean);
  let deal = '';
  if (!c.available) deal = `<div class="notice">${esc(t('unavailableLong'))}</div>`;
  else if (C.deal === 'rent') {
    deal = `
      <div><small class="faint">${esc(t('price'))}</small><div class="big-price">${money(c.rentPerDay)}<span> ${esc(t('perDay'))}</span></div></div>
      <div class="row">
        <label class="field"><span>${esc(t('pickUp'))}</span><input type="date" id="d-from" min="${today}" value="${C.from}"></label>
        <label class="field"><span>${esc(t('return'))}</span><input type="date" id="d-to" min="${C.from}" value="${C.to}"></label>
      </div>
      <label class="check"><input type="checkbox" id="d-ins" ${C.ins ? 'checked' : ''}><span>${icon('shield')} <b>${esc(t('insurance'))}</b><small>${esc(t('insuranceDesc', { p: money(INSURANCE_PER_DAY) }))}</small></span></label>
      <div class="lines">
        <div><span>${money(c.rentPerDay)} × ${esc(t('daysN', { n: q.days }))}</span><span>${money(q.base)}</span></div>
        ${C.ins ? `<div><span>${esc(t('insurance'))}</span><span>${money(q.ins)}</span></div>` : ''}
        <div class="total"><span>${esc(t('total'))}</span><span>${money(q.total)}</span></div>
      </div>
      <button class="btn primary block" data-checkout>${icon('trips')} ${esc(t('rentNow'))}</button>`;
  } else {
    deal = `
      <div><small class="faint">${esc(t('price'))}</small><div class="big-price">${money(c.price)}</div></div>
      <div class="seg" style="width:100%">
        <button data-full="0" class="${C.payFull ? '' : 'on'}" style="flex:1">${esc(t('finance'))}</button>
        <button data-full="1" class="${C.payFull ? 'on' : ''}" style="flex:1">${esc(t('payFull'))}</button>
      </div>
      ${C.payFull ? '' : `
      <label class="field"><span id="down-label">${esc(t('downPayment'))}: ${C.down}% · ${money(q.down)}</span><input type="range" id="d-down" min="10" max="60" step="5" value="${C.down}"></label>
      <label class="field"><span>${esc(t('term'))}</span><select id="d-term">${[24, 36, 48, 60, 72].map(n => `<option value="${n}" ${n === C.term ? 'selected' : ''}>${esc(t('monthsN', { n }))}</option>`).join('')}</select></label>`}
      <div class="lines" id="buy-lines">
        ${C.payFull ? '' : `<div><span>${esc(t('estMonthly'))} (${(APR * 100).toFixed(1)}% APR)</span><b>${money(q.monthly)}</b></div>`}
        <div class="total"><span>${esc(t('dueToday'))}</span><span>${money(q.due)}</span></div>
      </div>
      <button class="btn primary block" data-checkout>${icon('check')} ${esc(t('buyNow'))}</button>`;
  }
  $('#car-panel').innerHTML = `
    <span class="brand-line">${brandMark(c.make)}${esc(c.make)} · ${esc(c.year)} · ${esc(t('body_' + c.body))}</span>
    <h2>${esc(c.model)}</h2>
    <div class="tags"><span class="rating">${icon('star')} ${(c.rating || 5).toFixed(1)}</span><span class="tag">${esc(t('tripsN', { n: num(c.trips || 0) }))}</span>${c.photos?.length ? `<span class="tag">${icon('camera')} ${esc(t('realPhotos'))}</span>` : ''}</div>
    <div class="specs">${specs.map(([i, v, l]) => `<div class="spec">${icon(i)}<b>${esc(v)}</b><small>${esc(l)}</small></div>`).join('')}</div>
    ${c.description ? `<p class="muted" style="margin:0;white-space:pre-line">${esc(c.description)}</p>` : ''}
    <div class="book">
      ${dealTabs.length > 1 ? `<div class="seg" style="width:100%">${dealTabs.map(([k, l]) => `<button style="flex:1" data-deal="${k}" class="${C.deal === k ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>` : ''}
      ${deal}
    </div>
    <p class="faint" style="margin:0">${esc(t('priceNote'))}</p>`;
  const p = $('#car-panel');
  p.onclick = e => {
    const d = e.target.closest('[data-deal]');
    if (d) { C.deal = d.dataset.deal; renderCarPanel(); }
    const f = e.target.closest('[data-full]');
    if (f) { C.payFull = f.dataset.full === '1'; renderCarPanel(); }
    if (e.target.closest('[data-checkout]')) openCheckout();
  };
  p.onchange = e => {
    if (e.target.id === 'd-from') { C.from = e.target.value; if (C.to <= C.from) C.to = isoDay(new Date(C.from).getTime() + DAY); }
    if (e.target.id === 'd-to') C.to = e.target.value;
    if (e.target.id === 'd-ins') C.ins = e.target.checked;
    if (e.target.id === 'd-term') C.term = +e.target.value;
    renderCarPanel();
  };
  // Update the finance numbers live without rebuilding the slider being dragged.
  p.oninput = e => {
    if (e.target.id !== 'd-down') return;
    C.down = +e.target.value;
    const nq = quote();
    $('#down-label').textContent = `${t('downPayment')}: ${C.down}% · ${money(nq.down)}`;
    const vals = $$('#buy-lines b, #buy-lines .total span:last-child');
    vals[0].textContent = money(nq.monthly);
    vals[1].textContent = money(nq.due);
  };
}

function closeCarDialog(fromRoute) {
  stage?.unmount();
  const dlg = $('#dlg-car');
  if (dlg.open) { S.closing = true; dlg.close(); }
  if (!fromRoute && location.hash.startsWith('#/car/')) {
    if (S.pushedCar) history.back(); else location.replace('#/browse');
  }
  S.pushedCar = false;
  setTimeout(mountHero, 0);
}

/* ---------- Lightbox ---------- */
function openLightbox(list, i) {
  const lb = $('#lightbox');
  const draw = () => {
    lb.innerHTML = `<img src="${esc(list[i])}" alt="">
      <button class="icon-btn sheet-close glass" data-x aria-label="${esc(t('close'))}">${icon('x')}</button>
      ${list.length > 1 ? `<button class="icon-btn glass lb-nav prev" data-p aria-label="‹">${icon('chevL')}</button><button class="icon-btn glass lb-nav next" data-n aria-label="›">${icon('chevR')}</button>` : ''}`;
  };
  const step = d => { i = (i + d + list.length) % list.length; draw(); };
  lb.onclick = e => {
    if (e.target.closest('[data-x]') || e.target === lb.querySelector('img') && list.length < 2) lb.close();
    else if (e.target.closest('[data-p]')) step(-1);
    else if (e.target.closest('[data-n]')) step(1);
  };
  lb.onkeydown = e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); };
  let sx = 0;
  lb.ontouchstart = e => { sx = e.touches[0].clientX; };
  lb.ontouchend = e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); };
  draw();
  lb.showModal();
}

/* ---------- Checkout ---------- */
function openCheckout() {
  const c = C.car, q = quote();
  const kind = C.deal;
  const summary = kind === 'rent'
    ? `${fmtDate(C.from)} → ${fmtDate(C.to)} · ${t('daysN', { n: q.days })}${C.ins ? ' · ' + t('insurance') : ''}`
    : (C.payFull ? t('payFull') : `${t('finance')} · ${C.down}% · ${t('monthsN', { n: C.term })} · ${money(q.monthly)}/${t('mo')}`);
  const saved = local.get('contact', {});
  const sheet = $('#checkout-sheet');
  sheet.innerHTML = `
    <form class="sheet-pad" id="co-form" novalidate>
      <h3>${esc(t('checkout'))}</h3>
      <div class="admin-car" style="grid-template-columns:72px 1fr"><img src="${esc(c.photos?.[0] || S.thumbs.get(thumbKey(c)) || '')}" alt=""><div><b>${esc(carName(c))}</b><div class="faint">${esc(t(kind === 'rent' ? 'rent' : 'buy'))} · ${esc(summary)}</div></div></div>
      <div class="row">
        <label class="field"><span>${esc(t('fullName'))}</span><input name="name" required autocomplete="name" value="${esc(saved.name || '')}"></label>
        <label class="field"><span>${esc(t('phone'))}</span><input name="phone" type="tel" required autocomplete="tel" value="${esc(saved.phone || '')}"></label>
      </div>
      <label class="field"><span>${esc(t('email'))}</span><input name="email" type="email" required autocomplete="email" value="${esc(saved.email || '')}"></label>
      <div class="field"><span>${esc(t('payMethod'))}</span>
        <div class="pay-opts">
          ${[['card', 'card', t('payCard')], ['wallet', 'bolt', t('payWallet')], ['cash', 'trips', t(kind === 'rent' ? 'payAtPickup' : 'payAtDealer')]].map(([v, ic, l], i) =>
            `<label class="pay-opt"><input type="radio" name="method" value="${v}" ${i === 0 ? 'checked' : ''}>${icon(ic)}<span>${esc(l)}</span></label>`).join('')}
        </div>
      </div>
      <div class="notice">${icon('shield')}<span>${esc(t('demoNotice'))}</span></div>
      <div class="lines"><div class="total"><span>${esc(t('dueToday'))}</span><span>${money(q.due)}</span></div></div>
      <button class="btn primary block" type="submit">${icon('lock')} ${esc(t('confirmPay', { amount: money(q.due) }))}</button>
    </form>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  sheet.querySelector('[data-close]').onclick = () => $('#dlg-checkout').close();
  $('#co-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    if (!f.reportValidity()) return;
    const data = Object.fromEntries(new FormData(f));
    local.set('contact', { name: data.name, phone: data.phone, email: data.email });
    const trip = {
      id: uid(), code: 'MD-' + Math.random().toString(36).slice(2, 8).toUpperCase(), carId: c.id, car: carName(c), body: c.body, fuel: c.fuel,
      photo: c.photos?.[0] || null, color: C.color, kind, from: kind === 'rent' ? C.from : null, to: kind === 'rent' ? C.to : null,
      summary, totalUsd: q.total, dueUsd: q.due, method: data.method, name: data.name, email: data.email, phone: data.phone,
      createdAt: Date.now(), status: 'confirmed',
    };
    S.trips.unshift(trip);
    await db.set('trips', S.trips);
    renderNav();
    sheet.innerHTML = `<div class="sheet-pad"><div class="success">
        <div class="tick">${icon('check')}</div>
        <h3 style="padding:0">${esc(t('successTitle'))}</h3>
        <p class="muted" style="margin:0">${esc(t(kind === 'rent' ? 'successRent' : 'successBuy', { car: carName(c) }))}</p>
        <div class="code">${esc(trip.code)}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
          <button class="btn dark" data-trips>${icon('trips')} ${esc(t('viewTrips'))}</button>
          <button class="btn" data-close>${esc(t('close'))}</button>
        </div></div></div>`;
    sheet.onclick = ev => {
      if (ev.target.closest('[data-close]')) $('#dlg-checkout').close();
      if (ev.target.closest('[data-trips]')) { $('#dlg-checkout').close(); closeCarDialog(true); location.hash = '#/trips'; }
    };
  };
  sheet.onclick = null;
  $('#dlg-checkout').showModal();
}

/* ---------- Trips ---------- */
function renderTrips() {
  const el = $('#trips');
  if (!S.trips.length) {
    el.innerHTML = `<div class="empty">${icon('trips')}<p>${esc(t('tripsEmpty'))}</p><a class="btn primary" href="#/browse">${esc(t('navBrowse'))}</a></div>`;
    return;
  }
  el.innerHTML = S.trips.map(x => {
    const car = S.cat.cars.find(c => c.id === x.carId);
    const img = x.photo || (car && S.thumbs.get(thumbKey(car))) || '';
    return `<div class="trip">
      <img class="${x.photo ? 'photo' : ''}" src="${esc(img)}" alt="">
      <div><h4>${esc(x.car)} <span class="status ${x.status}">${esc(t('status_' + x.status))}</span></h4>
        <div class="faint">${esc(t(x.kind === 'rent' ? 'rent' : 'buy'))} · ${esc(x.kind === 'rent' ? `${fmtDate(x.from)} → ${fmtDate(x.to)}` : x.summary)}</div>
        <div class="faint">${esc(t('bookingCode'))}: <b>${esc(x.code)}</b> · ${esc(t('paid'))}: ${money(x.dueUsd)}</div></div>
      <div class="acts">${x.status === 'confirmed' ? `<button class="btn sm danger" data-cancel="${esc(x.id)}">${esc(t('cancel'))}</button>` : ''}</div>
    </div>`;
  }).join('');
  el.onclick = async e => {
    const b = e.target.closest('[data-cancel]');
    if (!b || !confirm(t('cancelConfirm'))) return;
    const trip = S.trips.find(x => x.id === b.dataset.cancel);
    trip.status = 'cancelled';
    await db.set('trips', S.trips);
    renderTrips();
    renderNav();
  };
}

/* ---------- Owner / admin ---------- */
const isOwner = () => S.user?.role === 'owner';
const requireStaff = () => { if (!S.user) throw new Error(t('notAllowed')); };

function logout() {
  S.user = null;
  session.del('user');
  renderAll();
}

function renderAdmin() {
  const el = $('#admin');
  if (!S.cat.staff.length) {
    el.innerHTML = `
      <form class="panel-card auth-card" id="claim">
        <h3>${icon('crown')} ${esc(t('claimTitle'))}</h3>
        <p class="muted" style="margin:0">${esc(t('claimDesc'))}</p>
        <label class="field"><span>${esc(t('yourName'))}</span><input name="name" required maxlength="40" autocomplete="username"></label>
        <label class="field"><span>${esc(t('passphrase'))}</span><input name="pass" type="password" required minlength="10" autocomplete="new-password"></label>
        <label class="field"><span>${esc(t('passphraseAgain'))}</span><input name="pass2" type="password" required minlength="10" autocomplete="new-password"></label>
        <p class="faint" style="margin:0">${esc(t('passHint'))}</p>
        <button class="btn primary block">${icon('crown')} ${esc(t('claim'))}</button>
      </form>`;
    $('#claim').onsubmit = async e => {
      e.preventDefault();
      const { name, pass, pass2 } = Object.fromEntries(new FormData(e.target));
      if (pass.length < 10) return toast(t('passShort'));
      if (pass !== pass2) return toast(t('passMismatch'));
      const owner = { id: uid(), name: name.trim(), role: 'owner', ...(await hashPass(pass)), addedAt: Date.now() };
      S.cat.staff = [owner];
      S.user = owner;
      session.set('user', owner.id);
      await commit(t('claimed'));
    };
    return;
  }
  if (!S.user) {
    el.innerHTML = `
      <form class="panel-card auth-card" id="login">
        <h3>${icon('lock')} ${esc(t('staffLogin'))}</h3>
        <p class="muted" style="margin:0">${esc(t('staffLoginDesc'))}</p>
        <label class="field"><span>${esc(t('yourName'))}</span><input name="name" required autocomplete="username"></label>
        <label class="field"><span>${esc(t('passphrase'))}</span><input name="pass" type="password" required autocomplete="current-password"></label>
        <button class="btn primary block">${icon('key')} ${esc(t('login'))}</button>
      </form>`;
    $('#login').onsubmit = async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      const { name, pass } = Object.fromEntries(new FormData(e.target));
      const person = S.cat.staff.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
      const ok = person && (await hashPass(pass, person.salt)).hash === person.hash;
      btn.disabled = false;
      if (!ok) return toast(t('wrongPass'));
      S.user = person;
      session.set('user', person.id);
      toast(t('welcome', { name: person.name }));
      renderAll();
    };
    return;
  }

  const gh = local.get('gh', { repo: 'pnpran10-dot/mastersketch2', branch: 'main', dir: 'cars', token: '' });
  const draftBar = S.draft ? `
    <div class="draft-bar">${icon('cloud')}
      <div class="grow"><b>${esc(t('draftTitle'))}</b><div class="faint">${esc(t(S.stale ? 'draftStale' : 'draftDesc'))}</div></div>
      <button class="btn sm primary" data-act="publish">${icon('upload')} ${esc(t('publish'))}</button>
      <button class="btn sm" data-act="export">${icon('download')} ${esc(t('export'))}</button>
      <button class="btn sm danger" data-act="discard">${esc(t('discard'))}</button>
    </div>` : '';
  el.innerHTML = `
    <div class="page-head">
      <div><h2>${esc(t('dashboard'))}</h2><div class="muted">${esc(t('signedInAs', { name: S.user.name }))} <span class="role ${S.user.role}">${icon(S.user.role === 'owner' ? 'crown' : 'shield')} ${esc(t('role_' + S.user.role))}</span></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn sm" data-act="passwd">${icon('key')} ${esc(t('changePass'))}</button>
        <button class="btn sm" data-act="logout">${icon('logout')} ${esc(t('logout'))}</button>
      </div>
    </div>
    ${draftBar}
    <div class="admin-grid">
      <div class="admin-col">
        <section class="panel-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <h3>${icon('car')} ${esc(t('cars'))} <span class="faint">(${num(S.cat.cars.length)})</span></h3>
            <button class="btn sm primary" data-act="add-car">${icon('plus')} ${esc(t('addCar'))}</button>
          </div>
          <div class="list">${S.cat.cars.map(c => `
            <div class="admin-car" data-id="${esc(c.id)}">
              ${c.photos?.length ? `<img class="photo" src="${esc(c.photos[0])}" alt="">` : `<img class="render" ${S.thumbs.has(thumbKey(c)) ? `src="${S.thumbs.get(thumbKey(c))}"` : `data-thumb="${esc(c.id)}"`} alt="">`}
              <div><b>${esc(carName(c))}</b> <span class="faint">${esc(c.year)}</span>
                <div class="faint">${icon('camera')} ${num(c.photos?.length || 0)} · ${c.forRent ? money(c.rentPerDay) + t('perDay') : '—'} · ${c.forSale ? money(c.price) : '—'}${c.available ? '' : ' · ' + esc(t('unavailable'))}</div></div>
              <div class="acts">
                <button class="icon-btn" data-act="photos" data-id="${esc(c.id)}" title="${esc(t('uploadPhotos'))}" aria-label="${esc(t('uploadPhotos'))}">${icon('camera')}</button>
                <button class="icon-btn" data-act="edit" data-id="${esc(c.id)}" title="${esc(t('edit'))}" aria-label="${esc(t('edit'))}">${icon('edit')}</button>
                <button class="icon-btn" data-act="del" data-id="${esc(c.id)}" title="${esc(t('delete'))}" aria-label="${esc(t('delete'))}">${icon('trash')}</button>
              </div>
            </div>`).join('')}</div>
        </section>
      </div>
      <div class="admin-col">
        <section class="panel-card">
          <h3>${icon('users')} ${esc(t('team'))}</h3>
          <div class="list">${S.cat.staff.map(p => `
            <div class="person"><div><b>${esc(p.name)}</b>${p.id === S.user.id ? ` <span class="faint">(${esc(t('you'))})</span>` : ''}<div><span class="role ${p.role}">${esc(t('role_' + p.role))}</span></div></div>
              ${isOwner() && p.role !== 'owner' ? `<button class="btn sm danger" data-act="remove-admin" data-id="${esc(p.id)}">${esc(t('remove'))}</button>` : ''}
            </div>`).join('')}</div>
          ${isOwner() ? `
          <form class="list" id="add-admin">
            <b>${esc(t('addAdmin'))}</b>
            <p class="faint" style="margin:0">${esc(t('addAdminDesc'))}</p>
            <label class="field"><span>${esc(t('name'))}</span><input name="name" required maxlength="40"></label>
            <label class="field"><span>${esc(t('tempPass'))}</span><input name="pass" type="text" required minlength="10" autocomplete="off"></label>
            <button class="btn sm dark">${icon('shield')} ${esc(t('giveAdmin'))}</button>
          </form>` : `<p class="faint" style="margin:0">${esc(t('onlyOwner'))}</p>`}
        </section>
        <section class="panel-card">
          <h3>${icon('cloud')} ${esc(t('publishing'))}</h3>
          <p class="faint" style="margin:0">${esc(t('publishDesc'))}</p>
          <form class="list" id="gh-form">
            <label class="field"><span>${esc(t('ghRepo'))}</span><input name="repo" value="${esc(gh.repo)}" placeholder="owner/repo" required></label>
            <div class="row">
              <label class="field"><span>${esc(t('ghBranch'))}</span><input name="branch" value="${esc(gh.branch)}" required></label>
              <label class="field"><span>${esc(t('ghFolder'))}</span><input name="dir" value="${esc(gh.dir)}"></label>
            </div>
            <label class="field"><span>${esc(t('ghToken'))}</span><input name="token" type="password" value="${esc(gh.token)}" autocomplete="off" placeholder="github_pat_…"></label>
            <p class="faint" style="margin:0">${esc(t('ghTokenHint'))}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn sm primary" type="submit">${icon('upload')} ${esc(t('publish'))}</button>
              <button class="btn sm" type="button" data-act="export">${icon('download')} ${esc(t('export'))}</button>
              <label class="btn sm">${icon('upload')} ${esc(t('import'))}<input type="file" accept="application/json,.json" id="import-file" hidden></label>
            </div>
            <div class="faint" id="pub-status"></div>
          </form>
        </section>
      </div>
    </div>`;

  el.onclick = async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    switch (b.dataset.act) {
      case 'logout': logout(); break;
      case 'passwd': openPasswd(); break;
      case 'add-car': openEditor(null); break;
      case 'edit': openEditor(id); break;
      case 'photos': openEditor(id, true); break;
      case 'del': {
        const car = S.cat.cars.find(c => c.id === id);
        if (car && confirm(t('deleteConfirm', { car: carName(car) }))) {
          S.cat.cars = S.cat.cars.filter(c => c.id !== id);
          await commit(t('saved'));
        }
        break;
      }
      case 'remove-admin': {
        if (!isOwner()) return toast(t('onlyOwner'));
        const p = S.cat.staff.find(x => x.id === id);
        if (p && p.role !== 'owner' && confirm(t('removeConfirm', { name: p.name }))) {
          S.cat.staff = S.cat.staff.filter(x => x.id !== id);
          await commit(t('saved'));
        }
        break;
      }
      case 'export': exportCatalog(); break;
      case 'publish': publish(); break;
      case 'discard': if (confirm(t('discardConfirm'))) discardDraft(); break;
    }
  };
  $('#add-admin') && ($('#add-admin').onsubmit = async e => {
    e.preventDefault();
    if (!isOwner()) return toast(t('onlyOwner'));
    const { name, pass } = Object.fromEntries(new FormData(e.target));
    if (pass.length < 10) return toast(t('passShort'));
    if (S.cat.staff.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) return toast(t('nameTaken'));
    S.cat.staff.push({ id: uid(), name: name.trim(), role: 'admin', ...(await hashPass(pass)), addedAt: Date.now(), addedBy: S.user.id });
    await commit(t('adminAdded', { name: name.trim() }));
  });
  $('#gh-form').onsubmit = e => {
    e.preventDefault();
    local.set('gh', Object.fromEntries(new FormData(e.target)));
    publish();
  };
  $('#gh-form').onchange = e => { if (e.target.name) local.set('gh', Object.fromEntries(new FormData($('#gh-form')))); };
  $('#import-file').onchange = e => importCatalog(e.target.files[0]);
  queueThumbs();
}

function openPasswd() {
  const sheet = $('#info-sheet');
  sheet.innerHTML = `
    <form class="sheet-pad" id="pw-form">
      <h3>${icon('key')} ${esc(t('changePass'))}</h3>
      <label class="field"><span>${esc(t('currentPass'))}</span><input name="old" type="password" required autocomplete="current-password"></label>
      <label class="field"><span>${esc(t('newPass'))}</span><input name="pass" type="password" required minlength="10" autocomplete="new-password"></label>
      <label class="field"><span>${esc(t('passphraseAgain'))}</span><input name="pass2" type="password" required minlength="10" autocomplete="new-password"></label>
      <button class="btn primary block">${esc(t('save'))}</button>
    </form>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  sheet.querySelector('[data-close]').onclick = () => $('#dlg-info').close();
  $('#pw-form').onsubmit = async e => {
    e.preventDefault();
    const { old, pass, pass2 } = Object.fromEntries(new FormData(e.target));
    const me = S.cat.staff.find(p => p.id === S.user.id);
    if ((await hashPass(old, me.salt)).hash !== me.hash) return toast(t('wrongPass'));
    if (pass.length < 10) return toast(t('passShort'));
    if (pass !== pass2) return toast(t('passMismatch'));
    Object.assign(me, await hashPass(pass));
    S.user = me;
    $('#dlg-info').close();
    await commit(t('saved'));
  };
  $('#dlg-info').showModal();
}

/* Car editor with real-photo upload */
async function compressImage(file) {
  let src = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!src) {
    const url = URL.createObjectURL(file);
    src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  }
  const w = src.width, h = src.height, k = Math.min(1, 1600 / Math.max(w, h));
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * k);
  cv.height = Math.round(h * k);
  cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.82);
}

function openEditor(id, focusPhotos) {
  try { requireStaff(); } catch (err) { return toast(err.message); }
  const orig = id ? S.cat.cars.find(c => c.id === id) : null;
  const car = orig ? structuredClone(orig) : {
    id: '', make: '', model: '', year: new Date().getFullYear(), body: 'sedan', fuel: 'gas', seats: 5, transmission: 'auto', hp: 150, rangeKm: 0,
    rentPerDay: 60, price: 30000, forRent: true, forSale: true, available: true, rating: 5, trips: 0, colors: ['#e8e9ec', '#111318'], description: '', photos: [],
  };
  const sheet = $('#edit-sheet');
  const opt = (list, val, prefix) => list.map(v => `<option value="${v}" ${v === val ? 'selected' : ''}>${esc(t(prefix + v))}</option>`).join('');
  const draw = () => {
    sheet.innerHTML = `
      <form class="sheet-pad" id="edit-form">
        <h3>${icon(orig ? 'edit' : 'plus')} ${esc(orig ? carName(orig) : t('addCar'))}</h3>
        <section class="list" id="photo-section">
          <b>${icon('camera')} ${esc(t('realPhotos'))}</b>
          <label class="drop" id="drop">${icon('upload')}<span>${esc(t('dropPhotos'))}</span><small class="faint">${esc(t('photoHint'))}</small>
            <input type="file" accept="image/*" multiple hidden id="photo-input"></label>
          <div class="photo-grid">${car.photos.map((p, i) => `
            <figure><img src="${esc(p)}" alt="">${i === 0 ? `<span class="badge cover">${esc(t('cover'))}</span>` : ''}
              <div class="p-acts">
                ${i ? `<button type="button" data-cover="${i}" title="${esc(t('makeCover'))}" aria-label="${esc(t('makeCover'))}">${icon('star2')}</button>` : '<span></span>'}
                <button type="button" data-rm="${i}" title="${esc(t('delete'))}" aria-label="${esc(t('delete'))}">${icon('trash')}</button>
              </div></figure>`).join('')}</div>
        </section>
        <div class="row">
          <label class="field"><span>${esc(t('make'))}</span><input name="make" required value="${esc(car.make)}" placeholder="Toyota"></label>
          <label class="field"><span>${esc(t('model'))}</span><input name="model" required value="${esc(car.model)}" placeholder="Corolla Cross"></label>
        </div>
        <div class="row3">
          <label class="field"><span>${esc(t('year'))}</span><input name="year" type="number" min="1950" max="2100" required value="${esc(car.year)}"></label>
          <label class="field"><span>${esc(t('bodyType'))}</span><select name="body">${opt(BODY_TYPES, car.body, 'body_')}</select></label>
          <label class="field"><span>${esc(t('fuel'))}</span><select name="fuel">${opt(FUELS, car.fuel, 'fuel_')}</select></label>
          <label class="field"><span>${esc(t('seats'))}</span><input name="seats" type="number" min="1" max="20" value="${esc(car.seats)}"></label>
          <label class="field"><span>${esc(t('transmission'))}</span><select name="transmission">${opt(['auto', 'manual'], car.transmission, 'trans_')}</select></label>
          <label class="field"><span>${esc(t('hp'))}</span><input name="hp" type="number" min="0" value="${esc(car.hp)}"></label>
        </div>
        <div class="row3">
          <label class="field"><span>${esc(t('rentPrice'))} (USD)</span><input name="rentPerDay" type="number" min="0" step="1" value="${esc(car.rentPerDay)}"></label>
          <label class="field"><span>${esc(t('salePrice'))} (USD)</span><input name="price" type="number" min="0" step="100" value="${esc(car.price)}"></label>
          <label class="field"><span>${esc(t('range'))} (km)</span><input name="rangeKm" type="number" min="0" value="${esc(car.rangeKm)}"></label>
        </div>
        <div class="row3">
          <label class="check"><input type="checkbox" name="forRent" ${car.forRent ? 'checked' : ''}><span>${esc(t('forRent'))}</span></label>
          <label class="check"><input type="checkbox" name="forSale" ${car.forSale ? 'checked' : ''}><span>${esc(t('forSale'))}</span></label>
          <label class="check"><input type="checkbox" name="available" ${car.available ? 'checked' : ''}><span>${esc(t('availableNow'))}</span></label>
        </div>
        <div class="field"><span>${esc(t('colors'))}</span>
          <div class="colors-edit">${car.colors.map((col, i) => `<label><input type="color" value="${esc(col)}" data-col="${i}" aria-label="${esc(t('color'))}">${car.colors.length > 1 ? `<button type="button" class="x" data-rmcol="${i}" aria-label="${esc(t('remove'))}">×</button>` : ''}</label>`).join('')}
            ${car.colors.length < 8 ? `<button type="button" class="icon-btn" data-addcol aria-label="${esc(t('addColor'))}">${icon('plus')}</button>` : ''}</div>
        </div>
        <label class="field"><span>${esc(t('description'))}</span><textarea name="description" maxlength="1200">${esc(car.description)}</textarea></label>
        <button class="btn primary block" type="submit">${icon('check')} ${esc(t('save'))}</button>
      </form>
      <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
    const form = $('#edit-form');
    const readFields = () => {
      const fd = new FormData(form);
      for (const k of ['make', 'model', 'body', 'fuel', 'transmission', 'description']) car[k] = String(fd.get(k) ?? '').trim();
      for (const k of ['year', 'seats', 'hp', 'rentPerDay', 'price', 'rangeKm']) car[k] = Math.max(0, +fd.get(k) || 0);
      for (const k of ['forRent', 'forSale', 'available']) car[k] = fd.get(k) === 'on';
    };
    const addFiles = async files => {
      readFields();
      const list = [...files].filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
      if (!list.length) return;
      toast(t('processing'));
      for (const f of list) {
        try { car.photos.push(await compressImage(f)); } catch { toast(t('badImage', { name: f.name })); }
      }
      draw();
    };
    const drop = $('#drop');
    $('#photo-input').onchange = e => addFiles(e.target.files);
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); };
    form.oninput = e => { if (e.target.dataset.col != null) car.colors[+e.target.dataset.col] = e.target.value; };
    sheet.onclick = e => {
      if (e.target.closest('[data-close]')) return $('#dlg-edit').close();
      const rm = e.target.closest('[data-rm]');
      const cov = e.target.closest('[data-cover]');
      const rmc = e.target.closest('[data-rmcol]');
      if (rm) { readFields(); car.photos.splice(+rm.dataset.rm, 1); draw(); }
      if (cov) { readFields(); const [p] = car.photos.splice(+cov.dataset.cover, 1); car.photos.unshift(p); draw(); }
      if (rmc) { e.preventDefault(); readFields(); car.colors.splice(+rmc.dataset.rmcol, 1); draw(); }
      if (e.target.closest('[data-addcol]')) { readFields(); car.colors.push('#888888'); draw(); }
    };
    form.onsubmit = async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      readFields();
      if (!car.forRent && !car.forSale) return toast(t('needRentOrSale'));
      if (!car.id) {
        const slug = `${car.make}-${car.model}`.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'car';
        car.id = S.cat.cars.some(c => c.id === slug) ? `${slug}-${uid().slice(0, 4)}` : slug;
        S.cat.cars.unshift(car);
      } else {
        S.cat.cars[S.cat.cars.findIndex(c => c.id === car.id)] = car;
      }
      $('#dlg-edit').close();
      await commit(t('saved'));
    };
  };
  draw();
  $('#dlg-edit').showModal();
  if (focusPhotos) $('#photo-section').scrollIntoView();
}

/* Export / import / publish */
function exportCatalog() {
  const blob = new Blob([JSON.stringify({ ...S.cat, updatedAt: Date.now() }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'catalog.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(t('exported'));
}

async function importCatalog(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.cars) || !Array.isArray(data.staff)) throw new Error('shape');
    if (!data.staff.some(p => p.id === S.user.id && p.role === S.user.role)) throw new Error('lockout');
    if (!confirm(t('importConfirm', { n: data.cars.length }))) return;
    S.cat = data;
    S.thumbs.clear();
    await commit(t('imported'));
  } catch (err) {
    toast(err.message === 'lockout' ? t('importLockout') : t('importBad'));
  }
}

async function publish() {
  try { requireStaff(); } catch (err) { return toast(err.message); }
  const gh = local.get('gh', {});
  const status = $('#pub-status');
  const say = m => { if (status) status.textContent = m; };
  if (!gh.repo || !gh.token) { setView('admin'); $('#gh-form [name=token]')?.focus(); return toast(t('ghNeedToken')); }
  const dir = (gh.dir || '').replace(/^\/+|\/+$/g, '');
  const path = p => (dir ? dir + '/' : '') + p;
  const api = (p, opts = {}) => fetch(`https://api.github.com/repos/${gh.repo}/contents/${p.split('/').map(encodeURIComponent).join('/')}${opts.method ? '' : `?ref=${encodeURIComponent(gh.branch)}`}`, {
    ...opts, headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  const put = async (p, content, sha, message) => {
    const r = await api(p, { method: 'PUT', body: JSON.stringify({ message, content, branch: gh.branch, ...(sha ? { sha } : {}) }) });
    if (!r.ok) throw new Error(`${r.status} ${(await r.json().catch(() => ({}))).message || ''}`);
  };
  try {
    say(t('publishing') + '…');
    const out = structuredClone(S.cat);
    const photos = out.cars.flatMap(c => (c.photos || []).map((p, i) => [c, i, p])).filter(([, , p]) => p.startsWith('data:'));
    let n = 0;
    for (const [c, i, p] of photos) {
      say(t('uploadingPhoto', { n: ++n, total: photos.length }));
      const data = p.slice(p.indexOf(',') + 1);
      const name = `photos/${(await sha1(data)).slice(0, 20)}.jpg`;
      const head = await api(path(name));
      if (head.status === 404) await put(path(name), data, null, `Add car photo for ${carName(c)}`);
      else if (!head.ok) throw new Error(`${head.status}`);
      c.photos[i] = name;
    }
    out.updatedAt = Date.now();
    say(t('savingCatalog'));
    const cur = await api(path('catalog.json'));
    if (!cur.ok && cur.status !== 404) throw new Error(`${cur.status}`);
    const sha = cur.ok ? (await cur.json()).sha : null;
    await put(path('catalog.json'), utf8b64(JSON.stringify(out, null, 1)), sha, `Update car catalog (${out.cars.length} cars) by ${S.user.name}`);
    // Keep the device copy with embedded photos until the site redeploys with the uploaded files.
    S.published = out;
    S.draft = S.stale = false;
    S.synced = true;
    await db.set('draft', { base: out.updatedAt, data: S.cat, synced: true });
    say(t('publishedOk'));
    toast(t('publishedOk'));
    renderAll();
  } catch (err) {
    say(t('publishFail', { err: err.message }));
    toast(t('publishFail', { err: err.message }));
  }
}

/* ---------- Boot ---------- */
function renderAll() {
  applyI18n();
  renderNav();
  renderFilters();
  renderGrid();
  if (S.view === 'trips') renderTrips();
  if (S.view === 'admin') renderAdmin();
  if ($('#dlg-car').open && C.car) {
    C.car = S.cat.cars.find(c => c.id === C.car.id) || C.car;
    renderCar();
  }
}

function initInstall() {
  let deferred = null;
  const btn = $('#btn-install');
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.hidden = false; });
  btn.onclick = async e => {
    e.preventDefault();
    if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; btn.hidden = true; }
  };
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

async function boot() {
  $('#year').textContent = new Date().getFullYear();
  initPrefs();
  bindBrowse();
  // A forced close (e.g. a repeated Esc that skips 'cancel') still has to leave the #/car/ route.
  $('#dlg-car').addEventListener('close', () => {
    if (stage?.host?.closest('#dlg-car')) stage.unmount();
    setTimeout(mountHero, 0);
    if (!S.closing && location.hash.startsWith('#/car/')) location.replace('#/browse');
    S.closing = false;
  });
  $('#dlg-car').addEventListener('cancel', e => { e.preventDefault(); closeCarDialog(); });
  await loadData();
  renderAll();
  route();
  window.addEventListener('hashchange', route);
  initInstall();
}
boot();
