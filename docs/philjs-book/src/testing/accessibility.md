# Accessibility Testing

Bake accessibility into automated tests to avoid regressions.

## Unit/component level

- Use role/label/placeholder queries (`getByRole`, `getByLabelText`).
- Assert focus management for dialogs/menus (focus trap, restore on close).
- Check `aria-invalid`, `aria-describedby` for form errors.

## Integration

- With MSW, simulate error states and ensure `role="alert"` messages appear.
- Verify keyboard navigation (Tab/Shift+Tab/Enter/Escape) works on critical components.
- Ensure reduced-motion handling is respected in components with animations.

## E2E (Playwright)

- Tab through dialogs/menus; assert focus order.
- Check that skip links, landmarks (`main`, `nav`, `footer`) are present.
- Optional: run axe on a subset of critical pages; keep failures actionable.

## Contrast and visuals

- Token-level contrast checks (color pairs) in unit tests if possible.
- Avoid text in images; if used, ensure alt text/captions.

## Checklist

- [ ] Role/label queries cover core UI.
- [ ] Focus management tested for overlays.
- [ ] Keyboard flows tested in E2E.
- [ ] Reduced-motion respected where applicable.
- [ ] Optional axe checks on critical pages.
