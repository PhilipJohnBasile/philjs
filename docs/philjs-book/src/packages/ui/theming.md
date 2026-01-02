# Theming

@philjs/ui ships with a configurable theme system and dark mode support.

## Theme provider

```tsx
import { ThemeProvider } from '@philjs/ui';

<ThemeProvider
  theme={{
    colors: {
      brand: {
        500: '#2563eb'
      }
    }
  }}
  defaultColorMode="system"
>
  <App />
</ThemeProvider>
```

## Accessing theme values

```tsx
import { useTheme, useColorMode } from '@philjs/ui';

const { theme } = useTheme();
const { isDark, toggleColorMode } = useColorMode();
```

## CSS variables

```ts
import { generateCSSVariables, defaultTheme } from '@philjs/ui';

const css = generateCSSVariables(defaultTheme);
```

## Tips

- Define a `brand` palette and reuse it across buttons, badges, and links.
- Use `data-theme` hooks in CSS for light and dark adjustments.
