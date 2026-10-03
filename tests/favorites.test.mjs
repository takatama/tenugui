import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

// Test the real shared store and resource route without a browser or live KV.
// Production auth is retained, rather than substituting the DEV shortcut.
const cache = new Map();
function load(relativePath) {
  return compile(path.resolve(relativePath));
}
function compile(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(path.dirname(filename));
  cache.set(filename, module);
  const require = module.require.bind(module);
  module.require = (specifier) => {
    if (specifier.endsWith(".css")) return {};
    if (!specifier.startsWith(".")) return require(specifier);
    const base = path.resolve(path.dirname(filename), specifier);
    const dependency = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ].find((file) => existsSync(file) && /\.tsx?$/.test(file));
    return dependency ? compile(dependency) : require(specifier);
  };
  const source = readFileSync(filename, "utf8").replaceAll(
    "import.meta.env.DEV",
    "false",
  );
  const transformed = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  module._compile(transformed.outputText, filename);
  return module.exports;
}

const { createFavoritesStore } = load("app/hooks/useFavorites.ts");
const route = load("app/routes/api.favorites.tsx");
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}

function harness({
  authenticated = true,
  favorites = [],
  local = [],
  loadResponse,
} = {}) {
  let localFavorites = [...local];
  let localFailure = false;
  let currentLoader =
    loadResponse ||
    (() => Promise.resolve(Response.json({ authenticated, favorites })));
  const requests = [];
  const localWrites = [];
  const storageListeners = new Set();
  let getCount = 0;
  let readCount = 0;
  let localSubscriptions = 0;
  let localUnsubscriptions = 0;
  const environment = {
    fetch: (url, init = {}) => {
      assert.equal(url, "/api/favorites");
      assert.equal(init.credentials, "include");
      if (init.method !== "POST") {
        getCount++;
        return currentLoader();
      }
      const pending = deferred();
      requests.push({ payload: JSON.parse(init.body), ...pending });
      return pending.promise;
    },
    readLocal: () => {
      readCount++;
      return [...localFavorites];
    },
    writeLocal: (value) => {
      if (localFailure) throw new Error("Storage denied");
      localFavorites = [...value];
      localWrites.push([...value]);
    },
    subscribeLocal: (listener) => {
      localSubscriptions++;
      storageListeners.add(listener);
      return () => {
        localUnsubscriptions++;
        storageListeners.delete(listener);
      };
    },
  };
  const store = createFavoritesStore(() => environment);
  return {
    store,
    requests,
    localWrites,
    get getCount() {
      return getCount;
    },
    get readCount() {
      return readCount;
    },
    get localSubscriptions() {
      return localSubscriptions;
    },
    get localUnsubscriptions() {
      return localUnsubscriptions;
    },
    setLocalFailure: (value) => {
      localFailure = value;
    },
    setLoader: (value) => {
      currentLoader = value;
    },
    changeLocal: (value) => {
      localFavorites = [...value];
      storageListeners.forEach((listener) => listener());
    },
    complete: (index, status = 200, body) =>
      requests[index].resolve(
        Response.json(body ?? requests[index].payload, { status }),
      ),
  };
}

test("anonymous visitors keep browser favorites; sidebar and detail share one initialization and snapshot", async () => {
  const h = harness({ authenticated: false, local: ["local-a", "local-a"] });
  let sidebarUpdates = 0,
    detailUpdates = 0;
  const unsubscribeSidebar = h.store.subscribe(() => {
    sidebarUpdates++;
  });
  const unsubscribeDetail = h.store.subscribe(() => {
    detailUpdates++;
  });
  await h.store.initialize();
  assert.equal(h.getCount, 1);
  assert.equal(h.localSubscriptions, 1);
  assert.deepEqual(h.store.getSnapshot(), {
    favorites: ["local-a"],
    error: "",
    storageMode: "browser",
  });
  h.store.toggleFavorite("local-b");
  assert.deepEqual(h.store.getSnapshot().favorites, ["local-a", "local-b"]);
  assert.deepEqual(h.localWrites, [["local-a", "local-b"]]);
  assert.equal(h.requests.length, 0);
  assert.ok(sidebarUpdates > 0 && detailUpdates > 0);
  unsubscribeSidebar();
  assert.equal(h.localUnsubscriptions, 0);
  unsubscribeDetail();
  assert.equal(h.localUnsubscriptions, 1);
});

