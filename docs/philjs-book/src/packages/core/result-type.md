# Result Type - Rust-Style Error Handling

PhilJS provides a Rust-inspired `Result` type for explicit, type-safe error handling without exceptions.

## Why Result Types?

```tsx
// Traditional approach - errors can be forgotten
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

// With Result - errors are explicit in the type
async function fetchUser(id: string): Promise<Result<User, FetchError>> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    return Err({ code: response.status, message: 'Failed to fetch' });
  }
  return Ok(await response.json());
}
```

## Basic Usage

```tsx
import { Ok, Err, isOk, isErr, unwrap, unwrapOr, matchResult } from '@philjs/core';
import type { Result } from '@philjs/core';

// Creating Results
const success: Result<number, string> = Ok(42);
const failure: Result<number, string> = Err('Something went wrong');

// Type guards
if (isOk(success)) {
  console.log(success.value); // 42
}

if (isErr(failure)) {
  console.log(failure.error); // 'Something went wrong'
}

// Unwrapping
const value = unwrap(success); // 42
const valueOrDefault = unwrapOr(failure, 0); // 0

// Pattern matching
const message = matchResult(success, {
  ok: (value) => `Success: ${value}`,
  err: (error) => `Error: ${error}`
});
```

## Result API

### Creating Results

```tsx
// Ok - successful result
const result = Ok(value);

// Err - error result
const result = Err(error);

// From nullable
function fromNullable<T>(value: T | null | undefined): Result<T, 'null'> {
  return value != null ? Ok(value) : Err('null');
}

// From try/catch
function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}
```

### Type Guards

```tsx
import { isOk, isErr, isResult } from '@philjs/core';

const result = fetchData();

if (isOk(result)) {
  // TypeScript knows result.value exists
  console.log(result.value);
}

if (isErr(result)) {
  // TypeScript knows result.error exists
  console.error(result.error);
}

// Check if unknown value is a Result
if (isResult(maybeResult)) {
  // maybeResult is Result<unknown, unknown>
}
```

### Transforming Results

```tsx
import { map, mapErr, andThen } from '@philjs/core';

const result: Result<number, string> = Ok(5);

// Transform success value
const doubled = map(result, x => x * 2);
// Ok(10)

// Transform error
const errorMapped = mapErr(result, err => new Error(err));
// Still Ok(5), mapErr only affects Err

// Chain operations (flatMap)
const chained = andThen(result, x =>
  x > 0 ? Ok(x * 2) : Err('Must be positive')
);
// Ok(10)
```

### Unwrapping

```tsx
import { unwrap, unwrapOr, matchResult } from '@philjs/core';

const success = Ok(42);
const failure = Err('error');

// Unwrap (throws if Err)
const value = unwrap(success); // 42
// unwrap(failure); // throws!

// Unwrap with default
const value = unwrapOr(failure, 0); // 0

// Pattern matching (recommended)
const result = matchResult(success, {
  ok: (value) => `Got ${value}`,
  err: (error) => `Failed: ${error}`
});
// 'Got 42'
```

## Practical Examples

### API Calls

```tsx
interface ApiError {
  code: number;
  message: string;
  details?: Record<string, string>;
}

async function fetchUser(id: string): Promise<Result<User, ApiError>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      const error = await response.json();
      return Err({
        code: response.status,
        message: error.message || 'Unknown error',
        details: error.details
      });
    }

    return Ok(await response.json());
  } catch (e) {
    return Err({
      code: 0,
      message: 'Network error'
    });
  }
}

// Usage
const userResult = await fetchUser('123');

matchResult(userResult, {
  ok: (user) => {
    setUser(user);
    toast.success(`Welcome, ${user.name}`);
  },
  err: (error) => {
    if (error.code === 404) {
      navigate('/not-found');
    } else {
      toast.error(error.message);
    }
  }
});
```

### Form Validation

```tsx
interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email) {
    return Err({ field: 'email', message: 'Email is required' });
  }
  if (!email.includes('@')) {
    return Err({ field: 'email', message: 'Invalid email format' });
  }
  return Ok(email);
}

function validatePassword(password: string): Result<string, ValidationError> {
  if (password.length < 8) {
    return Err({ field: 'password', message: 'Password too short' });
  }
  return Ok(password);
}

// Combine validations
function validateLoginForm(
  email: string,
  password: string
): Result<{ email: string; password: string }, ValidationError[]> {
  const errors: ValidationError[] = [];

  const emailResult = validateEmail(email);
  const passwordResult = validatePassword(password);

  if (isErr(emailResult)) errors.push(emailResult.error);
  if (isErr(passwordResult)) errors.push(passwordResult.error);

  if (errors.length > 0) {
    return Err(errors);
  }

  return Ok({
    email: unwrap(emailResult),
    password: unwrap(passwordResult)
  });
}
```

