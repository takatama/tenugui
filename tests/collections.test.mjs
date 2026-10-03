import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

// Exercise actual TS modules with each Vite compile-time DEV value, without
// spawning build tools. CSS is irrelevant to these data/authorization tests.
const moduleCache = new Map();
async function loadModule(relativePath, development = false) {
  return compileModule(path.resolve(relativePath), development);
}
function compileModule(filename, development) {
  const cacheKey = `${development}:${filename}`;
  if (moduleCache.has(cacheKey)) return moduleCache.get(cacheKey).exports;
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  moduleCache.set(cacheKey, compiled);
  const nativeRequire = compiled.require.bind(compiled);
  compiled.require = (specifier) => {
    if (specifier.endsWith(".css")) return {};
    if (!specifier.startsWith(".")) return nativeRequire(specifier);
    const base = path.resolve(path.dirname(filename), specifier);
    const dependency = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ].find((candidate) => existsSync(candidate) && /\.tsx?$/.test(candidate));
    return dependency
      ? compileModule(dependency, development)
      : nativeRequire(specifier);
  };
  const source = readFileSync(filename, "utf8").replaceAll(
    "import.meta.env.DEV",
    String(development),
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
  compiled._compile(transformed.outputText, filename);
  return compiled.exports;
}

class FakeKV {
  constructor(entries = {}, pageSize = 100) {
    this.store = new Map(
      Object.entries(entries).map(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]),
    );
    this.writes = [];
    this.putOptions = [];
    this.pageSize = pageSize;
    this.listCalls = 0;
  }
  async get(key, format) {
    const value = this.store.get(key) ?? null;
    return value === null || format !== "json" ? value : JSON.parse(value);
  }
  async put(key, value, options) {
    this.store.set(key, value);
    this.writes.push(key);
    this.putOptions.push(options);
  }
  async delete(key) {
    this.store.delete(key);
  }
  async list({ prefix, cursor, limit }) {
    this.listCalls++;
    const keys = [...this.store.keys()]
      .filter((key) => key.startsWith(prefix))
      .sort();
    const offset = Number(cursor ?? 0);
    const end = Math.min(keys.length, offset + Math.min(limit, this.pageSize));
    return {
      keys: keys.slice(offset, end).map((name) => ({ name })),
      list_complete: end === keys.length,
      cursor: end === keys.length ? "" : String(end),
    };
  }
}

const oldItem = {
  id: "original",
  name: "昔からの一枚",
  imageUrl: "https://example.com/original.jpg",
  tags: ["藍色"],
  memo: "人には見せない思い出",
  productUrl: "https://example.com/private-product",
  order: 3,
};
const itemsProd = await loadModule("app/data/items.ts");
const itemsDev = await loadModule("app/data/items.ts", true);
const exhibitionData = await loadModule("app/data/exhibitions.ts");
const guardProd = await loadModule("app/lib/auth-guard.ts");
const guardDev = await loadModule("app/lib/auth-guard.ts", true);
const publicRoute = await loadModule(
  "app/routes/exhibitions.$exhibitionId.tsx",
);
const manageRoute = await loadModule("app/routes/exhibitions.tsx");
const authMeProd = await loadModule("app/routes/api.auth.me.tsx");
const authMeDev = await loadModule("app/routes/api.auth.me.tsx", true);
const collectionTools = await loadModule("app/data/collection-tools.ts");
const settingsRoute = await loadModule("app/routes/settings.tsx");
const renameRoute = await loadModule("app/routes/api.tag-rename.tsx");
const deleteTagRoute = await loadModule("app/routes/api.tag-delete.tsx");
const oauthState = await loadModule("app/lib/oauth-state.ts");
const oauthCallback = await loadModule("app/routes/auth.callback.tsx");
const sessions = await loadModule("app/lib/cloudflare-auth.ts");

test("malformed or expired session records never grant editing rights", async () => {
  const valid = {
    user: { email: "owner@example.com" },
    expires: Date.now() + 60000,
  };
  for (const record of [
    null,
    {},
    { ...valid, expires: "tomorrow" },
    { user: valid.user },
    { ...valid, expires: Date.now() - 1 },
    { ...valid, user: {} },
    { ...valid, user: { email: "" } },
  ]) {
    assert.equal(
      await sessions.getSession(
        "owner",
        new FakeKV({ "session:owner": record }),
      ),
      null,
    );
  }
  assert.deepEqual(
    await sessions.getSession("owner", new FakeKV({ "session:owner": valid })),
    valid.user,
  );
});

