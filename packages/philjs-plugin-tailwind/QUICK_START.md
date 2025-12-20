# PhilJS Tailwind Plugin - Quick Start Guide

Get up and running with Tailwind CSS in PhilJS in under 5 minutes.

## Installation

```bash
# Using PhilJS CLI (recommended)
philjs plugin add philjs-plugin-tailwind

# Or with npm
npm install philjs-plugin-tailwind tailwindcss autoprefixer postcss
```

## Basic Setup

### 1. Configure the Plugin

```typescript
// philjs.config.ts
import { defineConfig } from "philjs-core";
import tailwind from "philjs-plugin-tailwind";

export default defineConfig({
  plugins: [tailwind()],
});
```

### 2. Import Styles

```typescript
// src/index.tsx or src/main.tsx
import "./styles/tailwind.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">
        Hello Tailwind!
      </h1>
    </div>
  );
}
```

### 3. Start Development

```bash
npm run dev
```

That's it! Tailwind CSS is now configured and ready to use.

## What Gets Generated

The plugin automatically creates:

1. **`tailwind.config.js`** - Tailwind configuration
2. **`postcss.config.js`** - PostCSS configuration
3. **`src/styles/tailwind.css`** - Base styles with custom utilities

## Common Use Cases

### Buttons

```tsx
function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      {children}
    </button>
  );
}
```

### Cards

```tsx
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}
```

### Responsive Grid

```tsx
function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}
```

### Dark Mode

```tsx
function DarkModeExample() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <p>This adapts to dark mode!</p>
    </div>
  );
}

// Toggle dark mode
document.documentElement.classList.toggle("dark");
```

## Using Utilities

The plugin provides helpful utilities:

### Class Merging

```typescript
import { cn } from "philjs-plugin-tailwind/utils";

const buttonClass = cn(
  "px-4 py-2",
  "bg-blue-600",
  isActive && "bg-blue-700",
  isDisabled && "opacity-50"
);
```

### Responsive Utilities

```typescript
import { responsive } from "philjs-plugin-tailwind/utils";

const textClass = responsive("text-base", {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
});
// Result: "text-base sm:text-lg md:text-xl lg:text-2xl"
```

### Dark Mode Helper

```typescript
import { dark } from "philjs-plugin-tailwind/utils";

const cardClass = dark(
  "bg-white text-gray-900",
  "bg-gray-800 text-white"
);
```

## Custom Configuration

Need more control? Customize the plugin:

```typescript
import { createTailwindPlugin } from "philjs-plugin-tailwind";

export default defineConfig({
  plugins: [
    createTailwindPlugin({
      // Custom content paths
      content: ["./src/**/*.{ts,tsx}", "./pages/**/*.tsx"],

      // Dark mode strategy
      darkMode: "class",

      // Custom theme
      theme: {
        colors: {
          primary: "#3b82f6",
          secondary: "#8b5cf6",
        },
        fontFamily: {
          sans: ["Inter", "sans-serif"],
        },
      },

      // Tailwind plugins
      plugins: [
        "@tailwindcss/forms",
        "@tailwindcss/typography",
      ],
    }),
  ],
});
```

## Theme Generation

Generate themes from brand colors:

```typescript
import { generateBrandTheme } from "philjs-plugin-tailwind/theme-generator";

const theme = generateBrandTheme({
  primary: "#3b82f6",
  secondary: "#8b5cf6",
});

// Use in config
export default defineConfig({
  plugins: [
    createTailwindPlugin({
      theme: theme.extend,
    }),
  ],
});
```

## Pre-configured Components

The base CSS includes utility components:

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>

<!-- Cards -->
<div class="card">
  <p>Card content</p>
</div>

<!-- Inputs -->
<input type="text" class="input" placeholder="Enter text" />
```

## Common Patterns

### Conditional Classes

```tsx
const buttonClass = cn(
  "btn",
  variant === "primary" && "btn-primary",
  variant === "secondary" && "btn-secondary",
  isLoading && "opacity-75 cursor-wait",
  disabled && "opacity-50 cursor-not-allowed"
);
```

### Variant System

```typescript
import { createVariants } from "philjs-plugin-tailwind/utils";

const button = createVariants({
  size: {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  },
  variant: {
    primary: "bg-blue-600 text-white",
    secondary: "bg-gray-200 text-gray-800",
  },
});

// Usage
const className = button({ size: "md", variant: "primary" });
```

## Production Optimization

The plugin automatically optimizes for production:

- ✅ Purges unused styles
- ✅ Minifies CSS
- ✅ Removes comments
- ✅ Generates source maps (dev only)

No additional configuration needed!

## Troubleshooting

### Styles not applying?

1. Make sure you imported `./styles/tailwind.css`
2. Check that content paths include your files
3. Restart dev server after config changes

### Dark mode not working?

1. Ensure `darkMode: "class"` in config
2. Toggle with `document.documentElement.classList.toggle("dark")`
3. Or use system preference: `darkMode: "media"`

### Build size too large?

1. Check content paths are specific (not too broad)
2. Ensure purge is enabled (default in production)
3. Remove unused Tailwind plugins

## Next Steps

- 📚 Check out [examples/](./examples/) for more patterns
- 📖 Read the [full documentation](./README.md)
- 🎨 Explore [theme customization](./examples/theme-customization.ts)
- 🌙 Implement [dark mode](./examples/dark-mode.tsx)
- 🧰 Learn about [utilities](./examples/utilities-example.ts)

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PhilJS Documentation](https://philjs.dev)
- [Plugin GitHub](https://github.com/yourusername/philjs/tree/main/packages/philjs-plugin-tailwind)

## Support

- 💬 [Discord Community](https://discord.gg/philjs)
- 🐛 [Report Issues](https://github.com/yourusername/philjs/issues)
- 📧 [Email Support](mailto:support@philjs.dev)

---

Happy styling! 🎨
