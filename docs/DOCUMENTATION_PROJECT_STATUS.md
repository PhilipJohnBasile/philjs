# PhilJS Documentation Status (v0.1.0)

PhilJS documentation is now synchronized across code, docs, and the book.

## Canonical Sources

- **Book (canonical guide)**: `docs/philjs-book/src` (see `SUMMARY.md`).
- **Docs**: `docs/` (package guides, architecture notes, internal references).
- **Code**: `packages/` and `examples/` (source of truth for APIs).

## Current Status

- **Book**: Complete for v0.1.0 (162 chapters, ~125k words).
- **Exports**: `docs/philjs-book/dist/philjs-book.{pdf,epub}`.
- **Links**: `pnpm book:links` verifies internal links and anchors.

## Alignment Rules (1:1:1)

- Any new package or API must ship with:
  1) Package README,
  2) Doc entry (guide or reference),
  3) Book coverage (chapter or appendix).
- Remove or update docs when code changes to avoid drift.
- Keep README and `docs/README.md` aligned to book structure.

## Maintenance Checklist

- Update `docs/philjs-book/src/SUMMARY.md` when chapters change.
- Run `pnpm book:links` before export.
- Run `pnpm book:export` to regenerate PDF/EPUB.
- Confirm docs/README and root README point to the canonical book paths.
