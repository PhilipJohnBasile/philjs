# Event Simulation

`@philjs/testing` provides two approaches to simulating user interactions: `fireEvent` for simple DOM events and `userEvent` for realistic user behavior simulation.

## fireEvent vs userEvent

| Aspect | fireEvent | userEvent |
|--------|-----------|-----------|
| Speed | Fastest | Slower (simulates real timing) |
| Realism | Low | High |
| Events | Single events | Event sequences |
| Async | Synchronous | Asynchronous |
| Use Case | Simple interactions | Complex user flows |

**Recommendation:** Use `userEvent` for most tests. Use `fireEvent` when you need low-level control or faster tests.

## fireEvent

### Basic Usage

```typescript
import { render, screen, fireEvent } from '@philjs/testing';

it('handles click event', () => {
  const handleClick = vi.fn();
  render(<button onClick={handleClick}>Click me</button>);

  fireEvent.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Common Events

#### Mouse Events

```typescript
import { fireEvent, screen } from '@philjs/testing';

// Click
fireEvent.click(screen.getByRole('button'));

// Double click
fireEvent.dblClick(screen.getByRole('button'));

// Mouse down/up (for drag operations)
fireEvent.mouseDown(element);
fireEvent.mouseUp(element);

// Hover
fireEvent.mouseOver(element);
fireEvent.mouseOut(element);
fireEvent.mouseEnter(element);
fireEvent.mouseLeave(element);

// Context menu (right-click)
fireEvent.contextMenu(element);
```

#### Form Events

```typescript
import { fireEvent, screen } from '@philjs/testing';

// Input change
fireEvent.change(screen.getByLabelText('Email'), {
  target: { value: 'test@example.com' },
});

// Input event (for real-time updates)
fireEvent.input(screen.getByLabelText('Search'), {
  target: { value: 'query' },
});

// Focus/Blur
fireEvent.focus(screen.getByLabelText('Email'));
fireEvent.blur(screen.getByLabelText('Email'));

// Form submit
fireEvent.submit(screen.getByRole('form'));

// Select change
fireEvent.change(screen.getByRole('combobox'), {
  target: { value: 'option2' },
});

// Checkbox toggle
fireEvent.click(screen.getByRole('checkbox'));
```

#### Keyboard Events

```typescript
import { fireEvent, screen } from '@philjs/testing';

const input = screen.getByRole('textbox');

// Key down
fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

// Key up
fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });

// Key press (deprecated, but still works)
fireEvent.keyPress(input, { key: 'a' });

// With modifiers
fireEvent.keyDown(input, {
  key: 's',
  code: 'KeyS',
  ctrlKey: true,
});

// Special keys
fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });
fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
```

#### Scroll Events

```typescript
import { fireEvent, screen } from '@philjs/testing';

const scrollable = screen.getByTestId('scroll-container');

// Scroll event
fireEvent.scroll(scrollable, { target: { scrollY: 100 } });

// Scroll to specific position
fireEvent.scroll(window, { target: { scrollY: 500 } });
```

#### Touch Events

```typescript
import { fireEvent, screen } from '@philjs/testing';

const element = screen.getByTestId('touchable');

// Touch start
fireEvent.touchStart(element, {
  touches: [{ clientX: 100, clientY: 100 }],
});

// Touch move
fireEvent.touchMove(element, {
  touches: [{ clientX: 150, clientY: 150 }],
});

// Touch end
fireEvent.touchEnd(element);
```

#### Clipboard Events

```typescript
import { fireEvent, screen } from '@philjs/testing';

const input = screen.getByRole('textbox');

// Copy
fireEvent.copy(input);

// Cut
fireEvent.cut(input);

// Paste
fireEvent.paste(input, {
  clipboardData: {
    getData: () => 'pasted text',
  },
});
```

### Extended Event Helpers

The `fire` object provides higher-level event helpers:

```typescript
import { render, screen } from '@philjs/testing';
import { fire } from '@philjs/testing/events';

// Input with value change
fire.inputValue(screen.getByLabelText('Name'), 'John Doe');

// Change with value
fire.changeValue(screen.getByLabelText('Email'), 'john@example.com');

// Select option
fire.selectOption(screen.getByRole('combobox'), 'option2');

// Toggle checkbox
fire.toggleCheckbox(screen.getByRole('checkbox'));

// Submit form
fire.submitForm(screen.getByRole('form'));