test("anonymous toggles persist both additions and removals; storage failure preserves previously saved choices", async () => {
  const h = harness({ authenticated: false, local: ["saved"] });
  await h.store.initialize();
  h.store.toggleFavorite("new");
  h.store.toggleFavorite("new");
  assert.deepEqual(h.localWrites, [["saved", "new"], ["saved"]]);
  h.setLocalFailure(true);
  h.store.toggleFavorite("saved");
  assert.deepEqual(h.store.getSnapshot().favorites, ["saved"]);
  assert.match(h.store.getSnapshot().error, /ブラウザ/);
  h.setLocalFailure(false);
  h.store.toggleFavorite("new");
  assert.deepEqual(h.store.getSnapshot().favorites, ["saved", "new"]);
  assert.equal(h.store.getSnapshot().error, "");
});

test("browser favorites refresh across tabs and after all subscribers return", async () => {
  const h = harness({ authenticated: false, local: ["first"] });
  const unsubscribe = h.store.subscribe(() => {});
  await h.store.initialize();
  h.changeLocal(["from-another-tab"]);
  assert.deepEqual(h.store.getSnapshot().favorites, ["from-another-tab"]);
  unsubscribe();
  h.changeLocal(["while-away"]);
  const unsubscribeAgain = h.store.subscribe(() => {});
  assert.deepEqual(h.store.getSnapshot().favorites, ["while-away"]);
  assert.equal(h.getCount, 1);
  unsubscribeAgain();
});

test("authenticated favorites come from KV and never import or overwrite anonymous browser selections", async () => {
  const h = harness({ favorites: ["cloud-a"], local: ["browser-only"] });
  const unsubscribe = h.store.subscribe(() => {});
  await h.store.initialize();
  assert.deepEqual(h.store.getSnapshot(), {
    favorites: ["cloud-a"],
    error: "",
    storageMode: "cloud",
  });
  assert.equal(h.readCount, 0);
  h.changeLocal(["changed-in-another-tab"]);
  assert.deepEqual(h.store.getSnapshot().favorites, ["cloud-a"]);
  h.store.toggleFavorite("cloud-b");
  h.complete(0);
  await tick();
  assert.deepEqual(h.store.getSnapshot().favorites, ["cloud-a", "cloud-b"]);
  assert.deepEqual(h.localWrites, []);
  unsubscribe();
});

test("a click while cloud favorites load survives the response and preserves other saved pieces", async () => {
  const pendingLoad = deferred();
  const h = harness({ loadResponse: () => pendingLoad.promise });
  const initialized = h.store.initialize();
  h.store.toggleFavorite("clicked-during-load");
  assert.deepEqual(h.store.getSnapshot().favorites, ["clicked-during-load"]);
  assert.equal(h.store.getSnapshot().storageMode, "loading");
  assert.equal(h.requests.length, 0);
  pendingLoad.resolve(
    Response.json({ authenticated: true, favorites: ["already-saved"] }),
  );
  await initialized;
  assert.deepEqual(h.store.getSnapshot().favorites, [
    "already-saved",
    "clicked-during-load",
  ]);
  assert.deepEqual(
    h.requests.map((request) => request.payload),
    [{ itemId: "clicked-during-load", favorite: true }],
  );
  h.complete(0);
  await tick();
  assert.deepEqual(h.store.getSnapshot().favorites, [
    "already-saved",
    "clicked-during-load",
  ]);
});

test("rapid add/remove clicks serialize each piece and finish at the most recent requested state", async () => {
  const h = harness();
  await h.store.initialize();
  h.store.toggleFavorite("a");
  h.store.toggleFavorite("a");
  assert.deepEqual(h.store.getSnapshot().favorites, []);
  assert.deepEqual(
    h.requests.map((request) => request.payload),
    [{ itemId: "a", favorite: true }],
  );
  h.complete(0);
  await tick();
  assert.deepEqual(
    h.requests.map((request) => request.payload),
    [
      { itemId: "a", favorite: true },
      { itemId: "a", favorite: false },
    ],
  );
  assert.deepEqual(h.store.getSnapshot().favorites, []);
  h.complete(1);
  await tick();
  assert.deepEqual(h.store.getSnapshot(), {
    favorites: [],
    error: "",
    storageMode: "cloud",
  });
  h.store.toggleFavorite("a");
  h.store.toggleFavorite("a");
  h.store.toggleFavorite("a");
  assert.equal(h.requests.length, 3);
  h.complete(2);
  await tick();
  assert.equal(h.requests.length, 3);
  assert.deepEqual(h.store.getSnapshot().favorites, ["a"]);
});

