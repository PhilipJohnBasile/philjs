# Form Components

PhilJS UI provides a complete set of accessible form components with validation support, labels, helper text, and error states.

## Input

Text input component with support for labels, icons, validation, and multiple variants.

```tsx
import { Input } from '@philjs/ui';

// Basic input
<Input placeholder="Enter text" />

// With label and helper text
<Input
  label="Email Address"
  placeholder="you@example.com"
  helperText="We'll never share your email"
  type="email"
/>

// With validation error
<Input
  label="Username"
  value={username()}
  error="Username is already taken"
  required
/>

// With icons
<Input
  label="Search"
  placeholder="Search..."
  leftElement={<SearchIcon />}
  rightElement={<Button size="sm">Go</Button>}
/>
```

### Input Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type (text, email, password, etc.) |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | - | Initial uncontrolled value |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `variant` | `'outline' \| 'filled' \| 'flushed'` | `'outline'` | Visual style |
| `disabled` | `boolean` | `false` | Disable the input |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean \| string` | `false` | Error state or message |
| `helperText` | `string` | - | Helper text below input |
| `label` | `string` | - | Label text |
| `leftElement` | `JSX.Element` | - | Element on the left |
| `rightElement` | `JSX.Element` | - | Element on the right |
| `onInput` | `(e: Event) => void` | - | Input event handler |
| `onChange` | `(e: Event) => void` | - | Change event handler |
| `onFocus` | `(e: FocusEvent) => void` | - | Focus event handler |
| `onBlur` | `(e: FocusEvent) => void` | - | Blur event handler |
| `autoComplete` | `string` | - | Autocomplete attribute |
| `autoFocus` | `boolean` | - | Auto focus on mount |
| `maxLength` | `number` | - | Maximum character length |
| `minLength` | `number` | - | Minimum character length |
| `pattern` | `string` | - | Validation pattern |

### Input Variants

```tsx
// Outline (default) - bordered input
<Input variant="outline" placeholder="Outline style" />

// Filled - background fill
<Input variant="filled" placeholder="Filled style" />

// Flushed - bottom border only
<Input variant="flushed" placeholder="Flushed style" />
```

### Input Sizes

```tsx
<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium (default)" />
<Input size="lg" placeholder="Large" />
```

## Textarea

Multi-line text input with resize options.

```tsx
import { Textarea } from '@philjs/ui';

// Basic textarea
<Textarea placeholder="Enter your message" />

// With configuration
<Textarea
  label="Description"
  placeholder="Write a description..."
  rows={6}
  resize="vertical"
  helperText="Maximum 500 characters"
/>

// With validation
<Textarea
  label="Bio"
  value={bio()}
  error={bio().length > 500 ? "Bio is too long" : false}
  required
/>
```

### Textarea Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | - | Initial uncontrolled value |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Textarea size |
| `variant` | `'outline' \| 'filled' \| 'flushed'` | `'outline'` | Visual style |
| `rows` | `number` | `4` | Number of visible rows |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Resize behavior |
| `disabled` | `boolean` | `false` | Disable the textarea |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean \| string` | `false` | Error state or message |
| `helperText` | `string` | - | Helper text |
| `label` | `string` | - | Label text |

## Select

Single-selection dropdown component.

```tsx
import { Select } from '@philjs/ui';

const options = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte', disabled: true }
];

// Basic select
<Select options={options} placeholder="Choose a framework" />

// Controlled with label
<Select
  label="Framework"
  options={options}
  value={selected()}
  onChange={setSelected}
  helperText="Select your preferred framework"
/>

// With validation error
<Select
  label="Country"
  options={countries}
  error="Please select a country"
  required
/>
```

### Select Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | required | Array of options |
| `value` | `string` | - | Selected value |
| `defaultValue` | `string` | - | Initial value |
| `placeholder` | `string` | - | Placeholder text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Select size |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean \| string` | `false` | Error state |
| `helperText` | `string` | - | Helper text |
| `label` | `string` | - | Label text |
| `onChange` | `(value: string) => void` | - | Change handler |

### SelectOption Type

```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## MultiSelect

Multiple-selection dropdown with tag display.