function context(kv, sessions = new FakeKV()) {
  return { cloudflare: { env: { TENUGUI_KV: kv, SESSIONS: sessions } } };
}
function authenticatedContext(kv) {
  return context(
    kv,
    new FakeKV({
      "session:owner": {
        user: { email: "owner@example.com" },
        expires: Date.now() + 60000,
      },
    }),
  );
}
function request(url = "https://gallery.example/exhibitions", options = {}) {
  return new Request(url, options);
}
function ownerRequest(url, options = {}) {
  return request(url, {
    ...options,
    headers: {
      Cookie: "session=owner",
      Origin: "https://gallery.example",
      ...options.headers,
    },
  });
}

test("examples only appear for absent local-development data, never production or an existing empty collection", async () => {
  const kv = new FakeKV();
  const demo = await itemsDev.getAllItems(kv);
  assert.equal(demo.length, 8);
  assert.equal(new Set(demo.map((item) => item.id)).size, 8);
  assert.ok(demo.some((item) => item.imageUrl === "/images/yamayama.svg"));
  assert.equal(await itemsDev.getIsDemo(kv), true);
  assert.deepEqual(await itemsProd.getAllItems(kv), []);
  assert.equal(await itemsProd.getIsDemo(kv), false);
  assert.deepEqual(kv.writes, []);
  const empty = new FakeKV({ items: [] });
  assert.deepEqual(await itemsDev.getAllItems(empty), []);
  assert.equal(await itemsDev.getIsDemo(empty), false);
});

test("legacy records and all their fields survive reads and updates", async () => {
  const kv = new FakeKV({ items: [oldItem] });
  const before = await kv.get("items");
  const [item] = await itemsDev.getAllItems(kv);
  assert.deepEqual(item, { ...oldItem, status: "purchased" });
  assert.equal(await kv.get("items"), before);
  assert.deepEqual(kv.writes, []);
  await itemsProd.updateItem(kv, oldItem.id, {
    ...oldItem,
    name: "名前だけ更新",
  });
  const [updated] = await kv.get("items", "json");
  assert.equal(updated.order, 3);
  assert.equal(updated.memo, oldItem.memo);
  assert.equal(updated.productUrl, oldItem.productUrl);
  assert.equal(updated.name, "名前だけ更新");
});

test("development edits persist the standard items schema and production creation starts empty", async () => {
  const local = new FakeKV();
  const created = await itemsDev.createItem(local, {
    ...oldItem,
    name: "新しい一枚",
  });
  assert.equal((await local.get("items", "json")).length, 9);
  assert.equal((await local.get("items", "json"))[0].id, created.id);
  assert.equal(await itemsDev.getIsDemo(local), false);
  const production = new FakeKV();
  await itemsProd.createItem(production, oldItem);
  assert.equal((await production.get("items", "json")).length, 1);
});

test("exhibitions use individual keys, validate selection, deduplicate, and retain the collection untouched", async () => {
  const kv = new FakeKV({ items: [oldItem] });
  const before = await kv.get("items");
  const saved = await exhibitionData.createExhibition(
    kv,
    {
      title: "  藍の時間  ",
      description: "  気に入りの藍色  ",
      itemIds: [oldItem.id, oldItem.id],
      public: false,
    },
    [oldItem],
  );
  assert.equal(saved.title, "藍の時間");
  assert.deepEqual(saved.itemIds, [oldItem.id]);
  assert.deepEqual(kv.writes, [`exhibition:${saved.id}`]);
  assert.equal(await kv.get("items"), before);
  await assert.rejects(
    exhibitionData.createExhibition(
      kv,
      { title: "展示", description: "", itemIds: ["missing"], public: true },
      [oldItem],
    ),
    /見つかりません/,
  );
  await assert.rejects(
    exhibitionData.createExhibition(
      kv,
      { title: "", description: "", itemIds: [oldItem.id], public: true },
      [oldItem],
    ),
    /80文字/,
  );
  await assert.rejects(
    exhibitionData.createExhibition(
      kv,
      { title: "展示", description: "", itemIds: [], public: true },
      [oldItem],
    ),
    /1枚以上/,
  );
  assert.equal(kv.writes.length, 1);
});

