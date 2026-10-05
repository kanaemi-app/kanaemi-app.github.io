"""Write the usage illustrations as SVG with live text into the directory given as
the first argument. build.sh outlines the text and renders the PNGs.

The pictures show the default key bindings; change them here when the defaults change.
"""
import os
import re
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
BRAND = Path(__file__).resolve().parents[2] / "public" / "logo"

DARK = os.environ.get("THEME") == "dark"
SUFFIX = "-dark" if DARK else ""


def mix(fg, bg, t):
    """Blend fg over bg at opacity t (tints of the brand colours, not new hues)."""
    f = [int(fg[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(bg[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(b[i] + (f[i] - b[i]) * t):02x}" for i in range(3))


# Brand palette (kanaemi-brand README): ink, smile, auxiliary.
if DARK:
    INK, ACCENT, MUTED, PAPER = "#e8eaf0", "#f2704b", "#a3aab8", "#1d2433"
else:
    INK, ACCENT, MUTED, PAPER = "#1d2433", "#d9502e", "#5a6272", "#ffffff"
LINE = mix(INK, PAPER, 0.18)
SOFT = mix(INK, PAPER, 0.06)
ACCENT_TINT = mix(ACCENT, PAPER, 0.3)
KEYFILL = PAPER if not DARK else mix(INK, PAPER, 0.05)
# Latin in Quicksand (the wordmark face), Japanese in Zen Maru Gothic (the 「か」 face).
LATIN = "Quicksand Light"
KANA = "Zen Maru Gothic"


def inner(svg_file):
    s = (BRAND / svg_file).read_text()
    s = re.sub(r"^<svg[^>]*>", "", s)
    s = re.sub(r"</svg>\s*$", "", s)
    s = re.sub(r"<title>.*?</title>", "", s)
    return s


ICON = inner(f"kanaemi-icon{SUFFIX}.svg")
LOGO_H = inner(f"kanaemi-logo-horizontal{SUFFIX}.svg")


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def text(x, y, t, size=28, fill=INK, anchor="start", weight="500", extra=""):
    # resvg drops to a system font for Latin that follows a Japanese run, so a
    # line takes one face: Quicksand when it is all ASCII, Zen Maru Gothic otherwise.
    family = LATIN if re.fullmatch(r"[ -~]*", t) else KANA
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
        f'fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" {extra}>{esc(t)}</text>'
    )


def bold(x, y, t, size=28, fill=INK, anchor="start"):
    return text(x, y, t, size, fill, anchor, weight="700")


def key(x, y, w, h, label, hot=False, size=None, dim=False, sub=None):
    stroke = ACCENT if hot else (LINE if dim else INK)
    sw = 5 if not dim else 3
    r = min(w, h) * 0.24
    fill = KEYFILL
    out = [
        f'<rect x="{x+3}" y="{y+5}" width="{w}" height="{h}" rx="{r}" fill="{LINE if not hot else ACCENT_TINT}" opacity="0.6"/>',
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>',
    ]
    size = size or h * 0.42
    col = ACCENT if hot else (MUTED if dim else INK)
    ty = y + h / 2 + size * 0.36 - (size * 0.35 if sub else 0)
    out.append(bold(x + w / 2, ty, label, size, col, "middle") if not dim
               else text(x + w / 2, ty, label, size, col, "middle"))
    if sub:
        out.append(text(x + w / 2, y + h - h * 0.17, sub, size * 0.5, MUTED, "middle"))
    return "".join(out)


def keys_seq(x, y, seq, k=48, gap=8, hot=";"):
    """Draw a sequence of small keycaps; return svg and total width."""
    out, cx = [], x
    for ch in seq:
        w = k * 2.2 if ch == "Space" else (k * 1.8 if ch == "Enter" else k)
        lab = ch
        out.append(key(cx, y, w, k, lab, hot=(ch in hot), size=k * (0.36 if len(ch) > 1 else 0.5)))
        cx += w + gap
    return "".join(out), cx - gap - x


def shift_key(x, y, w, h, side):
    out = [key(x, y, w, h, "", hot=True)]
    size = h * 0.35
    label_x = x + w / 2 + (14 if side == "l" else -14)
    out.append(bold(label_x, y + h / 2 + size * 0.36, "Shift", size, ACCENT, "middle"))
    ix = x + w / 2 + (-50 if side == "l" else 50)
    iy = y + h / 2
    a = h * 0.17
    out.append(f'<path d="M{ix} {iy-a*1.3} L{ix+a*1.2} {iy} H{ix+a*0.5} V{iy+a*1.2} H{ix-a*0.5} V{iy} H{ix-a*1.2} Z" '
               f'fill="none" stroke="{ACCENT}" stroke-width="3.5" stroke-linejoin="round"/>')
    return "".join(out)


def smile(cx, cy, w, color=ACCENT, sw=8):
    return (f'<path d="M{cx-w/2} {cy} q{w/2} {w*0.4} {w} 0" fill="none" '
            f'stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>')


def arrow(x1, y1, x2, y2, color=MUTED, sw=4):
    import math
    a = math.atan2(y2 - y1, x2 - x1)
    h = 14
    p1 = (x2 - h * math.cos(a - 0.5), y2 - h * math.sin(a - 0.5))
    p2 = (x2 - h * math.cos(a + 0.5), y2 - h * math.sin(a + 0.5))
    return (f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" fill="none"/>'
            f'<path d="M{p1[0]:.1f} {p1[1]:.1f} L{x2} {y2} L{p2[0]:.1f} {p2[1]:.1f}" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>')


def preedit(x, y, t, size=40, anchor="start", color=INK, underline=True, width=None):
    out = [bold(x, y, t, size, color, anchor)]
    if underline and width:
        x0 = x - width / 2 if anchor == "middle" else x
        out.append(f'<path d="M{x0} {y+12} h{width}" stroke="{color}" stroke-width="3" '
                   f'stroke-dasharray="2 7" stroke-linecap="round"/>')
    return "".join(out)


def tap(cx, cy, color=ACCENT):
    return "".join(
        f'<path d="M{cx-r} {cy} a{r} {r*0.8} 0 0 1 {2*r} 0" fill="none" stroke="{color}" '
        f'stroke-width="4" stroke-linecap="round" opacity="{o}"/>'
        for r, o in ((16, 1), (30, 0.55)))


def chip(x, y, t, fill=INK, color=PAPER, size=24, padx=18, w=None):
    w = w or len(t) * size * 0.75 + padx * 2
    h = size * 1.7
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{fill}"/>'
            + bold(x + w / 2, y + h / 2 + size * 0.36, t, size, color, "middle"))


def header(title, sub=None, W=1200):
    out = [f'<g transform="translate(52 40) scale(0.42)">{ICON}</g>',
           bold(150, 100, title, 44)]
    if sub:
        out.append(text(150, 140, sub, 22, MUTED))
    return "".join(out)


def page(W, H, body, name):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
           f'<rect width="{W}" height="{H}" fill="{PAPER}"/>{body}</svg>')
    (OUT / f"{name}{SUFFIX}.svg").write_text(svg)


# ---------------------------------------------------------------- 1. Shift
def shift_image():
    W, H = 1200, 675
    b = [header("左右の Shift でモードを切り替える", "Shift だけをポンと押して離す（ほかのキーと一緒に押せば、ふつうの Shift）")]
    y = 200
    sw, kw, g = 200, 56, 8
    x = 72
    b.append(shift_key(x, y, sw, 80, "l"))
    b.append(tap(x + sw / 2, y - 18))
    cx = x + sw + 12
    for ch in "ZXCVBNM,./":
        b.append(key(cx, y + 12, kw, 56, ch, dim=True, size=22))
        cx += kw + g
    rx = cx - g + 12
    b.append(shift_key(rx, y, sw, 80, "r"))
    b.append(tap(rx + sw / 2, y - 18))

    # cards
    cy = 330
    for (x0, lcx, mode, out_t, note) in (
        (72, x + sw / 2, "ABC モード", "nihongo", "英字をそのまま打つ"),
        (628, rx + sw / 2, "かなモード", "にほんご", "ローマ字でかなを打つ"),
    ):
        b.append(arrow(lcx, y + 96, lcx, cy - 10, ACCENT))
        b.append(f'<rect x="{x0}" y="{cy}" width="500" height="290" rx="36" fill="{KEYFILL}" stroke="{INK}" stroke-width="6"/>')
        b.append(chip(x0 + 32, cy + 30, mode, size=26, w=200))
        b.append(text(x0 + 252, cy + 63, note, 22, MUTED))
        s, w = keys_seq(x0 + 32, cy + 110, "nihongo", k=46, gap=7, hot="")
        b.append(s)
        b.append(arrow(x0 + 250, cy + 175, x0 + 250, cy + 205))
        b.append(bold(x0 + 250, cy + 256, out_t, 46, INK, "middle"))
    b.append(text(600, 650, "同じキーでも、モードで打てるものが変わる", 22, MUTED, "middle"))
    page(W, H, "".join(b), "shift")


# ---------------------------------------------------------------- 2. flow
def flow_image():
    W, H = 1200, 675
    b = [header("; で読みを始め、Space で変換", "かなモードでは、打ったかなはそのまま確定する。漢字にしたい語だけ ; から打つ")]
    cols = [(220, "読みを打つ"), (600, "変換する"), (980, "確定する")]
    for cx, lab in cols:
        b.append(chip(cx - 90, 190, lab, fill=SOFT, color=INK, size=24, w=180))
    # step 1
    s, w = keys_seq(0, 0, ";kanji", k=46, gap=6)
    b.append(f'<g transform="translate({220 - w/2} 290)">{s}</g>')
    # step 2
    s, w = keys_seq(0, 0, ["Space"], k=56)
    b.append(f'<g transform="translate({600 - w/2} 285)">{s}</g>')
    # step 3
    s, w = keys_seq(0, 0, ["Enter"], k=56)
    b.append(f'<g transform="translate({980 - w/2} 285)">{s}</g>')
    for cx in (220, 600, 980):
        b.append(arrow(cx, 362, cx, 400))
    b.append(preedit(220, 470, "›かんじ", 52, "middle", width=190))
    b.append(preedit(600, 470, "»漢字", 52, "middle", color=ACCENT, width=150))
    b.append(bold(980, 470, "漢字", 56, INK, "middle"))
    b.append(smile(980, 498, 90, sw=8))
    for x1 in (370, 750):
        b.append(arrow(x1, 452, x1 + 80, 452, LINE, 5))
    # candidate list hint
    b.append(text(600, 540, "Space でつぎの候補（感じ・幹事…）", 22, MUTED, "middle"))
    b.append(text(220, 540, "› は読みの印", 22, MUTED, "middle"))
    b.append(text(980, 540, "印が消えて確定", 22, MUTED, "middle"))
    b.append(f'<rect x="72" y="580" width="1056" height="60" rx="30" fill="{SOFT}"/>')
    b.append(text(600, 620, "Esc で取り消し ・ F7 でカタカナ ・ 候補がなければ、その場で登録", 23, INK, "middle"))
    page(W, H, "".join(b), "convert")


# ---------------------------------------------------------------- 3. ; roles
def semicolon_image():
    W, H = 1200, 820
    b = [header("; のはたらき", "いまの場面で、; の意味が変わる")]
    cards = [
        ("何も打っていないとき", "読みを始める", ";kanji", "›かんじ", INK),
        ("読みの途中で", "送り仮名の始まり", ";ka;ku", "»書く", ACCENT),
        ("候補を選んでいるとき", "確定して次の読みへ", None, None, INK),
        ("読みを始めたすぐあと", "; の文字を打つ", ";;", "；", INK),
    ]
    for i, (when, what, seq, res, rc) in enumerate(cards):
        x0 = 72 + (i % 2) * 540
        y0 = 180 + (i // 2) * 310
        b.append(f'<rect x="{x0}" y="{y0}" width="516" height="286" rx="36" fill="{KEYFILL}" stroke="{INK}" stroke-width="6"/>')
        b.append(text(x0 + 36, y0 + 56, when, 22, MUTED))
        b.append(bold(x0 + 36, y0 + 100, what, 34))
        if seq:
            s, w = keys_seq(0, 0, seq, k=36, gap=5)
            b.append(f'<g transform="translate({x0+36} {y0+154})">{s}</g>')
            b.append(arrow(x0 + 52 + w, y0 + 172, x0 + 92 + w, y0 + 172))
            b.append(preedit(x0 + 106 + w, y0 + 188, res, 42, color=rc,
                             underline=res != "；", width=len(res) * 42 * 0.85))
        else:
            b.append(preedit(x0 + 36, y0 + 190, "»漢字", 42, color=ACCENT, width=110))
            s, w = keys_seq(0, 0, ";", k=46)
            b.append(f'<g transform="translate({x0+170} {y0+150})">{s}</g>')
            b.append(arrow(x0 + 236, y0 + 173, x0 + 286, y0 + 173))
            b.append(bold(x0 + 304, y0 + 190, "漢字", 42))
            b.append(preedit(x0 + 392, y0 + 190, "›", 42, width=22))
        notes = {
            0: "› の後ろが読みになる",
            1: "送り仮名を打つと、すぐ変換",
            2: "語を続けて打っていける",
            3: ";; で全角の ；",
        }
        b.append(text(x0 + 36, y0 + 250, notes[i], 22, MUTED))
    page(W, H, "".join(b), "semicolon")


# ---------------------------------------------------------------- SandS
def sands_image():
    """Space held as the key that starts a reading. Not a default binding, so
    the picture says how to turn it on."""
    W, H = 1200, 675
    b = [header("Space を押さえたまま打てば、; の代わりに",
                "SandS の指づかいのまま、読みと送り仮名を始められる")]
    k, g = 44, 6

    def chord(x, y, before, after):
        """Keys typed as they are, then Space held while the next key goes down."""
        out, cx = [], x
        for ch in before:
            out.append(key(cx, y, k, k, ch, size=k * 0.5))
            cx += k + g
        if before:
            cx += 10
        sw = k * 2.2
        out.append(key(cx, y, sw, k, "Space", hot=True, size=k * 0.36))
        out.append(text(cx + sw / 2, y + k + 28, "押さえたまま", 19, ACCENT, "middle"))
        cx += sw + 6
        out.append(bold(cx + 9, y + k * 0.68, "+", 28, ACCENT, "middle"))
        cx += 24
        for i, ch in enumerate(after):
            out.append(key(cx, y, k, k, ch, hot=(i == 0), size=k * 0.5))
            cx += k + g
        return "".join(out)

    cards = [
        ("何も打っていないとき", "読みを始める", "", "kanji", "›かんじ", INK, ";kanji と同じ"),
        ("読みの途中で", "送り仮名の始まり", "ka", "ku", "»書く", ACCENT, ";ka;ku と同じ。すぐ変換"),
    ]
    for i, (when, what, before, after, res, rc, note) in enumerate(cards):
        x0, y0 = 72 + i * 540, 172
        b.append(f'<rect x="{x0}" y="{y0}" width="516" height="352" rx="36" fill="{KEYFILL}" stroke="{INK}" stroke-width="6"/>')
        b.append(text(x0 + 36, y0 + 56, when, 22, MUTED))
        b.append(bold(x0 + 36, y0 + 100, what, 34))
        b.append(chord(x0 + 36, y0 + 136, before, after))
        b.append(arrow(x0 + 52, y0 + 258, x0 + 92, y0 + 258))
        b.append(preedit(x0 + 108, y0 + 274, res, 42, color=rc, width=len(res) * 42 * 0.85))
        b.append(text(x0 + 36, y0 + 324, note, 22, MUTED))
    b.append(f'<rect x="72" y="546" width="1056" height="60" rx="30" fill="{SOFT}"/>')
    b.append(text(600, 586, "Space を単独で押せば、いつもどおり変換や空白になる", 23, INK, "middle"))
    b.append(text(600, 645, "設定アプリのキーバインドで、「読みを始める」に「Space を押さえたまま」を足す", 21, MUTED, "middle"))
    page(W, H, "".join(b), "sands")


# ---------------------------------------------------------------- 4. cheat sheet
def cheatsheet_image():
    W, H = 1080, 1620
    b = [f'<g transform="translate(277 40) scale(1)">{LOGO_H}</g>',
         text(540, 260, "つかいかた", 30, MUTED, "middle")]

    def section(y, title):
        return (f'<path d="M72 {y} h936" stroke="{LINE}" stroke-width="3"/>'
                + chip(72, y - 22, title, size=24, w=220))

    # modes
    y = 330
    b.append(section(y, "モード"))
    # The bottom key row, so the two Shift keys read as left and right.
    sw, kw, g = 180, 44, 6
    lx, rx = 96, 984 - sw
    b.append(shift_key(lx, y + 80, sw, 70, "l"))
    b.append(shift_key(rx, y + 80, sw, 70, "r"))
    cx = lx + sw + 17
    for ch in "ZXCVBNM,./":
        b.append(key(cx, y + 90, kw, 50, ch, dim=True, size=18))
        cx += kw + g
    for kx, mode, note in ((lx + sw / 2, "ABC", "英字をそのまま"), (rx + sw / 2, "かな", "ローマ字でかな")):
        b.append(tap(kx, y + 62))
        b.append(arrow(kx, y + 165, kx, y + 200, ACCENT))
        b.append(bold(kx, y + 248, mode, 40, INK, "middle"))
        b.append(text(kx, y + 284, note, 22, MUTED, "middle"))
    b.append(text(540, y + 236, "Shift だけを", 22, MUTED, "middle"))
    b.append(text(540, y + 270, "ポンと押して離す", 22, MUTED, "middle"))

    # convert
    y = 680
    b.append(section(y, "変換"))
    s, w = keys_seq(0, 0, ";kanji", k=44, gap=6)
    b.append(f'<g transform="translate(96 {y+56})">{s}</g>')
    b.append(arrow(96 + w + 18, y + 78, 96 + w + 58, y + 78))
    b.append(preedit(96 + w + 76, y + 94, "›かんじ", 40, width=150))
    s, w2 = keys_seq(0, 0, ["Space"], k=50)
    b.append(f'<g transform="translate(96 {y+140})">{s}</g>')
    b.append(arrow(96 + w2 + 18, y + 165, 96 + w2 + 58, y + 165))
    b.append(preedit(96 + w2 + 76, y + 181, "»漢字", 40, color=ACCENT, width=110))
    s, w3 = keys_seq(0, 0, ["Enter"], k=50)
    b.append(f'<g transform="translate(600 {y+140})">{s}</g>')
    b.append(arrow(600 + w3 + 18, y + 165, 600 + w3 + 58, y + 165))
    b.append(bold(600 + w3 + 76, y + 181, "漢字", 40))
    b.append(smile(600 + w3 + 116, y + 204, 70, sw=6))
    b.append(text(96, y + 260, "; から打った語だけ変換する。ほかはかなのまま確定", 22, MUTED))

    # ; roles
    y = 1000
    b.append(section(y, "; のはたらき"))
    rows = [
        (";kanji", "›かんじ", "読みを始める"),
        (";ka;ku", "»書く", "送り仮名の始まり（すぐ変換）"),
        ("»漢字 ;", "漢字›", "候補を確定して次の読みへ"),
        (";;", "；", "読みが空なら ; の文字"),
    ]
    for i, (a, r, d) in enumerate(rows):
        yy = y + 80 + i * 74
        b.append(f'<rect x="96" y="{yy-40}" width="888" height="60" rx="30" fill="{SOFT}"/>')
        b.append(bold(130, yy, a, 30, ACCENT if a.startswith("»") else INK))
        b.append(arrow(330, yy - 10, 370, yy - 10))
        b.append(bold(390, yy, r, 30, ACCENT if r.startswith("»") else INK))
        b.append(text(560, yy, d, 24, INK))

    # misc
    y = 1400
    b.append(section(y, "そのほか"))
    misc = [("Esc", "取り消す"), ("F7", "カタカナで確定"), ("1–9", "番号の候補を確定"), ("0", "語を登録")]
    for i, (k, d) in enumerate(misc):
        x0 = 96 + (i % 2) * 460
        yy = y + 50 + (i // 2) * 70
        b.append(key(x0, yy, 84, 52, k, size=22))
        b.append(text(x0 + 104, yy + 35, d, 24))
    page(W, H, "".join(b), "cheatsheet")


if __name__ == "__main__":
    shift_image()
    flow_image()
    semicolon_image()
    sands_image()
    cheatsheet_image()
