import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const filename = path.resolve("app/lib/pwaUpdates.ts");
const compiled = new Module(filename);
compiled._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { createPwaUpdateController } = compiled.exports;

class Worker extends EventTarget {
  state = "installed";
  messages = [];
  postMessage(message) { this.messages.push(message); }
  change(state) { this.state = state; this.dispatchEvent(new Event("statechange")); }
}
function client({ firstInstall = false, waiting = null, initialOffline = false } = {}) {
  const initial = firstInstall ? null : new Worker();
  const registration = Object.assign(new EventTarget(), {
    active: initial, waiting, installing: null, checks: 0,
    offline: false,
    async update() { this.checks++; if (this.offline) throw new Error("Offline"); },
  });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: initial, calls: [], offline: initialOffline,
    async register(...args) {
      this.calls.push(args);
      if (this.offline) throw new Error("Offline");
      return registration;
    },
  });
  const timers = new Map();
  const window = Object.assign(new EventTarget(), {
    setTimeout(callback) { timers.set(timers.size + 1, callback); return timers.size; },
    clearTimeout(id) { timers.delete(id); },
  });
  const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const state = { blocked: false, reloads: 0, now: 0, snapshots: [] };
  const controller = createPwaUpdateController({
    serviceWorker, window, document,
    canReload: () => !state.blocked,
    reload: () => state.reloads++,
    onState: (value) => state.snapshots.push(value),
    now: () => state.now,
  });
  return {
    registration, serviceWorker, window, document, state, controller, timers,
    last: () => state.snapshots.at(-1),
    activate(worker) {
      registration.active = worker; registration.waiting = null;
      serviceWorker.controller = worker;
      worker.change("activated");
      serviceWorker.dispatchEvent(new Event("controllerchange"));
    },
  };
}

test("first installation and claiming a page do not offer or trigger a reload", async () => {
  const app = client({ firstInstall: true });
  await app.controller.ready;
  const first = new Worker(); first.state = "installing";
  app.registration.installing = first;
  app.registration.dispatchEvent(new Event("updatefound"));
  first.change("installed");
  app.activate(first);
  assert.equal(app.state.reloads, 0);
  assert.equal(app.last()?.available ?? false, false);
  assert.deepEqual(first.messages, []);
  assert.deepEqual(app.serviceWorker.calls, [["/sw.js", { updateViaCache: "none" }]]);
  app.controller.dispose();
});

test("a waiting update needs explicit consent and reloads its consenting tab exactly once", async () => {
  const update = new Worker();
  const app = client({ waiting: update });
  await app.controller.ready;
  assert.equal(app.last().available, true);
  assert.equal(app.state.reloads, 0);
  assert.deepEqual(update.messages, []);
  app.controller.apply(); app.controller.apply();
  assert.deepEqual(update.messages, [{ type: "SKIP_WAITING" }]);
  assert.equal(app.last().applying, true);
  app.activate(update);
  app.serviceWorker.dispatchEvent(new Event("controllerchange"));
  app.controller.apply();
  assert.equal(app.state.reloads, 1);
  assert.equal(app.timers.size, 0);
  app.controller.dispose();
});

test("dismissing an update stays dismissed on resume; a newer update can be offered", async () => {
  const app = client({ waiting: new Worker() });
  await app.controller.ready;
  app.controller.dismiss();
  app.state.now += 60_001;
  app.window.dispatchEvent(new Event("focus"));
  assert.equal(app.last().available, false);
  const newer = new Worker(); newer.state = "installing";
  app.registration.installing = newer;
  app.registration.dispatchEvent(new Event("updatefound"));
  newer.change("installed");
  assert.equal(app.last().available, true);
  app.controller.dispose();
});

test("dirty input blocks activation, and newly-started input also blocks the eventual reload", async () => {
  const update = new Worker();
  const app = client({ waiting: update });
  await app.controller.ready;
  app.state.blocked = true; app.controller.apply();
  assert.deepEqual(update.messages, []);
  assert.equal(app.last().blocked, true);
  app.state.blocked = false; app.controller.apply();
  app.state.blocked = true; app.activate(update);
  assert.equal(app.state.reloads, 0);
  assert.equal(app.last().applying, false);
  assert.equal(app.last().available, true);
  app.state.blocked = false; app.controller.refresh(); app.controller.apply();
  assert.equal(app.state.reloads, 1);
  assert.equal(update.messages.length, 1);
  app.controller.dispose();
});

