import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import GithubSlugger from "github-slugger";
import { functionAnchor, keyLabel, parseDefaultKeys } from "./default-keys.ts";

const template = `
# 未確定文字列の印。
#[marks]
#reading = "›"

#[keys]
#tap_timeout_ms = 300

# 読みを打っているとき
#[keys.reading]
#"space" = "@next"
#"ctrl+n" = "@next"
#"enter" = "@commit"

# ふだん（変換中の文字がないとき）。押したキーを置き換える。
#[keys.application]
#"ctrl+h" = "backspace"
`;

const nested = `
# 語を登録しているとき
#[keys.registration]
#"enter" = "@commit"

# モードを限った割り当て。
# かなモードだけ
#[keys.registration.kana-mode]

# ふだん
#[keys.application]
#"ctrl+m" = "enter"

# macOS だけ。Ctrl+H などは、macOS の文字欄がもともと扱う。
#[keys.application.macos]
#"ctrl+backspace" = "alt+backspace"
`;

test("parseDefaultKeys groups the keys of each scene by what they do", () => {
  assert.deepEqual(parseDefaultKeys(template), [
    {
      scene: "reading",
      title: "読みを打っているとき",
      bindings: [
        { action: "@next", keys: ["space", "ctrl+n"] },
        { action: "@commit", keys: ["enter"] },
      ],
    },
    {
      scene: "application",
      title: "ふだん（変換中の文字がないとき）",
      bindings: [{ action: "backspace", keys: ["ctrl+h"] }],
    },
  ]);
});

test("parseDefaultKeys skips settings under [keys] that are not bindings", () => {
  const scenes = parseDefaultKeys(template);
  assert.ok(scenes.every((s) => s.scene !== ""));
});

test("parseDefaultKeys reads a table under a scene as a scene of its own, even when it is empty", () => {
  assert.deepEqual(
    parseDefaultKeys(nested).map(({ scene, title, bindings }) => ({ scene, title, count: bindings.length })),
    [
      { scene: "registration", title: "語を登録しているとき", count: 1 },
      { scene: "registration.kana-mode", title: "かなモードだけ", count: 0 },
      { scene: "application", title: "ふだん", count: 1 },
      { scene: "application.macos", title: "macOS だけ", count: 1 },
    ],
  );
});

test("parseDefaultKeys throws when the template has no key bindings", () => {
  assert.throws(() => parseDefaultKeys("#[marks]\n#reading = \"›\"\n"), /no key bindings/);
});

test("keyLabel names keys the way the docs write them", () => {
  assert.deepEqual(keyLabel("ctrl+n"), ["Ctrl", "N"]);
  assert.deepEqual(keyLabel("shift+space"), ["Shift", "Space"]);
  assert.deepEqual(keyLabel("left-shift#tap"), ["左 Shift（単独）"]);
  assert.deepEqual(keyLabel("space#hold"), ["Space（押さえたまま）"]);
  assert.deepEqual(keyLabel("eisu"), ["英数"]);
  assert.deepEqual(keyLabel("f7"), ["F7"]);
  assert.deepEqual(keyLabel(";"), [";"]);
  assert.deepEqual(keyLabel("shift+delete"), ["Shift", "Delete"]);
  assert.deepEqual(keyLabel("shift+tab"), ["Shift", "Tab"]);
  assert.deepEqual(keyLabel("ctrl+;"), ["Ctrl", ";"]);
  assert.deepEqual(keyLabel("page-up"), ["Page Up"]);
  assert.deepEqual(keyLabel("page-down"), ["Page Down"]);
  assert.deepEqual(keyLabel("zenkaku-hankaku"), ["半角/全角"]);
  assert.deepEqual(keyLabel("caps-lock"), ["Caps Lock"]);
});

test("functionAnchor points a function at the heading that describes it", () => {
  assert.equal(functionAnchor("@next"), "次の候補");
  assert.equal(functionAnchor("@left"), "カーソルを動かす");
  assert.equal(functionAnchor("@katakana"), "かなの形にして選ぶ");
  assert.equal(functionAnchor("@commit-katakana"), "形にして確定する");
  assert.equal(functionAnchor("@select-3"), "番号で選ぶ");
  assert.equal(functionAnchor("@abc"), "abc-モードへ");
  assert.equal(functionAnchor("@reread-kana"), "打ったかなを読みに戻す");
  assert.equal(functionAnchor("@undo-commit"), "確定を選び直す");
  assert.equal(functionAnchor("@paste"), "クリップボードから貼る");
});

test("every function a key can be bound to has its heading on the functions page", () => {
  const page = readFileSync(new URL("../content/docs/docs/reference/functions.mdx", import.meta.url), "utf8");
  const slugger = new GithubSlugger();
  const anchors = new Set(
    page
      .split("\n")
      .filter((line) => /^#{2,6}\s/.test(line))
      .map((line) => slugger.slug(line.replace(/^#+\s+/, ""))),
  );
  const template = readFileSync(new URL("../data/config.toml", import.meta.url), "utf8");
  const functions = new Set([...template.matchAll(/@[a-z][a-z0-9-]*/g)].map((m) => m[0]));
  functions.delete("@none");
  assert.ok(functions.size > 0);
  for (const fn of functions) {
    assert.ok(anchors.has(functionAnchor(fn)), `${fn} → #${functionAnchor(fn)}`);
  }
});
