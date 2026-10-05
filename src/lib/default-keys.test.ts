import { test } from "node:test";
import assert from "node:assert/strict";
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
});

test("functionAnchor points a function at the heading that describes it", () => {
  assert.equal(functionAnchor("@next"), "next");
  assert.equal(functionAnchor("@left"), "leftrighthomeend");
  assert.equal(functionAnchor("@katakana"), "hiraganakatakanahalf-katakana");
  assert.equal(functionAnchor("@alphanumeric"), "full-alphanumericalphanumeric");
  assert.equal(functionAnchor("@commit-katakana"), "commit-hiraganacommit-katakanacommit-half-katakanacommit-full-alphanumericcommit-alphanumeric");
  assert.equal(functionAnchor("@select-3"), "select-1select-9");
});
