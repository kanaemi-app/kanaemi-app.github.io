export interface Binding {
  /** A function (`@next`) or, in the `application` scene, the key sent instead. */
  action: string;
  keys: string[];
}

export interface Scene {
  scene: string;
  title: string;
  bindings: Binding[];
}

const SCENE_HEADER = /^#\[keys\.([a-z-]+(?:\.[a-z-]+)?)\]$/;
const BINDING = /^#"(.+)" = "(.+)"$/;

/**
 * Read the default key bindings out of Kanaemi's settings template, where
 * every setting is a commented-out line and each `[keys.<scene>]` table is
 * introduced by a comment saying when it applies. A table that narrows a scene
 * to one mode or OS (`[keys.application.macos]`) is a scene of its own, named
 * with the dot, and may be empty.
 */
export function parseDefaultKeys(template: string): Scene[] {
  const scenes: Scene[] = [];
  let previous = "";
  let current: Scene | undefined;
  for (const raw of template.split("\n")) {
    const line = raw.trim();
    const header = SCENE_HEADER.exec(line);
    if (header) {
      // The comment can go on after the first full stop; the heading is the clause before it.
      const title = previous.replace(/^#\s*/, "").split("。")[0];
      current = { scene: header[1], title, bindings: [] };
      scenes.push(current);
    } else if (line.startsWith("#[")) {
      current = undefined;
    } else if (current) {
      const binding = BINDING.exec(line);
      if (binding) {
        const [, key, action] = binding;
        const existing = current.bindings.find((b) => b.action === action);
        if (existing) existing.keys.push(key);
        else current.bindings.push({ action, keys: [key] });
      }
    }
    if (line !== "") previous = line;
  }
  if (scenes.length === 0) {
    throw new Error("the settings template has no key bindings; has its format changed?");
  }
  return scenes;
}

const NAMES: Record<string, string> = {
  ctrl: "Ctrl",
  cmd: "Cmd",
  alt: "Option",
  shift: "Shift",
  space: "Space",
  enter: "Enter",
  esc: "Esc",
  backspace: "Backspace",
  delete: "Delete",
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
  home: "Home",
  end: "End",
  tab: "Tab",
  "page-up": "Page Up",
  "page-down": "Page Down",
  eisu: "英数",
  kana: "かな",
  henkan: "変換",
  muhenkan: "無変換",
  "zenkaku-hankaku": "半角/全角",
  "caps-lock": "Caps Lock",
};

const SIDES: Record<string, string> = { left: "左", right: "右" };

function name(key: string): string {
  const sided = /^(left|right)-(shift|ctrl|cmd|alt)$/.exec(key);
  if (sided) return `${SIDES[sided[1]]} ${NAMES[sided[2]]}`;
  if (/^f\d+$/.test(key)) return key.toUpperCase();
  if (key.length === 1) return key.toUpperCase();
  return NAMES[key] ?? key;
}

/** The caps to draw for a key as the settings write it, one per key pressed together. */
export function keyLabel(key: string): string[] {
  const [chord, how] = key.split("#");
  const caps = chord.split("+").map(name);
  if (how === "tap") caps[caps.length - 1] += "（単独）";
  if (how === "hold") caps[caps.length - 1] += "（押さえたまま）";
  return caps;
}

/**
 * The functions reference page heads each function, or each set of functions
 * that work alike, with what it does; the heading's anchor is its slug.
 */
const FUNCTION_HEADINGS: [string, string[]][] = [
  ["次の候補", ["next"]],
  ["前の候補", ["previous"]],
  ["確定する", ["commit"]],
  ["取り消す", ["cancel"]],
  ["前の文字を消す", ["backspace"]],
  ["後ろの文字を消す", ["delete"]],
  ["カーソルを動かす", ["left", "right", "home", "end"]],
  ["かなの形にして選ぶ", ["hiragana", "katakana", "half-katakana"]],
  ["英数の形にして選ぶ", ["full-alphanumeric", "alphanumeric"]],
  [
    "形にして確定する",
    [
      "commit-hiragana",
      "commit-katakana",
      "commit-half-katakana",
      "commit-full-alphanumeric",
      "commit-alphanumeric",
    ],
  ],
  ["登録する", ["register"]],
  ["候補を出さないようにする", ["forget"]],
  ["ページを送る", ["next-page", "previous-page"]],
  ["補完する", ["complete", "complete-previous"]],
  ["abc-モードへ", ["abc"]],
  ["かなモードへ", ["kana"]],
  ["読みを始める", ["begin"]],
  ["打ったかなを読みに戻す", ["reread-kana"]],
  ["確定を選び直す", ["undo-commit"]],
];

/** The anchor on the functions reference page for a function written as `@name`. */
export function functionAnchor(action: string): string {
  const fn = action.replace(/^@/, "");
  if (/^select-\d$/.test(fn)) return "番号で選ぶ";
  const heading = FUNCTION_HEADINGS.find(([, names]) => names.includes(fn));
  return heading ? heading[0] : fn;
}