test("prefix listing follows every KV cursor and sorts newest first", async () => {
  const kv = new FakeKV({}, 1);
  const first = await exhibitionData.createExhibition(
    kv,
    { title: "ひとつめ", description: "", itemIds: [oldItem.id], public: true },
    [oldItem],
  );
  const second = await exhibitionData.createExhibition(
    kv,
    {
      title: "ふたつめ",
      description: "",
      itemIds: [oldItem.id],
      public: false,
    },
    [oldItem],
  );
  await kv.put(
    `exhibition:${first.id}`,
    JSON.stringify({ ...first, createdAt: "2026-01-01T00:00:00.000Z" }),
  );
  await kv.put(
    `exhibition:${second.id}`,
    JSON.stringify({ ...second, createdAt: "2026-02-01T00:00:00.000Z" }),
  );
  await kv.put("unrelated:data", "do not list");
  const listed = await exhibitionData.listExhibitions(kv);
  assert.deepEqual(
    listed.map((entry) => entry.id),
    [second.id, first.id],
  );
  assert.equal(kv.listCalls, 2);
});

test("submitted selection order is saved and shown after duplicates are removed", async () => {
  const second = { ...oldItem, id: "second", name: "二枚目" };
  const kv = new FakeKV();
  const saved = await exhibitionData.createExhibition(
    kv,
    {
      title: "並びを楽しむ",
      description: "",
      itemIds: [second.id, oldItem.id, second.id],
      public: true,
    },
    [oldItem, second],
  );
  assert.deepEqual(saved.itemIds, [second.id, oldItem.id]);
  const loaded = await exhibitionData.getExhibition(kv, saved.id);
  assert.deepEqual(
    exhibitionData
      .getExhibitionItems(loaded, [oldItem, second])
      .map((item) => item.id),
    [second.id, oldItem.id],
  );
});

test("public projection never contains memories or product links, and gracefully skips deleted items", () => {
  const projected = exhibitionData.getExhibitionItems(
    { itemIds: ["deleted", oldItem.id] },
    [oldItem],
  );
  assert.deepEqual(projected, [
    {
      id: oldItem.id,
      name: oldItem.name,
      imageUrl: oldItem.imageUrl,
      tags: oldItem.tags,
    },
  ]);
  assert.equal(JSON.stringify(projected).includes(oldItem.memo), false);
  assert.equal(JSON.stringify(projected).includes(oldItem.productUrl), false);
});

test("production authentication remains required while local development uses only the compile-time DEV shortcut", async () => {
  const ctx = context(new FakeKV());
  assert.equal(
    (await guardDev.requireAuth(request(), ctx)).isAuthenticated,
    true,
  );
  assert.equal(
    (await guardDev.requireAuthForAction(request(), ctx)).user.email,
    "gallery@localhost",
  );
  assert.equal(
    (await guardProd.getAuthStateOptional(request(), ctx)).isAuthenticated,
    false,
  );
  await assert.rejects(
    guardProd.requireAuth(request(), ctx),
    (error) =>
      error instanceof Response &&
      error.status === 302 &&
      error.headers.get("Location").startsWith("/auth?action=login"),
  );
  await assert.rejects(
    guardProd.requireAuthForAction(request(), ctx),
    (error) => error instanceof Response && error.status === 401,
  );
  assert.equal(
    (
      await (
        await authMeDev.loader({ request: request(), context: ctx })
      ).json()
    ).isAuthenticated,
    true,
  );
  assert.equal(
    (
      await (
        await authMeProd.loader({ request: request(), context: ctx })
      ).json()
    ).isAuthenticated,
    false,
  );
});