test("another tab's activation leaves this tab's input and page untouched", async () => {
  const app = client();
  await app.controller.ready;
  app.state.blocked = true;
  app.activate(new Worker());
  assert.equal(app.state.reloads, 0);
  assert.equal(app.last().available, true);
  app.controller.apply();
  assert.equal(app.state.reloads, 0);
  app.state.blocked = false; app.controller.apply();
  assert.equal(app.state.reloads, 1);
  app.controller.dispose();
});

test("startup/resume/online checks are throttled and listeners are removed on disposal", async () => {
  const app = client();
  await app.controller.ready;
  assert.equal(app.registration.checks, 1);
  app.window.dispatchEvent(new Event("focus"));
  assert.equal(app.registration.checks, 1);
  app.state.now = 60_001;
  app.window.dispatchEvent(new Event("online"));
  await Promise.resolve();
  assert.equal(app.registration.checks, 2);
  app.document.visibilityState = "hidden"; app.state.now += 60_001;
  app.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(app.registration.checks, 2);
  app.document.visibilityState = "visible";
  app.document.dispatchEvent(new Event("visibilitychange"));
  await Promise.resolve();
  assert.equal(app.registration.checks, 3);
  app.controller.dispose(); app.state.now += 60_001;
  app.window.dispatchEvent(new Event("pageshow"));
  assert.equal(app.registration.checks, 3);
});

test("a competing activation cancels pending consent instead of reloading or staying busy", async () => {
  const expected = new Worker();
  const app = client({ waiting: expected });
  await app.controller.ready;
  app.controller.apply();
  app.activate(new Worker());
  assert.equal(app.state.reloads, 0);
  assert.equal(app.last().applying, false);
  assert.equal(app.last().available, true);
  assert.equal(app.timers.size, 0);
  app.activate(expected);
  assert.equal(app.state.reloads, 0);
  app.controller.dispose();
});

test("activation failures can be retried and late activation never revives expired consent", async () => {
  const update = new Worker();
  const app = client({ waiting: update });
  await app.controller.ready;
  app.controller.apply();
  [...app.timers.values()][0]();
  assert.equal(app.last().applying, false);
  assert.ok(app.last().error);
  app.activate(update);
  assert.equal(app.state.reloads, 0);
  assert.equal(app.last().available, true);
  app.controller.dispose();
});

test("an offline startup retries registration on reconnect; a failed update check can retry immediately", async () => {
  const app = client({ initialOffline: true });
  await app.controller.ready;
  assert.equal(app.registration.checks, 0);
  app.serviceWorker.offline = false;
  app.window.dispatchEvent(new Event("online"));
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(app.serviceWorker.calls.length, 2);
  assert.equal(app.registration.checks, 1);
  app.registration.offline = true;
  app.state.now = 60_001;
  app.window.dispatchEvent(new Event("focus"));
  await Promise.resolve(); await Promise.resolve();
  assert.equal(app.registration.checks, 2);
  app.registration.offline = false;
  app.window.dispatchEvent(new Event("online"));
  await Promise.resolve();
  assert.equal(app.registration.checks, 3);
  app.controller.dispose();
});

function response(body, options = {}) {
  const value = new Response(body, options);
  Object.defineProperty(value, "type", { value: "basic" });
  return value;
}
function workerRuntime() {
  const listeners = new Map();
  const stores = new Map();
  const calls = [];
  const deleted = [];
  let fetchResponse = response("network");
  let offline = false;
  let cacheUnavailable = false;
  let claims = 0;
  let skips = 0;
  const caches = {
    async keys() { if (cacheUnavailable) throw new Error("Cache unavailable"); return [...stores.keys()]; },
    async open(name) {
      if (cacheUnavailable) throw new Error("Cache unavailable");
      if (!stores.has(name)) stores.set(name, new Map());
      const values = stores.get(name);
      return {
        async match(request) { return values.get(request.url)?.clone(); },
        async put(request, value) { values.set(request.url, value); },
      };
    },
    async delete(name) { deleted.push(name); return stores.delete(name); },
  };
  const self = {
    location: { origin: "https://gallery.example" },
    addEventListener(name, listener) { listeners.set(name, listener); },
    async skipWaiting() { skips++; },
    clients: { async claim() { claims++; } },
  };
  vm.runInNewContext(readFileSync("public/sw.js", "utf8").replace("__TENUGUI_BUILD_VERSION__", "test-release"), {
    self, caches, URL, Set, Promise,
    async fetch(request, options) {
      calls.push({ url: request.url, options });
      if (offline) throw new Error("Offline");
      return fetchResponse;
    },
  });
  return {
    stores, calls, deleted, caches,
    setResponse(value) { fetchResponse = value; },
    offline(value = true) { offline = value; },
    cacheUnavailable(value = true) { cacheUnavailable = value; },
    claims: () => claims, skips: () => skips,
    async fetch(pathname, init = {}) {
      let result;
      listeners.get("fetch")({
        request: new Request(new URL(pathname, self.location.origin), init),
        respondWith(value) { result = value; },
      });
      return result;
    },
    async dispatch(name, data) {
      let done;
      listeners.get(name)?.({ data, waitUntil(value) { done = value; } });
      await done;
    },
  };
}

