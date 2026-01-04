# Validation

@philjs/forms provides a comprehensive validation system with built-in validators, async validation, Zod integration, and advanced features like conditional and cross-field validation.

## Built-in Validators

The `validators` object provides common validation rules:

```typescript
import { validators, validateValue } from '@philjs/forms';
```

### Required Fields

```typescript
// Basic required check
validators.required()
// Result: Validates that value is not null, undefined, empty string, or empty array

// Custom message
validators.required('Please enter your name')
```

### Email Validation

```typescript
validators.email()
// Default: 'Invalid email address'

validators.email('Please enter a valid email')
```

### String Length

```typescript
// Minimum length
validators.minLength(8)
// Default: 'Must be at least 8 characters'

validators.minLength(8, 'Password must be at least 8 characters')

// Maximum length
validators.maxLength(100)
// Default: 'Must be at most 100 characters'

validators.maxLength(100, 'Description too long')
```

### Numeric Range

```typescript
// Minimum value
validators.min(18)
// Default: 'Must be at least 18'

validators.min(0, 'Quantity cannot be negative')

// Maximum value
validators.max(100)
// Default: 'Must be at most 100'

validators.max(10, 'Maximum 10 items allowed')
```

### Pattern Matching

```typescript
validators.pattern(/^[A-Z]/, 'Must start with uppercase letter')
validators.pattern(/^\d{5}$/, 'Must be exactly 5 digits')
```

### URL Validation

```typescript
validators.url()
// Default: 'Invalid URL'

validators.url('Please enter a valid website URL')
```

### Field Matching

Validate that a field matches another field (e.g., password confirmation):

```typescript
validators.matches('password', 'Passwords must match')
// Compares current value against values.password
```

### Enum Values

```typescript
validators.oneOf(['admin', 'user', 'guest'])
// Default: 'Must be one of: admin, user, guest'

validators.oneOf(['red', 'green', 'blue'], 'Invalid color selection')
```

### Custom Validation

```typescript
// Sync validation
validators.custom(
  (value) => value !== 'admin',
  'Admin is a reserved username'
)

// Async validation
validators.custom(
  async (value) => {
    const exists = await checkUsernameExists(value);
    return !exists;
  },
  'Username already taken'
)
```

## Using Validators

### Single Rule

```typescript
import { validateValue, validators } from '@philjs/forms';

const error = await validateValue(
  'test@example',
  validators.email('Invalid email format')
);

if (error) {
  console.log(error); // 'Invalid email format'
}
```

### Multiple Rules

Rules are evaluated in order. The first failing rule returns its error:

```typescript
const error = await validateValue(
  'abc',
  [
    validators.required('Password is required'),
    validators.minLength(8, 'Password must be 8+ characters'),
    validators.pattern(
      /(?=.*[A-Z])(?=.*[0-9])/,
      'Must contain uppercase and number'
    )
  ]
);
// Returns: 'Password must be 8+ characters'
```

### Cross-Field Validation

Access other form values during validation:

```typescript
const passwordConfirmRule = {
  validate: (value, values) => value === values.password,
  message: 'Passwords do not match'
};

const error = await validateValue(
  confirmPassword,
  passwordConfirmRule,
  { password: 'secret123', confirmPassword: 'secret124' }
);
```

## Common Patterns

The `patterns` object provides pre-built regex patterns:

```typescript
import { patterns } from '@philjs/forms';

patterns.email       // /^[^\s@]+@[^\s@]+\.[^\s@]+$/
patterns.phone       // /^\+?[\d\s\-()]+$/
patterns.url         // /^https?:\/\/.+/
patterns.alphanumeric // /^[a-zA-Z0-9]+$/
patterns.numeric     // /^\d+$/
patterns.alpha       // /^[a-zA-Z]+$/
patterns.username    // /^[a-zA-Z0-9_-]{3,20}$/
patterns.password    // Strong password pattern
patterns.zipCode     // /^\d{5}(-\d{4})?$/
patterns.creditCard  // /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/
patterns.hexColor    // /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
patterns.ipv4        // IPv4 address pattern
```

