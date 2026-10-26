import { STR, LANGS } from './i18n.js';
import { BRAND_PATHS, brandKey } from './brands.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const local = {
  get(k, d) { try { const v = localStorage.getItem('ls_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ls_' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  del(k) { try { localStorage.removeItem('ls_' + k); } catch { /* storage blocked */ } },
};

const ICON = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  car: '<path d="M3 14l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 9l2 5v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3z"/>',
  trips: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  star: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>',
  seat: '<path d="M7 18v3M17 18v3M5 14h14v4H5zM7 14V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  cube: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
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
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.7 0 2-1.3 1.3-2.4-.6-1-.2-2.6 1.4-2.6H17a5 5 0 0 0 5-5c0-5.5-4.5-10-10-10z"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  star2: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>',
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

const LOCALES = { en: 'en-US', th: 'th-TH', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR', ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ar: 'ar-AE', hi: 'hi-IN', vi: 'vi-VN', id: 'id-ID' };
// Approximate display rates from USD; prices are stored in USD.
const RATES = { USD: 1, EUR: 0.92, GBP: 0.78, THB: 33.5, JPY: 150, KRW: 1380, CNY: 7.15, INR: 84, BRL: 5.5, RUB: 90, AED: 3.67, VND: 25500, IDR: 16200, AUD: 1.52, SGD: 1.33 };
const CUR_BY_LANG = { en: 'USD', th: 'THB', es: 'EUR', fr: 'EUR', de: 'EUR', it: 'EUR', pt: 'BRL', ru: 'RUB', ja: 'JPY', ko: 'KRW', zh: 'CNY', ar: 'AED', hi: 'INR', vi: 'VND', id: 'IDR' };
const BODY_TYPES = ['sedan', 'suv', 'sports', 'hatch', 'pickup', 'van'];
const FUELS = ['gas', 'diesel', 'hybrid', 'ev'];
const STATUSES = ['new', 'confirmed', 'completed', 'cancelled'];
const INSURANCE_PER_DAY = 19;
const APR = 0.059;
const DAY = 86400000;
const POLL_MS = 20000;

const ACCENTS = [['lime', '#ddf160'], ['sky', '#5ab8ff'], ['blue', '#4d7cff'], ['violet', '#9b7bff'], ['pink', '#ff6fb5'], ['orange', '#ff9a3d'], ['red', '#ff5a5a'], ['mint', '#4fe3b0'], ['gold', '#f5c84c'], ['white', '#f2f2f2']];
const BACKGROUNDS = [['carbon', '#0c0d0b'], ['midnight', '#0a0f1e'], ['navy', '#0d1733'], ['plum', '#180d22'], ['forest', '#0b1510'], ['graphite', '#1c1d21'], ['sand', '#f1ede4'], ['light', '#f3f5f7']];

const S = {
  lang: 'en', cur: 'USD', theme: null,
  cars: [], orders: [], users: [], user: null, token: null, status: null,
  view: 'browse', adminTab: 'orders', orderFilter: 'new',
  f: { q: '', mode: 'rent', body: 'all', fuel: 'all', sort: 'popular', brand: 'all', saved: false },
  saved: new Set(), from: null, to: null, feat: 0, featCar: null,
  thumbs: new Map(), installPrompt: null,
};
let stage = null;
const stageReady = import('./viewer.js').then(m => { stage = new m.CarStage(); return stage; }).catch(err => { console.warn('3D unavailable', err); return null; });

const locale = () => LOCALES[S.lang] || 'en-US';
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
const money = usd => new Intl.NumberFormat(locale(), { style: 'currency', currency: S.cur, maximumFractionDigits: 0 }).format((usd || 0) * RATES[S.cur]);
const num = n => new Intl.NumberFormat(locale()).format(n);
const fmtDate = d => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
const fmtTime = d => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
const isoDay = d => new Date(d - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const carName = c => `${c.make} ${c.model}`;
const isStaff = () => S.user && (S.user.role === 'admin' || S.user.role === 'owner');
const isOwner = () => S.user?.role === 'owner';

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('on'), 3200);
}

/* ---------- Server ---------- */
class ApiError extends Error {}
async function api(path, { method = 'GET', body, raw } = {}) {
  const headers = {};
  if (S.token) headers.authorization = 'Bearer ' + S.token;
  if (body !== undefined && !raw) headers['content-type'] = 'application/json';
  if (raw) headers['content-type'] = raw;
  let res;
  try {
    res = await fetch('api/' + path, { method, headers, body: raw ? body : body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(t('err_offline'));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    const code = data?.error || 'server_error';
    if (code === 'login_required' && S.user) signOutLocal();
    throw new ApiError(STR.en['err_' + code] ? t('err_' + code) : t('err_server_error'));
  }
  return data;
}

/* ---------- Theme: accent and background colours ---------- */
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, w) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * w)); };
const lum = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

function applyTheme() {
  const { accent, bg } = S.theme;
  const dark = lum(bg) < 0.3;
  const vars = {
    '--lime': accent, '--lime2': mix(accent, '#000000', 0.12),
    '--lime-ink': lum(accent) > 0.4 ? mix(accent, '#000000', 0.88) : '#ffffff',
    '--bg': bg,
    '--surface': dark ? mix(bg, '#ffffff', 0.045) : mix(bg, '#ffffff', 0.7),
    '--surface2': dark ? mix(bg, '#ffffff', 0.085) : mix(bg, '#000000', 0.035),
    '--surface3': dark ? mix(bg, '#ffffff', 0.13) : mix(bg, '#000000', 0.08),
    '--text': dark ? '#f2f4ec' : '#14161a', '--muted': dark ? '#a3a89a' : '#5a5f66', '--faint': dark ? '#6f7468' : '#8a9097',
    '--line': dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)', '--line2': dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.16)',
  };
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.colorScheme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]').content = bg;
}

function showDialog(sel) { const d = $(sel); if (!d.open) d.showModal(); }
function resetSheet(sheet) { sheet.onclick = sheet.oninput = sheet.onchange = null; }

