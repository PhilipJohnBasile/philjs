# Complex Forms

Build sophisticated forms with dynamic fields, nested data, and advanced validation patterns.

## Multi-Step Forms

### Wizard Pattern

```tsx
import { signal } from '@philjs/core';

export default function SignupWizard() {
  const step = signal(1);
  const formData = signal({
    // Step 1
    email: '',
    password: '',
    // Step 2
    firstName: '',
    lastName: '',
    // Step 3
    address: '',
    city: ''
  });

  const nextStep = () => step.set(step() + 1);
  const prevStep = () => step.set(step() - 1);

  return (
    <div>
      {step() === 1 && (
        <div>
          <h2>Step 1: Account</h2>
          <input
            type="email"
            value={formData().email}
            onInput={(e) => formData.set({
              ...formData(),
              email: e.target.value
            })}
          />
          <button onClick={nextStep}>Next</button>
        </div>
      )}

      {step() === 2 && (
        <div>
          <h2>Step 2: Personal Info</h2>
          <input
            value={formData().firstName}
            onInput={(e) => formData.set({
              ...formData(),
              firstName: e.target.value
            })}
          />
          <button onClick={prevStep}>Back</button>
          <button onClick={nextStep}>Next</button>
        </div>
      )}

      {step() === 3 && (
        <div>
          <h2>Step 3: Address</h2>
          <button onClick={prevStep}>Back</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
}
```

## Dynamic Fields

### Add/Remove Fields

```tsx
import { signal } from '@philjs/core';

export default function DynamicForm() {
  const items = signal([{ id: 1, value: '' }]);

  const addItem = () => {
    items.set([
      ...items(),
      { id: Date.now(), value: '' }
    ]);
  };

  const removeItem = (id: number) => {
    items.set(items().filter(item => item.id !== id));
  };

  return (
    <form>
      {items().map(item => (
        <div key={item.id}>
          <input
            value={item.value}
            onInput={(e) => {
              items.set(items().map(i =>
                i.id === item.id
                  ? { ...i, value: e.target.value }
                  : i
              ));
            }}
          />
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <button onClick={addItem}>Add Item</button>
    </form>
  );
}
```

## Nested Forms

### Nested Object Structure

```tsx
const formData = signal({
  user: {
    name: '',
    email: ''
  },
  address: {
    street: '',
    city: '',
    zipCode: ''
  },
  preferences: {
    newsletter: false,
    notifications: true
  }
});

const updateNested = (path: string, value: any) => {
  const keys = path.split('.');
  const updated = { ...formData() };

  let current = updated;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
  formData.set(updated);
};

<input
  value={formData().user.name}
  onInput={(e) => updateNested('user.name', e.target.value)}
/>
```

## Best Practices

### ✅ Do: Validate Each Step

```tsx
const canProceed = () => {
  if (step() === 1) return email().includes('@');
  if (step() === 2) return firstName().length > 0;
  return true;
};

<button onClick={nextStep} disabled={!canProceed()}>
  Next
</button>
```

## Next Steps

- [Validation](/docs/forms/validation.md) - Advanced validation
- [Form Libraries](/docs/forms/form-libraries.md) - Use form libraries
- [Multi-Step](/docs/forms/multi-step.md) - Multi-step patterns

---

💡 **Tip**: Use signals for complex form state management.

⚠️ **Warning**: Save progress in multi-step forms to prevent data loss.

ℹ️ **Note**: PhilJS's reactive system makes complex forms simple to manage.
