import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

// Execute actual server modules with production authentication. No Vite process
// or external API is needed for validation, binary storage and recovery checks.
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

class FakeKV {
  constructor(entries = {}) {
    this.store = new Map(
      Object.entries(entries).map(([key, value]) => [
        key,
        typeof value === "string" || value instanceof ArrayBuffer
          ? value
          : JSON.stringify(value),
      ]),
    );
    this.metadata = new Map();
    this.writes = [];
    this.failPrefix = "";
  }
  async get(key, type) {
    const value = this.store.get(key) ?? null;
    return value === null || type !== "json" ? value : JSON.parse(value);
  }
  async getWithMetadata(key) {
    return {
      value: this.store.get(key) ?? null,
      metadata: this.metadata.get(key) ?? null,
    };
  }
  async put(key, value, options) {
    if (this.failPrefix && key.startsWith(this.failPrefix))
      throw new Error("Simulated KV failure");
    this.store.set(key, value);
    this.metadata.set(key, options?.metadata);
    this.writes.push(key);
  }
}

const formUtils = load("app/lib/formUtils.ts");
const uploadRoute = load("app/routes/api.images.tsx");
const imageRoute = load("app/routes/images.$imageId.tsx");
const createRoute = load("app/routes/items.new.tsx");
const editRoute = load("app/routes/items.$itemId.edit.tsx");
const detailRoute = load("app/routes/items.$itemId.tsx");
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfWoAAAAASUVORK5CYII=",
  "base64",
);
const oldItem = {
  id: "existing",
  name: "旅の一枚",
  imageUrl: "https://example.com/original.jpg",
  productUrl: "https://example.com/shop",
  tags: ["藍色"],
  memo: "大切な旅の記録",
  status: "purchased",
  order: 8,
};

function context(kv, authenticated = true) {
  const sessions = new FakeKV(
    authenticated
      ? {
          "session:owner": {
            user: { email: "owner@example.com" },
            expires: Date.now() + 60000,
          },
        }
      : {},
  );
  return { cloudflare: { env: { TENUGUI_KV: kv, SESSIONS: sessions } } };
}
function request(pathname, body, authenticated = true) {
  return new Request(`https://gallery.example${pathname}`, {
    method: body ? "POST" : "GET",
    body,
    headers: {
      Origin: "https://gallery.example",
      ...(authenticated ? { Cookie: "session=owner" } : {}),
    },
  });
}
function form(values = {}) {
  return new URLSearchParams({
    name: "",
    imageUrl: "https://example.com/photo.jpg",
    memo: "",
    tags: "",
    status: "purchased",
    ...values,
  });
}
function photo(bytes = PNG, mime = "image/png") {
  const data = new FormData();
  data.set("image", new File([bytes], "photo", { type: mime }));
  return data;
}
function actionData(result) {
  return result.data;
}

test("a photograph alone is enough; optional metadata and unique Japanese tags survive", async () => {
  const values = await formUtils.parseFormData(
    request(
      "/items/new",
      form({
        tags: "藍色、旅, 藍色\n夏",
        memo: "朝の光\n旅の思い出",
        status: "unpurchased",
      }),
    ),
  );
  assert.equal(values.name, "名もなき一枚");
  assert.equal(values.productUrl, undefined);
  assert.deepEqual(values.tags, ["藍色", "旅", "夏"]);
  assert.equal(values.memo, "朝の光\n旅の思い出");
  assert.equal(values.status, "unpurchased");
});

test("URL validation blocks executable schemes, credentials and path tricks, while allowing app photographs", async () => {
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "//evil.example/photo.png",
    "https://user:pass@example.com/photo.png",
    "https:\\evil.example\\photo.png",
    "/images/../auth",
    "/images/%2e%2e%2fauth",
  ]) {
    assert.equal(formUtils.isValidImageUrl(url), false, url);
    await assert.rejects(
      formUtils.parseFormData(request("/items/new", form({ imageUrl: url }))),
      (error) =>
        error instanceof formUtils.FormValidationError &&
        !!error.fieldErrors.imageUrl,
    );
  }
  assert.equal(
    formUtils.isValidImageUrl("/images/01234567-89ab-4def-8123-456789abcdef"),
    true,
  );
  assert.equal(formUtils.isValidImageUrl("/images/yamayama.svg"), true); // Trusted, authored demo asset; uploads still reject SVG.
  await assert.rejects(
    formUtils.parseFormData(
      request("/items/new", form({ productUrl: "javascript:alert(1)" })),
    ),
    (error) => !!error.fieldErrors.productUrl,
  );
});

