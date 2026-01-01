# Forms

PhilJS ships a typed form API. Use it for validation, error tracking, and clean submit handling.

```tsx
import { useForm, createField, validators } from "@philjs/core";

type SignupForm = {
  email: string;
  name: string;
  consent: boolean;
};

const Fields = createField<SignupForm>();

export function Signup() {
  const form = useForm<SignupForm>({
    schema: {
      email: validators.email().required(),
      name: validators.string().min(2),
      consent: validators.boolean().required(),
    },
    onSubmit: async (values) => {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <Fields.Input form={form} name="email" label="Email" />
      <Fields.Input form={form} name="name" label="Name" />
      <Fields.Checkbox form={form} name="consent" label="I agree" />
      <button type="submit" disabled={() => !form.isValid()}>
        Create account
      </button>
    </form>
  );
}
```

## Why use the form API

- Built-in validation with typed schemas
- Signals for form state (`isSubmitting`, `isValid`, `errors`)
- Accessible field helpers with `aria-invalid` and error IDs
- Works with SSR and progressive enhancement (real `<form>` submissions)

## Validation strategies

- Schema-first with `validators` or Zod/Valibot.
- Field-level validation for fast feedback; form-level for cross-field rules.
- Async validation (e.g., username availability) using effects tied to field signals.

## Error rendering

- Use `form.errors().name` to show inline messages.
- Add `role="alert"` for error summaries.
- Ensure inputs get `aria-invalid` and `aria-describedby` automatically when using field helpers.

## Submission patterns

- For server-trustable mutations, pair `useForm` with a route `action`.
- Use optimistic UI for perceived speed; reconcile on server response.
- Disable submit while `isSubmitting` or when invalid.

```tsx
<button type="submit" disabled={() => !form.isValid() || form.isSubmitting()}>
  Save
</button>
```

## File uploads

- Use `<input type="file">` and access files via `formData`.
- Stream to storage in actions; return progress via SSE/WebSocket if needed.
- Show upload status with a resource or store slice.

## Testing forms

- Component tests: render the form, type into inputs with `fireEvent.input`, submit, assert handlers fired with parsed values.
- Integration: use MSW to mock server responses; assert error messages on 400s.
- E2E: Playwright to submit real forms; verify SSR + hydration keep inputs intact.

## Checklist

- [ ] Schema validates required fields and constraints.
- [ ] Errors surfaced inline and announced (role="alert").
- [ ] Submit disabled when invalid or submitting.
- [ ] Handles server errors gracefully (action result/error boundary).
- [ ] File uploads handled with proper encoding and progress UX.

## Try it now: form + action pair

```tsx
export const contactAction = action(async ({ formData }) => {
  const payload = {
    email: String(formData.get('email') ?? ''),
    message: String(formData.get('message') ?? ''),
  };
  if (!payload.email || !payload.message) return Err(new Error('Missing fields'));
  await sendMessage(payload);
});
```

In the component, call `useForm` and submit to the action; show `form.errors()` for validation and action errors.