test("authenticated and development mutations both reject hostile browser origins", async () => {
  const ctx = authenticatedContext(new FakeKV());
  for (const guard of [guardProd, guardDev]) {
    for (const headers of [
      { Origin: "https://evil.example" },
      { Origin: "null" },
      { "Sec-Fetch-Site": "cross-site" },
    ]) {
      await assert.rejects(
        guard.requireAuthForAction(
          ownerRequest(undefined, { method: "POST", headers }),
          ctx,
        ),
        (error) => error instanceof Response && error.status === 403,
      );
    }
  }
  assert.equal(
    (
      await guardProd.requireAuthForAction(
        ownerRequest(undefined, { method: "POST" }),
        ctx,
      )
    ).isAuthenticated,
    true,
  );
});

test("public routes are readable without authentication, serialize only shared fields, and require login immediately after publication stops", async () => {
  const kv = new FakeKV({ items: [oldItem] });
  const saved = await exhibitionData.createExhibition(
    kv,
    {
      title: "藍の時間",
      description: "一枚の展示",
      itemIds: [oldItem.id],
      public: true,
    },
    [oldItem],
  );
  const url = `https://gallery.example/exhibitions/${saved.id}`;
  const args = {
    request: request(url),
    context: context(kv),
    params: { exhibitionId: saved.id },
  };
  const response = await publicRoute.loader(args);
  const body = await response.json();
  assert.equal(body.title, "藍の時間");
  assert.deepEqual(Object.keys(body.items[0]).sort(), [
    "id",
    "imageUrl",
    "name",
    "tags",
  ]);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  await exhibitionData.setExhibitionVisibility(kv, saved.id, false);
  await assert.rejects(
    publicRoute.loader(args),
    (error) => error instanceof Response && error.status === 302,
  );
  const privateResponse = await publicRoute.loader({
    ...args,
    request: ownerRequest(url),
    context: authenticatedContext(kv),
  });
  assert.equal((await privateResponse.json()).public, false);
  await assert.rejects(
    publicRoute.loader({ ...args, params: { exhibitionId: "../../items" } }),
    (error) => error instanceof Response && error.status === 404,
  );
});

