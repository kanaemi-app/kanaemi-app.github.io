#!/usr/bin/env bash
# Build the usage illustrations into public/guide/.
#
# The SVGs have their text outlined, like the logo, so they look the same where
# the fonts are not installed. Each is also rendered as a PNG at twice its size,
# for sites that do not take SVG (X, for one).
#
# Needs python3, usvg and resvg. The fonts are downloaded into .cache/fonts.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fonts="$root/.cache/fonts"
work="$root/.cache/guide"
out="$root/public/guide"

fetch() {
  [[ -s "$fonts/$1" ]] || curl -fsSL -o "$fonts/$1" "$2"
}

mkdir -p "$fonts" "$work" "$out"
# The faces of the logo (see kanaemi-brand): Zen Maru Gothic for Japanese,
# Quicksand for Latin.
fetch ZenMaruGothic-Medium.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/ZenMaruGothic-Medium.ttf
fetch ZenMaruGothic-Bold.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/ZenMaruGothic-Bold.ttf
fetch Quicksand-Medium.ttf https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-500-normal.ttf
fetch Quicksand-Bold.ttf https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-700-normal.ttf

rm -f "$work"/*.svg
python3 "$root/scripts/guide/gen.py" "$work"
THEME=dark python3 "$root/scripts/guide/gen.py" "$work"

for svg in "$work"/*.svg; do
  usvg --skip-system-fonts --use-fonts-dir "$fonts" "$svg" "$out/$(basename "$svg")"
done
for svg in "$out"/*.svg; do
  resvg --zoom 2 "$svg" "${svg%.svg}.png"
done