// Type text character by character
fire.type(screen.getByLabelText('Search'), 'hello');

// Special keys
fire.pressEnter(screen.getByRole('textbox'));
fire.pressEscape(screen.getByRole('dialog'));
fire.pressTab(screen.getByRole('textbox'));
fire.pressTab(screen.getByRole('textbox'), true); // Shift+Tab

// Hover
fire.hover(screen.getByRole('button'));
fire.unhover(screen.getByRole('button'));

// Focus
fire.focus(screen.getByRole('textbox'));
fire.blur(screen.getByRole('textbox'));

// Drag and drop
fire.dragAndDrop(
  screen.getByTestId('source'),
  screen.getByTestId('target')
);
```

### Creating Custom Events

```typescript
import { render, screen, createEvent, fireEvent } from '@philjs/testing';

// Create event with custom properties
const button = screen.getByRole('button');
const clickEvent = createEvent.click(button, {
  clientX: 100,
  clientY: 200,
  button: 0,
});

// Fire custom event
fireEvent(button, clickEvent);

// Custom event type
const customEvent = createEvent('my-custom-event', button, {
  bubbles: true,
  cancelable: true,
});
fireEvent(button, customEvent);
```

## userEvent

`userEvent` simulates realistic user interactions with proper event sequences and timing.

### Setup

```typescript
import { render, screen, userEvent, user, setup } from '@philjs/testing';

// Method 1: Default instance
await user.click(screen.getByRole('button'));

// Method 2: Create new instance
const userEvt = setup();
await userEvt.click(screen.getByRole('button'));

// Method 3: With options
const userEvt = userEvent({ delay: 100 });
await userEvt.click(screen.getByRole('button'));
```

### Click Events

```typescript
import { render, screen, user } from '@philjs/testing';

// Single click
await user.click(screen.getByRole('button'));

// Double click
await user.dblClick(screen.getByRole('button'));

// Triple click (selects all text)
await user.tripleClick(screen.getByRole('textbox'));
```

#### What Click Does

A `user.click()` triggers this sequence:
1. `pointerOver` / `mouseOver`
2. `pointerMove` / `mouseMove`
3. `pointerDown` / `mouseDown`
4. `focus` (if focusable)
5. `pointerUp` / `mouseUp`
6. `click`

### Typing Text

```typescript
import { render, screen, user } from '@philjs/testing';

const input = screen.getByLabelText('Name');

// Type text
await user.type(input, 'John Doe');

// Type with click first (default)
await user.type(input, 'text');

// Skip the initial click
await user.type(input, 'more text', { skipClick: true });

// Set cursor position
await user.type(input, 'inserted', {
  initialSelectionStart: 5,
  initialSelectionEnd: 5,
});
```

#### What Type Does

For each character, `user.type()` triggers:
1. `keyDown`
2. `keyPress`
3. Value update
4. `input` event
5. `keyUp`

After all characters:
6. `change` event

### Clearing Input

```typescript
import { render, screen, user } from '@philjs/testing';

const input = screen.getByLabelText('Name');

// Clear existing content
await user.clear(input);

// Clear and type new value
await user.clear(input);
await user.type(input, 'New value');
```

### Selecting Options

```typescript
import { render, screen, user } from '@philjs/testing';

// Single select
const select = screen.getByRole('combobox');
await user.selectOptions(select, 'option1');

// Multiple select (for <select multiple>)
const multiSelect = screen.getByRole('listbox');
await user.selectOptions(multiSelect, ['option1', 'option2']);

// By visible text
await user.selectOptions(select, 'First Option');

// Deselect options
await user.deselectOptions(multiSelect, ['option1']);
```

### File Upload

```typescript
import { render, screen, user } from '@philjs/testing';

const fileInput = screen.getByLabelText('Upload file');

// Single file
const file = new File(['content'], 'file.txt', { type: 'text/plain' });
await user.upload(fileInput, file);

// Multiple files
const files = [
  new File(['content1'], 'file1.txt', { type: 'text/plain' }),
  new File(['content2'], 'file2.txt', { type: 'text/plain' }),
];
await user.upload(fileInput, files);
```

### Hovering

```typescript
import { render, screen, user } from '@philjs/testing';

const button = screen.getByRole('button');

// Hover over element
await user.hover(button);

// Unhover
await user.unhover(button);
```

#### What Hover Does

`user.hover()` triggers:
1. `pointerOver` / `pointerEnter`
2. `mouseOver` / `mouseEnter`
3. `pointerMove` / `mouseMove`

### Tab Navigation

```typescript
import { render, screen, user } from '@philjs/testing';

