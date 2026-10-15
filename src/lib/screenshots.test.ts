import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DOCS = new URL("../content/docs/", import.meta.url).pathname;
const PUBLIC = new URL("../../public/screenshots/", import.meta.url).pathname;

function mdxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return mdxFiles(path);
    return entry.name.endsWith(".mdx") ? [path] : [];
  });
}

/** The names the pages pass to `<Screenshot name="…">`. */
function namesInPages(): Set<string> {
  const names = new Set<string>();
  for (const file of mdxFiles(DOCS)) {
    for (const m of readFileSync(file, "utf8").matchAll(/<Screenshot\b[^>]*\bname="([^"]+)"/g)) {
      names.add(m[1]);
    }
  }
  return names;
}

test("every screenshot a page shows has its light and its dark image", () => {
  const missing = [...namesInPages()].flatMap((name) =>
    [`${PUBLIC}${name}.webp`, `${PUBLIC}${name}-dark.webp`]
      .filter((path) => !existsSync(path))
      .map((path) => `${name}: ${path}`),
  );
  assert.deepEqual(missing, []);
});

test("every screenshot kept is shown on some page", () => {
  const shown = namesInPages();
  const kept = readdirSync(PUBLIC)
    .filter((f) => f.endsWith(".webp") && !f.endsWith("-dark.webp"))
    .map((f) => f.replace(/\.webp$/, ""));
  assert.deepEqual(
    kept.filter((name) => !shown.has(name)),
    [],
  );
});