test("validation responses retain the exact entered name, URL, memory and tags without writing", async () => {
  const kv = new FakeKV();
  const result = await createRoute.action({
    request: request(
      "/items/new",
      form({
        name: "  私の一枚  ",
        imageUrl: "",
        memo: "ここまで書いた記憶\n二行目",
        tags: "夏、海",
      }),
    ),
    context: context(kv),
  });
  assert.equal(result.init.status, 400);
  assert.equal(actionData(result).values.name, "  私の一枚  ");
  assert.equal(actionData(result).values.memo, "ここまで書いた記憶\n二行目");
  assert.equal(actionData(result).values.tags, "夏、海");
  assert.equal(actionData(result).values.imageUrl, "");
  assert.deepEqual(kv.writes, []);
});

test("collection writes require authentication; a valid minimal record redirects to its new detail", async () => {
  const kv = new FakeKV();
  await assert.rejects(
    createRoute.action({
      request: request("/items/new", form(), false),
      context: context(kv, false),
    }),
    (error) => error instanceof Response && error.status === 401,
  );
  assert.deepEqual(kv.writes, []);
  const result = await createRoute.action({
    request: request("/items/new", form()),
    context: context(kv),
  });
  assert.equal(result.status, 302);
  const [saved] = await kv.get("items", "json");
  assert.equal(saved.name, "名もなき一枚");
  assert.equal(result.headers.get("Location"), `/items/${saved.id}`);
});

test("upload authentication is checked before any binary content is accepted", async () => {
  const kv = new FakeKV();
  await assert.rejects(
    uploadRoute.action({
      request: request("/api/images", photo(), false),
      context: context(kv, false),
    }),
    (error) => error instanceof Response && error.status === 401,
  );
  assert.deepEqual(kv.writes, []);
  assert.equal(uploadRoute.loader().status, 405);
});

test("SVG, forged image MIME types, empty files and bodies above the limit are rejected", async () => {
  // Buffer the multipart fixture first: Node's FormData encoder reports a
  // spurious late rejection if its own generator is cancelled mid-encoding.
  const largeMultipart = new Request("https://gallery.example/api/images", {
    method: "POST",
    body: photo(Buffer.alloc(4 * 1024 * 1024)),
  });
  const largeRequest = new Request("https://gallery.example/api/images", {
    method: "POST",
    body: await largeMultipart.arrayBuffer(),
    headers: {
      "Content-Type": largeMultipart.headers.get("Content-Type"),
      Origin: "https://gallery.example",
      Cookie: "session=owner",
    },
  });
  const cases = [
    [
      photo(
        Buffer.from(
          "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>",
        ),
        "image/png",
      ),
      400,
    ],
    [photo(PNG, "image/webp"), 400],
    [photo(Buffer.alloc(0)), 400],
    [largeRequest, 413],
  ];
  for (const [body, status] of cases) {
    const kv = new FakeKV();
    const result = await uploadRoute.action({
      request: body instanceof Request ? body : request("/api/images", body),
      context: context(kv),
    });
    assert.equal(result.status, status);
    assert.ok((await result.json()).error);
    assert.deepEqual(kv.writes, []);
  }
});

