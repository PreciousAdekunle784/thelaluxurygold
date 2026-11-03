#!/usr/bin/env bash
# Encode rendered hero film frames into web videos + poster stills.
#   tools/render/encode-film.sh <frames-dir> <name>    e.g. film/d hero-desktop
set -euo pipefail
FR="$1"; NAME="$2"; OUT="${3:-public/videos}"
mkdir -p "$OUT"
# H.264 MP4 — plays everywhere (iOS Safari included); faststart for progressive playback.
ffmpeg -y -loglevel error -framerate 24 -i "$FR/f%04d.jpg" -c:v libx264 -preset slow -crf 25 -profile:v high -pix_fmt yuv420p -movflags +faststart -an "$OUT/$NAME.mp4"
# VP9 WebM — smaller, preferred by Chrome/Firefox/Edge.
ffmpeg -y -loglevel error -framerate 24 -i "$FR/f%04d.jpg" -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p -an "$OUT/$NAME.webm"
ls -lh "$OUT/$NAME".*
