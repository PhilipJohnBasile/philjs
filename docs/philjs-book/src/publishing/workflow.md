# Publishing Workflow (End-to-End)

Goal: produce a single artifact (cover, front matter, chapters, appendices, index) and export to PDF/EPUB/Kindle reliably.

## Layout

- Content: `docs/philjs-book/src` (markdown, cover, front matter, chapters, appendices, index).
- Visuals: `docs/philjs-book/visuals` (SVG/PNG, cover art, diagram sources).
- Styles: `docs/philjs-book/src/epub.css` (EPUB styling) and `docs/philjs-book/src/pdf.css` (PDF styling).
- Export script: `scripts/export-book.mjs` (uses SUMMARY order).
- Package atlas generator: `scripts/generate-package-atlas.mjs` (syncs packages into the book and refreshes API snapshots in package READMEs).
- Link checker: `scripts/book-links.mjs` (internal links and fragments).

## Steps

1) Ensure `SUMMARY.md` is up to date (drives TOC and export order).
2) Regenerate the package atlas and API snapshots (keeps the book + package docs aligned with `packages/`): `node scripts/generate-package-atlas.mjs`.
3) Run link check (optional but recommended): `node scripts/book-links.mjs` or `pnpm book:links`.
4) Build exports:
   ```bash
   node scripts/export-book.mjs
   ```
   Outputs `docs/philjs-book/dist/philjs-book.{epub,pdf}` with cover and front matter.
5) Kindle: import `philjs-book.epub` into Kindle Previewer to generate `.kpf` for KDP.

## Cover and front matter

- `cover.md` embeds `visuals/cover.svg` for a printable cover page.
- To embed an EPUB cover image, add `docs/philjs-book/visuals/cover.png` (the export script picks it up).
- Front matter can be expanded with extra markdown files listed early in `SUMMARY.md`.

## Tooling notes

- `export-book.mjs` auto-detects pandoc; set `PANDOC=/path/to/pandoc` if it is not on PATH.
- `export-book.mjs` prefers `wkhtmltopdf` (set `WKHTMLTOPDF=/path/to/wkhtmltopdf` if needed), then `weasyprint`/`prince`, and falls back to `pdflatex` or `PDF_ENGINE`.
- `export-book.mjs` converts SVG visuals to PNG using Inkscape; set `INKSCAPE=/path/to/inkscape` if needed.
- `book-links.mjs` uses lychee; set `LYCHEE=/path/to/lychee` if it is not on PATH.

## Automation

- Add npm scripts:
  ```json
  "scripts": {
    "book:packages": "node scripts/generate-package-atlas.mjs",
    "book:export": "node scripts/export-book.mjs",
    "book:links": "node scripts/book-links.mjs"
  }
  ```
- CI can run `book:links` and `book:export` to publish artifacts.

## Clickable links

- Keep links relative (as in the repo); pandoc preserves them in PDF/EPUB.
- Verify TOC and index links after export; Kindle Previewer to confirm internal links.

## Checklist

- [ ] SUMMARY updated; all chapters/appendices listed.
- [ ] Link check passed.
- [ ] Exports generated (PDF/EPUB); cover present.
- [ ] Kindle preview verified; internal links clickable.
- [ ] Visuals optimized (SVG/PNG) with alt text.
