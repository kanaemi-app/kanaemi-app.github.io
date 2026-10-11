/**
 * The Kanaemi release each documented feature first shipped in, for the
 * 「vX.Y.Z から」 badges. Each entry was traced in Kanaemi's history to the
 * commit that introduced the feature, then to the first tag containing it;
 * a commit no tag contains yet belongs to the next release.
 *
 * Features already in the first release get no entry: every page describes
 * them, and a badge on each line would say nothing.
 */

export const FIRST_RELEASE = "v0.1.0";
export const RELEASED = [
  "v0.1.0",
  "v0.1.1",
  "v0.1.2",
  "v0.1.3",
  "v0.1.4",
  "v0.1.5",
  "v0.2.0",
  "v0.3.0",
  "v0.4.0",
  "v0.4.1",
  "v0.5.0",
] as const;
export const NEXT_RELEASE = "v0.6.0";

export interface Since {
  version: string;
  commit: string;
}

export const SINCE = {
  // 押さえたままの印（[marks] hold）
  "hold-mark": { version: "v0.1.3", commit: "ff7163e" },
  // 設定アプリで辞書の語を読みの順に見る
  "browse-dictionary": { version: "v0.1.3", commit: "340b69a" },
  // 設定アプリで、割り当てに要る OS の許可がないことを示す
  "permission-notice": { version: "v0.1.3", commit: "b8a9fff" },
  // 送り仮名の打ちかけを仕上げると、送り仮名を伸ばして変換し直す
  "okurigana-extend": { version: "v0.2.0", commit: "8642580" },
  // [romaji] keep_unfinished
  "keep-unfinished": { version: "v0.2.0", commit: "8396895" },
  // 出さないとした自分の登録を、登録ごと消す
  "remove-registration": { version: "v0.2.0", commit: "aafaef5" },
  // @undo-commit（確定した候補を選び直す）
  "undo-commit": { version: "v0.2.0", commit: "933dc2b" },
  // 表記の置き場所
  placeholders: { version: "v0.3.0", commit: "fd7e01c" },
  // functions フォルダの Luau の関数
  "user-functions": { version: "v0.3.0", commit: "e8080d3" },
  // 組み込みの辞書と関数、[functions] disabled、設定アプリの「関数」
  "builtin-dictionaries": { version: "v0.3.0", commit: "c6acad9" },
  // 送り仮名付きの語の、行だけを持つ書き方（か*k）
  "okurigana-row": { version: "v0.4.0", commit: "d4169c6" },
  // @complete・@complete-previous と Tab のキー
  complete: { version: "v0.5.0", commit: "f5625c6" },
  // 補完の読みの一覧と [keys.completion]
  "completion-list": { version: "v0.5.0", commit: "dac56f8" },
  // @reread-kana（打ったかなを読みに戻す）
  "reread-kana": { version: "v0.5.0", commit: "46cde18" },
  // ほかの IME と SKK の辞書の取り込みと書き出し
  "import-export": { version: "v0.5.0", commit: "ff44715" },
  // 設定アプリでユーザー辞書の語を足し、直し、消す
  "edit-words": { version: "v0.5.0", commit: "4ac3f1d" },
  // [keys] send_except
  "send-except": { version: "v0.5.0", commit: "8531056" },
  // [keys.application.<OS>] と OS ごとの既定の置き換え
  "os-remaps": { version: "v0.5.0", commit: "9514615" },
  // 候補の一覧の辞書の名前と、@next-page・@previous-page、page-up・page-down
  "candidate-pages": { version: "v0.5.0", commit: "008a425" },
  // 候補の意味を OS の辞書で引いて、候補の一覧の横に出す
  "candidate-meanings": { version: "v0.5.0", commit: "2077164" },
  // Linux の Fcitx5 版
  fcitx5: { version: "v0.5.0", commit: "f4fb903" },
  // かなモードの Space をローマ字の表に通す
  "romaji-space": { version: "v0.5.0", commit: "6670682" },
  // ローマ字の打ちかけの続きになるキーを、割り当てより先に表に通す
  "unfinished-romaji-first": { version: "v0.5.0", commit: "7437e9b" },
  // キーの名前 zenkaku-hankaku・caps-lock
  "zenkaku-caps": { version: "v0.5.0", commit: "dbdd4be" },
  // [keys.registration.kana-mode]・[keys.registration.abc-mode]
  "registration-modes": { version: "v0.5.0", commit: "9ed86b3" },
  // かなモードで大文字を打つと ABC モードへ（[keys] abc_on_capital）
  "abc-on-capital": { version: "v0.6.0", commit: "4f18818" },
} satisfies Record<string, Since>;

export type Feature = keyof typeof SINCE;

/** The badge text for a feature: the release it can be used from. */
export function sinceLabel(feature: string): string {
  const found = (SINCE as Record<string, Since>)[feature];
  if (!found) throw new Error(`no release is recorded for the feature "${feature}"`);
  return `${found.version} から`;
}

/**
 * How many of the newest minor lines (X.Y, patches ignored) keep their
 * badges. Older badges drop off by themselves as new lines are released,
 * rather than piling up on every page.
 */
export const SHOWN_MINOR_LINES = 5;

const RELEASE_VERSION = /^v?(\d+)\.(\d+)(?:\.\d+)?$/;

function minorLine(version: string): [number, number] {
  const m = RELEASE_VERSION.exec(version);
  if (!m) throw new Error(`not a release version: "${version}"`);
  return [Number(m[1]), Number(m[2])];
}

/** Whether a feature from `version` still gets a badge, given every version known. */
export function badgeShown(version: string, known: readonly string[]): boolean {
  const lines = [...new Set(known.map((v) => minorLine(v).join(".")))]
    .map((l) => l.split(".").map(Number))
    .sort((a, b) => b[0] - a[0] || b[1] - a[1])
    .slice(0, SHOWN_MINOR_LINES)
    .map((l) => l.join("."));
  return lines.includes(minorLine(version).join("."));
}

/**
 * The versions to count lines from: the releases recorded here, the upcoming
 * one, the versions in the mapping, and any fetched from GitHub's releases.
 */
export function knownVersions(fetched: readonly string[] = []): string[] {
  const recorded = Object.values(SINCE as Record<string, Since>).map((s) => s.version);
  const plain = fetched.filter((v) => RELEASE_VERSION.test(v));
  return [...new Set([...RELEASED, NEXT_RELEASE, ...recorded, ...plain])];
}

/**
 * Whether a feature's badge says only what the badge of the page it is on
 * (`pageFeature`, from the page's frontmatter) already says for the whole page.
 */
export function repeatsPage(feature: string, pageFeature: string | undefined): boolean {
  if (pageFeature === undefined) return false;
  const all = SINCE as Record<string, Since>;
  return all[feature]?.version === all[pageFeature]?.version;
}
