# Form components

@philjs/ui provides inputs that pair well with `@philjs/core/forms`.

## Basic form

```tsx
import { Input, Select, Checkbox, Button } from '@philjs/ui';
import { useForm, v } from '@philjs/core/forms';

const form = useForm({
  schema: {
    email: v.email().required('Email is required'),
    plan: v.string().required('Select a plan'),
    agree: v.boolean().required('Please accept')
  }
});

<form onSubmit={form.handleSubmit(async values => save(values))}>
  <Input
    label="Email"
    value={form.values.email}
    onInput={e => form.setValue('email', e.currentTarget.value)}
    error={form.errors.email?.[0]}
  />

  <Select
    label="Plan"
    value={form.values.plan}
    onChange={value => form.setValue('plan', value)}
    options={[{ label: 'Pro', value: 'pro' }]}
  />

  <Checkbox
    label="I agree"
    checked={form.values.agree}
    onChange={checked => form.setValue('agree', checked)}
  />

  <Button type="submit">Submit</Button>
</form>
```

## Other inputs

- `Textarea`, `Radio`, `Switch` for additional controls
- `Select` and `MultiSelect` for lists

## Tips

- Use schema validation with `v` to keep errors typed.
- Keep error messages close to the control for clarity.
