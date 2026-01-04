# Field Types

@philjs/forms provides a collection of field component factories that create consistent, accessible form fields with validation support.

## Overview

Field components are factory functions that return configuration objects for rendering form fields. They handle:

- Consistent attribute generation
- Accessibility attributes (aria-invalid, aria-describedby)
- Value and error state binding
- Event handling (onChange, onBlur, onFocus)

## Common Field Properties

All field types share these base properties:

```typescript
interface BaseFieldProps<T> {
  name: string;              // Field name (required)
  label?: string;            // Label text
  placeholder?: string;      // Placeholder text
  disabled?: boolean;        // Disable the field
  required?: boolean;        // Mark as required
  className?: string;        // CSS class name
  id?: string;               // Element ID (defaults to name)
  'aria-describedby'?: string; // Accessibility description
  value?: T;                 // Current value
  error?: string | null;     // Validation error
  touched?: boolean;         // Has been touched
  onChange?: (value: T) => void;  // Value change handler
  onBlur?: () => void;       // Blur handler
  onFocus?: () => void;      // Focus handler
}
```

## TextField

For text-based input fields including email, password, phone, and more.

### Usage

```typescript
import { TextField } from '@philjs/forms';

const emailField = TextField({
  name: 'email',
  label: 'Email Address',
  type: 'email',
  placeholder: 'user@example.com',
  required: true,
  autoComplete: 'email',
  value: form.values().email,
  error: form.errors().email,
  touched: form.touched().email,
  onChange: (value) => form.setFieldValue('email', value),
  onBlur: () => form.setFieldTouched('email', true),
});

// Access the configuration
emailField.type;      // 'text'
emailField.props;     // Original props
emailField.render();  // { tag: 'input', attributes: {...} }
```

### Properties

```typescript
interface TextFieldProps extends BaseFieldProps<string> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  minLength?: number;
  maxLength?: number;
  pattern?: string;       // HTML5 pattern attribute
  autoComplete?: string;  // Autocomplete hint
  autoFocus?: boolean;    // Focus on mount
}
```

### Examples

```typescript
// Password field
const passwordField = TextField({
  name: 'password',
  type: 'password',
  label: 'Password',
  minLength: 8,
  autoComplete: 'new-password',
  required: true,
});

// Search field
const searchField = TextField({
  name: 'search',
  type: 'search',
  placeholder: 'Search...',
  autoFocus: true,
});

// Phone field
const phoneField = TextField({
  name: 'phone',
  type: 'tel',
  label: 'Phone Number',
  pattern: '[0-9]{3}-[0-9]{3}-[0-9]{4}',
  autoComplete: 'tel',
});
```

## TextAreaField

For multi-line text input.

### Usage

```typescript
import { TextAreaField } from '@philjs/forms';

const bioField = TextAreaField({
  name: 'bio',
  label: 'Biography',
  placeholder: 'Tell us about yourself...',
  rows: 5,
  maxLength: 500,
  value: form.values().bio,
  error: form.errors().bio,
  onChange: (value) => form.setFieldValue('bio', value),
});
```

### Properties

```typescript
interface TextAreaFieldProps extends BaseFieldProps<string> {
  rows?: number;       // Number of visible rows
  cols?: number;       // Number of visible columns
  minLength?: number;  // Minimum characters
  maxLength?: number;  // Maximum characters
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}
```

### Examples

```typescript
// Comment field with character limit
const commentField = TextAreaField({
  name: 'comment',
  label: 'Your Comment',
  rows: 4,
  maxLength: 1000,
  placeholder: 'Share your thoughts...',
});

// Fixed-size code editor
const codeField = TextAreaField({
  name: 'code',
  rows: 20,
  cols: 80,
  resize: 'none',
  className: 'monospace',
});
```

## SelectField

For dropdown selection fields.

### Usage

```typescript
import { SelectField } from '@philjs/forms';

const countryField = SelectField({
  name: 'country',
  label: 'Country',
  required: true,
  options: [
    { value: '', label: 'Select a country...', disabled: true },
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
  ],
  value: form.values().country,
  error: form.errors().country,
  onChange: (value) => form.setFieldValue('country', value),
});
```

### Properties

```typescript
interface SelectFieldProps extends BaseFieldProps<string | string[]> {
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  multiple?: boolean;  // Allow multiple selections
  size?: number;       // Number of visible options
}
```

### Examples