render(<Form />);

// Tab to next element
await user.tab();

// Shift+Tab to previous
await user.tab({ shift: true });

// Tab sequence
await user.tab(); // Focus first input
await user.type(screen.getByLabelText('Name'), 'John');
await user.tab(); // Focus email
await user.type(screen.getByLabelText('Email'), 'john@test.com');
await user.tab(); // Focus submit
await user.click(screen.getByRole('button'));
```

### Keyboard Input

```typescript
import { render, screen, user } from '@philjs/testing';

const input = screen.getByRole('textbox');
input.focus();

// Single key
await user.keyboard('{Enter}');

// Key sequence
await user.keyboard('abc{Enter}');

// Special keys
await user.keyboard('{Escape}');
await user.keyboard('{Tab}');
await user.keyboard('{Backspace}');
await user.keyboard('{Delete}');
await user.keyboard('{ArrowUp}');
await user.keyboard('{ArrowDown}');
await user.keyboard('{ArrowLeft}');
await user.keyboard('{ArrowRight}');
await user.keyboard('{Home}');
await user.keyboard('{End}');
await user.keyboard('{PageUp}');
await user.keyboard('{PageDown}');
await user.keyboard('{Space}');

// Modifiers (press and hold)
await user.keyboard('{Shift>}abc{/Shift}'); // ABC
await user.keyboard('{Control>}a{/Control}'); // Select all
await user.keyboard('{Alt>}f{/Alt}'); // Alt+F
await user.keyboard('{Meta>}s{/Meta}'); // Cmd+S
```

### Clipboard Operations

```typescript
import { render, screen, user } from '@philjs/testing';

const input = screen.getByRole('textbox');
await user.type(input, 'some text');

// Select all
await user.tripleClick(input);

// Copy
await user.copy();

// Cut
await user.cut();

// Paste
await user.paste('pasted content');

// Or paste without argument (uses clipboard)
await user.paste();
```

### Pointer Events

```typescript
import { render, screen, user } from '@philjs/testing';

// Low-level pointer control
await user.pointer([
  // Move to element and click
  { target: screen.getByRole('button'), keys: '[MouseLeft]' },

  // Press and hold
  { target: screen.getByRole('slider'), keys: '[MouseLeft>]' },

  // Move while held
  { target: screen.getByTestId('end-point') },

  // Release
  { keys: '[/MouseLeft]' },
]);
```

## Event Options

### userEvent Options

```typescript
interface UserEventOptions {
  // Delay between actions (ms)
  delay?: number;

  // Skip hover events before click
  skipHover?: boolean;

  // Skip click before type
  skipClick?: boolean;
}

// With delay for realistic timing
const user = setup({ delay: 100 });

// For faster tests
const user = setup({ delay: 0 });
```

### Type Options

```typescript
interface TypeOptions {
  // Skip initial click
  skipClick?: boolean;

  // Initial cursor position
  initialSelectionStart?: number;
  initialSelectionEnd?: number;
}

await user.type(input, 'text', {
  skipClick: true,
  initialSelectionStart: 0,
  initialSelectionEnd: 5, // Select first 5 chars
});
```

## Testing Form Interactions

### Complete Form Test

```typescript
import { render, screen, user, waitFor } from '@philjs/testing';

describe('LoginForm', () => {
  it('submits with valid credentials', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    // Check remember me
    await user.click(screen.getByRole('checkbox', { name: 'Remember me' }));

    // Submit
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    // Verify
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });
  });

  it('shows validation errors', async () => {
    render(<LoginForm />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check errors
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.tab(); // Blur to trigger validation

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });
});
```

### Testing Autocomplete

```typescript
import { render, screen, user, waitFor } from '@philjs/testing';

