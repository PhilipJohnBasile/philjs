# Sass/SCSS

Use Sass preprocessing for powerful CSS features in PhilJS applications.

## What You'll Learn

- Sass setup
- Variables and nesting
- Mixins and functions
- Partials and imports
- Modules system
- Best practices

## Setup

### Installation

```bash
npm install -D sass
```

### Vite Configuration

Vite supports Sass out of the box:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  }
});
```

### File Structure

```
src/
  styles/
    _variables.scss      # Variables
    _mixins.scss         # Mixins
    _functions.scss      # Functions
    global.scss          # Global styles
  components/
    Button/
      Button.tsx
      Button.scss
```

## Variables

### Basic Variables

```scss
// _variables.scss
$primary-color: #007bff;
$secondary-color: #6c757d;
$success-color: #28a745;
$danger-color: #dc3545;

$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
$font-size-base: 16px;
$font-size-small: 14px;
$font-size-large: 18px;

$spacing-unit: 8px;
$border-radius: 4px;
$transition-speed: 0.3s;
```

### Using Variables

```scss
// Button.scss
@import '../styles/variables';

.button {
  padding: $spacing-unit $spacing-unit * 2;
  font-family: $font-family;
  font-size: $font-size-base;
  background-color: $primary-color;
  border-radius: $border-radius;
  transition: background-color $transition-speed;

  &:hover {
    background-color: darken($primary-color, 10%);
  }
}
```

## Nesting

### Basic Nesting

```scss
.card {
  background: white;
  border-radius: 8px;
  padding: 16px;

  .card-header {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .card-body {
    color: #666;
    line-height: 1.6;
  }

  .card-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
}
```

### Parent Selector (&)

```scss
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.button-primary {
    background-color: #007bff;
    color: white;
  }

  &.button-large {
    padding: 12px 24px;
    font-size: 18px;
  }
}
```

### Nested Properties

```scss
.text {
  font: {
    family: sans-serif;
    size: 16px;
    weight: 600;
  }

  border: {
    style: solid;
    width: 1px;
    color: #ccc;
    radius: 4px;
  }
}
```

## Mixins

### Basic Mixins

```scss
// _mixins.scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin card-shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

// Usage
.card {
  @include flex-center;
  @include card-shadow;
  padding: 16px;
}
```

### Mixins with Parameters

```scss
@mixin button-variant($bg-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;

  &:hover {
    background-color: darken($bg-color, 10%);
  }

  &:active {
    background-color: darken($bg-color, 15%);
  }
}

