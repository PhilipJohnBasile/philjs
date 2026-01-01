# Accessibility Patterns

Ship accessible experiences by default and catch regressions early.

## Principles

- Semantics first: use native elements and correct roles.
- Labels everywhere: form controls, buttons, inputs.
- Keyboard-first: everything reachable via Tab/Shift+Tab; Escape closes overlays.
- Respect user preferences: reduced motion, contrast, font size.

## Forms

- Use `<label for>` with matching ids.
- Add `aria-invalid` and `aria-describedby` for errors.
- Group related fields with `<fieldset>` and `<legend>`.

## Dialogs and menus

- Trap focus inside dialogs; restore on close.
- Close on Escape and outside click; keep state in signals/stores.
- Menus: roving tab index, arrow key navigation, `aria-expanded` on trigger.

## Live regions

- Announce async events (toast, form errors) with `role="status"` or `role="alert"`.
- Throttle announcements to avoid spam.

## Motion and contrast

- Honor `prefers-reduced-motion`: disable heavy animations.
- Ensure color contrast meets WCAG AA; bake into design tokens.

## Testing

- Use PhilJS testing with role/label queries.
- Add axe checks to key pages in CI (sparingly to keep noise low).
- Playwright keyboard navigation tests for dialogs/menus/forms.

## Checklist

- [ ] Labels and roles on interactive elements.
- [ ] Focus management for overlays.
- [ ] Keyboard nav for menus/lists.
- [ ] Reduced-motion respected.
- [ ] Contrast verified for tokens and components.
- [ ] Live regions for async feedback.
