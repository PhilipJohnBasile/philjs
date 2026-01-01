# Publishing and Formats (PDF/EPUB/Kindle)

How to turn the PhilJS book into distributable formats.

## Source layout

- Markdown lives in `docs/philjs-book/src`.
- `SUMMARY.md` defines navigation and export order.
- Visuals live in `docs/philjs-book/visuals` (SVG/PNG).
- Cover page is in `docs/philjs-book/src/cover.md`.

## PDF and EPUB (pandoc)

Use the export script:

```bash
node scripts/export-book.mjs
```

Outputs:

- `docs/philjs-book/dist/philjs-book.epub`
- `docs/philjs-book/dist/philjs-book.pdf`

The script:

- Reads file order from `SUMMARY.md`.
- Includes `docs/philjs-book/visuals` via `--resource-path`.
- Applies `docs/philjs-book/src/epub.css` for EPUB styling and `docs/philjs-book/src/pdf.css` for PDF styling.
- Uses `cover.png` (if present) for EPUB cover metadata.
- Converts SVG visuals to PNG via Inkscape for EPUB/PDF compatibility.
- Uses `wkhtmltopdf` when available for PDF; falls back to `weasyprint`/`prince`, then `pdflatex` or `PDF_ENGINE`.

## Kindle (KDP)

- Convert the EPUB with Kindle Previewer to generate `.kpf`.
- Validate layout and internal links on multiple device profiles.

## Optional upgrades

- Use `mdbook-pdf` or Prince for higher-fidelity PDFs.
- Add a print-specific CSS file if you need headers/footers or page numbers.

## Link correctness

- Keep links relative; pandoc preserves them in PDF/EPUB.
- Run a link checker before export (`node scripts/book-links.mjs` or `pnpm book:links`).

## Image handling

- Prefer SVG for diagrams; provide PNG if Kindle rendering needs it.
- Add alt text and captions for every visual.

## QA before publish

- Verify TOC and index links.
- Spot-check code blocks and diagrams in PDF/EPUB.
- Confirm cover and front matter appear in the output.