### Using Patterns

```typescript
validators.pattern(patterns.username, 'Invalid username format')
validators.pattern(patterns.phone, 'Invalid phone number')
```

## Zod Integration

For schema-based validation, integrate with Zod:

### Basic Usage

```typescript
import { z } from 'zod';
import { zodValidator, createZodValidator } from '@philjs/forms';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
  age: z.number().min(18, 'Must be 18 or older'),
});

// Validate all fields
const errors = await zodValidator(schema)(formValues);
// Returns: { email: 'Invalid email' } or {}
```

### With Form

```typescript
const form = createForm({
  initialValues: {
    email: '',
    password: '',
    age: 0,
  },
  onSubmit: async (values) => {
    const errors = await zodValidator(schema)(values);
    if (Object.keys(errors).length > 0) {
      form.setErrors(errors);
      return;
    }
    // Submit...
  },
});
```

### Field-Level Validation

```typescript
const { validate, validateField } = createZodValidator(schema);

// Validate single field
const emailError = await validateField('email', 'invalid');
// Returns: 'Invalid email'

// Validate all fields
const allErrors = await validate(formValues);
```

### Complex Schemas

```typescript
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);
```

## Composing Validators

Combine multiple validation functions:

```typescript
import { composeValidators, zodValidator } from '@philjs/forms';

const schemaValidator = zodValidator(schema);
const customValidator = async (values) => {
  const errors = {};
  if (await isUsernameTaken(values.username)) {
    errors.username = 'Username already taken';
  }
  return errors;
};

const combinedValidator = composeValidators(
  schemaValidator,
  customValidator
);

const errors = await combinedValidator(formValues);
```

## Debounced Validation

For expensive validations (e.g., server checks):

```typescript
import { debounceValidation } from '@philjs/forms';

const checkUsername = async (username) => {
  const available = await api.checkUsername(username);
  return available ? null : 'Username taken';
};

const debouncedCheck = debounceValidation(checkUsername, 500);

// Only executes after 500ms of no calls
await debouncedCheck('newuser');
```

## Advanced Validation

The advanced validation system provides additional capabilities:

### Async Validators with Debounce

```typescript
import { advancedValidators } from '@philjs/forms';

// Email with domain checking
advancedValidators.emailWithDomainCheck(
  ['company.com', 'allowed.org'],
  'Email must be from allowed domains'
)
// Built-in 300ms debounce

// Username availability check
advancedValidators.usernameAvailable(
  async (username) => {
    const response = await fetch(`/api/check-username?u=${username}`);
    return response.json();
  },
  'Username is already taken'
)
// Built-in 500ms debounce
```

### Password Strength

```typescript
advancedValidators.passwordStrength('weak')
// Requires: 8+ characters

advancedValidators.passwordStrength('medium')
// Requires: 8+ chars, lowercase, uppercase, number

advancedValidators.passwordStrength('strong')
// Requires: 8+ chars, lowercase, uppercase, number, special char

advancedValidators.passwordStrength('very-strong')
// Requires: 12+ chars, lowercase, uppercase, number, special char
```

### File Validation

```typescript
advancedValidators.file({
  maxSize: 5 * 1024 * 1024,  // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxFiles: 3,
})
```

### Date Validation

```typescript
advancedValidators.date({
  min: new Date('2024-01-01'),
  max: new Date('2024-12-31'),
  excludeWeekends: true,
  excludeDates: [
    new Date('2024-12-25'),
    new Date('2024-01-01'),
  ],
})
```

### Array Validation

```typescript
advancedValidators.array({
  min: 1,
  max: 10,
  unique: true,
  itemValidator: validators.email(),
})
```

### Credit Card (Luhn Algorithm)

```typescript
advancedValidators.creditCard('Invalid credit card number')
// Validates using Luhn algorithm
```

### IBAN Validation

