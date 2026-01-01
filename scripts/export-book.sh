#!/usr/bin/env bash
set -euo pipefail

ROOT="docs/philjs-book"
OUT="$ROOT/dist"
SUMMARY="$ROOT/src/SUMMARY.md"

mkdir -p "$OUT"

if command -v rg >/dev/null 2>&1; then
  mapfile -t FILES < <(rg -o '\(([^)]+\.md)\)' -r '$1' "$SUMMARY" | sed 's|^./||' | sed "s|^|$ROOT/src/|")
else
  mapfile -t FILES < <(find "$ROOT/src" -name '*.md' | sort)
fi

RESOURCE_PATH="$ROOT/src:$ROOT/visuals"
EPUB_COVER=""
PDF_ENGINE_ARGS=()

if [ -f "$ROOT/visuals/cover.png" ]; then
  EPUB_COVER="--epub-cover-image=$ROOT/visuals/cover.png"
elif [ -f "$ROOT/visuals/cover.jpg" ]; then
  EPUB_COVER="--epub-cover-image=$ROOT/visuals/cover.jpg"
fi

if [ -n "${PDF_ENGINE:-}" ]; then
  PDF_ENGINE_ARGS+=(--pdf-engine="$PDF_ENGINE")
elif command -v wkhtmltopdf >/dev/null 2>&1; then
  PDF_ENGINE_ARGS+=(--pdf-engine=wkhtmltopdf --pdf-engine-opt=--enable-local-file-access)
elif command -v weasyprint >/dev/null 2>&1; then
  PDF_ENGINE_ARGS+=(--pdf-engine=weasyprint)
fi

echo "Building EPUB and PDF from $ROOT/src ..."

pandoc -s -o "$OUT/philjs-book.epub" "${FILES[@]}" \
  --toc \
  --toc-depth=3 \
  --metadata title="PhilJS Book" \
  --metadata author="PhilJS Team" \
  --resource-path="$RESOURCE_PATH" \
  --css="$ROOT/src/epub.css" \
  $EPUB_COVER

pandoc -s -o "$OUT/philjs-book.pdf" "${FILES[@]}" \
  --toc \
  --toc-depth=3 \
  --metadata title="PhilJS Book" \
  --metadata author="PhilJS Team" \
  --resource-path="$RESOURCE_PATH" \
  --css="$ROOT/src/epub.css" \
  --css="$ROOT/src/pdf.css" \
  "${PDF_ENGINE_ARGS[@]}"

echo "Exports written to $OUT"
