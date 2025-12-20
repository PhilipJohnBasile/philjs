# PhilJS Storybook Examples

This directory contains example stories demonstrating various PhilJS Storybook features.

## Examples

### Button.stories.tsx
Basic component story showing:
- Multiple variants (primary, secondary, danger)
- Multiple sizes (small, medium, large)
- Disabled state
- ArgTypes configuration
- Multiple story variations

### UserProfile.stories.tsx
Route component story showing:
- Mock router setup
- Route parameters
- Loader data
- Loading states
- Error states

### ContactForm.stories.tsx
Form component story showing:
- Form validation
- User interactions with `@storybook/test`
- Submitting states
- Error handling
- Play functions for testing

### Counter.stories.tsx
Island component story showing:
- Signal state management
- Interactive components
- Boundary testing
- User interaction testing
- Multiple story variants

## Running the Examples

1. Install dependencies:
```bash
pnpm install
```

2. Build the package:
```bash
pnpm build
```

3. Initialize Storybook in a test project:
```bash
philjs storybook init
```

4. Copy example stories to your Storybook:
```bash
cp examples/*.stories.tsx .storybook/stories/
```

5. Start Storybook:
```bash
pnpm storybook
```

## Key Features Demonstrated

- **Component Stories**: Simple component documentation
- **Route Stories**: Testing route components with mock data
- **Form Stories**: Interactive form testing with user events
- **Island Stories**: Testing interactive components with signals
- **Decorators**: withRouter, withLayout, withSignals
- **Mock Utilities**: createMockLoader, createMockRouter
- **Play Functions**: Automated testing with @storybook/test
- **ArgTypes**: Control panel configuration