```tsx
import { MultiSelect } from '@philjs/ui';

const skills = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' }
];

// Basic multi-select
<MultiSelect
  options={skills}
  placeholder="Select skills"
/>

// With maximum selections
<MultiSelect
  label="Skills"
  options={skills}
  value={selectedSkills()}
  onChange={setSelectedSkills}
  maxSelections={3}
  helperText="Select up to 3 skills"
/>
```

### MultiSelect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | required | Array of options |
| `value` | `string[]` | `[]` | Selected values |
| `placeholder` | `string` | - | Placeholder text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean \| string` | `false` | Error state |
| `helperText` | `string` | - | Helper text |
| `label` | `string` | - | Label text |
| `maxSelections` | `number` | - | Maximum selections allowed |
| `onChange` | `(values: string[]) => void` | - | Change handler |

## Checkbox

Checkbox component with indeterminate state support.

```tsx
import { Checkbox } from '@philjs/ui';

// Basic checkbox
<Checkbox label="Accept terms and conditions" />

// Controlled checkbox
<Checkbox
  label="Subscribe to newsletter"
  checked={subscribed()}
  onChange={setSubscribed}
/>

// With description
<Checkbox
  label="Enable notifications"
  description="Receive email notifications for updates"
/>

// Indeterminate state (for "select all")
<Checkbox
  label="Select all items"
  indeterminate={someSelected && !allSelected}
  checked={allSelected}
  onChange={toggleAll}
/>

// Different sizes
<Checkbox label="Small" size="sm" />
<Checkbox label="Medium" size="md" />
<Checkbox label="Large" size="lg" />
```

### Checkbox Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | - | Controlled checked state |
| `defaultChecked` | `boolean` | - | Initial checked state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `disabled` | `boolean` | `false` | Disable the checkbox |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean \| string` | `false` | Error state |
| `label` | `string` | - | Label text |
| `description` | `string` | - | Description text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Checkbox size |
| `value` | `string` | - | Value for form submission |
| `onChange` | `(checked: boolean) => void` | - | Change handler |

## CheckboxGroup

Group of related checkboxes with shared state.

```tsx
import { CheckboxGroup, Checkbox } from '@philjs/ui';

// Vertical layout (default)
<CheckboxGroup
  label="Select your interests"
  description="Choose all that apply"
>
  <Checkbox value="sports" label="Sports" />
  <Checkbox value="music" label="Music" />
  <Checkbox value="art" label="Art" />
  <Checkbox value="tech" label="Technology" />
</CheckboxGroup>

// Horizontal layout
<CheckboxGroup
  label="Notification preferences"
  orientation="horizontal"
>
  <Checkbox value="email" label="Email" />
  <Checkbox value="sms" label="SMS" />
  <Checkbox value="push" label="Push" />
</CheckboxGroup>

// With validation error
<CheckboxGroup
  label="Agree to policies"
  error="You must accept at least one policy"
  required
>
  <Checkbox value="terms" label="Terms of Service" />
  <Checkbox value="privacy" label="Privacy Policy" />
</CheckboxGroup>
```

### CheckboxGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element[]` | required | Checkbox children |
| `label` | `string` | - | Group label |
| `description` | `string` | - | Group description |
| `required` | `boolean` | `false` | Mark as required |
| `error` | `boolean \| string` | `false` | Error state |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction |

## Radio

Radio button for mutually exclusive selection.

```tsx
import { RadioGroup, Radio } from '@philjs/ui';

// Basic radio group
<RadioGroup name="plan" label="Select a plan">
  <Radio value="free" label="Free" description="Basic features" />
  <Radio value="pro" label="Pro" description="All features" />
  <Radio value="enterprise" label="Enterprise" description="Custom solutions" />
</RadioGroup>

// Controlled radio group
<RadioGroup
  name="size"
  label="Size"
  value={size()}
  onChange={setSize}
  orientation="horizontal"
>
  <Radio value="sm" label="Small" />
  <Radio value="md" label="Medium" />
  <Radio value="lg" label="Large" />
</RadioGroup>

// With validation
<RadioGroup
  name="payment"
  label="Payment method"
  error="Please select a payment method"
  required
>
  <Radio value="card" label="Credit Card" />
  <Radio value="paypal" label="PayPal" />
  <Radio value="bank" label="Bank Transfer" />
</RadioGroup>
```

### RadioGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | required | Group name for form submission |
| `children` | `JSX.Element[]` | required | Radio children |
| `value` | `string` | - | Controlled selected value |
| `defaultValue` | `string` | - | Initial selected value |
| `label` | `string` | - | Group label |
| `description` | `string` | - | Group description |
| `required` | `boolean` | `false` | Mark as required |
| `disabled` | `boolean` | `false` | Disable all radios |
| `error` | `boolean \| string` | `false` | Error state |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Radio size |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction |
| `onChange` | `(value: string) => void` | - | Change handler |

### Radio Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Radio value |
| `label` | `string` | - | Label text |
| `description` | `string` | - | Description text |
| `disabled` | `boolean` | `false` | Disable this radio |

## Switch

Toggle switch for boolean values with keyboard support.

```tsx
import { Switch } from '@philjs/ui';

// Basic switch
<Switch label="Enable dark mode" />

// Controlled switch
<Switch
  label="Notifications"
  checked={notificationsEnabled()}
  onChange={setNotificationsEnabled}
/>

// With description
<Switch
  label="Marketing emails"
  description="Receive promotional emails and offers"
/>

// Different sizes
<Switch label="Small" size="sm" />
<Switch label="Medium" size="md" />
<Switch label="Large" size="lg" />

// Disabled state
<Switch label="Feature flag" disabled checked />
```

### Switch Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | - | Controlled checked state |
| `defaultChecked` | `boolean` | `false` | Initial checked state |
| `disabled` | `boolean` | `false` | Disable the switch |
| `label` | `string` | - | Label text |
| `description` | `string` | - | Description text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Switch size |
| `onChange` | `(checked: boolean) => void` | - | Change handler |

## Complete Form Example

```tsx
import { signal } from '@philjs/core';
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Radio,
  Switch,
  Button
} from '@philjs/ui';

function ContactForm() {
  const name = signal('');
  const email = signal('');
  const message = signal('');
  const priority = signal('normal');
  const subscribe = signal(false);
  const errors = signal<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name()) newErrors.name = 'Name is required';
    if (!email()) newErrors.email = 'Email is required';
    else if (!email().includes('@')) newErrors.email = 'Invalid email';
    if (!message()) newErrors.message = 'Message is required';

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      console.log({ name: name(), email: email(), message: message() });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={name()}
        onInput={(e) => name.set(e.target.value)}
        error={errors().name}
        required
      />

      <Input
        label="Email"
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        error={errors().email}
        required
      />

      <Select
        label="Department"
        options={[
          { value: 'sales', label: 'Sales' },
          { value: 'support', label: 'Support' },
          { value: 'billing', label: 'Billing' }
        ]}
        placeholder="Select department"
      />

      <Textarea
        label="Message"
        value={message()}
        onInput={(e) => message.set(e.target.value)}
        error={errors().message}
        rows={5}
        required
      />

      <RadioGroup
        name="priority"
        label="Priority"
        value={priority()}
        onChange={priority.set}
        orientation="horizontal"
      >
        <Radio value="low" label="Low" />
        <Radio value="normal" label="Normal" />
        <Radio value="high" label="High" />
      </RadioGroup>

      <Switch
        label="Subscribe to updates"
        checked={subscribe()}
        onChange={subscribe.set}
      />

      <Checkbox
        label="I agree to the terms and conditions"
        required
      />

      <Button type="submit" color="primary">
        Submit
      </Button>
    </form>
  );
}
```

## Accessibility Features

All form components include:

- **Labels**: Associated with inputs via `htmlFor`/`id`
- **Required indicators**: Visual asterisk and `required` attribute
- **Error messages**: Connected via `aria-describedby` and `role="alert"`
- **Helper text**: Linked via `aria-describedby`
- **Invalid state**: `aria-invalid` when errors present
- **Focus styles**: Visible focus rings for keyboard navigation
- **Disabled states**: Proper `disabled` attribute and styling
