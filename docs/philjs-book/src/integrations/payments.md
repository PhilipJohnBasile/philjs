# Payments Integration

Handle payments safely with predictable UX and secure server-side handling.

## Principles

- Keep secrets server-side; clients use ephemeral tokens only.
- Validate amounts/currency/server-calculated totals on the server.
- Idempotent mutations to prevent double-charges.

## Client flow (example with Stripe)

- Fetch a payment intent client secret via a loader/action.
- Use provider UI components or your own; keep UI reactive with signals.
- Handle required 3DS/authorization flows; surface clear statuses.

```tsx
const pay = action(async ({ formData }) => {
  const amount = Number(formData.get('amount') ?? 0);
  const intent = await createPaymentIntent(amount); // server-side secret use
  return { clientSecret: intent.clientSecret };
});
```

## Server handling

- Verify signatures on webhooks; use raw body as required by provider.
- Recalculate totals server-side; never trust client-submitted amounts.
- Record transaction state and idempotency keys; reconcile on retry.

## UX patterns

- Show clear states: idle, processing, succeeded, failed, requires_action.
- Keep form inputs disabled during processing; allow retry on recoverable errors.
- Provide receipts and history; sync with backend state, not just client.

## Testing

- Use provider test keys/modes; cover success/failure/3DS flows.
- Simulate webhook events in integration tests to ensure idempotency.
- E2E: run against sandbox, assert UI states and backend state consistency.

## Security

- Never expose secret keys to the client.
- Validate webhook origins and signatures.
- Rate-limit actions that initiate payments.
- Sanitize all metadata fields to prevent injection.

## Checklist

- [ ] Server recalculates totals and enforces idempotency.
- [ ] Webhooks verified; raw body handling correct.
- [ ] Client uses ephemeral tokens only.
- [ ] UI covers all payment states with clear messaging.
- [ ] Tests cover sandbox flows + webhook reconciliation.
