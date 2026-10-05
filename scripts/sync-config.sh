#!/usr/bin/env bash
# Copy Kanaemi's settings template into src/data/, from which the reference
# pages build the table of default keys. Run it when the defaults change.
#
# Takes the path to a kanaemi checkout; defaults to a sibling directory.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kanaemi="${1:-$root/../kanaemi}"

cp "$kanaemi/crates/config/assets/config.toml" "$root/src/data/config.toml"
echo "copied from $(git -C "$kanaemi" rev-parse --short HEAD)"
