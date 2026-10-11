import { test } from "node:test";
import assert from "node:assert/strict";
import { entriesLabel, sizeLabel } from "./dictionaries.ts";

test("a size of a megabyte or more is shown in MB to one decimal place", () => {
  assert.equal(sizeLabel(6374371), "6.1 MB");
  assert.equal(sizeLabel(1024 * 1024), "1.0 MB");
});

test("a smaller size is shown in whole KB, and never as 0 KB", () => {
  assert.equal(sizeLabel(97153), "95 KB");
  assert.equal(sizeLabel(10), "1 KB");
});

test("the number of entries is grouped by thousands", () => {
  assert.equal(entriesLabel(619006), "619,006");
  assert.equal(entriesLabel(18), "18");
});
