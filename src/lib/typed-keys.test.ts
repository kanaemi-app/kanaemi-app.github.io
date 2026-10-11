import { test } from "node:test";
import assert from "node:assert/strict";
import { typedKeys, type KeyNode } from "./typed-keys.ts";

const shown = (keys: KeyNode[] | undefined) =>
  keys?.map((k) => (k.properties.className?.includes("key-begin") ? `[${k.children[0].value}]` : k.children[0].value));

test("keys typed one after another are shown one key each", () => {
  assert.deepEqual(shown(typedKeys(";1ko")), ["[;]", "1", "k", "o"]);
  assert.deepEqual(shown(typedKeys("kya")), ["k", "y", "a"]);
});

test("the key that begins a reading stands out wherever it is", () => {
  assert.deepEqual(shown(typedKeys(";")), ["[;]"]);
  assert.deepEqual(shown(typedKeys(";ka;tta")), ["[;]", "k", "a", "[;]", "t", "t", "a"]);
});

test("a key named by its name stays one key", () => {
  for (const name of ["Tab", "Space", "Esc", "Ctrl", "英数", "z"]) {
    assert.equal(typedKeys(name), undefined, name);
  }
});
