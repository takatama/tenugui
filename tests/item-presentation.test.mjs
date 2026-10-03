import test from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import ts from "typescript";

const filename = path.resolve("app/lib/itemPresentation.ts");
const compiled = new Module(filename);
compiled._compile(
  ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText,
  filename,
);
const { getDisplayName } = compiled.exports;

test("shop titles reveal the named design without editing the saved name", () => {
  const original =
    "【楽天市場】 手ぬぐい かまわぬ 「月と猫」 注染 日本製 メール便対応";
  const item = Object.freeze({ name: original });
  assert.equal(getDisplayName(item.name), "月と猫");
  assert.equal(item.name, original);
});

test("a product descriptor or brand in quotes does not replace the design name", () => {
  assert.equal(
    getDisplayName("かまわぬ 手ぬぐい 「注染」『夜の庭』 日本製"),
    "夜の庭",
  );
  assert.equal(
    getDisplayName("手ぬぐい 「濱文様」 「雨の日」 メール便"),
    "雨の日",
  );
});

test("standalone design names and familiar product prefixes stay useful", () => {
  assert.equal(getDisplayName("「春待ち」"), "春待ち");
  assert.equal(getDisplayName("【送料無料】 てぬぐい にじゆら 海辺"), "海辺");
  assert.equal(getDisplayName("手ぬぐい かまわぬ 青い鳥"), "青い鳥");
});

test("personal titles and unrecognized titles are preserved", () => {
  for (const title of [
    "母がくれた手ぬぐい「夏の記憶」",
    "手ぬぐいの思い出「夏」",
    "映画「海辺の家」を見た日に",
    "【春の思い出】桜の一枚",
    "  お気に入りの青  ",
    "長い名前でも、認識できない文字列を勝手に切り取らないための一枚",
  ])
    assert.equal(getDisplayName(title), title);
});

test("empty and descriptor-only names never lose their original value", () => {
  for (const title of [
    "",
    "   ",
    "【送料無料】",
    "手ぬぐい 「注染」",
    "「てぬぐい」",
  ])
    assert.equal(getDisplayName(title), title);
});

test("explicit catalog structures separate the pattern from shop navigation", () => {
  assert.equal(
    getDisplayName(
      "青い鳥｜手ぬぐい｜【Kenema】和楽｜JIKAN STYLEオンラインショップ",
    ),
    "青い鳥",
  );
  assert.equal(
    getDisplayName(
      "伊勢木綿 textile手ぬぐい／夏の庭（なつのにわ） - SOU・SOU netshop - ブランド紹介",
    ),
    "夏の庭（なつのにわ）",
  );
  assert.equal(
    getDisplayName("【庭の花】【捺染】【濱文様】夏柄てぬぐい 花柄"),
    "庭の花",
  );
  assert.equal(
    getDisplayName("手ぬぐい 立花文穂 | SCOPE (スコープ)"),
    "立花文穂",
  );
  assert.equal(
    getDisplayName("「木陰」夏／緑／てぬぐい：手ぬぐい 染のお店"),
    "木陰",
  );
  assert.equal(
    getDisplayName("【春の思い出】青い鳥｜お気に入りの一枚"),
    "【春の思い出】青い鳥｜お気に入りの一枚",
  );
});
