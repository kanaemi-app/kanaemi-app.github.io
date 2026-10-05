/**
 * A small imitation of Kanaemi's way of typing, for the demo on the landing
 * page: kana mode only, Hepburn and Kunrei romaji, `;` to start a reading or
 * okurigana, Space / Enter / Escape / Backspace. It is not the real engine and
 * leaves out conjugation, registration and ranking; the dictionary it is given
 * lists every form it can convert.
 */

const SYLLABLES: Record<string, string> = {
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", si: "し", shi: "し", su: "す", se: "せ", so: "そ",
  ta: "た", ti: "ち", chi: "ち", tu: "つ", tsu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", hu: "ふ", fu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を", nn: "ん",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", zi: "じ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sya: "しゃ", syu: "しゅ", syo: "しょ", sha: "しゃ", shu: "しゅ", sho: "しょ",
  tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ", cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  zya: "じゃ", zyu: "じゅ", zyo: "じょ", ja: "じゃ", ju: "じゅ", jo: "じょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  "-": "ー", ",": "、", ".": "。",
};

const RULES = Object.keys(SYLLABLES);
const VOWELS = "aeiou";

/** Turn romaji into kana as far as it goes; returns the kana and what is still waiting. */
export function romajiToKana(input: string): { kana: string; rest: string } {
  let kana = "";
  let rest = input;
  while (rest !== "") {
    const longer = RULES.some((r) => r.length > rest.length && r.startsWith(rest));
    if (longer) break;
    let matched = "";
    for (const r of RULES) {
      if (rest.startsWith(r) && r.length > matched.length) matched = r;
    }
    if (matched) {
      kana += SYLLABLES[matched];
      rest = rest.slice(matched.length);
    } else if (rest[0] === "n" && rest.length > 1) {
      kana += "ん";
      rest = rest.slice(1);
    } else if (rest.length > 1 && rest[0] === rest[1] && !VOWELS.includes(rest[0])) {
      kana += "っ";
      rest = rest.slice(1);
    } else {
      rest = rest.slice(1);
    }
  }
  return { kana, rest };
}

function katakana(hiragana: string): string {
  return [...hiragana]
    .map((c) => {
      const code = c.codePointAt(0) ?? 0;
      return code >= 0x3041 && code <= 0x3096 ? String.fromCodePoint(code + 0x60) : c;
    })
    .join("");
}

export type Scene = "kana" | "reading" | "candidates";

export class DemoEngine {
  committed = "";
  scene: Scene = "kana";
  #dictionary: Record<string, string[]>;
  #pending = "";
  #reading = "";
  /** The okurigana typed so far, or null when its start has not been marked. */
  #okuri: string | null = null;
  #candidates: string[] = [];
  #index = 0;

  constructor(dictionary: Record<string, string[]>) {
    this.#dictionary = dictionary;
  }

  get preedit(): string {
    switch (this.scene) {
      case "kana":
        return this.#pending;
      case "reading":
        return `›${this.#reading}${this.#okuri === null ? "" : `*${this.#okuri}`}${this.#pending}`;
      case "candidates":
        return `»${this.#candidates[this.#index]}${this.#pending}`;
    }
  }

  press(key: string): void {
    switch (this.scene) {
      case "kana":
        return this.#pressKana(key);
      case "reading":
        return this.#pressReading(key);
      case "candidates":
        return this.#pressCandidates(key);
    }
  }

  #pressKana(key: string): void {
    if (key === ";") {
      this.#flushPending();
      this.#startReading();
    } else if (key === "Backspace") {
      if (this.#pending) this.#pending = this.#pending.slice(0, -1);
      else this.committed = [...this.committed].slice(0, -1).join("");
    } else if (key.length === 1) {
      const { kana, rest } = romajiToKana(this.#pending + key);
      this.committed += kana;
      this.#pending = rest;
    }
  }

  #pressReading(key: string): void {
    if (key === ";") {
      if (this.#reading === "" && this.#pending === "") {
        this.committed += "；";
        this.scene = "kana";
      } else if (this.#okuri === null) {
        this.#absorbPending();
        if (this.#reading !== "") this.#okuri = "";
      }
    } else if (key === "Space") {
      this.#absorbPending();
      this.#convert();
    } else if (key === "Enter") {
      this.#absorbPending();
      this.committed += this.#reading + (this.#okuri ?? "");
      this.#reset();
    } else if (key === "Escape") {
      this.#reset();
    } else if (key === "Backspace") {
      if (this.#pending) this.#pending = this.#pending.slice(0, -1);
      else if (this.#okuri) this.#okuri = this.#okuri.slice(0, -1);
      else if (this.#okuri === "") this.#okuri = null;
      else if (this.#reading) this.#reading = [...this.#reading].slice(0, -1).join("");
      else this.#reset();
    } else if (key.length === 1) {
      const { kana, rest } = romajiToKana(this.#pending + key);
      this.#pending = rest;
      if (this.#okuri === null) {
        this.#reading += kana;
      } else if (kana !== "") {
        // Kanaemi converts as soon as the first unit of the okurigana is typed.
        this.#okuri += kana;
        this.#convert();
      }
    }
  }

  #pressCandidates(key: string): void {
    if (key === "Space") {
      this.#index = (this.#index + 1) % this.#candidates.length;
    } else if (key === "Enter") {
      this.#commitCandidate();
    } else if (key === "Escape" || key === "Backspace") {
      this.scene = "reading";
      this.#okuri = null;
      this.#pending = "";
      if (key === "Backspace") this.#reading = [...this.#reading].slice(0, -1).join("");
    } else if (key === ";") {
      this.#commitCandidate();
      this.#startReading();
    } else if (key.length === 1) {
      this.#commitCandidate();
      this.#pressKana(key);
    }
  }

  #convert(): void {
    if (this.#reading === "") return;
    const okuri = this.#okuri;
    const found =
      okuri === null || okuri === ""
        ? (this.#dictionary[this.#reading] ?? [])
        : (this.#dictionary[`${this.#reading}*${[...okuri][0]}`] ?? []).filter((w) => w.endsWith(okuri));
    const kata = katakana(this.#reading + (okuri ?? ""));
    this.#candidates = found.includes(kata) ? found : [...found, kata];
    this.#index = 0;
    this.scene = "candidates";
  }

  #commitCandidate(): void {
    this.committed += this.#candidates[this.#index];
    const pending = this.#pending;
    this.#reset();
    this.#pending = pending;
  }

  #startReading(): void {
    this.scene = "reading";
    this.#reading = "";
    this.#okuri = null;
    this.#pending = "";
  }

  #absorbPending(): void {
    const { kana } = romajiToKana(this.#pending.endsWith("n") ? `${this.#pending}n` : this.#pending);
    if (this.#okuri === null) this.#reading += kana;
    else this.#okuri += kana;
    this.#pending = "";
  }

  #flushPending(): void {
    const { kana } = romajiToKana(this.#pending.endsWith("n") ? `${this.#pending}n` : this.#pending);
    this.committed += kana;
    this.#pending = "";
  }

  #reset(): void {
    this.scene = "kana";
    this.#reading = "";
    this.#okuri = null;
    this.#pending = "";
    this.#candidates = [];
    this.#index = 0;
  }
}
