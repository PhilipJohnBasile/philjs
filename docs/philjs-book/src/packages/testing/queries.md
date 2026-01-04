# Query Utilities

`@philjs/testing` provides comprehensive query utilities built on top of `@testing-library/dom`, with additional PhilJS-specific enhancements for testing signal-bound elements.

## Query Types Overview

There are three types of queries, each with different behavior when elements are not found:

| Query Type | No Match | Multiple Matches | Usage |
|------------|----------|-----------------|-------|
| `getBy*` | Throws error | Throws error | Elements that must exist |
| `queryBy*` | Returns `null` | Throws error | Elements that may not exist |
| `findBy*` | Waits, then throws | Waits, then throws | Async elements |

Each type also has an "all" variant (`getAllBy*`, `queryAllBy*`, `findAllBy*`) that returns arrays.

## Using screen vs Bound Queries

### The screen Object

`screen` provides queries bound to `document.body`:

```typescript
import { render, screen } from '@philjs/testing';

render(<App />);

// Query entire document
const button = screen.getByRole('button');
const input = screen.getByLabelText('Email');
const heading = screen.getByText('Welcome');
```

### Bound Queries from render()

`render()` returns queries bound to the rendered container:

```typescript
import { render } from '@philjs/testing';

const { getByRole, getByText } = render(<Modal />);

// Queries only search within the rendered container
const closeButton = getByRole('button', { name: 'Close' });
```

### Scoped Queries with within()

Use `within()` to scope queries to a specific element:

```typescript
import { render, screen, within } from '@philjs/testing';

render(<Page />);

// Get the sidebar
const sidebar = screen.getByRole('navigation');

// Query only within the sidebar
const homeLink = within(sidebar).getByRole('link', { name: 'Home' });
const settingsLink = within(sidebar).getByRole('link', { name: 'Settings' });
```

## Query Methods by Priority

### 1. getByRole (Highest Priority)

Queries elements by their ARIA role. This is the most accessible query and should be your first choice:

```typescript
import { screen } from '@philjs/testing';

// Buttons
screen.getByRole('button');
screen.getByRole('button', { name: 'Submit' });
screen.getByRole('button', { name: /submit/i });

// Links
screen.getByRole('link', { name: 'Home' });

// Headings
screen.getByRole('heading', { level: 1 });
screen.getByRole('heading', { name: 'Welcome' });

// Form elements
screen.getByRole('textbox');
screen.getByRole('checkbox');
screen.getByRole('radio');
screen.getByRole('combobox'); // select
screen.getByRole('spinbutton'); // number input

// Lists
screen.getByRole('list');
screen.getByRole('listitem');

// Regions
screen.getByRole('main');
screen.getByRole('navigation');
screen.getByRole('banner'); // header
screen.getByRole('contentinfo'); // footer

// Dialogs
screen.getByRole('dialog');
screen.getByRole('alertdialog');
```

#### Role Query Options

```typescript
interface RoleQueryOptions {
  // Match by accessible name
  name?: string | RegExp;

  // Heading level (1-6)
  level?: number;

  // For select/combobox
  selected?: boolean;

  // For checkbox/radio
  checked?: boolean;

  // Pressed state (toggle buttons)
  pressed?: boolean;

  // Expanded state (accordions, menus)
  expanded?: boolean;

  // Include hidden elements
  hidden?: boolean;
}

// Examples
screen.getByRole('heading', { level: 2 });
screen.getByRole('checkbox', { checked: true });
screen.getByRole('button', { pressed: true });
screen.getByRole('button', { expanded: false });
```

### 2. getByLabelText

Queries form elements by their associated label:

```typescript
import { screen } from '@philjs/testing';

// Label with for/id
// <label for="email">Email Address</label>
// <input id="email" type="email" />
screen.getByLabelText('Email Address');

// Wrapped label
// <label>Email Address <input type="email" /></label>
screen.getByLabelText('Email Address');

// aria-label
// <input aria-label="Search" type="text" />
screen.getByLabelText('Search');

// aria-labelledby
// <span id="email-label">Email</span>
// <input aria-labelledby="email-label" type="email" />
screen.getByLabelText('Email');

// With RegExp
screen.getByLabelText(/email/i);
```

