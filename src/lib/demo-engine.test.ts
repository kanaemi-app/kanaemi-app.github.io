import { test } from "node:test";
import assert from "node:assert/strict";
import { DemoEngine } from "./demo-engine.ts";

const dictionary = {
  かんじ: ["漢字", "感じ"],
  "か*く": ["書く", "描く"],
  にほんご: ["日本語"],
};

function typed(keys: string[]): DemoEngine {
  const engine = new DemoEngine(dictionary);
  for (const key of keys) engine.press(key);
  return engine;
}

const chars = (s: string) => [...s];

test("kana mode commits kana as it is typed", () => {
  const e = typed(chars("watashiha"));
  assert.equal(e.committed, "わたしは");
  assert.equal(e.preedit, "");
});

test("an unfinished romaji stays in the preedit", () => {
  const e = typed(chars("wak"));
  assert.equal(e.committed, "わ");
  assert.equal(e.preedit, "k");
});

test("n before a consonant becomes ん, and a doubled consonant っ", () => {
  assert.equal(typed(chars("kanka")).committed, "かんか");
  assert.equal(typed(chars("kitte")).committed, "きって");
});

test("; starts a reading, marked with ›", () => {
  const e = typed(chars(";kanji"));
  assert.equal(e.committed, "");
  assert.equal(e.preedit, "›かんじ");
  assert.equal(e.scene, "reading");
});

test("Space converts and marks the candidate with »; Space again moves on", () => {
  const e = typed([...chars(";kanji"), "Space"]);
  assert.equal(e.preedit, "»漢字");
  e.press("Space");
  assert.equal(e.preedit, "»感じ");
});

test("the candidates end with the reading in katakana", () => {
  const e = typed([...chars(";kanji"), "Space", "Space", "Space"]);
  assert.equal(e.preedit, "»カンジ");
});

test("Enter commits the candidate", () => {
  const e = typed([...chars(";kanji"), "Space", "Enter"]);
  assert.equal(e.committed, "漢字");
  assert.equal(e.preedit, "");
  assert.equal(e.scene, "kana");
});

test("Enter on a reading commits it as kana", () => {
  assert.equal(typed([...chars(";kanji"), "Enter"]).committed, "かんじ");
});

test("a ; in the middle of a reading starts okurigana and converts at once", () => {
  const e = typed(chars(";ka;k"));
  assert.equal(e.preedit, "›か*k");
  e.press("u");
  assert.equal(e.preedit, "»書く");
  assert.equal(e.scene, "candidates");
});

test("; on a candidate commits it and starts the next reading", () => {
  const e = typed([...chars(";kanji"), "Space", ";"]);
  assert.equal(e.committed, "漢字");
  assert.equal(e.preedit, "›");
});

test("a letter on a candidate commits it and goes on typing", () => {
  const e = typed([...chars(";kanji"), "Space", ...chars("wo")]);
  assert.equal(e.committed, "漢字を");
});

test(";; types a full-width semicolon", () => {
  assert.equal(typed(chars(";;")).committed, "；");
});

test("Escape cancels a reading, and goes back from candidates to the reading", () => {
  assert.equal(typed([...chars(";kanji"), "Escape"]).preedit, "");
  const e = typed([...chars(";kanji"), "Space", "Escape"]);
  assert.equal(e.preedit, "›かんじ");
});

test("Backspace removes the last kana of a reading, then leaves it", () => {
  const e = typed([...chars(";kan"), "Backspace"]);
  assert.equal(e.preedit, "›か");
  e.press("Backspace");
  assert.equal(e.preedit, "›");
  e.press("Backspace");
  assert.equal(e.preedit, "");
  assert.equal(e.scene, "kana");
});

test("Backspace in kana mode deletes committed text", () => {
  const e = typed([...chars("kana"), "Backspace"]);
  assert.equal(e.committed, "か");
});

test("a reading with no words still offers its katakana", () => {
  const e = typed([...chars(";pdf"), "Space"]);
  assert.equal(e.scene, "reading");
  const k = typed([...chars(";kanaemi"), "Space"]);
  assert.equal(k.preedit, "»カナエミ");
});

test("punctuation becomes Japanese punctuation", () => {
  assert.equal(typed(chars("ne,ne.")).committed, "ね、ね。");
});
