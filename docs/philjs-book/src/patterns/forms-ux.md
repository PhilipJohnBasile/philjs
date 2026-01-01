# Forms UX Patterns

Design forms that are fast, clear, and resilient.

## Clarity and flow

- Single-column layouts; logical grouping with headings.
- Show progress for multi-step flows; allow back/forward without losing data.
- Keep labels always visible; avoid placeholder-only labels.

## Validation UX

- Validate on blur or submit; avoid noisy per-keystroke errors.
- Show inline errors near fields; summary at top with anchors for accessibility.
- Offer examples (e.g., email format) and constraints (password rules) before submission.

## Performance and responsiveness

- Debounce expensive validation (e.g., username availability).
- Optimistic UI for non-critical saves; autosave drafts.
- Prefill known data; cache form state between steps/pages.

## Accessibility

- Proper labels, descriptions, and `aria-*` attributes.
- Keyboard-friendly: tab order logical, Enter submits, Escape cancels modals.
- High contrast and visible focus states.

## File uploads

- Show file size/type constraints early.
- Display progress, success/failure; allow cancel/retry.
- Handle large files with chunking where necessary.

## Errors and recovery

- Keep data on error; never clear the form.
- Offer retry and contact/support options when server fails.
- For partial saves, show what succeeded and what did not.

## Testing

- Component tests for validation messages and disabled states.
- Integration tests for server errors and retries (MSW).
- E2E for multi-step flows, back/forward navigation, and drafts.

## Checklist

- [ ] Labels + descriptions always visible.
- [ ] Validation timed sensibly; helpful messages.
- [ ] Autosave/drafts for longer flows.
- [ ] File uploads with progress and retry.
- [ ] Errors keep data and offer recovery.