test("management reads and actions enforce production authentication and validate item IDs", async () => {
  const kv = new FakeKV({ items: [oldItem] });
  await assert.rejects(
    manageRoute.loader({ request: request(), context: context(kv) }),
    (error) => error instanceof Response && error.status === 302,
  );
  const form = new URLSearchParams({
    intent: "create",
    title: "展示",
    itemIds: "not-in-collection",
    public: "true",
  });
  await assert.rejects(
    manageRoute.action({
      request: request(undefined, { method: "POST", body: form }),
      context: context(kv),
    }),
    (error) => error instanceof Response && error.status === 401,
  );
  const response = await manageRoute.action({
    request: ownerRequest(undefined, { method: "POST", body: form }),
    context: authenticatedContext(kv),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /見つかりません/);
  assert.deepEqual(kv.writes, []);
});

test("bulk tag rename updates every matching item with one write and retains non-target data", async () => {
  const first = {
    ...oldItem,
    tags: ["夏", "植物", "夏"],
    status: "unpurchased",
    legacyNote: "preserve unknown fields",
  };
  const second = {
    ...oldItem,
    id: "second",
    tags: ["春", "夏", "藍色"],
    status: "purchased",
  };
  const untouched = {
    ...oldItem,
    id: "untouched",
    tags: ["保存", "保存"],
    status: "purchased",
  };
  const kv = new FakeKV({ items: [first, second, untouched] });
  const count = await collectionTools.changeTag(kv, "夏", "春");
  const updated = await kv.get("items", "json");
  assert.equal(count, 2);
  assert.deepEqual(kv.writes, ["items"]);
  assert.deepEqual(updated, [
    { ...first, tags: ["春", "植物"] },
    { ...second, tags: ["春", "藍色"] },
    untouched,
  ]);
});

test("bulk tag deletion removes only the target tag across all items with one write", async () => {
  const first = { ...oldItem, tags: ["藍色", "和柄"], status: "unpurchased" };
  const second = {
    ...oldItem,
    id: "second",
    tags: ["藍色", "植物", "藍色"],
    status: "purchased",
  };
  const kv = new FakeKV({ items: [first, second] });
  assert.equal(await collectionTools.changeTag(kv, "藍色"), 2);
  assert.deepEqual(await kv.get("items", "json"), [
    { ...first, tags: ["和柄"] },
    { ...second, tags: ["植物"] },
  ]);
  assert.deepEqual(kv.writes, ["items"]);
});

test("shelved listing paginates, deduplicates by latest deletion, and hides items already restored", async () => {
  const present = { ...oldItem, id: "present" };
  const earlier = { ...oldItem, id: "shelved", memo: "古い記録" };
  const latest = { ...earlier, memo: "最新の記録", tags: ["冬"] };
  const another = { ...oldItem, id: "another" };
  const kv = new FakeKV(
    {
      items: [present],
      "item-backup:shelved:1000": {
        item: earlier,
        deletedAt: "2026-01-01T00:00:00.000Z",
      },
      "item-backup:shelved:2000": {
        item: latest,
        deletedAt: "2026-02-01T00:00:00.000Z",
      },
      "item-backup:another:3000": {
        item: another,
        deletedAt: "2026-03-01T00:00:00.000Z",
      },
      "item-backup:present:4000": {
        item: present,
        deletedAt: "2026-04-01T00:00:00.000Z",
      },
      "item-backup:shelved:before-edit": {
        item: latest,
        savedAt: "2026-04-01T00:00:00.000Z",
      },
    },
    1,
  );
  const shelved = await collectionTools.getShelvedRecords(kv);
  assert.deepEqual(
    shelved.map((record) => record.item.id),
    ["another", "shelved"],
  );
  assert.equal(shelved[1].key, "item-backup:shelved:2000");
  assert.equal(shelved[1].item.memo, "最新の記録");
  assert.equal(kv.listCalls, 5);
  assert.deepEqual(kv.writes, []);
});

test("restore keeps the full original schema, prepends once, and is idempotent", async () => {
  const restored = {
    ...oldItem,
    id: "shelved",
    status: "unpurchased",
    legacyNote: { text: "preserve" },
  };
  const current = { ...oldItem, status: "purchased" };
  const key = "item-backup:shelved:1000";
  const kv = new FakeKV({
    items: [current],
    [key]: {
      item: restored,
      deletedAt: "2026-01-01T00:00:00.000Z",
      imageRetained: true,
    },
  });
  assert.equal(await collectionTools.restoreShelvedRecord(kv, key), true);
  assert.deepEqual(await kv.get("items", "json"), [restored, current]);
  assert.deepEqual(kv.writes, ["items"]);
  assert.equal(await collectionTools.restoreShelvedRecord(kv, key), true);
  assert.deepEqual(kv.writes, ["items"]);
  assert.deepEqual(await collectionTools.getShelvedRecords(kv), []);
  assert.ok(await kv.get(key), "backup remains recoverable");
});

test("restore rejects invalid keys, missing backups, mismatched IDs, and malformed Item records without writing", async () => {
  const valid = { ...oldItem, id: "shelved" };
  const deletedAt = "2026-01-01T00:00:00.000Z";
  const invalidEntries = {
    items: [oldItem],
    "item-backup:mismatch:1000": { item: valid, deletedAt },
    "item-backup:shelved:1001": {
      item: { ...valid, tags: undefined },
      deletedAt,
    },
    "item-backup:shelved:1002": {
      item: { ...valid, memo: undefined },
      deletedAt,
    },
    "item-backup:shelved:1003": {
      item: { ...valid, imageUrl: undefined },
      deletedAt,
    },
    "item-backup:shelved:1004": { item: { ...valid, tags: [42] }, deletedAt },
    "item-backup:shelved:1005": { item: valid, deletedAt: "not-a-date" },
    "item-backup:shelved:before-edit": { item: valid, deletedAt },
    "item-backup:shelved:1006": { item: null, deletedAt },
  };
  const kv = new FakeKV(invalidEntries);
  for (const key of [
    "items",
    "session:owner",
    "item-backup:../../items:1000",
    "item-backup:shelved:9999",
    ...Object.keys(invalidEntries).filter((key) =>
      key.startsWith("item-backup:"),
    ),
  ]) {
    assert.equal(
      await collectionTools.restoreShelvedRecord(kv, key),
      false,
      key,
    );
  }
  assert.deepEqual(await collectionTools.getShelvedRecords(kv), []);
  assert.deepEqual(kv.writes, []);
  assert.deepEqual(await kv.get("items", "json"), [oldItem]);
});

test("settings actions reject stale, partial, duplicate, or foreign item orders without touching data", async () => {
  const second = { ...oldItem, id: "second" };
  const kv = new FakeKV({ items: [oldItem, second] });
  const ctx = authenticatedContext(kv);
  for (const ids of [
    [oldItem.id],
    [oldItem.id, oldItem.id],
    [oldItem.id, "foreign"],
  ]) {
    const form = new URLSearchParams({ intent: "reorder" });
    ids.forEach((id) => form.append("itemIds", id));
    const response = await settingsRoute.action({
      request: ownerRequest("https://gallery.example/settings", {
        method: "POST",
        body: form,
      }),
      context: ctx,
    });
    assert.equal(response.init.status, 409);
    assert.match(response.data.error, /変更されました/);
  }
  assert.deepEqual(kv.writes, []);
  const form = new URLSearchParams({ intent: "reorder" });
  [second.id, oldItem.id].forEach((id) => form.append("itemIds", id));
  const saved = await settingsRoute.action({
    request: ownerRequest("https://gallery.example/settings", {
      method: "POST",
      body: form,
    }),
    context: ctx,
  });
  assert.match(saved.data.message, /保存しました/);
  assert.deepEqual(
    (await kv.get("items", "json")).map((item) => item.id),
    [second.id, oldItem.id],
  );
  assert.equal((await kv.get("items", "json"))[1].memo, oldItem.memo);
});

test("settings management requires production authentication and rejects unsafe restore requests", async () => {
  const kv = new FakeKV({ items: [oldItem] });
  const form = new URLSearchParams({ intent: "restore", key: "items" });
  await assert.rejects(
    settingsRoute.loader({
      request: request("https://gallery.example/settings"),
      context: context(kv),
    }),
    (error) => error instanceof Response && error.status === 302,
  );
  await assert.rejects(
    settingsRoute.action({
      request: request("https://gallery.example/settings", {
        method: "POST",
        body: form,
      }),
      context: context(kv),
    }),
    (error) => error instanceof Response && error.status === 401,
  );
  const response = await settingsRoute.action({
    request: ownerRequest("https://gallery.example/settings", {
      method: "POST",
      body: form,
    }),
    context: authenticatedContext(kv),
  });
  assert.equal(response.init.status, 404);
  assert.match(response.data.error, /見つかりません/);
  assert.deepEqual(kv.writes, []);
});

test("tag API routes rename and delete every matching record through one collection write", async () => {
  const first = { ...oldItem, tags: ["夏", "植物"], status: "unpurchased" };
  const second = {
    ...oldItem,
    id: "second",
    tags: ["夏", "藍色"],
    status: "purchased",
  };
  const kv = new FakeKV({ items: [first, second] });
  const ctx = authenticatedContext(kv);
  const renamed = await renameRoute.action({
    request: ownerRequest("https://gallery.example/api/tag-rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldTagName: "夏", newTagName: "秋" }),
    }),
    context: ctx,
  });
  assert.equal(renamed.data.updatedItemsCount, 2);
  assert.deepEqual(kv.writes, ["items"]);
  assert.deepEqual(await kv.get("items", "json"), [
    { ...first, tags: ["秋", "植物"] },
    { ...second, tags: ["秋", "藍色"] },
  ]);
  const removed = await deleteTagRoute.action({
    request: ownerRequest("https://gallery.example/api/tag-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagToDelete: "秋" }),
    }),
    context: ctx,
  });
  assert.equal(removed.data.deletedCount, 2);
  assert.deepEqual(kv.writes, ["items", "items"]);
  assert.deepEqual(await kv.get("items", "json"), [
    { ...first, tags: ["植物"] },
    { ...second, tags: ["藍色"] },
  ]);
});