test("a failed save rolls back only that piece, preserving independent successful changes", async () => {
  const h = harness({ favorites: ["saved"] });
  await h.store.initialize();
  h.store.toggleFavorite("a");
  h.store.toggleFavorite("b");
  assert.equal(h.requests.length, 2);
  h.complete(1);
  h.complete(0, 503, { error: "Storage unavailable" });
  await tick();
  assert.deepEqual(h.store.getSnapshot().favorites, ["saved", "b"]);
  assert.match(h.store.getSnapshot().error, /保存できません/);
  assert.deepEqual(h.localWrites, []);
});

test("an old failed request cannot remove a newer click that matches the saved state", async () => {
  const h = harness({ favorites: ["a"] });
  await h.store.initialize();
  h.store.toggleFavorite("a");
  h.store.toggleFavorite("a");
  h.complete(0, 503, { error: "Failed old removal" });
  await tick();
  assert.deepEqual(h.store.getSnapshot().favorites, ["a"]);
  assert.equal(h.requests.length, 1);
});

test("failed initialization never silently falls back to browser storage or overwrites cloud data; it can retry", async () => {
  const h = harness({
    local: ["browser-only"],
    loadResponse: () => Promise.reject(new Error("Offline")),
  });
  h.store.toggleFavorite("not-yet-saved");
  await h.store.initialize();
  assert.equal(h.store.getSnapshot().storageMode, "loading");
  assert.deepEqual(h.store.getSnapshot().favorites, []);
  assert.match(h.store.getSnapshot().error, /読み込めません/);
  assert.equal(h.readCount, 0);
  assert.deepEqual(h.localWrites, []);
  assert.equal(h.requests.length, 0);
  h.setLoader(() =>
    Promise.resolve(
      Response.json({ authenticated: true, favorites: ["cloud"] }),
    ),
  );
  await h.store.initialize();
  assert.equal(h.getCount, 2);
  assert.deepEqual(h.store.getSnapshot(), {
    favorites: ["cloud"],
    error: "",
    storageMode: "cloud",
  });
});

test("expired authentication and malformed save acknowledgements do not mark an unconfirmed selection as saved", async () => {
  for (const [status, response] of [
    [401, { error: "Unauthorized" }],
    [200, { itemId: "wrong-piece", favorite: true }],
  ]) {
    const h = harness({ favorites: ["saved"] });
    await h.store.initialize();
    h.store.toggleFavorite("a");
    h.complete(0, status, response);
    await tick();
    assert.deepEqual(h.store.getSnapshot().favorites, ["saved"]);
    assert.match(h.store.getSnapshot().error, /保存できません/);
    assert.deepEqual(h.localWrites, []);
  }
});

class FakeKV {
  constructor(entries = {}, pageSize = 100) {
    this.store = new Map(
      Object.entries(entries).map(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]),
    );
    this.writes = [];
    this.deletes = [];
    this.pageSize = pageSize;
    this.listCalls = 0;
    this.failMutation = false;
  }
  async get(key, type) {
    const value = this.store.get(key) ?? null;
    return value === null || type !== "json" ? value : JSON.parse(value);
  }
  async put(key, value) {
    if (this.failMutation) throw new Error("KV unavailable");
    this.store.set(key, value);
    this.writes.push(key);
  }
  async delete(key) {
    if (this.failMutation) throw new Error("KV unavailable");
    this.store.delete(key);
    this.deletes.push(key);
  }
  async list({ prefix, cursor, limit }) {
    this.listCalls++;
    const keys = [...this.store.keys()]
      .filter((key) => key.startsWith(prefix))
      .sort();
    const start = Number(cursor || 0);
    const end = Math.min(keys.length, start + Math.min(limit, this.pageSize));
    return {
      keys: keys.slice(start, end).map((name) => ({ name })),
      list_complete: end === keys.length,
      cursor: end === keys.length ? "" : String(end),
    };
  }
}

const items = ["a", "b"].map((id) => ({
  id,
  name: `一枚${id}`,
  imageUrl: `https://example.com/${id}.jpg`,
  tags: [],
  memo: "思い出",
  status: "purchased",
}));
function context(kv, authenticated = true) {
  return {
    cloudflare: {
      env: {
        TENUGUI_KV: kv,
        SESSIONS: new FakeKV(
          authenticated
            ? {
                "session:owner": {
                  user: { email: "owner@example.com" },
                  expires: Date.now() + 60000,
                },
              }
            : {},
        ),
      },
    },
  };
}
function request({ payload, authenticated = true, headers = {}, method } = {}) {
  return new Request("https://gallery.example/api/favorites", {
    method: method || (payload === undefined ? "GET" : "POST"),
    body: payload === undefined ? undefined : JSON.stringify(payload),
    headers: {
      Origin: "https://gallery.example",
      "Content-Type": "application/json",
      ...(authenticated ? { Cookie: "session=owner" } : {}),
      ...headers,
    },
  });
}

