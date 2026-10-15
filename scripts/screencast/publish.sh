#!/usr/bin/env bash
# Turn the recordings of the scenes into what the pages show:
# public/screencasts/<name>.mp4 and a poster, <name>.webp, from its last
# moment.
#
# Takes the names of the scenes; publishes them all without any. Each is
# read from the recording in its CleanShot Studio project
# ($SCREENCAST_PROJECTS, .cache/screencast by default). Studio adds nothing
# the stage does not already show, so the recording is cut here rather than
# exported from Studio: from just before the first caption to a moment
# after the last change, without the title bar and the marks CleanShot
# draws on the corners of the area.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"
projects="${SCREENCAST_PROJECTS:-$root/.cache/screencast}"
out="$root/public/screencasts"
mkdir -p "$out"

if [ $# -eq 0 ]; then
  set -- $(cd "$here/scenes" && ls *.txt | perl -pe 's/\.txt$//')
fi

for name in "$@"; do
  recording="$projects/$name.cleanshotvideo/files/video.mov"
  [ -f "$recording" ] || { echo "$name: no recording at $recording" >&2; exit 1; }
  duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$recording")
  # The caption band of the stage, below the title bar: dark pixels there
  # mean the first caption is up and the scene has begun. A moment later, so
  # the mode shown when the stage was put in kana mode has gone.
  first=$(ffmpeg -hide_banner -i "$recording" \
    -vf "crop=600:36:30:44,signalstats,metadata=print:key=lavfi.signalstats.YMIN" -f null - 2>&1 |
    perl -ne 'if (/pts_time:([\d.]+)/) { $t = $1 } if (/YMIN=(\d+)/ && $1 < 150) { print "$t\n"; exit }')
  # The last time anything on the stage changed, the caret aside.
  last=$(ffmpeg -hide_banner -i "$recording" \
    -vf "crop=900:420:30:44,select='gt(scene,0.0005)',showinfo" -f null - 2>&1 |
    perl -ne 'print "$1\n" if /pts_time:([\d.]+)/' | tail -1)
  start=$(perl -e 'printf "%.2f", $ARGV[0] + 0.3' "$first")
  end=$(perl -e 'my $e = $ARGV[0] + 1.5; $e = $ARGV[1] if $e > $ARGV[1]; printf "%.2f", $e' "$last" "$duration")
  echo "publishing $name ($start..$end)"
  ffmpeg -loglevel error -y -ss "$start" -to "$end" -i "$recording" \
    -vf "crop=iw-24:ih-44:12:32,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 24 \
    -movflags +faststart -an "$out/$name.mp4"
  ffmpeg -loglevel error -y -sseof -0.3 -i "$out/$name.mp4" \
    -frames:v 1 -c:v libwebp -quality 90 "$out/$name.webp"
done