function openTheme() {
  const sheet = $('#info-sheet');
  resetSheet(sheet);
  const draw = () => {
    sheet.innerHTML = `
      <div class="sheet-pad">
        <h3>${icon('palette')} ${esc(t('themeTitle'))}</h3>
        <div class="field"><span>${esc(t('accentColor'))}</span>
          <div class="swatch-row">${ACCENTS.map(([n, c]) => `<button class="swatch ${S.theme.accent === c ? 'on' : ''}" style="background:${c}" data-accent="${c}" aria-label="${esc(t('color_' + n))}" title="${esc(t('color_' + n))}"></button>`).join('')}
            <label class="swatch custom" title="${esc(t('customColor'))}"><input type="color" id="th-accent" value="${S.theme.accent}" aria-label="${esc(t('customColor'))}">${icon('plus')}</label></div></div>
        <div class="field"><span>${esc(t('backgroundColor'))}</span>
          <div class="swatch-row">${BACKGROUNDS.map(([n, c]) => `<button class="swatch bg ${S.theme.bg === c ? 'on' : ''}" style="background:${c}" data-bg="${c}" aria-label="${esc(t('bg_' + n))}" title="${esc(t('bg_' + n))}"></button>`).join('')}
            <label class="swatch custom" title="${esc(t('customColor'))}"><input type="color" id="th-bg" value="${S.theme.bg}" aria-label="${esc(t('customColor'))}">${icon('plus')}</label></div></div>
        <div class="theme-preview"><span class="btn primary sm">${esc(t('rentNow'))}</span><span class="chip on">${esc(t('bodyAll'))}</span><span class="chip">${esc(t('body_suv'))}</span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" data-reset>${icon('rotate')} ${esc(t('resetTheme'))}</button>
          <button class="btn primary" data-close>${icon('check')} ${esc(t('done'))}</button>
        </div>
      </div>
      <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  };
  const set = patch => { S.theme = { ...S.theme, ...patch }; local.set('theme', S.theme); applyTheme(); draw(); };
  draw();
  sheet.onclick = e => {
    const a = e.target.closest('[data-accent]'), b = e.target.closest('[data-bg]');
    if (a) set({ accent: a.dataset.accent });
    if (b) set({ bg: b.dataset.bg });
    if (e.target.closest('[data-reset]')) set({ accent: ACCENTS[0][1], bg: BACKGROUNDS[0][1] });
    if (e.target.closest('[data-close]')) $('#dlg-info').close();
  };
  sheet.oninput = e => {
    if (e.target.id === 'th-accent') { S.theme.accent = e.target.value; applyTheme(); }
    if (e.target.id === 'th-bg') { S.theme.bg = e.target.value; applyTheme(); }
  };
  sheet.onchange = e => { if (e.target.id === 'th-accent' || e.target.id === 'th-bg') set({}); };
  showDialog('#dlg-info');
}

/* ---------- Get the app: QR code + install steps ---------- */
function platform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'mac';
  return 'pc';
}
function openGetApp() {
  const url = location.origin + location.pathname;
  let qr = '';
  if (window.qrcode) {
    const q = window.qrcode(0, 'M');
    q.addData(url);
    q.make();
    qr = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }
  const mine = platform();
  const steps = ['ios', 'android', 'mac', 'pc'].map(p => `
    <div class="step ${p === mine ? 'mine' : ''}"><b>${icon(p === 'mac' || p === 'pc' ? 'download' : 'phone')} ${esc(t('app_' + p))}</b><span>${esc(t('app_' + p + 'Steps'))}</span></div>`).join('');
  const sheet = $('#info-sheet');
  resetSheet(sheet);
  sheet.innerHTML = `
    <div class="sheet-pad">
      <h3>${icon('phone')} ${esc(t('getAppTitle'))}</h3>
      <p class="muted" style="margin:0">${esc(t('getAppDesc'))}</p>
      <div class="qr-row"><div class="qr">${qr}</div><div class="qr-text"><b>${esc(t('scanToOpen'))}</b><div class="link-copy"><code id="app-url">${esc(url)}</code><button class="btn sm" data-copy>${esc(t('copyLink'))}</button></div></div></div>
      ${S.installPrompt ? `<button class="btn primary block" data-install>${icon('download')} ${esc(t('installNow'))}</button>` : ''}
      <div class="steps">${steps}</div>
    </div>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  sheet.onclick = async e => {
    if (e.target.closest('[data-close]')) $('#dlg-info').close();
    if (e.target.closest('[data-copy]')) {
      try { await navigator.clipboard.writeText(url); toast(t('copied')); } catch { getSelection().selectAllChildren($('#app-url')); }
    }
    if (e.target.closest('[data-install]') && S.installPrompt) {
      S.installPrompt.prompt();
      await S.installPrompt.userChoice.catch(() => {});
      S.installPrompt = null;
      $('#dlg-info').close();
    }
  };
  showDialog('#dlg-info');
}

/* ---------- Language & currency ---------- */
function initPrefs() {
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  S.lang = local.get('lang', STR[nav] ? nav : 'en');
  S.cur = local.get('cur', CUR_BY_LANG[S.lang] || 'USD');
  S.saved = new Set(local.get('saved', []));
  S.theme = { accent: ACCENTS[0][1], bg: BACKGROUNDS[0][1], ...local.get('theme', {}) };
  S.from = isoDay(Date.now() + DAY);
  S.to = isoDay(Date.now() + 4 * DAY);
  applyTheme();
  $('#sel-lang').innerHTML = LANGS.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('');
  $('#sel-cur').innerHTML = Object.keys(RATES).map(c => `<option value="${c}">${c}</option>`).join('');
  $('#sel-lang').onchange = e => {
    S.lang = e.target.value;
    local.set('lang', S.lang);
    if (!local.get('curPicked', false)) S.cur = CUR_BY_LANG[S.lang] || S.cur;
    renderAll();
  };
  $('#sel-cur').onchange = e => { S.cur = e.target.value; local.set('cur', S.cur); local.set('curPicked', true); renderAll(); };
  $('#btn-theme').onclick = openTheme;
  $$('[data-get-app]').forEach(b => { b.onclick = e => { e.preventDefault(); openGetApp(); }; });
  $('#btn-account').onclick = openAccount;
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
  $$('[data-hero-title]').forEach(el => { el.innerHTML = esc(t('heroTitle')).replace(/\*(.+?)\*/, '<em>$1</em>'); });
  document.title = `LocalSold – ${t('tagline')}`;
}

// Brand logo (Simple Icons) or a lettered badge for brands without one.
function brandMark(make) {
  const path = BRAND_PATHS[brandKey(make)];
  if (path) return `<svg class="logo-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  const letters = String(make || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 3).toUpperCase();
  return `<span class="monogram" aria-hidden="true"><span>${esc(letters)}</span></span>`;
}
const initials = name => String(name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* ---------- Accounts ---------- */
function renderAuth() {
  const mode = S.authMode || 'login';
  const card = $('#auth-card');
  card.innerHTML = `
    <div class="seg" style="width:100%">
      <button type="button" data-auth-mode="login" class="${mode === 'login' ? 'on' : ''}" style="flex:1">${esc(t('login'))}</button>
      <button type="button" data-auth-mode="signup" class="${mode === 'signup' ? 'on' : ''}" style="flex:1">${esc(t('createAccount'))}</button>
    </div>
    <h2>${esc(t(mode === 'login' ? 'welcomeBackTitle' : 'joinTitle'))}</h2>
    <p class="muted" style="margin:0">${esc(t(mode === 'login' ? 'loginDesc' : 'signupDesc'))}</p>
    <form id="auth-form" class="list" novalidate>
      ${mode === 'signup' ? `<label class="field"><span>${esc(t('fullName'))}</span><input name="name" id="au-name" required maxlength="60" autocomplete="name"></label>` : ''}
      <label class="field"><span>${esc(t('email'))}</span><input name="email" id="au-email" type="email" required autocomplete="email"></label>
      <label class="field"><span>${esc(t('password'))}</span><input name="password" id="au-pass" type="password" required minlength="${mode === 'signup' ? 8 : 1}" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}"></label>
      ${mode === 'signup' ? `<p class="faint" style="margin:0">${esc(t('passHint'))}</p>` : ''}
      <button class="btn primary block" type="submit">${icon(mode === 'login' ? 'key' : 'user')} ${esc(t(mode === 'login' ? 'login' : 'createAccount'))}</button>
      <p class="form-error" id="auth-error" role="alert"></p>
    </form>`;
  card.onclick = e => {
    const b = e.target.closest('[data-auth-mode]');
    if (b) { S.authMode = b.dataset.authMode; renderAuth(); }
  };
  $('#auth-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    if (!f.reportValidity()) return;
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(f));
      const res = await api(mode === 'login' ? 'auth/login' : 'auth/signup', { method: 'POST', body: data });
      S.token = res.token;
      S.user = res.user;
      local.set('token', S.token);
      toast(t('welcome', { name: S.user.name }));
      await enterApp();
    } catch (err) {
      $('#auth-error').textContent = err.message;
      btn.disabled = false;
    }
  };
}

function signOutLocal() {
  S.token = null;
  S.user = null;
  S.orders = [];
  local.del('token');
  clearInterval(S.pollTimer);
  document.body.classList.add('gated');
  $$('dialog[open]').forEach(d => d.close());
  if (location.hash.length > 2) location.hash = '#/browse';
  renderAll();
  mountHero();
}
async function logout() {
  await api('auth/logout', { method: 'POST' }).catch(() => {});
  signOutLocal();
}

function openAccount() {
  if (!S.user) return;
  const sheet = $('#info-sheet');
  resetSheet(sheet);
  sheet.innerHTML = `
    <div class="sheet-pad">
      <div class="account-head"><span class="avatar big">${esc(initials(S.user.name))}</span>
        <div><h3 style="padding:0">${esc(S.user.name)}</h3><div class="faint">${esc(S.user.email)}</div>
        <span class="role ${S.user.role}">${icon(S.user.role === 'owner' ? 'crown' : S.user.role === 'admin' ? 'shield' : 'user')} ${esc(t('role_' + S.user.role))}</span></div></div>
      <div class="menu">
        ${!S.status?.ownerExists && !isStaff() ? `<button data-act="claim">${icon('crown')} ${esc(t('claimTitle'))}</button>` : ''}
        <button data-act="theme">${icon('palette')} ${esc(t('themeTitle'))}</button>
        <button data-act="app">${icon('phone')} ${esc(t('getAppTitle'))}</button>
        <button data-act="password">${icon('key')} ${esc(t('changePass'))}</button>
        <button data-act="logout" class="danger">${icon('logout')} ${esc(t('logout'))}</button>
      </div>
    </div>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  sheet.onclick = e => {
    if (e.target.closest('[data-close]')) return $('#dlg-info').close();
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'claim') openClaim();
    if (act === 'theme') openTheme();
    if (act === 'app') openGetApp();
    if (act === 'password') openPassword();
    if (act === 'logout') { $('#dlg-info').close(); logout(); }
  };
  showDialog('#dlg-info');
}

