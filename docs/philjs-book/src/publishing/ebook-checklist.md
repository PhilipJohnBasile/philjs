# eBook Export Checklist

- [ ] `SUMMARY.md` up to date; all chapters reachable.
- [ ] Links verified (run `node scripts/book-links.mjs` or similar).
- [ ] Images optimized; SVG preferred, PNG fallbacks where needed; alt text provided.
- [ ] Inkscape installed (or PNG versions available) for SVG conversion in exports.
- [ ] `epub.css` and `pdf.css` present for typography.
- [ ] Cover page in `cover.md` renders; add `visuals/cover.png` for EPUB metadata cover.
- [ ] Metadata set: title "PhilJS Book", author, version 0.1.0.
- [ ] Code blocks have info strings for syntax highlighting.
- [ ] No absolute file:// links; all links relative.
- [ ] Run `node scripts/export-book.mjs` to generate PDF/EPUB.
- [ ] Validate EPUB with `epubcheck`; preview Kindle via Kindle Previewer.