#### LabelText Query Options

```typescript
interface LabelTextOptions {
  // Match label exactly
  exact?: boolean;

  // Specify element selector
  selector?: string;
}

// Case-insensitive, partial match
screen.getByLabelText('email', { exact: false });

// Only match input elements
screen.getByLabelText('Email', { selector: 'input' });
```

### 3. getByPlaceholderText

Queries input elements by their placeholder:

```typescript
import { screen } from '@philjs/testing';

// <input placeholder="Enter your email" />
screen.getByPlaceholderText('Enter your email');

// With RegExp
screen.getByPlaceholderText(/email/i);
```

**Note:** Prefer `getByLabelText` over `getByPlaceholderText` for accessibility.

### 4. getByText

Queries elements by their text content:

```typescript
import { screen } from '@philjs/testing';

// Exact match
screen.getByText('Hello World');

// RegExp match
screen.getByText(/hello/i);

// With selector
screen.getByText('Submit', { selector: 'button' });
```

#### Text Query Options

```typescript
interface TextOptions {
  // Match text exactly
  exact?: boolean;

  // Specify element selector
  selector?: string;

  // Custom text normalizer
  normalizer?: (text: string) => string;

  // Ignore case
  ignore?: string | boolean;
}

// Partial match
screen.getByText('Hello', { exact: false }); // Matches "Hello World"

// Normalize whitespace (default behavior)
screen.getByText('Hello World'); // Matches "Hello   World"

// Only in paragraphs
screen.getByText('Content', { selector: 'p' });
```

### 5. getByDisplayValue

Queries form elements by their current value:

```typescript
import { screen } from '@philjs/testing';

// <input value="John Doe" />
screen.getByDisplayValue('John Doe');

// <select><option selected>Option 1</option></select>
screen.getByDisplayValue('Option 1');

// <textarea>Some text</textarea>
screen.getByDisplayValue('Some text');

// With RegExp
screen.getByDisplayValue(/john/i);
```

### 6. getByAltText

Queries images by their alt attribute:

```typescript
import { screen } from '@philjs/testing';

// <img alt="Company Logo" src="/logo.png" />
screen.getByAltText('Company Logo');

// With RegExp
screen.getByAltText(/logo/i);
```

### 7. getByTitle

Queries elements by their title attribute:

```typescript
import { screen } from '@philjs/testing';

// <span title="Close">X</span>
screen.getByTitle('Close');

// <img title="Profile picture" src="/pic.jpg" />
screen.getByTitle('Profile picture');
```

### 8. getByTestId (Lowest Priority)

Queries elements by `data-testid` attribute. Use as a last resort:

```typescript
import { screen } from '@philjs/testing';

// <div data-testid="custom-element">Content</div>
screen.getByTestId('custom-element');
```

**Note:** Use `data-testid` only when other queries are not possible. It doesn't reflect user behavior.

## Query Variants

### getBy* - Must Exist

Throws an error if no element or multiple elements are found:

```typescript
// Throws if button doesn't exist
const button = screen.getByRole('button');

// Throws if multiple buttons exist
// Error: Found multiple elements with the role "button"
```

### getAllBy* - Multiple Elements

Returns an array of elements. Throws if none are found:

```typescript
// Get all list items
const items = screen.getAllByRole('listitem');
expect(items).toHaveLength(5);

// Check first and last
expect(items[0]).toHaveTextContent('First');
expect(items[items.length - 1]).toHaveTextContent('Last');
```

### queryBy* - May Not Exist

Returns `null` if no element is found. Throws if multiple are found:

```typescript
// Returns null if not found
const error = screen.queryByText('Error message');
expect(error).toBeNull();

// Useful for asserting absence
expect(screen.queryByRole('alert')).not.toBeInTheDocument();
```