### Chaining Operations

```tsx
function parseConfig(raw: string): Result<Config, ParseError> {
  return tryCatch(() => JSON.parse(raw))
    .pipe(json => validateConfig(json))
    .pipe(config => normalizeConfig(config));
}

// Using andThen for explicit chaining
function processUser(id: string): Promise<Result<ProcessedUser, Error>> {
  return fetchUser(id)
    .then(result =>
      andThen(result, user =>
        validateUser(user)
      )
    )
    .then(result =>
      andThen(result, user =>
        enrichUserData(user)
      )
    );
}

// Or with async/await
async function processUser(id: string): Promise<Result<ProcessedUser, Error>> {
  const userResult = await fetchUser(id);
  if (isErr(userResult)) return userResult;

  const validatedResult = validateUser(userResult.value);
  if (isErr(validatedResult)) return validatedResult;

  return enrichUserData(validatedResult.value);
}
```

### With Components

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [result, setResult] = useState<Result<User, ApiError> | null>(null);

  effect(() => {
    fetchUser(userId).then(setResult);
  });

  if (!result) {
    return <LoadingSpinner />;
  }

  return matchResult(result, {
    ok: (user) => (
      <div class="profile">
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    ),
    err: (error) => (
      <ErrorCard
        title="Failed to load user"
        message={error.message}
        code={error.code}
        onRetry={() => fetchUser(userId).then(setResult)}
      />
    )
  });
}
```

### Resource with Result

```tsx
import { resource } from '@philjs/core';

const userResource = resource(async (): Promise<Result<User, ApiError>> => {
  return fetchUser(userId());
});

function UserDisplay() {
  if (userResource.loading()) {
    return <Spinner />;
  }

  const result = userResource();

  return matchResult(result, {
    ok: (user) => <UserCard user={user} />,
    err: (error) => (
      <Alert type="error">
        {error.message}
        <button onClick={() => userResource.refresh()}>Retry</button>
      </Alert>
    )
  });
}
```

## Combining Multiple Results

```tsx
// Collect all successes, return first error
function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (isErr(result)) return result;
    values.push(result.value);
  }

  return Ok(values);
}

// Collect all errors
function partition<T, E>(
  results: Result<T, E>[]
): { successes: T[]; errors: E[] } {
  const successes: T[] = [];
  const errors: E[] = [];

  for (const result of results) {
    if (isOk(result)) {
      successes.push(result.value);
    } else {
      errors.push(result.error);
    }
  }

  return { successes, errors };
}

// Usage
const results = await Promise.all([
  fetchUser('1'),
  fetchUser('2'),
  fetchUser('3')
]);

const allResult = all(results);
matchResult(allResult, {
  ok: (users) => console.log('All users:', users),
  err: (error) => console.error('One failed:', error)
});
```

## TypeScript Types

```tsx
// Result type definition
type Result<T, E> = Ok<T> | Err<E>;

interface Ok<T> {
  readonly _tag: 'Ok';
  readonly value: T;
}

interface Err<E> {
  readonly _tag: 'Err';
  readonly error: E;
}

// Type inference works automatically
function divide(a: number, b: number): Result<number, 'division by zero'> {
  if (b === 0) return Err('division by zero');
  return Ok(a / b);
}

const result = divide(10, 2);
// Result<number, 'division by zero'>

if (isOk(result)) {
  const num: number = result.value; // TypeScript knows this is number
}
```

## Best Practices

### 1. Use Result for Expected Failures

```tsx
// Good - expected failure (user input)
function parseAge(input: string): Result<number, string> {
  const age = parseInt(input);
  if (isNaN(age)) return Err('Invalid number');
  if (age < 0) return Err('Age cannot be negative');
  return Ok(age);
}

// Bad - use exceptions for unexpected failures
function parseAge(input: string): number {
  const age = parseInt(input);
  if (isNaN(age)) throw new Error('Invalid number'); // Don't do this
  return age;
}
```

### 2. Use Specific Error Types

```tsx
// Good - specific error types
type UserError =
  | { type: 'not_found'; id: string }
  | { type: 'unauthorized' }
  | { type: 'network'; message: string };

function fetchUser(id: string): Promise<Result<User, UserError>> {
  // ...
}

// Bad - generic string errors
function fetchUser(id: string): Promise<Result<User, string>> {
  // Harder to handle different cases
}
```

### 3. Handle All Cases

```tsx
// Always handle both Ok and Err
const result = fetchData();

// Good - explicit handling
matchResult(result, {
  ok: (data) => render(data),
  err: (error) => showError(error)
});

// Avoid - ignoring errors
if (isOk(result)) {
  render(result.value);
}
// What about errors?
```

## Next Steps

- [Error Boundaries](./error-handling.md)
- [Data Layer](./data-layer.md)
- [TypeScript Integration](./typescript.md)
