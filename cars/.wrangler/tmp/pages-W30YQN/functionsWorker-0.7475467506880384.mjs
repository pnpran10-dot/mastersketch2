var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/[[path]].js
var ROLES = ["customer", "admin", "owner"];
var ORDER_STATUSES = ["new", "confirmed", "completed", "cancelled"];
var INSURANCE_PER_DAY = 19;
var APR = 0.059;
var DAY = 864e5;
var SESSION_TTL = 60 * 60 * 24 * 30;
var json = /* @__PURE__ */ __name((data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
}), "json");
var fail = /* @__PURE__ */ __name((status, error) => {
  throw json({ error }, status);
}, "fail");
var enc = new TextEncoder();
var b64 = /* @__PURE__ */ __name((bytes) => btoa(String.fromCharCode(...bytes)), "b64");
var randomId = /* @__PURE__ */ __name((n = 16) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join(""), "randomId");
async function hashPassword(password, saltB64) {
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" }, key, 256);
  return { salt: b64(salt), hash: b64(new Uint8Array(bits)) };
}
__name(hashPassword, "hashPassword");
function sameText(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}
__name(sameText, "sameText");
var publicUser = /* @__PURE__ */ __name((u) => u && { email: u.email, name: u.name, role: u.role, createdAt: u.createdAt }, "publicUser");
var isStaff = /* @__PURE__ */ __name((u) => u && (u.role === "admin" || u.role === "owner"), "isStaff");
var cleanEmail = /* @__PURE__ */ __name((e) => String(e || "").trim().toLowerCase(), "cleanEmail");
async function body(request) {
  try {
    return await request.json();
  } catch {
    return fail(400, "bad_json");
  }
}
__name(body, "body");
async function currentUser(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token)
    return null;
  const session = await env.STORE.get("session:" + token, "json");
  if (!session)
    return null;
  const user = await env.STORE.get("user:" + session.email, "json");
  return user ? { ...user, token } : null;
}
__name(currentUser, "currentUser");
var needUser = /* @__PURE__ */ __name((u) => u || fail(401, "login_required"), "needUser");
var needStaff = /* @__PURE__ */ __name((u) => isStaff(needUser(u)) ? u : fail(403, "staff_only"), "needStaff");
var needOwner = /* @__PURE__ */ __name((u) => needUser(u).role === "owner" ? u : fail(403, "owner_only"), "needOwner");
async function startSession(env, email) {
  const token = randomId(24);
  await env.STORE.put("session:" + token, JSON.stringify({ email }), { expirationTtl: SESSION_TTL });
  return token;
}
__name(startSession, "startSession");
async function ownerExists(env) {
  return await env.STORE.get("meta:owner") != null;
}
__name(ownerExists, "ownerExists");
async function loadCatalog(env, request) {
  const saved = await env.STORE.get("catalog", "json");
  if (saved)
    return saved;
  const res = await env.ASSETS.fetch(new URL("/catalog.json", request.url));
  const seed = res.ok ? await res.json() : { cars: [] };
  return { updatedAt: 0, cars: seed.cars || [] };
}
__name(loadCatalog, "loadCatalog");
async function saveCatalog(env, catalog) {
  catalog.updatedAt = Date.now();
  await env.STORE.put("catalog", JSON.stringify(catalog));
}
__name(saveCatalog, "saveCatalog");
function cleanCar(input, id) {
  const str = /* @__PURE__ */ __name((v, max = 80) => String(v ?? "").trim().slice(0, max), "str");
  const n = /* @__PURE__ */ __name((v, max) => Math.max(0, Math.min(max, Number(v) || 0)), "n");
  const pick = /* @__PURE__ */ __name((v, list, d) => list.includes(v) ? v : d, "pick");
  const car = {
    id,
    make: str(input.make),
    model: str(input.model),
    year: Math.round(n(input.year, 2100)) || (/* @__PURE__ */ new Date()).getFullYear(),
    body: pick(input.body, ["sedan", "suv", "sports", "hatch", "pickup", "van"], "sedan"),
    fuel: pick(input.fuel, ["gas", "diesel", "hybrid", "ev"], "gas"),
    seats: Math.round(n(input.seats, 20)) || 5,
    transmission: pick(input.transmission, ["auto", "manual"], "auto"),
    hp: Math.round(n(input.hp, 3e3)),
    rangeKm: Math.round(n(input.rangeKm, 3e3)),
    rentPerDay: n(input.rentPerDay, 1e5),
    price: n(input.price, 1e8),
    forRent: !!input.forRent,
    forSale: !!input.forSale,
    available: !!input.available,
    rating: Math.min(5, n(input.rating, 5)) || 5,
    trips: Math.round(n(input.trips, 1e7)),
    colors: (Array.isArray(input.colors) ? input.colors : []).filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 8),
    description: str(input.description, 1200),
    photos: (Array.isArray(input.photos) ? input.photos : []).filter((p) => /^(api\/photos\/[a-f0-9]{32}|photos\/[\w.-]+)$/.test(p)).slice(0, 30)
  };
  if (!car.make || !car.model)
    fail(400, "make_model_required");
  if (!car.colors.length)
    car.colors = ["#c8ccd2"];
  return car;
}
__name(cleanCar, "cleanCar");
function priceOrder(car, o) {
  if (o.kind === "rent") {
    if (!car.forRent)
      fail(400, "not_for_rent");
    const from = Date.parse(o.from), to = Date.parse(o.to);
    if (!from || !to || to <= from)
      fail(400, "bad_dates");
    const days = Math.max(1, Math.round((to - from) / DAY));
    if (days > 365)
      fail(400, "bad_dates");
    const total = car.rentPerDay * days + (o.insurance ? INSURANCE_PER_DAY * days : 0);
    return { days, totalUsd: total, dueUsd: total };
  }
  if (!car.forSale)
    fail(400, "not_for_sale");
  if (o.payFull)
    return { totalUsd: car.price, dueUsd: car.price };
  const downPct = Math.max(10, Math.min(60, Number(o.downPct) || 20));
  const term = [24, 36, 48, 60, 72].includes(Number(o.term)) ? Number(o.term) : 60;
  const down = Math.round(car.price * downPct / 100);
  const r = APR / 12, principal = car.price - down;
  const monthly = principal > 0 ? principal * r / (1 - Math.pow(1 + r, -term)) : 0;
  return { totalUsd: car.price, dueUsd: down, downPct, term, monthlyUsd: Math.round(monthly) };
}
__name(priceOrder, "priceOrder");
async function listOrders(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix: "order:", cursor });
    const rows = await Promise.all(page.keys.map((k) => env.STORE.get(k.name, "json")));
    out.push(...rows.filter(Boolean));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && out.length < 2e3);
  return out;
}
__name(listOrders, "listOrders");
async function route(method, path, request, env) {
  const user = await currentUser(request, env);
  const [a, b] = path.split("/");
  if (method === "GET" && path === "status") {
    return json({ ok: true, ownerExists: await ownerExists(env), ownerCodeSet: !!env.OWNER_SETUP_CODE });
  }
  if (method === "POST" && path === "auth/signup") {
    const { name, email, password } = await body(request);
    const e = cleanEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      fail(400, "bad_email");
    if (String(password || "").length < 8)
      fail(400, "password_short");
    if (!String(name || "").trim())
      fail(400, "name_required");
    if (await env.STORE.get("user:" + e))
      fail(409, "email_taken");
    const account = { id: randomId(8), email: e, name: String(name).trim().slice(0, 60), role: "customer", createdAt: Date.now(), ...await hashPassword(password) };
    await env.STORE.put("user:" + e, JSON.stringify(account));
    return json({ token: await startSession(env, e), user: publicUser(account) });
  }
  if (method === "POST" && path === "auth/login") {
    const { email, password } = await body(request);
    const e = cleanEmail(email);
    const account = await env.STORE.get("user:" + e, "json");
    const ok = account && sameText((await hashPassword(String(password || ""), account.salt)).hash, account.hash);
    if (!ok)
      fail(401, "wrong_login");
    return json({ token: await startSession(env, e), user: publicUser(account) });
  }
  if (method === "POST" && path === "auth/logout") {
    if (user)
      await env.STORE.delete("session:" + user.token);
    return json({ ok: true });
  }
  if (method === "GET" && path === "auth/me")
    return json({ user: publicUser(needUser(user)) });
  if (method === "POST" && path === "auth/password") {
    needUser(user);
    const { oldPassword, newPassword } = await body(request);
    if (!sameText((await hashPassword(String(oldPassword || ""), user.salt)).hash, user.hash))
      fail(401, "wrong_login");
    if (String(newPassword || "").length < 8)
      fail(400, "password_short");
    const { token, ...rest } = user;
    await env.STORE.put("user:" + user.email, JSON.stringify({ ...rest, ...await hashPassword(newPassword) }));
    return json({ ok: true });
  }
  if (method === "POST" && path === "auth/claim-owner") {
    needUser(user);
    if (!env.OWNER_SETUP_CODE)
      fail(503, "owner_code_not_set");
    if (await ownerExists(env))
      fail(409, "owner_exists");
    const { code } = await body(request);
    if (!sameText(code, env.OWNER_SETUP_CODE))
      fail(403, "wrong_code");
    const { token, ...rest } = user;
    await env.STORE.put("user:" + user.email, JSON.stringify({ ...rest, role: "owner" }));
    await env.STORE.put("meta:owner", user.email);
    return json({ user: publicUser({ ...rest, role: "owner" }) });
  }
  if (method === "GET" && path === "users") {
    needOwner(user);
    const out = [];
    let cursor;
    do {
      const page = await env.STORE.list({ prefix: "user:", cursor });
      const rows = await Promise.all(page.keys.map((k) => env.STORE.get(k.name, "json")));
      out.push(...rows.filter(Boolean).map(publicUser));
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor && out.length < 5e3);
    return json({ users: out.sort((x, y) => ROLES.indexOf(y.role) - ROLES.indexOf(x.role) || x.name.localeCompare(y.name)) });
  }
  if (method === "PATCH" && a === "users" && b) {
    needOwner(user);
    const target = await env.STORE.get("user:" + cleanEmail(decodeURIComponent(b)), "json");
    if (!target)
      fail(404, "not_found");
    if (target.role === "owner")
      fail(400, "cannot_change_owner");
    const { role } = await body(request);
    if (!["customer", "admin"].includes(role))
      fail(400, "bad_role");
    await env.STORE.put("user:" + target.email, JSON.stringify({ ...target, role }));
    return json({ user: publicUser({ ...target, role }) });
  }
  if (method === "GET" && path === "catalog")
    return json(await loadCatalog(env, request));
  if (method === "PUT" && a === "cars" && b) {
    needStaff(user);
    const catalog = await loadCatalog(env, request);
    const id = decodeURIComponent(b).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60) || randomId(4);
    const car = cleanCar(await body(request), id);
    const i = catalog.cars.findIndex((c) => c.id === id);
    if (i >= 0)
      catalog.cars[i] = car;
    else
      catalog.cars.unshift(car);
    await saveCatalog(env, catalog);
    return json({ car, updatedAt: catalog.updatedAt });
  }
  if (method === "DELETE" && a === "cars" && b) {
    needStaff(user);
    const catalog = await loadCatalog(env, request);
    catalog.cars = catalog.cars.filter((c) => c.id !== decodeURIComponent(b));
    await saveCatalog(env, catalog);
    return json({ ok: true });
  }
  if (method === "POST" && path === "photos") {
    needStaff(user);
    const type = request.headers.get("content-type") || "";
    if (!/^image\/(jpeg|png|webp)$/.test(type))
      fail(415, "image_only");
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 5 * 1024 * 1024)
      fail(413, "too_big");
    const id = randomId(16);
    await env.STORE.put("photo:" + id, bytes, { metadata: { type } });
    return json({ url: "api/photos/" + id });
  }
  if (method === "GET" && a === "photos" && /^[a-f0-9]{32}$/.test(b || "")) {
    const { value, metadata } = await env.STORE.getWithMetadata("photo:" + b, "arrayBuffer");
    if (!value)
      return new Response("Not found", { status: 404 });
    return new Response(value, { headers: { "content-type": metadata?.type || "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
  }
  if (method === "POST" && path === "orders") {
    needUser(user);
    const o = await body(request);
    const catalog = await loadCatalog(env, request);
    const car = catalog.cars.find((c) => c.id === o.carId);
    if (!car)
      fail(404, "car_not_found");
    if (!car.available)
      fail(400, "car_unavailable");
    if (!["rent", "buy"].includes(o.kind))
      fail(400, "bad_kind");
    const priced = priceOrder(car, o);
    const now = Date.now();
    const id = (9e12 - now).toString(36).padStart(9, "0") + randomId(3);
    const order = {
      id,
      code: "LS-" + randomId(3).toUpperCase(),
      status: "new",
      createdAt: now,
      updatedAt: now,
      kind: o.kind,
      carId: car.id,
      car: `${car.make} ${car.model}`,
      carYear: car.year,
      photo: car.photos?.[0] || null,
      color: /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : null,
      from: o.kind === "rent" ? String(o.from).slice(0, 10) : null,
      to: o.kind === "rent" ? String(o.to).slice(0, 10) : null,
      insurance: o.kind === "rent" && !!o.insurance,
      payFull: o.kind === "buy" && !!o.payFull,
      method: ["card", "wallet", "cash"].includes(o.method) ? o.method : "cash",
      phone: String(o.phone || "").slice(0, 40),
      note: String(o.note || "").slice(0, 500),
      customer: { name: user.name, email: user.email },
      ...priced
    };
    await env.STORE.put("order:" + id, JSON.stringify(order));
    return json({ order }, 201);
  }
  if (method === "GET" && path === "orders") {
    needUser(user);
    const all = await listOrders(env);
    return json({ orders: isStaff(user) ? all : all.filter((o) => o.customer.email === user.email) });
  }
  if (method === "PATCH" && a === "orders" && b) {
    needUser(user);
    const key = "order:" + b;
    const order = await env.STORE.get(key, "json");
    if (!order)
      fail(404, "not_found");
    const { status } = await body(request);
    if (!ORDER_STATUSES.includes(status))
      fail(400, "bad_status");
    const mine = order.customer.email === user.email;
    if (!isStaff(user) && !(mine && status === "cancelled"))
      fail(403, "staff_only");
    const updated = { ...order, status, updatedAt: Date.now(), handledBy: isStaff(user) ? user.name : order.handledBy };
    await env.STORE.put(key, JSON.stringify(updated));
    return json({ order: updated });
  }
  fail(404, "not_found");
}
__name(route, "route");
async function onRequest({ request, env, params }) {
  if (!env.STORE)
    return json({ error: "store_not_bound" }, 503);
  const path = (params.path || []).join("/");
  try {
    return await route(request.method, path, request, env);
  } catch (e) {
    if (e instanceof Response)
      return e;
    return json({ error: "server_error", detail: String(e && e.message || e) }, 500);
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-W30YQN/functionsRoutes-0.6956583581768268.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../../../tmp/claude-0/-home-user/8fd939a0-d296-5de1-9f70-17b59a682cf1/scratchpad/wr/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route2 = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route2 += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route2 += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route2 += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route2 += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route2 += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route2 += "".concat(delimiterRe, "?");
    route2 += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route2 += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route2 += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route2, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../tmp/claude-0/-home-user/8fd939a0-d296-5de1-9f70-17b59a682cf1/scratchpad/wr/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route2 of [...routes].reverse()) {
    if (route2.method && route2.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route2.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route2.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route2.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route2 of routes) {
    if (route2.method && route2.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route2.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route2.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route2.modules.length) {
      for (const handler of route2.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../tmp/claude-0/-home-user/8fd939a0-d296-5de1-9f70-17b59a682cf1/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../tmp/claude-0/-home-user/8fd939a0-d296-5de1-9f70-17b59a682cf1/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-mqd2lg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../tmp/claude-0/-home-user/8fd939a0-d296-5de1-9f70-17b59a682cf1/scratchpad/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-mqd2lg/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.7475467506880384.mjs.map
