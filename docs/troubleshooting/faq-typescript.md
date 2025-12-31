# FAQ - TypeScript

TypeScript-related frequently asked questions.

## Setup

**Q: How do I set up TypeScript?**

A: Create tsconfig.json:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core"
  }
}
```

## Type Errors

**Q: "Cannot find module '@philjs/core'"**

A: Add to tsconfig.json:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

**Q: "JSX element implicitly has type 'any'"**

A: Configure JSX:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core"
  }
}
```

## Component Types

**Q: How do I type component props?**

A: Use interfaces:

```tsx
interface Props {
  name: string;
  age?: number;
}

function Component({ name, age }: Props) {}
```

**Q: How do I type signals?**

A: Let TypeScript infer:

```tsx
const count = signal(0); // Signal<number>
const user = signal<User | null>(null);
```

## Next Steps

- [TypeScript Guide](/docs/learn/typescript.md) - TypeScript patterns

---

💡 **Tip**: Enable strict mode for better type safety.
