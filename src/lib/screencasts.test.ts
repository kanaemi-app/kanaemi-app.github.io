import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DOCS = new URL("../content/docs/", import.meta.url).pathname;
const PUBLIC = new URL("../../public/screencasts/", import.meta.url).pathname;
const SCENES = new URL("../../scripts/screencast/scenes/", import.meta.url).pathname;

function mdxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return mdxFiles(path);
    return entry.name.endsWith(".mdx") ? [path] : [];
  });
}

/** The names the pages pass to `<Screencast name="…">`. */
function namesInPages(): Set<string> {
  const names = new Set<string>();
  for (const file of mdxFiles(DOCS)) {
    for (const m of readFileSync(file, "utf8").matchAll(/<Screencast\b[^>]*\bname="([^"]+)"/g)) {
      names.add(m[1]);
    }
  }
  return names;
}

test("every screencast a page shows has its video, its poster and the scene it was recorded from", () => {
  const missing = [...namesInPages()].flatMap((name) =>
    [`${PUBLIC}${name}.mp4`, `${PUBLIC}${name}.webp`, `${SCENES}${name}.txt`]
      .filter((path) => !existsSync(path))
      .map((path) => `${name}: ${path}`),
  );
  assert.deepEqual(missing, []);
});

test("every scene is shown on some page", () => {
  const shown = namesInPages();
  const scenes = readdirSync(SCENES)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => f.replace(/\.txt$/, ""));
  assert.deepEqual(
    scenes.filter((s) => !shown.has(s)),
    [],
  );
});
