#!/usr/bin/env bash
# Record the screencasts of Kanaemi on macOS as CleanShot X Studio projects.
#
# Takes the names of the scenes to record (scripts/screencast/scenes/*.txt);
# records them all without any. Each becomes <name>.cleanshotvideo in
# $SCREENCAST_PROJECTS (.cache/screencast by default), kept so a recording can
# still be edited in CleanShot's Studio; publish.sh cuts what the pages show
# out of the recordings.
#
# Run it on a Mac with Kanaemi installed and nothing else to do: the
# keyboard and the screen are taken over while a scene plays. The candidates
# come from the settings folder Kanaemi reads, so record with one that holds
# only the official dictionaries, not one's own words and history.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"
work="$root/.cache/screencast"
projects="${SCREENCAST_PROJECTS:-$work}"
mkdir -p "$work" "$projects"

# The system's Swift: a Nix shell puts its own toolchain wrappers first.
env -i PATH=/usr/bin:/bin HOME="$HOME" /usr/bin/swiftc -O \
  -o "$work/stage" "$here/Stage.swift"

if [ $# -eq 0 ]; then
  set -- $(cd "$here/scenes" && ls *.txt | perl -pe 's/\.txt$//')
fi

for name in "$@"; do
  echo "recording $name"
  "$work/stage" "$here/scenes/$name.txt" "$projects/$name.cleanshotvideo"
done