```typescript
advancedValidators.iban('Invalid IBAN')
// International Bank Account Number validation
```

### JSON Validation

```typescript
advancedValidators.json('Invalid JSON format')
```

### Slug Validation

```typescript
advancedValidators.slug('Invalid URL slug')
// Validates: lowercase-words-with-dashes
```

### UUID Validation

```typescript
advancedValidators.uuid()           // Any valid UUID
advancedValidators.uuid(4)          // UUID v4 only
advancedValidators.uuid(1)          // UUID v1 only
```

## Schema Validator

For complex validation scenarios:

```typescript
import { createSchemaValidator, when, crossField, dependsOn } from '@philjs/forms';

const validator = createSchemaValidator({
  // Sync rules
  rules: {
    email: validators.email(),
    password: [
      validators.required(),
      validators.minLength(8),
    ],
  },

  // Async rules
  asyncRules: {
    username: {
      validate: async (value) => {
        const available = await checkUsername(value);
        return available;
      },
      message: 'Username taken',
      debounce: 500,
    },
  },

  // Conditional rules
  conditionalRules: {
    companyName: [
      when(
        (values) => values.accountType === 'business',
        validators.required('Company name required for business accounts')
      ),
    ],
  },

  // Cross-field validation
  crossFieldRules: [
    crossField(
      ['password', 'confirmPassword'],
      (values) => values.password === values.confirmPassword,
      'Passwords must match',
      'confirmPassword'  // Target field for error
    ),
  ],

  // Validation groups
  groups: [
    {
      name: 'account',
      fields: ['email', 'password'],
      validateOn: 'blur',
    },
    {
      name: 'profile',
      fields: ['name', 'bio'],
      validateOn: 'submit',
    },
  ],
});

// Validate all
const result = await validator.validate(formValues);
// { valid: boolean, errors: {}, warnings: {}, fieldResults: Map }

// Validate single field
const fieldResult = await validator.validateField('email', emailValue, allValues);
// { valid: boolean, error?: string, warning?: string, asyncPending: boolean }

// Validate group
const groupErrors = await validator.validateGroup('account', formValues);

// Cancel pending async validations
validator.cancelPending();
```

### Conditional Validation with `dependsOn`

```typescript
import { dependsOn } from '@philjs/forms';

const conditionalRules = {
  shippingAddress: [
    dependsOn(
      'sameAsBilling',
      (value) => value === false,
      validators.required('Shipping address required')
    ),
  ],
};
```

## Validation Utilities

### Check for Errors

```typescript
import { hasErrors, getFirstError, formatErrors } from '@philjs/forms';

const errors = { email: 'Invalid', password: null };

hasErrors(errors);
// true

getFirstError(errors);
// ['email', 'Invalid']

formatErrors(errors, { email: 'Email Address' });
// ['Email Address: Invalid']
```

### Combine Results

```typescript
import { combineResults } from '@philjs/forms';

const result1 = await validator1.validate(values);
const result2 = await validator2.validate(values);

const combined = combineResults([result1, result2]);
// Merges errors, warnings, and fieldResults
```

### Dynamic Messages

```typescript
import { messageWithField } from '@philjs/forms';

const template = messageWithField('{field} is required');

template('Email');  // 'Email is required'
template('Name');   // 'Name is required'
```

## Best Practices

1. **Validate on blur for better UX** - Don't show errors while users are still typing
2. **Use debouncing for async validation** - Avoid excessive server calls
3. **Provide specific error messages** - "Password must be 8+ characters" is better than "Invalid password"
4. **Validate on submit as a fallback** - Always validate before submission
5. **Use Zod for complex schemas** - It provides better type inference
6. **Group related validations** - Use validation groups for multi-step forms
7. **Cancel pending validations** - Clean up when component unmounts

## Related

- [Overview](./overview.md) - Package overview and quick start
- [Advanced Features](./advanced-features.md) - Wizards, masks, auto-save
- [API Reference](./api-reference.md) - Complete API documentation