.button-primary {
  @include button-variant(#007bff);
}

.button-success {
  @include button-variant(#28a745);
}

.button-danger {
  @include button-variant(#dc3545);
}
```

### Responsive Mixins

```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'mobile' {
    @media (max-width: 767px) { @content; }
  } @else if $breakpoint == 'tablet' {
    @media (min-width: 768px) and (max-width: 1023px) { @content; }
  } @else if $breakpoint == 'desktop' {
    @media (min-width: 1024px) { @content; }
  }
}

.container {
  padding: 16px;

  @include respond-to('mobile') {
    padding: 8px;
  }

  @include respond-to('tablet') {
    padding: 24px;
  }

  @include respond-to('desktop') {
    padding: 32px;
  }
}
```

## Functions

### Custom Functions

```scss
// _functions.scss
@function rem($pixels) {
  @return #{$pixels / 16}rem;
}

@function color-contrast($color) {
  @if (lightness($color) > 50%) {
    @return #000;
  } @else {
    @return #fff;
  }
}

// Usage
.text {
  font-size: rem(20);  // 1.25rem
}

.button {
  $bg: #007bff;
  background-color: $bg;
  color: color-contrast($bg);  // white
}
```

### Built-in Functions

```scss
.element {
  // Color functions
  background: lighten(#007bff, 20%);
  border-color: darken(#007bff, 10%);
  color: complement(#007bff);

  // Math functions
  width: percentage(3 / 12);     // 25%
  padding: round(16.7px);        // 17px

  // String functions
  font-family: unquote("Roboto, sans-serif");
}
```

## Modules (@use and @forward)

### Using Modules

```scss
// _variables.scss
$primary-color: #007bff;
$secondary-color: #6c757d;
```

```scss
// _mixins.scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```scss
// Button.scss
@use '../styles/variables' as vars;
@use '../styles/mixins';

.button {
  @include mixins.flex-center;
  background-color: vars.$primary-color;
}
```

### Namespacing

```scss
// With namespace
@use '../styles/variables' as v;

.button {
  background: v.$primary-color;
}

// Without namespace
@use '../styles/variables' as *;

.button {
  background: $primary-color;
}
```

### Forwarding

```scss
// _index.scss
@forward 'variables';
@forward 'mixins';
@forward 'functions';
```

```scss
// Component.scss
@use '../styles' as *;

.component {
  background: $primary-color;
  @include flex-center;
}
```

## Partials and Organization

### Partial Files

```scss
// _variables.scss
$primary-color: #007bff;

// _reset.scss
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

// _typography.scss
body {
  font-family: sans-serif;
  line-height: 1.6;
}

// main.scss
@use 'reset';
@use 'variables';
@use 'typography';
```

### 7-1 Architecture

```
styles/
  abstracts/
    _variables.scss
    _functions.scss
    _mixins.scss
  base/
    _reset.scss
    _typography.scss
  components/
    _buttons.scss
    _cards.scss
    _forms.scss
  layout/
    _header.scss
    _footer.scss
    _grid.scss
  pages/
    _home.scss
    _about.scss
  themes/
    _light.scss
    _dark.scss
  vendors/
    _normalize.scss
  main.scss
```

## Component Styling

### Scoped Component Styles

```typescript
// Button.tsx
import './Button.scss';
import { signal } from '@philjs/core';

export function Button({ variant = 'primary' }: {
  variant?: 'primary' | 'secondary';
}) {
  const loading = signal(false);

  return (
    <button
      className={`btn btn-${variant} ${loading() ? 'btn-loading' : ''}`}
      onClick={() => loading.set(true)}
    >
      {loading() ? 'Loading...' : 'Click me'}
    </button>
  );
}
```

```scss
// Button.scss
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.btn {
  padding: $spacing-unit $spacing-unit * 2;
  border: none;
  border-radius: $border-radius;
  font-size: $font-size-base;
  cursor: pointer;
  transition: all $transition-speed;

  @include respond-to('mobile') {
    width: 100%;
  }

  &-primary {
    background-color: $primary-color;
    color: white;

    &:hover {
      background-color: darken($primary-color, 10%);
    }
  }

  &-secondary {
    background-color: $secondary-color;
    color: white;

    &:hover {
      background-color: darken($secondary-color, 10%);
    }
  }

  &-loading {
    opacity: 0.6;
    pointer-events: none;

    &::after {
      content: '...';
      animation: loading 1s infinite;
    }
  }
}

@keyframes loading {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
```

## Advanced Patterns

### BEM with Sass

```scss
.card {
  background: white;
  border-radius: 8px;

  &__header {
    padding: 16px;
    border-bottom: 1px solid #eee;

    &--highlighted {
      background-color: #f0f8ff;
    }
  }

  &__body {
    padding: 16px;
  }

  &__footer {
    padding: 16px;
    border-top: 1px solid #eee;
  }

  &--compact {
    .card__header,
    .card__body,
    .card__footer {
      padding: 8px;
    }
  }
}
```

### Loop Generation

```scss
$colors: (
  'primary': #007bff,
  'success': #28a745,
  'danger': #dc3545,
  'warning': #ffc107
);

@each $name, $color in $colors {
  .btn-#{$name} {
    background-color: $color;
    color: white;

    &:hover {
      background-color: darken($color, 10%);
    }
  }

  .text-#{$name} {
    color: $color;
  }

  .bg-#{$name} {
    background-color: $color;
  }
}

// Generates:
// .btn-primary, .text-primary, .bg-primary
// .btn-success, .text-success, .bg-success
// etc.
```

### Spacing Utilities

```scss
$spacings: (
  0: 0,
  1: 4px,
  2: 8px,
  3: 12px,
  4: 16px,
  5: 20px,
  6: 24px
);

@each $key, $value in $spacings {
  .m-#{$key} { margin: $value; }
  .mt-#{$key} { margin-top: $value; }
  .mr-#{$key} { margin-right: $value; }
  .mb-#{$key} { margin-bottom: $value; }
  .ml-#{$key} { margin-left: $value; }

  .p-#{$key} { padding: $value; }
  .pt-#{$key} { padding-top: $value; }
  .pr-#{$key} { padding-right: $value; }
  .pb-#{$key} { padding-bottom: $value; }
  .pl-#{$key} { padding-left: $value; }
}
```

## Best Practices

### Keep Nesting Shallow

```scss
// ✅ Shallow nesting (max 3 levels)
.card {
  .card-header {
    .card-title {
      font-size: 20px;
    }
  }
}

// ❌ Deep nesting
.card {
  .card-wrapper {
    .card-container {
      .card-header {
        .card-title {
          .card-title-text {
            font-size: 20px;
          }
        }
      }
    }
  }
}
```

### Use @use Instead of @import

```scss
// ✅ Modern @use
@use '../styles/variables' as *;

.button {
  background: $primary-color;
}

// ❌ Deprecated @import
@import '../styles/variables';
```

### Organize Variables by Purpose

```scss
// ✅ Well organized
// Colors
$color-primary: #007bff;
$color-text: #333;

// Spacing
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;

// Typography
$font-family-base: sans-serif;
$font-size-base: 16px;

// ❌ Unorganized
$primary: #007bff;
$xs: 4px;
$font: sans-serif;
$text: #333;
```

### Extract Common Patterns

```scss
// ✅ Reusable mixin
@mixin card-base {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card { @include card-base; }
.modal { @include card-base; }
.tooltip { @include card-base; }

// ❌ Duplicate code
.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## Summary

You've learned:

✅ Sass/SCSS setup with PhilJS
✅ Variables and nesting
✅ Mixins and functions
✅ Modern module system (@use/@forward)
✅ File organization patterns
✅ Component styling
✅ Advanced patterns and loops
✅ Best practices

Sass provides powerful CSS preprocessing for PhilJS apps!

---

**Next:** [Styled Components →](./styled-components.md) Component-scoped styles with TypeScript
