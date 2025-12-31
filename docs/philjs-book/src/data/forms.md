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