test("valid image bytes persist unchanged under an opaque key and are served with safe headers", async () => {
  const kv = new FakeKV();
  const result = await uploadRoute.action({
    request: request("/api/images", photo()),
    context: context(kv),
  });
  assert.equal(result.status, 201);
  const saved = await result.json();
  assert.match(saved.imageId, /^[a-f0-9-]{36}$/);
  assert.equal(saved.imageUrl, `/images/${saved.imageId}`);
  assert.deepEqual(kv.writes, [`image:${saved.imageId}`]);
  const served = await imageRoute.loader({
    request: request(saved.imageUrl),
    context: context(kv, false),
    params: { imageId: saved.imageId },
  });
  assert.equal(served.headers.get("Content-Type"), "image/png");
  assert.equal(served.headers.get("X-Content-Type-Options"), "nosniff");
  assert.deepEqual(Buffer.from(await served.arrayBuffer()), PNG);
  const conditional = new Request(`https://gallery.example${saved.imageUrl}`, {
    headers: { "If-None-Match": served.headers.get("ETag") },
  });
  assert.equal(
    (
      await imageRoute.loader({
        request: conditional,
        context: context(kv),
        params: { imageId: saved.imageId },
      })
    ).status,
    304,
  );
  assert.equal(
    (
      await imageRoute.loader({
        request: request("/images/../../items"),
        context: context(kv),
        params: { imageId: "../../items" },
      })
    ).status,
    404,
  );
  kv.metadata.set(`image:${saved.imageId}`, { mimeType: "image/svg+xml" });
  assert.equal(
    (
      await imageRoute.loader({
        request: request(saved.imageUrl),
        context: context(kv),
        params: { imageId: saved.imageId },
      })
    ).status,
    404,
  );
});

test("a storage failure keeps entered values available for retry", async () => {
  const kv = new FakeKV();
  kv.failPrefix = "items";
  const result = await createRoute.action({
    request: request(
      "/items/new",
      form({ name: "新しい一枚", memo: "まだ保存できていない思い出" }),
    ),
    context: context(kv),
  });
  assert.equal(result.init.status, 503);
  assert.equal(actionData(result).values.name, "新しい一枚");
  assert.equal(actionData(result).values.memo, "まだ保存できていない思い出");
  assert.deepEqual(kv.writes, []);
});

test("editing retains the prior photograph and memory before changing the compatible record", async () => {
  const kv = new FakeKV({ items: [oldItem] });
  const result = await editRoute.action({
    request: request(
      "/items/existing/edit",
      form({
        name: "新しい名前",
        memo: "新しい思い出",
        imageUrl: "https://example.com/new.jpg",
      }),
    ),
    context: context(kv),
    params: { itemId: oldItem.id },
  });
  assert.equal(result.status, 302);
  const backup = await kv.get(`item-backup:${oldItem.id}:before-edit`, "json");
  assert.deepEqual(backup.item, oldItem);
  const [saved] = await kv.get("items", "json");
  assert.equal(saved.name, "新しい名前");
  assert.equal(saved.order, oldItem.order);
  assert.equal(saved.imageUrl, "https://example.com/new.jpg");
});

test("removing an item saves the complete record first and preserves its image; a failed backup removes nothing", async () => {
  for (const fail of [true, false]) {
    const kv = new FakeKV({ items: [oldItem] });
    const image = PNG.buffer.slice(
      PNG.byteOffset,
      PNG.byteOffset + PNG.byteLength,
    );
    kv.store.set("image:preserved", image);
    if (fail) kv.failPrefix = "item-backup:";
    const result = await detailRoute.action({
      request: request(
        "/items/existing",
        new URLSearchParams({ intent: "delete" }),
      ),
      context: context(kv),
      params: { itemId: oldItem.id },
    });
    if (fail) {
      assert.equal(result.init.status, 503);
      assert.deepEqual(await kv.get("items", "json"), [oldItem]);
      assert.deepEqual(kv.writes, []);
    } else {
      assert.equal(result.status, 302);
      assert.deepEqual(await kv.get("items", "json"), []);
      const backupKey = kv.writes.find((key) => key.startsWith("item-backup:"));
      assert.deepEqual((await kv.get(backupKey, "json")).item, oldItem);
      assert.equal((await kv.get(backupKey, "json")).imageRetained, true);
    }
    assert.equal(kv.store.get("image:preserved"), image);
  }
});