### queryAllBy* - Zero or More

Returns an empty array if no elements are found:

```typescript
// Empty list initially
const items = screen.queryAllByRole('listitem');
expect(items).toHaveLength(0);

// After adding items
expect(screen.queryAllByRole('listitem')).toHaveLength(3);
```

### findBy* - Async, Must Exist

Waits for the element to appear (default timeout: 1000ms):

```typescript
// Wait for element to appear
const button = await screen.findByRole('button');

// With custom timeout
const dialog = await screen.findByRole('dialog', {}, { timeout: 3000 });

// Useful for async rendering
render(<AsyncComponent />);
const data = await screen.findByText('Data loaded');
```

### findAllBy* - Async, Multiple

Waits for elements to appear, returns array:

```typescript
// Wait for list to populate
render(<AsyncList />);
const items = await screen.findAllByRole('listitem');
expect(items).toHaveLength(5);
```

## PhilJS-Specific Queries

### queryBySignalValue

Find elements displaying a specific signal value:

```typescript
import { render, queryBySignalValue } from '@philjs/testing';
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(42);
  return <span data-signal="count">{count()}</span>;
}

const { container } = render(<Counter />);

// Find element by signal name and value
const element = queryBySignalValue(container, 'count', 42);
expect(element).toHaveTextContent('42');
```

### queryAllBySignal

Find all elements bound to a signal:

```typescript
import { render, queryAllBySignal } from '@philjs/testing';
import { signal } from '@philjs/core';

function UserDisplay() {
  const name = signal('John');
  return (
    <div>
      <span data-signal="name">{name()}</span>
      <input data-signal="name" value={name()} />
    </div>
  );
}

const { container } = render(<UserDisplay />);

// Find all elements bound to the "name" signal
const elements = queryAllBySignal(container, 'name');
expect(elements).toHaveLength(2);
```

## Query Examples by Use Case

### Forms

```typescript
import { render, screen } from '@philjs/testing';

render(<LoginForm />);

// Email input
const emailInput = screen.getByLabelText('Email');
const emailByPlaceholder = screen.getByPlaceholderText('you@example.com');

// Password input
const passwordInput = screen.getByLabelText('Password');

// Remember me checkbox
const rememberMe = screen.getByRole('checkbox', { name: 'Remember me' });

// Submit button
const submitButton = screen.getByRole('button', { name: 'Sign In' });

// Forgot password link
const forgotLink = screen.getByRole('link', { name: /forgot password/i });
```

### Tables

```typescript
import { render, screen, within } from '@philjs/testing';

render(<UserTable users={users} />);

// Get table
const table = screen.getByRole('table');

// Get all rows (excluding header)
const rows = screen.getAllByRole('row').slice(1);

// Get cells in first row
const firstRow = rows[0];
const cells = within(firstRow).getAllByRole('cell');

// Get specific column header
const nameHeader = screen.getByRole('columnheader', { name: 'Name' });

// Get row by content
const johnRow = screen.getByRole('row', { name: /john/i });
```

### Navigation

```typescript
import { render, screen, within } from '@philjs/testing';

render(<Navigation />);

// Main nav
const nav = screen.getByRole('navigation');

// Links
const homeLink = within(nav).getByRole('link', { name: 'Home' });
const aboutLink = within(nav).getByRole('link', { name: 'About' });

// Current page indicator
const currentLink = within(nav).getByRole('link', { current: 'page' });
```

### Dialogs/Modals

```typescript
import { render, screen, within } from '@philjs/testing';

render(<ConfirmDialog open={true} />);

// Get dialog
const dialog = screen.getByRole('dialog');

// Dialog title
const title = within(dialog).getByRole('heading', { name: 'Confirm Action' });

// Dialog buttons
const confirmBtn = within(dialog).getByRole('button', { name: 'Confirm' });
const cancelBtn = within(dialog).getByRole('button', { name: 'Cancel' });

// Close button (often X)
const closeBtn = within(dialog).getByRole('button', { name: /close/i });
```

