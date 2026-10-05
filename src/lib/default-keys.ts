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

const SCENE_HEADER = /^#\[keys\.([a-z-]+)\]$/;
const BINDING = /^#"(.+)" = "(.+)"$/;

/**
 * Read the default key bindings out of Kanaemi's settings template, where
 * every setting is a commented-out line and each `[keys.<scene>]` table is
 * introduced by a comment saying when it applies.
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
  eisu: "英数",
  kana: "かな",
  henkan: "変換",
  muhenkan: "無変換",
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
 * The functions that the reference page describes under one heading, as the
 * heading lists them. The page's anchors are its headings slugged, which drops
 * the 「・」 and 「〜」 between the names.
 */
const FUNCTION_GROUPS = [
  ["left", "right", "home", "end"],
  ["hiragana", "katakana", "half-katakana"],
  ["full-alphanumeric", "alphanumeric"],
  [
    "commit-hiragana",
    "commit-katakana",
    "commit-half-katakana",
    "commit-full-alphanumeric",
    "commit-alphanumeric",
  ],
];

/** The anchor on the functions reference page for a function written as `@name`. */
export function functionAnchor(action: string): string {
  const fn = action.replace(/^@/, "");
  if (/^select-\d$/.test(fn)) return "select-1select-9";
  const group = FUNCTION_GROUPS.find((g) => g.includes(fn));
  return group ? group.join("") : fn;
}