test("OAuth return paths retain local destinations and reject external or ambiguous locations", () => {
  const origin = "https://gallery.example";
  assert.equal(
    oauthState.safeReturnTo(
      "/exhibitions?tag=%E8%97%8D#my-exhibitions",
      origin,
    ),
    "/exhibitions?tag=%E8%97%8D#my-exhibitions",
  );
  for (const unsafe of [
    "https://evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "javascript:alert(1)",
    "/\n//evil.example",
    "/\r\nLocation: https://evil.example",
    "relative",
    "",
  ]) {
    assert.equal(oauthState.safeReturnTo(unsafe, origin), "/", unsafe);
  }
});

test("OAuth state is random, browser-bound, expiring, and rejected after consumption", async () => {
  const kv = new FakeKV();
  const first = await oauthState.createOAuthState(
    kv,
    "/exhibitions",
    "https://gallery.example",
  );
  const second = await oauthState.createOAuthState(
    kv,
    "//evil.example",
    "https://gallery.example",
  );
  assert.notEqual(first.state, second.state);
  assert.match(first.state, /^[0-9a-f-]{36}$/);
  assert.match(first.cookie, /HttpOnly; Secure; SameSite=Lax; Path=\/auth/);
  assert.equal(kv.putOptions[0].expirationTtl, 600);
  assert.equal((await kv.get(`oauth:${second.state}`, "json")).returnTo, "/");
  const callbackUrl = "https://gallery.example/auth/callback";
  assert.equal(
    await oauthState.consumeOAuthState(kv, request(callbackUrl), first.state),
    null,
  );
  assert.equal(
    await oauthState.consumeOAuthState(
      kv,
      request(callbackUrl, {
        headers: { Cookie: `tenugui_oauth=${second.state}` },
      }),
      first.state,
    ),
    null,
  );
  assert.equal(
    await oauthState.consumeOAuthState(kv, request(callbackUrl), "../../items"),
    null,
  );
  const bound = request(callbackUrl, {
    headers: { Cookie: `unrelated=ok; tenugui_oauth=${first.state}` },
  });
  assert.equal(
    await oauthState.consumeOAuthState(kv, bound, first.state),
    "/exhibitions",
  );
  assert.equal(await kv.get(`oauth:${first.state}`), null);
  assert.equal(
    await oauthState.consumeOAuthState(kv, bound, first.state),
    null,
  );
});