```typescript
// Multiple selection
const interestsField = SelectField({
  name: 'interests',
  label: 'Your Interests',
  multiple: true,
  size: 5,
  options: [
    { value: 'tech', label: 'Technology' },
    { value: 'science', label: 'Science' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'sports', label: 'Sports' },
  ],
  value: form.values().interests || [],
  onChange: (values) => form.setFieldValue('interests', values),
});

// Grouped options (render manually)
const options = [
  { value: 'small', label: 'Small - $9.99' },
  { value: 'medium', label: 'Medium - $14.99' },
  { value: 'large', label: 'Large - $19.99' },
];
```

## CheckboxField

For boolean checkbox inputs.

### Usage

```typescript
import { CheckboxField } from '@philjs/forms';

const termsField = CheckboxField({
  name: 'acceptTerms',
  label: 'I accept the terms and conditions',
  required: true,
  value: form.values().acceptTerms,
  error: form.errors().acceptTerms,
  touched: form.touched().acceptTerms,
  onChange: (checked) => form.setFieldValue('acceptTerms', checked),
});
```

### Properties

```typescript
interface CheckboxFieldProps extends BaseFieldProps<boolean> {
  indeterminate?: boolean;  // Show indeterminate state
}
```

### Examples

```typescript
// Simple checkbox
const rememberMeField = CheckboxField({
  name: 'rememberMe',
  label: 'Remember me',
  value: false,
});

// Indeterminate checkbox (for "select all" patterns)
const selectAllField = CheckboxField({
  name: 'selectAll',
  label: 'Select All',
  indeterminate: someSelected && !allSelected,
  value: allSelected,
  onChange: handleSelectAll,
});
```

## RadioField

For radio button groups.

### Usage

```typescript
import { RadioField } from '@philjs/forms';

const planField = RadioField({
  name: 'plan',
  label: 'Select Plan',
  required: true,
  options: [
    { value: 'free', label: 'Free - $0/month' },
    { value: 'pro', label: 'Pro - $9.99/month' },
    { value: 'enterprise', label: 'Enterprise - Contact us' },
  ],
  value: form.values().plan,
  error: form.errors().plan,
  onChange: (value) => form.setFieldValue('plan', value),
});
```

### Properties

```typescript
interface RadioFieldProps extends BaseFieldProps<string> {
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  inline?: boolean;  // Display options horizontally
}
```

### Examples

```typescript
// Horizontal layout
const genderField = RadioField({
  name: 'gender',
  label: 'Gender',
  inline: true,
  options: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not', label: 'Prefer not to say' },
  ],
});

// With disabled option
const shippingField = RadioField({
  name: 'shipping',
  label: 'Shipping Method',
  options: [
    { value: 'standard', label: 'Standard (5-7 days)' },
    { value: 'express', label: 'Express (2-3 days)' },
    { value: 'overnight', label: 'Overnight', disabled: !eligibleForOvernight },
  ],
});
```

## FileField

For file upload inputs.

### Usage

```typescript
import { FileField } from '@philjs/forms';

const avatarField = FileField({
  name: 'avatar',
  label: 'Profile Picture',
  accept: 'image/*',
  error: form.errors().avatar,
  onChange: (file) => form.setFieldValue('avatar', file),
});
```

### Properties

```typescript
interface FileFieldProps extends BaseFieldProps<File | File[] | null> {
  accept?: string;                    // File type filter
  multiple?: boolean;                 // Allow multiple files
  capture?: 'user' | 'environment';  // Camera capture mode
}
```

### Examples

```typescript
// Multiple image upload
const photosField = FileField({
  name: 'photos',
  label: 'Upload Photos',
  accept: 'image/jpeg,image/png',
  multiple: true,
});

// Document upload
const documentField = FileField({
  name: 'document',
  label: 'Upload Document',
  accept: '.pdf,.doc,.docx',
  required: true,
});

// Camera capture (mobile)
const selfieField = FileField({
  name: 'selfie',
  label: 'Take Selfie',
  accept: 'image/*',
  capture: 'user',  // Front camera
});

const photoField = FileField({
  name: 'photo',
  label: 'Take Photo',
  accept: 'image/*',
  capture: 'environment',  // Back camera
});
```

## NumberField

For numeric input fields.

### Usage

```typescript
import { NumberField } from '@philjs/forms';

const ageField = NumberField({
  name: 'age',
  label: 'Age',
  min: 18,
  max: 120,
  required: true,
  value: form.values().age,
  error: form.errors().age,
  onChange: (value) => form.setFieldValue('age', value),
});
```

### Properties

```typescript
interface NumberFieldProps extends BaseFieldProps<number | null> {
  min?: number;   // Minimum value
  max?: number;   // Maximum value
  step?: number;  // Step increment
}
```

