// LocalSold API (Cloudflare Pages Function). Storage: one KV namespace bound as STORE.
// Secret: OWNER_SETUP_CODE — whoever enters it first (while no owner exists) becomes the owner.
//
// KV keys
//   user:<email>       account { id, email, name, role, salt, hash, createdAt }
//   session:<token>    { email } (expires after 30 days)
//   catalog            { updatedAt, cars: [...] }   (falls back to the static catalog.json)
//   photo:<id>         uploaded JPEG bytes
//   order:<sortkey>    order record (sort key puts newest first)

const ROLES = ['customer', 'admin', 'owner'];
const ORDER_STATUSES = ['new', 'confirmed', 'completed', 'cancelled'];
const INSURANCE_PER_DAY = 19;
const APR = 0.059;
const DAY = 86400000;
const SESSION_TTL = 60 * 60 * 24 * 30;

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});
const fail = (status, error) => { throw json({ error }, status); };

const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...bytes));
const randomId = (n = 16) => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');

// Workers cap PBKDF2 at 100k iterations.
async function hashPassword(password, saltB64) {
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return { salt: b64(salt), hash: b64(new Uint8Array(bits)) };
}
function sameText(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

const publicUser = u => u && ({ email: u.email, name: u.name, role: u.role, createdAt: u.createdAt });
const isStaff = u => u && (u.role === 'admin' || u.role === 'owner');
const cleanEmail = e => String(e || '').trim().toLowerCase();

async function body(request) {
  try { return await request.json(); } catch { return fail(400, 'bad_json'); }
}

async function currentUser(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const session = await env.STORE.get('session:' + token, 'json');
  if (!session) return null;
  const user = await env.STORE.get('user:' + session.email, 'json');
  return user ? { ...user, token } : null;
}
const needUser = u => u || fail(401, 'login_required');
const needStaff = u => (isStaff(needUser(u)) ? u : fail(403, 'staff_only'));
const needOwner = u => (needUser(u).role === 'owner' ? u : fail(403, 'owner_only'));

async function startSession(env, email) {
  const token = randomId(24);
  await env.STORE.put('session:' + token, JSON.stringify({ email }), { expirationTtl: SESSION_TTL });
  return token;
}

async function ownerExists(env) {
  return (await env.STORE.get('meta:owner')) != null;
}

async function loadCatalog(env, request) {
  const saved = await env.STORE.get('catalog', 'json');
  if (saved) return saved;
  const res = await env.ASSETS.fetch(new URL('/catalog.json', request.url));
  const seed = res.ok ? await res.json() : { cars: [] };
  return { updatedAt: 0, cars: seed.cars || [] };
}
async function saveCatalog(env, catalog) {
  catalog.updatedAt = Date.now();
  await env.STORE.put('catalog', JSON.stringify(catalog));
}

function cleanCar(input, id) {
  const str = (v, max = 80) => String(v ?? '').trim().slice(0, max);
  const n = (v, max) => Math.max(0, Math.min(max, Number(v) || 0));
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const car = {
    id, make: str(input.make), model: str(input.model), year: Math.round(n(input.year, 2100)) || new Date().getFullYear(),
    body: pick(input.body, ['sedan', 'suv', 'sports', 'hatch', 'pickup', 'van'], 'sedan'),
    fuel: pick(input.fuel, ['gas', 'diesel', 'hybrid', 'ev'], 'gas'),
    seats: Math.round(n(input.seats, 20)) || 5, transmission: pick(input.transmission, ['auto', 'manual'], 'auto'),
    hp: Math.round(n(input.hp, 3000)), rangeKm: Math.round(n(input.rangeKm, 3000)),
    rentPerDay: n(input.rentPerDay, 100000), price: n(input.price, 100000000),
    forRent: !!input.forRent, forSale: !!input.forSale, available: !!input.available,
    rating: Math.min(5, n(input.rating, 5)) || 5, trips: Math.round(n(input.trips, 1e7)),
    colors: (Array.isArray(input.colors) ? input.colors : []).filter(c => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 8),
    description: str(input.description, 1200),
    photos: (Array.isArray(input.photos) ? input.photos : []).filter(p => /^(api\/photos\/[a-f0-9]{32}|photos\/[\w.-]+)$/.test(p)).slice(0, 30),
  };
  if (!car.make || !car.model) fail(400, 'make_model_required');
  if (!car.colors.length) car.colors = ['#c8ccd2'];
  return car;
}

// Prices are worked out here from the catalog, never trusted from the browser.
function priceOrder(car, o) {
  if (o.kind === 'rent') {
    if (!car.forRent) fail(400, 'not_for_rent');
    const from = Date.parse(o.from), to = Date.parse(o.to);
    if (!from || !to || to <= from) fail(400, 'bad_dates');
    const days = Math.max(1, Math.round((to - from) / DAY));
    if (days > 365) fail(400, 'bad_dates');
    const total = car.rentPerDay * days + (o.insurance ? INSURANCE_PER_DAY * days : 0);
    return { days, totalUsd: total, dueUsd: total };
  }
  if (!car.forSale) fail(400, 'not_for_sale');
  if (o.payFull) return { totalUsd: car.price, dueUsd: car.price };
  const downPct = Math.max(10, Math.min(60, Number(o.downPct) || 20));
  const term = [24, 36, 48, 60, 72].includes(Number(o.term)) ? Number(o.term) : 60;
  const down = Math.round(car.price * downPct / 100);
  const r = APR / 12, principal = car.price - down;
  const monthly = principal > 0 ? principal * r / (1 - Math.pow(1 + r, -term)) : 0;
  return { totalUsd: car.price, dueUsd: down, downPct, term, monthlyUsd: Math.round(monthly) };
}

async function listOrders(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix: 'order:', cursor });
    const rows = await Promise.all(page.keys.map(k => env.STORE.get(k.name, 'json')));
    out.push(...rows.filter(Boolean));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && out.length < 2000);
  return out;
}