describe('Autocomplete', () => {
  it('filters suggestions as user types', async () => {
    render(<Autocomplete options={['Apple', 'Banana', 'Cherry']} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'a');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Cherry' })).not.toBeInTheDocument();
    });
  });

  it('selects option on click', async () => {
    const handleSelect = vi.fn();
    render(<Autocomplete options={['Apple', 'Banana']} onSelect={handleSelect} />);

    await user.type(screen.getByRole('combobox'), 'a');
    await user.click(await screen.findByRole('option', { name: 'Apple' }));

    expect(handleSelect).toHaveBeenCalledWith('Apple');
  });

  it('navigates with keyboard', async () => {
    render(<Autocomplete options={['Apple', 'Banana', 'Cherry']} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'a');

    // Navigate down
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    // Select with Enter
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('Banana');
  });

  it('closes on Escape', async () => {
    render(<Autocomplete options={['Apple', 'Banana']} />);

    await user.type(screen.getByRole('combobox'), 'a');
    expect(screen.getByRole('listbox')).toBeVisible();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
```

### Testing Drag and Drop

```typescript
import { render, screen } from '@philjs/testing';
import { fire } from '@philjs/testing/events';

describe('DragAndDrop', () => {
  it('moves item between lists', () => {
    render(<KanbanBoard />);

    const item = screen.getByText('Task 1');
    const targetList = screen.getByTestId('done-column');

    fire.dragAndDrop(item, targetList);

    expect(targetList).toContainElement(item);
  });
});
```

## Best Practices

### 1. Use userEvent for User Flows

```typescript
// Good - realistic user behavior
await user.type(screen.getByLabelText('Email'), 'test@example.com');
await user.click(screen.getByRole('button', { name: 'Submit' }));

// Less realistic - use for simple cases
fireEvent.change(input, { target: { value: 'test@example.com' } });
fireEvent.click(button);
```

### 2. Wait for Side Effects

```typescript
// Good - wait for async effects
await user.click(screen.getByRole('button', { name: 'Save' }));
await waitFor(() => {
  expect(screen.getByText('Saved!')).toBeInTheDocument();
});

// Bad - race condition
await user.click(screen.getByRole('button', { name: 'Save' }));
expect(screen.getByText('Saved!')).toBeInTheDocument();
```

### 3. Await userEvent Calls

```typescript
// Good
await user.click(button);
await user.type(input, 'text');

// Bad - can cause race conditions
user.click(button);
user.type(input, 'text');
```

### 4. Use delay: 0 for Fast Tests

```typescript
// Fast tests without delays
const user = setup({ delay: 0 });

// Or globally in setup
beforeEach(() => {
  vi.useFakeTimers();
});
```

### 5. Test Keyboard Accessibility

```typescript
it('is keyboard accessible', async () => {
  render(<Dropdown />);

  // Open with Enter
  screen.getByRole('button').focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('menu')).toBeVisible();

  // Navigate with arrows
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{ArrowDown}');
  expect(screen.getByRole('menuitem', { name: 'Option 2' })).toHaveFocus();

  // Select with Enter
  await user.keyboard('{Enter}');

  // Close with Escape
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});
```

## API Reference

### fireEvent

| Method | Description |
|--------|-------------|
| `fireEvent.click(el)` | Fire click event |
| `fireEvent.dblClick(el)` | Fire double click |
| `fireEvent.change(el, data)` | Fire change event |
| `fireEvent.input(el, data)` | Fire input event |
| `fireEvent.submit(form)` | Fire form submit |
| `fireEvent.focus(el)` | Fire focus event |
| `fireEvent.blur(el)` | Fire blur event |
| `fireEvent.keyDown(el, key)` | Fire key down |
| `fireEvent.keyUp(el, key)` | Fire key up |
| `fireEvent.mouseOver(el)` | Fire mouse over |
| `fireEvent.mouseOut(el)` | Fire mouse out |
| `fireEvent.scroll(el, data)` | Fire scroll event |

### userEvent

| Method | Description |
|--------|-------------|
| `user.click(el)` | Click element |
| `user.dblClick(el)` | Double click |
| `user.tripleClick(el)` | Triple click |
| `user.type(el, text)` | Type text |
| `user.clear(el)` | Clear input |
| `user.selectOptions(el, values)` | Select options |
| `user.deselectOptions(el, values)` | Deselect options |
| `user.upload(el, files)` | Upload files |
| `user.hover(el)` | Hover over element |
| `user.unhover(el)` | Unhover from element |
| `user.tab()` | Tab to next |
| `user.keyboard(text)` | Type with keyboard |
| `user.copy()` | Copy selection |
| `user.cut()` | Cut selection |
| `user.paste(text?)` | Paste text |
| `user.pointer(actions)` | Low-level pointer |

## Next Steps

- [Async Utilities](./async.md) - Handle asynchronous testing
- [Queries](./queries.md) - Find elements in the DOM
- [Signals](./signals.md) - Test reactive state