### Examples

```typescript
// Quantity field
const quantityField = NumberField({
  name: 'quantity',
  label: 'Quantity',
  min: 1,
  max: 100,
  step: 1,
  value: 1,
});

// Price field with decimals
const priceField = NumberField({
  name: 'price',
  label: 'Price',
  min: 0,
  step: 0.01,
  placeholder: '0.00',
});

// Percentage field
const percentField = NumberField({
  name: 'discount',
  label: 'Discount (%)',
  min: 0,
  max: 100,
  step: 5,
});
```

## Generic Field Factory

The `Field` function provides a unified way to create any field type:

```typescript
import { Field } from '@philjs/forms';

// Create fields using type parameter
const textField = Field('text', { name: 'title', label: 'Title' });
const selectField = Field('select', { name: 'category', options: [...] });
const checkboxField = Field('checkbox', { name: 'active', label: 'Active' });
const radioField = Field('radio', { name: 'size', options: [...] });
const fileField = Field('file', { name: 'upload', accept: '.pdf' });
const numberField = Field('number', { name: 'count', min: 0 });
const textareaField = Field('textarea', { name: 'description', rows: 3 });
```

### Type Overloads

The `Field` function is fully typed:

```typescript
Field(type: 'text', props: TextFieldProps): ReturnType<typeof TextField>;
Field(type: 'textarea', props: TextAreaFieldProps): ReturnType<typeof TextAreaField>;
Field(type: 'select', props: SelectFieldProps): ReturnType<typeof SelectField>;
Field(type: 'checkbox', props: CheckboxFieldProps): ReturnType<typeof CheckboxField>;
Field(type: 'radio', props: RadioFieldProps): ReturnType<typeof RadioField>;
Field(type: 'file', props: FileFieldProps): ReturnType<typeof FileField>;
Field(type: 'number', props: NumberFieldProps): ReturnType<typeof NumberField>;
```

## Rendering Fields

Field factories return a render configuration:

```typescript
const field = TextField({
  name: 'email',
  type: 'email',
  value: 'test@example.com',
  error: 'Invalid email',
  touched: true,
});

const config = field.render();
// {
//   tag: 'input',
//   attributes: {
//     type: 'email',
//     name: 'email',
//     id: 'email',
//     value: 'test@example.com',
//     'aria-invalid': 'true',
//     ...
//   }
// }
```

### Integration Example

```typescript
function renderField(fieldConfig) {
  const { tag, attributes, options } = fieldConfig.render();

  if (tag === 'input') {
    return <input {...attributes} />;
  }

  if (tag === 'textarea') {
    return <textarea {...attributes}>{attributes.value}</textarea>;
  }

  if (tag === 'select') {
    return (
      <select {...attributes}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // ... handle other types
}
```

## Accessibility Features

All field types include built-in accessibility support:

### aria-invalid

Set automatically when `touched` and `error` are both truthy:

```typescript
const field = TextField({
  name: 'email',
  value: 'invalid',
  error: 'Invalid email format',
  touched: true,
});

field.render().attributes['aria-invalid']; // 'true'
```

### aria-describedby

Link fields to error messages:

```typescript
const field = TextField({
  name: 'email',
  'aria-describedby': 'email-error',
  error: 'Invalid email',
});

// In your template:
// <input aria-describedby="email-error" />
// <span id="email-error">Invalid email</span>
```

### Fieldset for Radio Groups

Radio fields render as fieldsets for proper grouping:

```typescript
const radio = RadioField({
  name: 'plan',
  options: [...],
});

radio.render();
// { tag: 'fieldset', options: [...], attributes: {...} }
```

## Type Definitions

```typescript
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number';

type FieldValue = string | number | boolean | File | File[] | null | undefined;

type FieldProps =
  | TextFieldProps
  | TextAreaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps
  | RadioFieldProps
  | FileFieldProps
  | NumberFieldProps;

interface FieldState<T = FieldValue> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}
```

## Best Practices

1. **Always provide labels** - Use the `label` prop or associate labels externally
2. **Set appropriate types** - Use `type="email"` for emails, `type="tel"` for phones
3. **Use autocomplete hints** - Help browsers autofill correctly
4. **Provide placeholders** - Give users examples of expected input
5. **Handle touched state** - Only show errors after user interaction
6. **Use aria-describedby** - Link fields to their error messages
7. **Set min/max/step for numbers** - Constrain input at the HTML level

## Related

- [Overview](./overview.md) - Package overview and quick start
- [Validation](./validation.md) - Field validation
- [API Reference](./api-reference.md) - Complete API documentation
