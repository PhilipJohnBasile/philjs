# PhilJS Tailwind Plugin Examples

This directory contains comprehensive examples of using the PhilJS Tailwind plugin.

## Examples

### 1. Basic Setup (`basic-setup.ts`)
Shows the minimal configuration needed to get started with Tailwind in PhilJS.

```typescript
import tailwind from "philjs-plugin-tailwind";

export default defineConfig({
  plugins: [tailwind()],
});
```

### 2. Custom Configuration (`custom-config.ts`)
Demonstrates advanced configuration options including:
- Custom content paths
- Dark mode configuration
- Theme customization
- Tailwind plugins
- Optimization settings

### 3. Component Usage (`component-usage.tsx`)
Shows how to use Tailwind classes in React components with:
- Button variants
- Dark mode components
- Responsive grids
- Form inputs
- Advanced component patterns

### 4. Theme Customization (`theme-customization.ts`)
Examples of using theme generator utilities:
- Generate brand themes from colors
- Custom typography scales
- Spacing scales
- Merging multiple themes
- Using preset themes

### 5. Dark Mode (`dark-mode.tsx`)
Complete dark mode implementation including:
- Dark mode toggle hook
- System preference detection
- LocalStorage persistence
- Theme provider
- Dark mode utility usage

### 6. Utilities (`utilities-example.ts`)
Comprehensive guide to all utility functions:
- Class merging and conflict resolution
- Conditional classes
- Variant systems
- Responsive utilities
- State variants
- Arbitrary values
- Class extraction and sorting
- Theme merging

## Running Examples

To use these examples in your project:

1. Install the plugin:
```bash
npm install philjs-plugin-tailwind
```

2. Import the plugin in your `philjs.config.ts`:
```typescript
import tailwind from "philjs-plugin-tailwind";

export default defineConfig({
  plugins: [tailwind()],
});
```

3. Import the generated CSS in your app:
```typescript
import "./styles/tailwind.css";
```

4. Use Tailwind classes or utility functions:
```typescript
import { cn, responsive } from "philjs-plugin-tailwind/utils";

function MyComponent() {
  return (
    <div className={cn("p-4", responsive("text-base", { md: "text-lg" }))}>
      Hello Tailwind!
    </div>
  );
}
```

## Best Practices

1. **Use the `cn()` utility** for combining classes with conflict resolution
2. **Leverage the variant system** for component APIs
3. **Use responsive() helper** for responsive design
4. **Implement dark mode** with the `dark()` utility
5. **Generate themes** using theme generator functions
6. **Optimize for production** by enabling purge and minify options

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PhilJS Documentation](https://philjs.dev)
- [Plugin Configuration Reference](../README.md)