function openClaim() {
  const sheet = $('#info-sheet');
  resetSheet(sheet);
  sheet.innerHTML = `
    <form class="sheet-pad" id="claim-form">
      <h3>${icon('crown')} ${esc(t('claimTitle'))}</h3>
      <p class="muted" style="margin:0">${esc(t('claimDesc'))}</p>
      <label class="field"><span>${esc(t('setupCode'))}</span><input name="code" id="claim-code" type="password" required autocomplete="off"></label>
      <button class="btn primary block">${icon('crown')} ${esc(t('claim'))}</button>
      <p class="form-error" id="claim-error" role="alert"></p>
    </form>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  sheet.onclick = e => { if (e.target.closest('[data-close]')) $('#dlg-info').close(); };
  $('#claim-form').onsubmit = async e => {
    e.preventDefault();
    try {
      const res = await api('auth/claim-owner', { method: 'POST', body: { code: e.target.code.value } });
      S.user = res.user;
      S.status.ownerExists = true;
      $('#dlg-info').close();
      toast(t('claimed'));
      await loadOrders();
      startStaff();
      renderAll();
      location.hash = '#/admin';
    } catch (err) { $('#claim-error').textContent = err.message; }
  };
  showDialog('#dlg-info');
}

function openPassword() {
  const sheet = $('#info-sheet');
  resetSheet(sheet);
  sheet.innerHTML = `
    <form class="sheet-pad" id="pw-form">
      <h3>${icon('key')} ${esc(t('changePass'))}</h3>
      <label class="field"><span>${esc(t('currentPass'))}</span><input name="oldPassword" id="pw-old" type="password" required autocomplete="current-password"></label>
      <label class="field"><span>${esc(t('newPass'))}</span><input name="newPassword" id="pw-new" type="password" required minlength="8" autocomplete="new-password"></label>
      <button class="btn primary block">${esc(t('save'))}</button>
      <p class="form-error" id="pw-error" role="alert"></p>
    </form>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  sheet.onclick = e => { if (e.target.closest('[data-close]')) $('#dlg-info').close(); };
  $('#pw-form').onsubmit = async e => {
    e.preventDefault();
    if (!e.target.reportValidity()) return;
    try {
      await api('auth/password', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
      $('#dlg-info').close();
      toast(t('saved'));
    } catch (err) { $('#pw-error').textContent = err.message; }
  };
  showDialog('#dlg-info');
}

/* ---------- Navigation ---------- */
function renderNav() {
  const mine = S.orders.filter(o => o.customer?.email === S.user?.email && ['new', 'confirmed'].includes(o.status)).length;
  const fresh = isStaff() ? S.orders.filter(o => o.status === 'new').length : 0;
  const items = [['browse', 'car', t('navBrowse'), 0], ['trips', 'trips', t('navTrips'), mine]];
  if (isStaff()) items.push(['admin', 'inbox', t('navAdmin'), fresh]);
  const html = items.map(([v, ic, label, n]) =>
    `<a href="#/${v}" class="${S.view === v ? 'on' : ''}" aria-label="${esc(label)}">${icon(ic)}<span>${esc(label)}</span>${n ? `<span class="count ${v === 'admin' ? 'hot' : ''}">${n}</span>` : ''}</a>`).join('');
  $('#nav').innerHTML = html;
  $('#tabbar').innerHTML = html;
  const acc = $('#btn-account');
  acc.hidden = !S.user;
  if (S.user) acc.innerHTML = `<span class="avatar">${esc(initials(S.user.name))}</span>`;
}

function route() {
  if (!S.user) return;
  const [v, id] = location.hash.replace(/^#\/?/, '').split('/');
  if (v === 'car' && id) {
    if (!$('#view-' + S.view)?.classList.contains('on')) setView('browse');
    openCar(decodeURIComponent(id));
    return;
  }
  if ($('#dlg-car').open) closeCarDialog(true);
  const allowed = ['browse', 'trips', ...(isStaff() ? ['admin'] : [])];
  setView(allowed.includes(v) ? v : 'browse');
}
function setView(v) {
  S.view = v;
  $$('.view').forEach(el => el.classList.toggle('on', el.id === 'view-' + v));
  renderNav();
  if (v === 'trips') renderTrips();
  if (v === 'admin') { renderAdmin(); if (S.adminTab === 'team') loadUsers(); }
  mountHero();
  window.scrollTo({ top: 0 });
}

/* ---------- Browse ---------- */
const modelKind = c => (c.body === 'sports' ? 'sports' : 'sedan');
const thumbKey = c => `${modelKind(c)}|${(c.colors || [])[0]}`;
const priceHtml = c => (S.f.mode === 'buy' ? money(c.price) : `${money(c.rentPerDay)}<span>${esc(t('perDay'))}</span>`);
const carImg = c => c.photos?.[0] || S.thumbs.get(thumbKey(c)) || '';

function renderFilters() {
  $('#seg-mode').innerHTML = [['rent', 'trips', t('modeRent')], ['buy', 'check', t('modeBuy')]]
    .map(([k, ic, l]) => `<button type="button" data-mode="${k}" class="${S.f.mode === k ? 'on' : ''}">${icon(ic)} ${esc(l)}</button>`).join('');
  $$('[data-rent-only]').forEach(el => { el.hidden = S.f.mode !== 'rent'; });
  const today = isoDay(Date.now());
  Object.assign($('#f-from'), { min: today, value: S.from });
  Object.assign($('#f-to'), { min: S.from, value: S.to });
  const counts = {};
  S.cars.forEach(c => { counts[c.make] = (counts[c.make] || 0) + 1; });
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
  $('#owner-banner').hidden = !(S.user && S.status && !S.status.ownerExists && !isStaff());
}

function filteredCars() {
  const { q, mode, body, fuel, sort, brand, saved } = S.f;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = S.cars.filter(c =>
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
      const car = S.cars.find(c => c.id === el.dataset.thumb);
      el.removeAttribute('data-thumb');
      if (!car || !st) { el.nextElementSibling?.classList.contains('shimmer') && el.nextElementSibling.remove(); continue; }
      const key = thumbKey(car);
      if (!S.thumbs.has(key)) S.thumbs.set(key, await st.snapshot(car, car.colors?.[0]).catch(() => ''));
      $$(`[data-id="${CSS.escape(car.id)}"] img.render`).forEach(img => {
        if (S.thumbs.get(key)) { img.src = S.thumbs.get(key); img.hidden = false; }
        img.removeAttribute('data-thumb');
        img.nextElementSibling?.classList.contains('shimmer') && img.nextElementSibling.remove();
      });
    }
  } finally { thumbBusy = false; }
}

/* Hero showcase: a live 3D car on the accent card, cycling through the current results. */
function showcaseCars() {
  const list = filteredCars().filter(c => c.available);
  return list.length ? list : S.cars.filter(c => c.available);
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
// The one 3D canvas lives in the login screen, the home showcase, or the car dialog.
async function mountHero() {
  const gated = !S.user;
  const host = gated ? $('#auth-host') : $('#hero-host');
  const st = await stageReady;
  const car = gated ? (S.cars.find(c => c.body === 'sports') || S.cars[0]) : S.featCar;
  if (!st || !car || $('#dlg-car').open || (!gated && S.view !== 'browse')) return;
  await st.show(car, car.colors?.[0]).catch(() => null);
  if ($('#dlg-car').open || !S.user !== gated || (!gated && S.view !== 'browse')) return;
  st.setMode('ext');
  st.autoRotate = true;
  st.setTouch('pan-y');
  st.setFraming(gated ? 0.6 : 1.15);
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
  $('#owner-banner').onclick = e => { if (e.target.closest('button')) openClaim(); };
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
  const car = S.cars.find(c => c.id === id);
  if (!car) { location.replace('#/browse'); return; }
  // Open on the deal the shopper picked in the finder (Rent or Buy) when the car offers it.
  const deal = (S.f.mode === 'buy' ? car.forSale : car.forRent) ? S.f.mode : (car.forRent ? 'rent' : 'buy');
  Object.assign(C, {
    car, color: car.colors?.[0] || '#c8ccd2', tab: car.photos?.length ? 'photos' : '3d', mode: 'ext', photo: 0,
    deal, from: S.from, to: S.to, ins: true, down: 20, term: 60, payFull: false, spin: true,
  });
  renderCar();
  showDialog('#dlg-car');
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
  if (C.tab !== '3d' || !host) { if (st?.host?.closest('#dlg-car') || (st?.host && !st.host.isConnected)) st.unmount(); return; }
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
    g.innerHTML = `<div class="empty">${icon('camera')}<p>${esc(t('noPhotos'))}</p></div>`;
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
      <button class="icon-btn sheet-close" data-x aria-label="${esc(t('close'))}">${icon('x')}</button>
      ${list.length > 1 ? `<button class="icon-btn lb-nav prev" data-p aria-label="‹">${icon('chevL')}</button><button class="icon-btn lb-nav next" data-n aria-label="›">${icon('chevR')}</button>` : ''}`;
  };
  const step = d => { i = (i + d + list.length) % list.length; draw(); };
  lb.onclick = e => {
    if (e.target.closest('[data-x]') || (e.target === lb.querySelector('img') && list.length < 2)) lb.close();
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

/* ---------- Checkout: creates an order on the server ---------- */
function openCheckout() {
  const c = C.car, q = quote();
  const kind = C.deal;
  const summary = kind === 'rent'
    ? `${fmtDate(C.from)} → ${fmtDate(C.to)} · ${t('daysN', { n: q.days })}${C.ins ? ' · ' + t('insurance') : ''}`
    : (C.payFull ? t('payFull') : `${t('finance')} · ${C.down}% · ${t('monthsN', { n: C.term })} · ${money(q.monthly)}/${t('mo')}`);
  const sheet = $('#checkout-sheet');
  sheet.innerHTML = `
    <form class="sheet-pad" id="co-form" novalidate>
      <h3>${esc(t('checkout'))}</h3>
      <div class="admin-car" style="grid-template-columns:84px minmax(0,1fr)"><img class="${c.photos?.length ? 'photo' : ''}" src="${esc(carImg(c))}" alt=""><div><b>${esc(carName(c))}</b><div class="faint">${esc(t(kind === 'rent' ? 'rent' : 'buy'))} · ${esc(summary)}</div></div></div>
      <div class="who">${icon('user')} <span><b>${esc(S.user.name)}</b> · ${esc(S.user.email)}</span></div>
      <label class="field"><span>${esc(t('phone'))}</span><input name="phone" id="co-phone" type="tel" required autocomplete="tel" value="${esc(local.get('phone', ''))}"></label>
      <div class="field"><span>${esc(t('payMethod'))}</span>
        <div class="pay-opts">
          ${[['card', 'key', t('payCard')], ['wallet', 'bolt', t('payWallet')], ['cash', 'trips', t(kind === 'rent' ? 'payAtPickup' : 'payAtDealer')]].map(([v, ic, l]) =>
            `<label class="pay-opt"><input type="radio" name="method" value="${v}" ${v === 'cash' ? 'checked' : ''}>${icon(ic)}<span>${esc(l)}</span></label>`).join('')}
        </div>
      </div>
      <label class="field"><span>${esc(t('noteForStore'))}</span><textarea name="note" id="co-note" maxlength="500" rows="2"></textarea></label>
      <div class="notice">${icon('shield')}<span>${esc(t('demoNotice'))}</span></div>
      <div class="lines"><div class="total"><span>${esc(t('dueToday'))}</span><span>${money(q.due)}</span></div></div>
      <button class="btn primary block" type="submit">${icon('check')} ${esc(t(kind === 'rent' ? 'confirmBooking' : 'confirmOrder'))}</button>
      <p class="form-error" id="co-error" role="alert"></p>
    </form>
    <button class="icon-btn sheet-close" data-close aria-label="${esc(t('close'))}">${icon('x')}</button>`;
  sheet.onclick = e => { if (e.target.closest('[data-close]')) $('#dlg-checkout').close(); };
  $('#co-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    if (!f.reportValidity()) return;
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    const data = Object.fromEntries(new FormData(f));
    local.set('phone', data.phone);
    try {
      const { order } = await api('orders', {
        method: 'POST',
        body: { carId: c.id, kind, from: C.from, to: C.to, insurance: C.ins, payFull: C.payFull, downPct: C.down, term: C.term, method: data.method, phone: data.phone, note: data.note, color: C.color },
      });
      S.orders.unshift(order);
      S.seen?.add(order.id);
      renderNav();
      sheet.innerHTML = `<div class="sheet-pad"><div class="success">
          <div class="tick">${icon('check')}</div>
          <h3 style="padding:0">${esc(t('successTitle'))}</h3>
          <p class="muted" style="margin:0">${esc(t(kind === 'rent' ? 'successRent' : 'successBuy', { car: carName(c) }))}</p>
          <div class="code">${esc(order.code)}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
            <button class="btn dark" data-trips>${icon('trips')} ${esc(t('viewTrips'))}</button>
            <button class="btn" data-close>${esc(t('close'))}</button>
          </div></div></div>`;
      sheet.onclick = ev => {
        if (ev.target.closest('[data-close]')) $('#dlg-checkout').close();
        if (ev.target.closest('[data-trips]')) { $('#dlg-checkout').close(); closeCarDialog(true); location.hash = '#/trips'; }
      };
    } catch (err) {
      $('#co-error').textContent = err.message;
      btn.disabled = false;
    }
  };
  showDialog('#dlg-checkout');
}

/* ---------- Orders ---------- */
function orderLine(o) {
  return o.kind === 'rent'
    ? `${fmtDate(o.from)} → ${fmtDate(o.to)} · ${t('daysN', { n: o.days })}${o.insurance ? ' · ' + t('insurance') : ''}`
    : (o.payFull ? t('payFull') : `${t('finance')} · ${o.downPct}% · ${t('monthsN', { n: o.term })} · ${money(o.monthlyUsd)}/${t('mo')}`);
}
function orderThumb(o) {
  const car = S.cars.find(c => c.id === o.carId);
  const src = o.photo || (car && carImg(car)) || '';
  return `<img class="${o.photo ? 'photo' : ''}" src="${esc(src)}" alt="">`;
}

async function loadOrders() {
  if (!S.user) return;
  try { S.orders = (await api('orders')).orders; } catch { /* keep the last list */ }
}

function renderTrips() {
  const el = $('#trips');
  const mine = S.orders.filter(o => o.customer?.email === S.user?.email);
  if (!mine.length) {
    el.innerHTML = `<div class="empty">${icon('trips')}<p>${esc(t('tripsEmpty'))}</p><a class="btn primary" href="#/browse">${esc(t('navBrowse'))}</a></div>`;
    return;
  }
  el.innerHTML = mine.map(o => `<div class="trip">
      ${orderThumb(o)}
      <div><h4>${esc(o.car)} <span class="status ${o.status}">${esc(t('status_' + o.status))}</span></h4>
        <div class="faint">${esc(t(o.kind === 'rent' ? 'rent' : 'buy'))} · ${esc(orderLine(o))}</div>
        <div class="faint">${esc(t('bookingCode'))}: <b>${esc(o.code)}</b> · ${esc(t('dueToday'))}: ${money(o.dueUsd)}</div></div>
      <div class="acts">${['new', 'confirmed'].includes(o.status) ? `<button class="btn sm danger" data-cancel="${esc(o.id)}">${esc(t('cancel'))}</button>` : ''}</div>
    </div>`).join('');
  el.onclick = e => {
    const b = e.target.closest('[data-cancel]');
    if (b) confirmInline(b, t('cancelConfirm'), () => setOrderStatus(b.dataset.cancel, 'cancelled'));
  };
}

async function setOrderStatus(id, status) {
  try {
    const { order } = await api('orders/' + encodeURIComponent(id), { method: 'PATCH', body: { status } });
    S.orders = S.orders.map(o => (o.id === id ? order : o));
    toast(t('saved'));
    renderNav();
    if (S.view === 'trips') renderTrips();
    if (S.view === 'admin') renderAdmin();
  } catch (err) { toast(err.message); }
}

// Two-step confirm inside the page (no blocking browser dialogs).
function confirmInline(btn, question, action) {
  if (btn.dataset.armed) { action(); return; }
  btn.dataset.armed = '1';
  const old = btn.innerHTML;
  btn.textContent = question;
  btn.classList.add('armed');
  setTimeout(() => { if (btn.isConnected && btn.dataset.armed) { btn.innerHTML = old; delete btn.dataset.armed; btn.classList.remove('armed'); } }, 3500);
}

/* Staff: poll for new orders and pop an alert when one arrives. */
function startStaff() {
  clearInterval(S.pollTimer);
  if (!isStaff()) return;
  S.seen = new Set(local.get('seen_' + S.user.email, S.orders.map(o => o.id)));
  local.set('seen_' + S.user.email, [...S.seen]);
  S.pollTimer = setInterval(pollOrders, POLL_MS);
}
async function pollOrders() {
  if (!isStaff()) return;
  await loadOrders();
  const fresh = S.orders.filter(o => !S.seen.has(o.id));
  if (fresh.length) {
    fresh.forEach(o => S.seen.add(o.id));
    local.set('seen_' + S.user.email, [...S.seen].slice(-2000));
    const o = fresh[0];
    const msg = t(o.kind === 'rent' ? 'newBookingAlert' : 'newOrderAlert', { name: o.customer.name, car: o.car });
    toast(fresh.length > 1 ? t('newOrdersAlert', { n: fresh.length }) : msg);
    chime();
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('LocalSold', { body: msg, icon: 'icon-192.png', tag: 'order-' + o.id }); } catch { /* not allowed here */ }
    }
  }
  renderNav();
  if (S.view === 'admin' && S.adminTab === 'orders' && !$('#dlg-edit').open) renderAdmin();
}
function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const at = ctx.currentTime + i * 0.16;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.2, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(at);
      o.stop(at + 0.32);
    });
  } catch { /* audio blocked until the page is touched */ }
}

/* ---------- Admin: orders, cars, team ---------- */
function renderAdmin() {
  if (!isStaff()) return;
  const el = $('#admin');
  const tabs = [['orders', 'inbox', t('ordersTab')], ['cars', 'car', t('cars')], ...(isOwner() ? [['team', 'users', t('team')]] : [])];
  if (!tabs.some(([k]) => k === S.adminTab)) S.adminTab = 'orders';
  const fresh = S.orders.filter(o => o.status === 'new').length;
  el.innerHTML = `
    <div class="page-head">
      <div><h2>${esc(t('dashboard'))}</h2><div class="muted">${esc(t('signedInAs', { name: S.user.name }))} <span class="role ${S.user.role}">${icon(isOwner() ? 'crown' : 'shield')} ${esc(t('role_' + S.user.role))}</span></div></div>
      <div class="seg" id="admin-tabs">${tabs.map(([k, ic, l]) => `<button data-atab="${k}" class="${S.adminTab === k ? 'on' : ''}">${icon(ic)} ${esc(l)}${k === 'orders' && fresh ? ` <span class="count hot">${fresh}</span>` : ''}</button>`).join('')}</div>
    </div>
    <div id="admin-body"></div>`;
  $('#admin-tabs').onclick = e => { const b = e.target.closest('[data-atab]'); if (b) { S.adminTab = b.dataset.atab; renderAdmin(); if (S.adminTab === 'team') loadUsers(); } };
  ({ orders: renderOrdersAdmin, cars: renderCarsAdmin, team: renderTeam })[S.adminTab]();
}

function renderOrdersAdmin() {
  const box = $('#admin-body');
  const counts = Object.fromEntries(['all', ...STATUSES].map(s => [s, s === 'all' ? S.orders.length : S.orders.filter(o => o.status === s).length]));
  const list = S.orders.filter(o => S.orderFilter === 'all' || o.status === S.orderFilter);
  const canNotify = 'Notification' in window && Notification.permission === 'default';
  box.innerHTML = `
    <div class="filters">
      <div class="chips">${['new', 'confirmed', 'completed', 'cancelled', 'all'].map(s => `<button class="chip ${S.orderFilter === s ? 'on' : ''}" data-of="${s}">${esc(t(s === 'all' ? 'allOrders' : 'status_' + s))} <span class="n">${counts[s]}</span></button>`).join('')}</div>
      ${canNotify ? `<button class="btn sm" data-notify>${icon('bell')} ${esc(t('enableAlerts'))}</button>` : ''}
      <button class="btn sm" data-refresh>${icon('rotate')} ${esc(t('refresh'))}</button>
    </div>
    <div class="list">${list.length ? list.map(o => `
      <article class="order ${o.status}">
        ${orderThumb(o)}
        <div class="order-main">
          <div class="order-title"><b>${esc(o.car)}</b><span class="status ${o.status}">${esc(t('status_' + o.status))}</span><span class="kind">${esc(t(o.kind === 'rent' ? 'rent' : 'buy'))}</span></div>
          <div class="faint">${esc(orderLine(o))}</div>
          <div class="order-who">${icon('user')} <b>${esc(o.customer.name)}</b> · <span class="sel">${esc(o.customer.email)}</span>${o.phone ? ` · <span class="sel">${esc(o.phone)}</span>` : ''}</div>
          ${o.note ? `<div class="order-note">“${esc(o.note)}”</div>` : ''}
          <div class="faint">${esc(t('bookingCode'))} <b>${esc(o.code)}</b> · ${esc(t('pay_' + o.method))} · ${esc(fmtTime(o.createdAt))}${o.handledBy ? ' · ' + esc(t('handledBy', { name: o.handledBy })) : ''}</div>
        </div>
        <div class="order-side">
          <div class="order-amount"><small>${esc(t('dueToday'))}</small><b>${money(o.dueUsd)}</b></div>
          <div class="order-acts">
            ${o.status === 'new' ? `<button class="btn sm primary" data-st="confirmed" data-id="${esc(o.id)}">${icon('check')} ${esc(t('confirm'))}</button>` : ''}
            ${['new', 'confirmed'].includes(o.status) ? `<button class="btn sm" data-st="completed" data-id="${esc(o.id)}">${esc(t('markDone'))}</button>
            <button class="btn sm danger" data-st="cancelled" data-id="${esc(o.id)}">${esc(t('cancel'))}</button>` : ''}
          </div>
        </div>
      </article>`).join('') : `<div class="empty">${icon('inbox')}<p>${esc(t('noOrders'))}</p></div>`}</div>`;
  box.onclick = async e => {
    const f = e.target.closest('[data-of]');
    if (f) { S.orderFilter = f.dataset.of; renderOrdersAdmin(); return; }
    if (e.target.closest('[data-refresh]')) { await loadOrders(); renderAdmin(); renderNav(); return; }
    if (e.target.closest('[data-notify]')) { await Notification.requestPermission().catch(() => {}); renderOrdersAdmin(); return; }
    const b = e.target.closest('[data-st]');
    if (!b) return;
    if (b.dataset.st === 'cancelled') confirmInline(b, t('cancelConfirm'), () => setOrderStatus(b.dataset.id, 'cancelled'));
    else setOrderStatus(b.dataset.id, b.dataset.st);
  };
}

function renderCarsAdmin() {
  const box = $('#admin-body');
  box.innerHTML = `
    <section class="panel-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <h3>${icon('car')} ${esc(t('cars'))} <span class="faint">(${num(S.cars.length)})</span></h3>
        <button class="btn sm primary" data-act="add">${icon('plus')} ${esc(t('addCar'))}</button>
      </div>
      <div class="list">${S.cars.map(c => `
        <div class="admin-car" data-id="${esc(c.id)}">
          ${c.photos?.length ? `<img class="photo" src="${esc(c.photos[0])}" alt="">` : `<img class="render" ${S.thumbs.get(thumbKey(c)) ? `src="${S.thumbs.get(thumbKey(c))}"` : `data-thumb="${esc(c.id)}"`} alt="">`}
          <div><b>${esc(carName(c))}</b> <span class="faint">${esc(c.year)}</span>
            <div class="faint">${icon('camera')} ${num(c.photos?.length || 0)} · ${c.forRent ? money(c.rentPerDay) + t('perDay') : '—'} · ${c.forSale ? money(c.price) : '—'}${c.available ? '' : ' · ' + esc(t('unavailable'))}</div></div>
          <div class="acts">
            <button class="icon-btn" data-act="photos" data-id="${esc(c.id)}" title="${esc(t('uploadPhotos'))}" aria-label="${esc(t('uploadPhotos'))}">${icon('camera')}</button>
            <button class="icon-btn" data-act="edit" data-id="${esc(c.id)}" title="${esc(t('edit'))}" aria-label="${esc(t('edit'))}">${icon('edit')}</button>
            <button class="icon-btn" data-act="del" data-id="${esc(c.id)}" title="${esc(t('delete'))}" aria-label="${esc(t('delete'))}">${icon('trash')}</button>
          </div>
        </div>`).join('')}</div>
    </section>`;
  box.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'add') openEditor(null);
    if (b.dataset.act === 'edit') openEditor(id);
    if (b.dataset.act === 'photos') openEditor(id, true);
    if (b.dataset.act === 'del') confirmInline(b, '?', async () => {
      try {
        await api('cars/' + encodeURIComponent(id), { method: 'DELETE' });
        S.cars = S.cars.filter(c => c.id !== id);
        toast(t('saved'));
        renderAll();
      } catch (err) { toast(err.message); }
    });
  };
  queueThumbs();
}

async function loadUsers() {
  try { S.users = (await api('users')).users; } catch (err) { toast(err.message); }
  if (S.adminTab === 'team' && S.view === 'admin') renderTeam();
}
function renderTeam() {
  const box = $('#admin-body');
  const q = (S.teamQ || '').toLowerCase();
  const people = S.users.filter(u => !q || `${u.name} ${u.email}`.toLowerCase().includes(q));
  box.innerHTML = `
    <section class="panel-card">
      <h3>${icon('users')} ${esc(t('team'))}</h3>
      <p class="muted" style="margin:0">${esc(t('teamDesc'))}</p>
      <label class="field"><span>${esc(t('findPerson'))}</span><input id="team-q" type="search" value="${esc(S.teamQ || '')}" placeholder="name@example.com"></label>
      <div class="list" id="team-list">${people.length ? people.map(u => `
        <div class="person"><div><b>${esc(u.name)}</b>${u.email === S.user.email ? ` <span class="faint">(${esc(t('you'))})</span>` : ''}<div class="faint">${esc(u.email)}</div><span class="role ${u.role}">${esc(t('role_' + u.role))}</span></div>
          ${u.role === 'customer' ? `<button class="btn sm dark" data-role="admin" data-email="${esc(u.email)}">${icon('shield')} ${esc(t('giveAdmin'))}</button>` : ''}
          ${u.role === 'admin' ? `<button class="btn sm danger" data-role="customer" data-email="${esc(u.email)}">${esc(t('removeAdmin'))}</button>` : ''}
        </div>`).join('') : `<div class="empty">${icon('users')}<p>${esc(t('noPeople'))}</p></div>`}</div>
    </section>`;
  $('#team-q').oninput = e => { S.teamQ = e.target.value; const pos = e.target.selectionStart; renderTeam(); const i = $('#team-q'); i.focus(); i.setSelectionRange(pos, pos); };
  box.onclick = e => {
    const b = e.target.closest('[data-role]');
    if (!b) return;
    const go = async () => {
      try {
        const { user } = await api('users/' + encodeURIComponent(b.dataset.email), { method: 'PATCH', body: { role: b.dataset.role } });
        S.users = S.users.map(u => (u.email === user.email ? user : u));
        toast(t(user.role === 'admin' ? 'adminAdded' : 'adminRemoved', { name: user.name }));
        renderTeam();
      } catch (err) { toast(err.message); }
    };
    if (b.dataset.role === 'customer') confirmInline(b, t('removeConfirmShort'), go); else go();
  };
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
  return new Promise(res => cv.toBlob(res, 'image/jpeg', 0.82));
}

function openEditor(id, focusPhotos) {
  if (!isStaff()) return;
  const orig = id ? S.cars.find(c => c.id === id) : null;
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
          <label class="field"><span>${esc(t('make'))}</span><input name="make" id="ed-make" required value="${esc(car.make)}" placeholder="Toyota"></label>
          <label class="field"><span>${esc(t('model'))}</span><input name="model" id="ed-model" required value="${esc(car.model)}" placeholder="Corolla Cross"></label>
        </div>
        <div class="row3">
          <label class="field"><span>${esc(t('year'))}</span><input name="year" id="ed-year" type="number" min="1950" max="2100" required value="${esc(car.year)}"></label>
          <label class="field"><span>${esc(t('bodyType'))}</span><select name="body" id="ed-body">${opt(BODY_TYPES, car.body, 'body_')}</select></label>
          <label class="field"><span>${esc(t('fuel'))}</span><select name="fuel" id="ed-fuel">${opt(FUELS, car.fuel, 'fuel_')}</select></label>
          <label class="field"><span>${esc(t('seats'))}</span><input name="seats" id="ed-seats" type="number" min="1" max="20" value="${esc(car.seats)}"></label>
          <label class="field"><span>${esc(t('transmission'))}</span><select name="transmission" id="ed-trans">${opt(['auto', 'manual'], car.transmission, 'trans_')}</select></label>
          <label class="field"><span>${esc(t('hp'))}</span><input name="hp" id="ed-hp" type="number" min="0" value="${esc(car.hp)}"></label>
        </div>
        <div class="row3">
          <label class="field"><span>${esc(t('rentPrice'))} (USD)</span><input name="rentPerDay" id="ed-rent" type="number" min="0" step="1" value="${esc(car.rentPerDay)}"></label>
          <label class="field"><span>${esc(t('salePrice'))} (USD)</span><input name="price" id="ed-price" type="number" min="0" step="100" value="${esc(car.price)}"></label>
          <label class="field"><span>${esc(t('range'))} (km)</span><input name="rangeKm" id="ed-range" type="number" min="0" value="${esc(car.rangeKm)}"></label>
        </div>
        <div class="row3">
          <label class="check"><input type="checkbox" name="forRent" id="ed-forrent" ${car.forRent ? 'checked' : ''}><span>${esc(t('forRent'))}</span></label>
          <label class="check"><input type="checkbox" name="forSale" id="ed-forsale" ${car.forSale ? 'checked' : ''}><span>${esc(t('forSale'))}</span></label>
          <label class="check"><input type="checkbox" name="available" id="ed-avail" ${car.available ? 'checked' : ''}><span>${esc(t('availableNow'))}</span></label>
        </div>
        <div class="field"><span>${esc(t('colors'))}</span>
          <div class="colors-edit">${car.colors.map((col, i) => `<label><input type="color" value="${esc(col)}" data-col="${i}" aria-label="${esc(t('color'))}">${car.colors.length > 1 ? `<button type="button" class="x" data-rmcol="${i}" aria-label="${esc(t('remove'))}">×</button>` : ''}</label>`).join('')}
            ${car.colors.length < 8 ? `<button type="button" class="icon-btn" data-addcol aria-label="${esc(t('addColor'))}">${icon('plus')}</button>` : ''}</div>
        </div>
        <label class="field"><span>${esc(t('description'))}</span><textarea name="description" id="ed-desc" maxlength="1200">${esc(car.description)}</textarea></label>
        <button class="btn primary block" type="submit">${icon('check')} ${esc(t('save'))}</button>
        <p class="form-error" id="ed-error" role="alert"></p>
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
        try {
          const blob = await compressImage(f);
          const { url } = await api('photos', { method: 'POST', body: blob, raw: 'image/jpeg' });
          car.photos.push(url);
        } catch (err) { toast(err instanceof ApiError ? err.message : t('badImage', { name: f.name })); }
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
      if (!car.forRent && !car.forSale) { $('#ed-error').textContent = t('needRentOrSale'); return; }
      const slug = car.id || (`${car.make}-${car.model}`.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'car');
      const id = car.id || (S.cars.some(c => c.id === slug) ? `${slug}-${Math.random().toString(36).slice(2, 6)}` : slug);
      try {
        const res = await api('cars/' + encodeURIComponent(id), { method: 'PUT', body: car });
        const i = S.cars.findIndex(c => c.id === id);
        if (i >= 0) S.cars[i] = res.car; else S.cars.unshift(res.car);
        $('#dlg-edit').close();
        toast(t('saved'));
        renderAll();
      } catch (err) { $('#ed-error').textContent = err.message; }
    };
  };
  draw();
  showDialog('#dlg-edit');
  if (focusPhotos) $('#photo-section').scrollIntoView();
}

/* ---------- Boot ---------- */
function renderAll() {
  applyI18n();
  renderNav();
  renderFilters();
  renderGrid();
  if (!S.user) renderAuth();
  if (S.view === 'trips') renderTrips();
  if (S.view === 'admin') renderAdmin();
  if ($('#dlg-car').open && C.car) {
    C.car = S.cars.find(c => c.id === C.car.id) || C.car;
    renderCar();
    syncStage();
  }
}

async function enterApp() {
  document.body.classList.remove('gated');
  await loadOrders();
  startStaff();
  renderAll();
  route();
}

function showSetup() {
  document.body.classList.add('gated', 'setup');
  $('#auth-card').innerHTML = `
    <h2>${esc(t('setupTitle'))}</h2>
    <p class="muted" style="margin:0">${esc(t('setupDesc'))}</p>
    <ol class="setup-steps">${['setup1', 'setup2', 'setup3', 'setup4'].map(k => `<li>${esc(t(k))}</li>`).join('')}</ol>`;
}

async function boot() {
  $('#year').textContent = new Date().getFullYear();
  initPrefs();
  bindBrowse();
  // A forced close (e.g. a repeated Esc that skips 'cancel') still has to leave the #/car/ route.
  $('#dlg-car').addEventListener('close', () => {
    if (stage?.host?.closest('#dlg-car')) stage.unmount();
    if (!S.closing && location.hash.startsWith('#/car/')) location.replace('#/browse');
    S.closing = false;
    setTimeout(mountHero, 0);
  });
  $('#dlg-car').addEventListener('cancel', e => { e.preventDefault(); closeCarDialog(); });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installPrompt = e; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

  applyI18n();
  try {
    S.status = await api('status');
    S.cars = (await api('catalog')).cars || [];
  } catch {
    showSetup();
    return;
  }
  S.token = local.get('token', null);
  if (S.token) {
    try { S.user = (await api('auth/me')).user; } catch { S.token = null; local.del('token'); }
  }
  window.addEventListener('hashchange', route);
  if (S.user) await enterApp();
  else {
    document.body.classList.add('gated');
    renderAll();
    mountHero();
  }
}
boot();