test("OAuth rejects expired or non-finite state records before redirecting", async (t) => {
  const now = 1780000000000;
  t.mock.method(Date, "now", () => now);
  const state = "12345678-1234-1234-1234-123456789abc";
  const bound = request("https://gallery.example/auth/callback", {
    headers: { Cookie: `tenugui_oauth=${state}` },
  });
  for (const expires of [now - 1, now, "tomorrow", null]) {
    const kv = new FakeKV({
      [`oauth:${state}`]: { returnTo: "/exhibitions", expires },
    });
    assert.equal(
      await oauthState.consumeOAuthState(kv, bound, state),
      null,
      String(expires),
    );
  }
  const infinite = new FakeKV({
    [`oauth:${state}`]: '{"returnTo":"/exhibitions","expires":1e309}',
  });
  assert.equal(
    await oauthState.consumeOAuthState(infinite, bound, state),
    null,
  );
});

function oauthContext(sessions = new FakeKV()) {
  const ctx = context(new FakeKV(), sessions);
  Object.assign(ctx.cloudflare.env, {
    GOOGLE_CLIENT_ID: "test-client",
    GOOGLE_CLIENT_SECRET: "test-secret",
    ALLOWED_EMAILS: "owner@example.com",
  });
  return ctx;
}
async function callbackRequest(sessions, returnTo = "/exhibitions") {
  const state = await oauthState.createOAuthState(
    sessions,
    returnTo,
    "https://gallery.example",
  );
  return request(
    `https://gallery.example/auth/callback?code=test-code&state=${state.state}`,
    { headers: { Cookie: `tenugui_oauth=${state.state}` } },
  );
}