test("anonymous API reads reveal no KV favorites and authenticated reads paginate and skip shelved pieces", async () => {
  const kv = new FakeKV(
    {
      items,
      "favorite:a": "1",
      "favorite:b": "1",
      "favorite:shelved": "1",
      "unrelated:secret": "private",
    },
    1,
  );
  const anonymous = await route.loader({
    request: request({ authenticated: false }),
    context: context(kv, false),
  });
  assert.deepEqual(await anonymous.json(), {
    authenticated: false,
    favorites: [],
  });
  assert.equal(anonymous.headers.get("Cache-Control"), "no-store");
  assert.equal(kv.listCalls, 0);
  const authenticated = await route.loader({
    request: request(),
    context: context(kv),
  });
  assert.deepEqual(await authenticated.json(), {
    authenticated: true,
    favorites: ["a", "b"],
  });
  assert.equal(kv.listCalls, 3);
  assert.deepEqual(kv.writes, []);
});

test("favorite mutations require a production session and same browser origin", async () => {
  const kv = new FakeKV({ items });
  await assert.rejects(
    route.action({
      request: request({
        authenticated: false,
        payload: { itemId: "a", favorite: true },
      }),
      context: context(kv, false),
    }),
    (error) => error instanceof Response && error.status === 401,
  );
  await assert.rejects(
    route.action({
      request: request({
        payload: { itemId: "a", favorite: true },
        headers: { Origin: "https://evil.example" },
      }),
      context: context(kv),
    }),
    (error) => error instanceof Response && error.status === 403,
  );
  assert.deepEqual(kv.writes, []);
});

test("favorite mutations validate payloads and known item IDs before writing any key", async () => {
  const kv = new FakeKV({ items });
  for (const [payload, status] of [
    [{ itemId: "a", favorite: "true" }, 400],
    [{ itemId: "", favorite: true }, 400],
    [{ itemId: "x".repeat(201), favorite: true }, 400],
    [null, 400],
    [{ itemId: "../items", favorite: true }, 404],
  ]) {
    const response = await route.action({
      request: request({ payload }),
      context: context(kv),
    });
    assert.equal(response.status, status);
  }
  const malformed = new Request("https://gallery.example/api/favorites", {
    method: "POST",
    body: "{",
    headers: {
      Origin: "https://gallery.example",
      Cookie: "session=owner",
      "Content-Type": "application/json",
    },
  });
  assert.equal(
    (await route.action({ request: malformed, context: context(kv) })).status,
    400,
  );
  assert.deepEqual(kv.writes, []);
  assert.deepEqual(kv.deletes, []);
});

test("independent pieces use individual keys; repeated requests are idempotent and never change collection records", async () => {
  const kv = new FakeKV({ items });
  const before = await kv.get("items");
  await Promise.all(
    ["a", "b"].map((itemId) =>
      route.action({
        request: request({ payload: { itemId, favorite: true } }),
        context: context(kv),
      }),
    ),
  );
  await route.action({
    request: request({ payload: { itemId: "a", favorite: true } }),
    context: context(kv),
  });
  assert.equal(await kv.get("favorite:a"), "1");
  assert.equal(await kv.get("favorite:b"), "1");
  const removed = await route.action({
    request: request({ payload: { itemId: "a", favorite: false } }),
    context: context(kv),
  });
  assert.deepEqual(await removed.json(), { itemId: "a", favorite: false });
  assert.equal(await kv.get("favorite:a"), null);
  assert.equal(await kv.get("favorite:b"), "1");
  assert.equal(await kv.get("items"), before);
  assert.deepEqual(kv.deletes, ["favorite:a"]);
});

test("KV failures report retryable errors without falsely acknowledging a saved favorite", async () => {
  const kv = new FakeKV({ items, "favorite:a": "1" });
  kv.failMutation = true;
  for (const payload of [
    { itemId: "b", favorite: true },
    { itemId: "a", favorite: false },
  ]) {
    const response = await route.action({
      request: request({ payload }),
      context: context(kv),
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /保存できません/);
  }
  assert.equal(await kv.get("favorite:a"), "1");
  assert.equal(await kv.get("favorite:b"), null);
  assert.deepEqual(kv.writes, []);
  assert.deepEqual(kv.deletes, []);
});
