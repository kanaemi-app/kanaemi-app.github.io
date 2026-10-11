import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const DOCS = new URL("../content/docs/", import.meta.url).pathname;

function mdxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return mdxFiles(path);
    return entry.name.endsWith(".mdx") ? [path] : [];
  });
}

const HEADING = /^#{2,6}\s/;
const BADGE_ALONE = /^<Since\b[^>]*\/>$/;
const ROW_OR_ITEM = /^(\||[-*]\s|\d+\.\s)/;

/**
 * The `<Since>` badges in a page's body that say nothing of what they cover.
 * A badge may sit on a heading (alone on its line, with only blank lines
 * between it and a heading line above), or in a table row or a list item,
 * where the row or the item names it; a badge at the end of a paragraph may not.
 */
export function badgesOffHeadings(source: string): number[] {
  const lines = source.split("\n");
  const offending: number[] = [];
  let inFrontmatter = lines[0] === "---";
  let inFence = false;
  let previous = "";
  lines.forEach((line, i) => {
    if (inFrontmatter) {
      if (i > 0 && line === "---") inFrontmatter = false;
      return;
    }
    const trimmed = line.trim();
    if (/^(```|~~~)/.test(trimmed)) inFence = !inFence;
    if (!inFence && line.includes("<Since") && !ROW_OR_ITEM.test(trimmed)) {
      if (!BADGE_ALONE.test(trimmed) || !HEADING.test(previous)) offending.push(i + 1);
    }
    if (trimmed !== "") previous = line;
  });
  return offending;
}

test("badgesOffHeadings accepts a badge alone on the line after a heading, blank lines between", () => {
  const page = '## 補完\n\n<Since feature="complete" />\n\n本文\n';
  assert.deepEqual(badgesOffHeadings(page), []);
});

test("badgesOffHeadings reports a badge at the end of a paragraph", () => {
  const page = '## 補完\n\n補完できる。<Since feature="complete" />\n';
  assert.deepEqual(badgesOffHeadings(page), [3]);
});

test("badgesOffHeadings accepts a badge in a table row or a list item, which names what it covers", () => {
  const page = [
    "## 補完",
    "",
    "本文",
    "",
    '- 一覧 <Since feature="complete" />',
    '  * 入れ子 <Since feature="complete" />',
    '1. 番号 <Since feature="complete" />',
    "",
    '| キー | 働き <Since feature="complete" /> |',
  ].join("\n");
  assert.deepEqual(badgesOffHeadings(page), []);
});

test("badgesOffHeadings reports a badge alone on its line under a paragraph rather than a heading", () => {
  const page = '## 補完\n\n本文\n\n<Since feature="complete" />\n';
  assert.deepEqual(badgesOffHeadings(page), [5]);
});

test("badgesOffHeadings ignores the frontmatter and code blocks", () => {
  const page = '---\ntitle: x\nsince: complete\n---\n\n```mdx\n本文 <Since feature="complete" />\n```\n';
  assert.deepEqual(badgesOffHeadings(page), []);
});

test("every badge in the pages sits on a heading, a table row or a list item, so the reader can tell what it covers", () => {
  const offending = mdxFiles(DOCS).flatMap((file) =>
    badgesOffHeadings(readFileSync(file, "utf8")).map((line) => `${relative(DOCS, file)}:${line}`),
  );
  assert.deepEqual(offending, []);
});
