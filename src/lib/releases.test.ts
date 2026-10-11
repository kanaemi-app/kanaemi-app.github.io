import { test } from "node:test";
import assert from "node:assert/strict";
import { renderNotes } from "./releases.ts";

test("renderNotes renders GitHub's generated notes, linking the bare URLs", () => {
  const html = renderNotes(
    [
      "## What's Changed",
      "* 不安定なテストを 2 つ直す by @lambdalisue in https://github.com/kanaemi-app/kanaemi/pull/18",
      "",
      "**Full Changelog**: https://github.com/kanaemi-app/kanaemi/compare/v0.4.0...v0.4.1",
    ].join("\n"),
  );
  assert.match(html, /<li>不安定なテストを 2 つ直す by @lambdalisue in <a href="https:\/\/github.com\/kanaemi-app\/kanaemi\/pull\/18">/);
  assert.match(html, /<strong>Full Changelog<\/strong>/);
});

test("renderNotes puts the notes' headings below the version's, so the page outline stays the versions", () => {
  assert.match(renderNotes("## What's Changed"), /^<h4>What's Changed<\/h4>/);
  assert.match(renderNotes("##### Deep"), /^<h6>Deep<\/h6>/);
});

test("renderNotes drops raw HTML, keeping the text between the tags", () => {
  const html = renderNotes('<script>alert(1)</script>\n\ninline <b onclick="x()">bold</b>');
  assert.doesNotMatch(html, /script|onclick|<b>/);
  assert.match(html, /inline bold/);
});

test("renderNotes keeps only web and mail links, and only web images", () => {
  const html = renderNotes(
    "[bad](javascript:alert(1)) [ok](https://example.com) [mail](mailto:a@example.com) ![x](data:image/png;base64,AA) ![y](https://example.com/y.png)",
  );
  assert.doesNotMatch(html, /javascript:|data:/);
  assert.match(html, /bad <a href="https:\/\/example.com">ok<\/a> <a href="mailto:a@example.com">mail<\/a>/);
  assert.match(html, /<img src="https:\/\/example.com\/y.png" alt="y">/);
});

test("renderNotes keeps the same links and images when they are written by reference", () => {
  const html = renderNotes(
    [
      "[bad][a] [ok][b] ![x][c] ![y][d]",
      "",
      "[a]: javascript:alert(1)",
      "[b]: https://example.com",
      "[c]: data:image/png;base64,AA",
      "[d]: https://example.com/y.png",
    ].join("\n"),
  );
  assert.doesNotMatch(html, /javascript:|data:/);
  assert.match(html, /bad <a href="https:\/\/example.com">ok<\/a>/);
  assert.match(html, /<img src="https:\/\/example.com\/y.png" alt="y">/);
});

test("renderNotes renders empty notes as nothing", () => {
  assert.equal(renderNotes("").trim(), "");
});