test("only an explicit update message activates the installed worker", async () => {
  const worker = workerRuntime();
  await worker.dispatch("install");
  await worker.dispatch("message", { type: "OTHER" });
  assert.equal(worker.skips(), 0);
  await worker.dispatch("message", { type: "SKIP_WAITING" });
  assert.equal(worker.skips(), 1);
});

test("hashed assets use cache first across updates; stable icons/manifest use fresh network with offline fallback", async () => {
  const worker = workerRuntime();
  const asset = "/assets/root-Abc12345.js";
  assert.equal(await (await worker.fetch(asset)).text(), "network");
  worker.setResponse(response("changed"));
  assert.equal(await (await worker.fetch(asset)).text(), "network");
  assert.equal(worker.calls.length, 1);
  for (const file of ["/manifest.json", "/icons/icon-192x192.png?v=2"]) {
    worker.setResponse(response("first"));
    assert.equal(await (await worker.fetch(file)).text(), "first");
    worker.setResponse(response("latest"));
    assert.equal(await (await worker.fetch(file)).text(), "latest");
    assert.equal(worker.calls.at(-1).options.cache, "no-cache");
    worker.offline();
    assert.equal(await (await worker.fetch(file)).text(), "latest");
    worker.offline(false);
  }
});

test("authentication, dynamic data, uploaded photos and non-hashed code never enter SW cache", async () => {
  const worker = workerRuntime();
  for (const pathname of ["/", "/items", "/auth", "/auth/callback", "/api/auth/me", "/items.data", "/images/uploaded.svg", "/assets/root.js", "https://external.example/file.svg"]) {
    assert.equal(await worker.fetch(pathname), undefined, pathname);
  }
  assert.equal(await worker.fetch("/manifest.json", { method: "POST" }), undefined);
  assert.equal(worker.calls.length, 0);
  assert.equal(worker.stores.size, 0);
});

test("private/no-store responses stay uncached; cache storage failure still allows the network", async () => {
  const worker = workerRuntime();
  worker.setResponse(response("private", { headers: { "Cache-Control": "private, no-store" } }));
  await worker.fetch("/manifest.json");
  worker.offline();
  await assert.rejects(worker.fetch("/manifest.json"), /Offline/);
  worker.offline(false); worker.cacheUnavailable();
  assert.equal(await (await worker.fetch("/assets/root-Abc12345.js")).text(), "private");
});

test("activation keeps owned immutable assets/one previous release and never deletes other apps' caches", async () => {
  const worker = workerRuntime();
  const current = "tenugui-static-test-release";
  for (const name of ["other-app-cache", "tenugui-v1", "tenugui-assets-v1", "tenugui-static-a", "tenugui-static-b"]) {
    await worker.caches.open(name);
  }
  const prior = await worker.caches.open("tenugui-static-b");
  await prior.put(new Request("https://gallery.example/assets/old-Abc12345.js"), response("old chunk"));
  await worker.dispatch("activate");
  assert.deepEqual(new Set(worker.stores.keys()), new Set(["other-app-cache", "tenugui-assets-v1", "tenugui-static-b", current]));
  assert.equal(worker.claims(), 1);
  worker.offline();
  assert.equal(await (await worker.fetch("/assets/old-Abc12345.js")).text(), "old chunk");
});