### Lists

```typescript
import { render, screen, within } from '@philjs/testing';

render(<TodoList />);

// Get list
const list = screen.getByRole('list');

// Get all items
const items = within(list).getAllByRole('listitem');

// Get specific item
const firstItem = items[0];
const checkbox = within(firstItem).getByRole('checkbox');
const text = within(firstItem).getByText('Buy groceries');
const deleteBtn = within(firstItem).getByRole('button', { name: 'Delete' });
```

## Debugging Queries

### screen.debug()

Print the current DOM:

```typescript
import { render, screen } from '@philjs/testing';

render(<ComplexComponent />);

// Print entire document.body
screen.debug();

// Print specific element
screen.debug(screen.getByRole('form'));

// Limit output length
screen.debug(undefined, 10000);
```

### screen.logTestingPlaygroundURL()

Generate a Testing Playground URL for debugging:

```typescript
import { render, screen } from '@philjs/testing';

render(<Component />);

// Logs a URL to Testing Playground
screen.logTestingPlaygroundURL();
```

### Common Query Errors

#### No Matching Element

```typescript
// Error: Unable to find an element with the role "button"
screen.getByRole('button');

// Solution: Use queryBy* to check existence first
const button = screen.queryByRole('button');
if (button) {
  // Element exists
}
```

#### Multiple Matching Elements

```typescript
// Error: Found multiple elements with the role "button"
screen.getByRole('button');

// Solution: Be more specific
screen.getByRole('button', { name: 'Submit' });

// Or use getAllBy*
const buttons = screen.getAllByRole('button');
```

#### Element Not Accessible

```typescript
// Element is hidden
screen.getByRole('button', { hidden: true });

// Element has display: none
// Use debug to inspect
screen.debug();
```

## Best Practices

### 1. Prefer Accessible Queries

```typescript
// Best - reflects how assistive tech sees the page
screen.getByRole('button', { name: 'Submit' });

// Good - reflects what users see
screen.getByText('Submit');

// Acceptable - for form elements
screen.getByLabelText('Email');

// Last resort - not user-facing
screen.getByTestId('submit-button');
```

### 2. Use Specific Queries

```typescript
// Bad - too generic
screen.getByRole('button');

// Good - specific
screen.getByRole('button', { name: 'Submit Form' });
```

### 3. Query by Visible Text

```typescript
// Good - matches what user sees
screen.getByText('Click here to continue');

// Bad - matches implementation
screen.getByTestId('continue-btn');
```

### 4. Use RegExp for Flexibility

```typescript
// Strict - fails on minor text changes
screen.getByRole('button', { name: 'Submit Form Now' });

// Flexible - handles variations
screen.getByRole('button', { name: /submit/i });
```

### 5. Scope Queries When Needed

```typescript
// Can be ambiguous
screen.getByRole('button', { name: 'Delete' });

// Clear scope
const itemRow = screen.getByTestId('item-1');
within(itemRow).getByRole('button', { name: 'Delete' });
```

## API Reference

### Query Functions

| Query | Returns | When Not Found |
|-------|---------|----------------|
| `getBy*` | `HTMLElement` | Throws |
| `getAllBy*` | `HTMLElement[]` | Throws |
| `queryBy*` | `HTMLElement \| null` | Returns `null` |
| `queryAllBy*` | `HTMLElement[]` | Returns `[]` |
| `findBy*` | `Promise<HTMLElement>` | Throws (after timeout) |
| `findAllBy*` | `Promise<HTMLElement[]>` | Throws (after timeout) |

### Query Priority

1. `getByRole` - Best for accessibility
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Input hints
4. `getByText` - Non-interactive elements
5. `getByDisplayValue` - Current values
6. `getByAltText` - Images
7. `getByTitle` - Title attributes
8. `getByTestId` - Last resort

## Next Steps

- [Events](./events.md) - Simulate user interactions
- [Async Utilities](./async.md) - Handle asynchronous testing
- [Rendering](./rendering.md) - Component rendering options