test("OAuth callback rejects missing configuration or unbound state before any external request", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  const unavailable = await oauthCallback.loader({
    request: request("https://gallery.example/auth/callback?code=test-code"),
    context: context(new FakeKV()),
  });
  assert.equal(unavailable.status, 503);
  const invalid = await oauthCallback.loader({
    request: request(
      "https://gallery.example/auth/callback?code=test-code&state=https%3A%2F%2Fevil.example",
    ),
    context: oauthContext(),
  });
  assert.equal(invalid.status, 400);
  assert.match(invalid.headers.get("Set-Cookie"), /Max-Age=0/);
  const sessions = new FakeKV();
  const bound = await callbackRequest(sessions);
  const noCookie = await oauthCallback.loader({
    request: request(bound.url),
    context: oauthContext(sessions),
  });
  assert.equal(noCookie.status, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("OAuth callback exchanges valid state, uses a bearer header, retains local redirect, and creates only an allowed verified session", async (t) => {
  const sessions = new FakeKV();
  const callback = await callbackRequest(
    sessions,
    "/exhibitions?view=mine#my-exhibitions",
  );
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    if (url === "https://oauth2.googleapis.com/token")
      return Response.json({ access_token: "mock-access-token" });
    if (url === "https://www.googleapis.com/oauth2/v2/userinfo")
      return Response.json({
        email: "owner@example.com",
        verified_email: true,
        name: "Owner",
      });
    throw new Error("unexpected endpoint");
  });
  const response = await oauthCallback.loader({
    request: callback,
    context: oauthContext(sessions),
  });
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("Location"),
    "/exhibitions?view=mine#my-exhibitions",
  );
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.body.get("code"), "test-code");
  assert.equal(
    calls[0].options.body.get("redirect_uri"),
    "https://gallery.example/auth/callback",
  );
  assert.equal(calls[1].url.includes("mock-access-token"), false);
  assert.equal(
    calls[1].options.headers.Authorization,
    "Bearer mock-access-token",
  );
  const cookies = response.headers.getSetCookie();
  assert.ok(
    cookies.some(
      (cookie) =>
        cookie.startsWith("session=") &&
        cookie.includes("HttpOnly; Secure; SameSite=Lax"),
    ),
  );
  assert.ok(
    cookies.some(
      (cookie) =>
        cookie.startsWith("tenugui_oauth=") && cookie.includes("Max-Age=0"),
    ),
  );
  const savedSessions = [...sessions.store.keys()].filter((key) =>
    key.startsWith("session:"),
  );
  assert.equal(savedSessions.length, 1);
  assert.equal(
    (await sessions.get(savedSessions[0], "json")).user.email,
    "owner@example.com",
  );
  const replay = await oauthCallback.loader({
    request: callback,
    context: oauthContext(sessions),
  });
  assert.equal(replay.status, 400);
  assert.equal(calls.length, 2);
});

test("OAuth callback does not create sessions for non-allowed or unverified email profiles", async (t) => {
  let profile;
  t.mock.method(globalThis, "fetch", async (url) =>
    url === "https://oauth2.googleapis.com/token"
      ? Response.json({ access_token: "mock-access-token" })
      : Response.json(profile),
  );
  for (profile of [
    { email: "outsider@example.com", verified_email: true },
    { email: "owner@example.com", verified_email: false },
    { email: "owner@example.com" },
    { email: 42, verified_email: true },
  ]) {
    const sessions = new FakeKV();
    const callback = await callbackRequest(sessions);
    const response = await oauthCallback.loader({
      request: callback,
      context: oauthContext(sessions),
    });
    assert.equal(response.status, 403);
    assert.equal(
      [...sessions.store.keys()].some((key) => key.startsWith("session:")),
      false,
    );
    assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/);
  }
});

test("OAuth callback fails safely when token exchange has no token and never trusts an external return destination", async (t) => {
  const sessions = new FakeKV();
  const callback = await callbackRequest(sessions, "//evil.example");
  let malformedToken = true;
  t.mock.method(globalThis, "fetch", async (url) =>
    url === "https://oauth2.googleapis.com/token"
      ? Response.json(
          malformedToken
            ? { access_token: 42 }
            : { access_token: "mock-access-token" },
        )
      : Response.json({ email: "owner@example.com", verified_email: true }),
  );
  const failed = await oauthCallback.loader({
    request: callback,
    context: oauthContext(sessions),
  });
  assert.equal(failed.status, 503);
  assert.equal(
    [...sessions.store.keys()].some((key) => key.startsWith("session:")),
    false,
  );
  malformedToken = false;
  const retry = await callbackRequest(sessions, "//evil.example");
  const response = await oauthCallback.loader({
    request: retry,
    context: oauthContext(sessions),
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Location"), "/");
});