async function route(method, path, request, env) {
  const user = await currentUser(request, env);
  const [a, b] = path.split('/');

  if (method === 'GET' && path === 'status') {
    return json({ ok: true, ownerExists: await ownerExists(env), ownerCodeSet: !!env.OWNER_SETUP_CODE });
  }

  // Accounts
  if (method === 'POST' && path === 'auth/signup') {
    const { name, email, password } = await body(request);
    const e = cleanEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail(400, 'bad_email');
    if (String(password || '').length < 8) fail(400, 'password_short');
    if (!String(name || '').trim()) fail(400, 'name_required');
    if (await env.STORE.get('user:' + e)) fail(409, 'email_taken');
    const account = { id: randomId(8), email: e, name: String(name).trim().slice(0, 60), role: 'customer', createdAt: Date.now(), ...(await hashPassword(password)) };
    await env.STORE.put('user:' + e, JSON.stringify(account));
    return json({ token: await startSession(env, e), user: publicUser(account) });
  }
  if (method === 'POST' && path === 'auth/login') {
    const { email, password } = await body(request);
    const e = cleanEmail(email);
    const account = await env.STORE.get('user:' + e, 'json');
    const ok = account && sameText((await hashPassword(String(password || ''), account.salt)).hash, account.hash);
    if (!ok) fail(401, 'wrong_login');
    return json({ token: await startSession(env, e), user: publicUser(account) });
  }
  if (method === 'POST' && path === 'auth/logout') {
    if (user) await env.STORE.delete('session:' + user.token);
    return json({ ok: true });
  }
  if (method === 'GET' && path === 'auth/me') return json({ user: publicUser(needUser(user)) });
  if (method === 'POST' && path === 'auth/password') {
    needUser(user);
    const { oldPassword, newPassword } = await body(request);
    if (!sameText((await hashPassword(String(oldPassword || ''), user.salt)).hash, user.hash)) fail(401, 'wrong_login');
    if (String(newPassword || '').length < 8) fail(400, 'password_short');
    const { token, ...rest } = user;
    await env.STORE.put('user:' + user.email, JSON.stringify({ ...rest, ...(await hashPassword(newPassword)) }));
    return json({ ok: true });
  }
  if (method === 'POST' && path === 'auth/claim-owner') {
    needUser(user);
    if (!env.OWNER_SETUP_CODE) fail(503, 'owner_code_not_set');
    if (await ownerExists(env)) fail(409, 'owner_exists');
    const { code } = await body(request);
    if (!sameText(code, env.OWNER_SETUP_CODE)) fail(403, 'wrong_code');
    const { token, ...rest } = user;
    await env.STORE.put('user:' + user.email, JSON.stringify({ ...rest, role: 'owner' }));
    await env.STORE.put('meta:owner', user.email);
    return json({ user: publicUser({ ...rest, role: 'owner' }) });
  }

  // Team (owner only)
  if (method === 'GET' && path === 'users') {
    needOwner(user);
    const out = [];
    let cursor;
    do {
      const page = await env.STORE.list({ prefix: 'user:', cursor });
      const rows = await Promise.all(page.keys.map(k => env.STORE.get(k.name, 'json')));
      out.push(...rows.filter(Boolean).map(publicUser));
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor && out.length < 5000);
    return json({ users: out.sort((x, y) => ROLES.indexOf(y.role) - ROLES.indexOf(x.role) || x.name.localeCompare(y.name)) });
  }
  if (method === 'PATCH' && a === 'users' && b) {
    needOwner(user);
    const target = await env.STORE.get('user:' + cleanEmail(decodeURIComponent(b)), 'json');
    if (!target) fail(404, 'not_found');
    if (target.role === 'owner') fail(400, 'cannot_change_owner');
    const { role } = await body(request);
    if (!['customer', 'admin'].includes(role)) fail(400, 'bad_role');
    await env.STORE.put('user:' + target.email, JSON.stringify({ ...target, role }));
    return json({ user: publicUser({ ...target, role }) });
  }

  // Catalog
  if (method === 'GET' && path === 'catalog') return json(await loadCatalog(env, request));
  if (method === 'PUT' && a === 'cars' && b) {
    needStaff(user);
    const catalog = await loadCatalog(env, request);
    const id = decodeURIComponent(b).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60) || randomId(4);
    const car = cleanCar(await body(request), id);
    const i = catalog.cars.findIndex(c => c.id === id);
    if (i >= 0) catalog.cars[i] = car; else catalog.cars.unshift(car);
    await saveCatalog(env, catalog);
    return json({ car, updatedAt: catalog.updatedAt });
  }
  if (method === 'DELETE' && a === 'cars' && b) {
    needStaff(user);
    const catalog = await loadCatalog(env, request);
    catalog.cars = catalog.cars.filter(c => c.id !== decodeURIComponent(b));
    await saveCatalog(env, catalog);
    return json({ ok: true });
  }

  // Photos
  if (method === 'POST' && path === 'photos') {
    needStaff(user);
    const type = request.headers.get('content-type') || '';
    if (!/^image\/(jpeg|png|webp)$/.test(type)) fail(415, 'image_only');
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 5 * 1024 * 1024) fail(413, 'too_big');
    const id = randomId(16);
    await env.STORE.put('photo:' + id, bytes, { metadata: { type } });
    return json({ url: 'api/photos/' + id });
  }
  if (method === 'GET' && a === 'photos' && /^[a-f0-9]{32}$/.test(b || '')) {
    const { value, metadata } = await env.STORE.getWithMetadata('photo:' + b, 'arrayBuffer');
    if (!value) return new Response('Not found', { status: 404 });
    return new Response(value, { headers: { 'content-type': metadata?.type || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  // Orders: rentals, reservations and purchases
  if (method === 'POST' && path === 'orders') {
    needUser(user);
    const o = await body(request);
    const catalog = await loadCatalog(env, request);
    const car = catalog.cars.find(c => c.id === o.carId);
    if (!car) fail(404, 'car_not_found');
    if (!car.available) fail(400, 'car_unavailable');
    if (!['rent', 'buy'].includes(o.kind)) fail(400, 'bad_kind');
    const priced = priceOrder(car, o);
    const now = Date.now();
    const id = (9e12 - now).toString(36).padStart(9, '0') + randomId(3);
    const order = {
      id, code: 'LS-' + randomId(3).toUpperCase(), status: 'new', createdAt: now, updatedAt: now,
      kind: o.kind, carId: car.id, car: `${car.make} ${car.model}`, carYear: car.year, photo: car.photos?.[0] || null, color: /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : null,
      from: o.kind === 'rent' ? String(o.from).slice(0, 10) : null, to: o.kind === 'rent' ? String(o.to).slice(0, 10) : null,
      insurance: o.kind === 'rent' && !!o.insurance, payFull: o.kind === 'buy' && !!o.payFull,
      method: ['card', 'wallet', 'cash'].includes(o.method) ? o.method : 'cash',
      phone: String(o.phone || '').slice(0, 40), note: String(o.note || '').slice(0, 500),
      customer: { name: user.name, email: user.email }, ...priced,
    };
    await env.STORE.put('order:' + id, JSON.stringify(order));
    return json({ order }, 201);
  }
  if (method === 'GET' && path === 'orders') {
    needUser(user);
    const all = await listOrders(env);
    return json({ orders: isStaff(user) ? all : all.filter(o => o.customer.email === user.email) });
  }
  if (method === 'PATCH' && a === 'orders' && b) {
    needUser(user);
    const key = 'order:' + b;
    const order = await env.STORE.get(key, 'json');
    if (!order) fail(404, 'not_found');
    const { status } = await body(request);
    if (!ORDER_STATUSES.includes(status)) fail(400, 'bad_status');
    const mine = order.customer.email === user.email;
    if (!isStaff(user) && !(mine && status === 'cancelled')) fail(403, 'staff_only');
    const updated = { ...order, status, updatedAt: Date.now(), handledBy: isStaff(user) ? user.name : order.handledBy };
    await env.STORE.put(key, JSON.stringify(updated));
    return json({ order: updated });
  }

  fail(404, 'not_found');
}

export async function onRequest({ request, env, params }) {
  if (!env.STORE) return json({ error: 'store_not_bound' }, 503);
  const path = (params.path || []).join('/');
  try {
    return await route(request.method, path, request, env);
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: 'server_error', detail: String(e && e.message || e) }, 500);
  }
}
