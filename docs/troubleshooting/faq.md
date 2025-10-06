# Frequently Asked Questions

Common questions about PhilJS and their answers.

## General Questions

### What is PhilJS?

PhilJS is a modern JavaScript framework featuring:
- **Fine-grained reactivity** - Updates only what changed, no virtual DOM
- **Signals-based state** - Simple, predictable reactive primitives
- **TypeScript-first** - Built with TypeScript for excellent type inference
- **Minimal API surface** - Easy to learn, powerful to use
- **Server-side rendering** - Built-in SSR support

### How is PhilJS different from React?

| Feature | React | PhilJS |
|---------|-------|--------|
| Reactivity | Virtual DOM | Fine-grained signals |
| State | useState | signal() |
| Computed | useMemo | memo() |
| Effects | useEffect | effect() |
| Dependencies | Manual arrays | Automatic tracking |
| Re-renders | Entire component | Only changed parts |
| Performance | Good | Excellent |

### How is PhilJS different from Vue?

| Feature | Vue 3 | PhilJS |
|---------|-------|--------|
| Templates | SFC templates | JSX |
| State | ref()/reactive() | signal() |
| Computed | computed() | memo() |
| Effects | watchEffect() | effect() |
| Syntax | .value | () call |
| Updates | Proxy-based | Signal-based |

### How is PhilJS different from Solid?

PhilJS is heavily inspired by Solid and shares similar concepts. The main differences are:
- API naming (signal() vs createSignal())
- Some additional features
- Different ecosystem

### Is PhilJS production-ready?

PhilJS is designed for production use with:
- ✅ Stable API
- ✅ SSR support
- ✅ TypeScript support
- ✅ Testing utilities
- ✅ Performance optimizations
- ✅ Comprehensive documentation

However, check the current version and stability before using in critical applications.

### What's the learning curve?

**If you know React:** 1-2 days to get comfortable
- Similar concepts (components, effects, memos)
- Main difference: signals instead of useState
- No dependency arrays needed

**If you know Vue:** 1-2 days to get comfortable
- Similar Composition API patterns
- JSX instead of templates
- () instead of .value

**If you're new to frameworks:** 1 week to get productive
- Learn JavaScript/TypeScript first
- Understand reactive programming
- Follow tutorials and examples

## Technical Questions

### Do I need to call signals everywhere?

**Yes**, when reading values:

```tsx
// ✅ Correct
<p>Count: {count()}</p>

// ❌ Wrong - shows [Function]
<p>Count: {count}</p>
```

**Exception:** When passing to another function that will call it.

### Why use .set() instead of direct assignment?

Direct assignment doesn't trigger reactivity:

```tsx
// ❌ Doesn't work
count = count + 1;  // Just reassigns variable

// ✅ Works
count.set(count() + 1);  // Triggers updates
```

### Can I use classes with signals?

Yes, but use immutable updates:

```tsx
class User {
  constructor(public name: string, public age: number) {}
}

const user = signal(new User('Alice', 30));

// ❌ Mutation doesn't trigger update
user().age = 31;

// ✅ Create new instance
user.set(new User('Alice', 31));

// Or use object
const userObj = signal({ name: 'Alice', age: 30 });
userObj.set({ ...userObj(), age: 31 });
```

### How do I handle forms?

Use controlled components:

```tsx
function Form() {
  const email = signal('');
  const password = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({ email: email(), password: password() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.currentTarget.value)}
      />

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.currentTarget.value)}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Can I use PhilJS with existing React code?

Not directly. PhilJS is a separate framework. You would need to:
1. Migrate components one by one
2. Use a micro-frontend architecture
3. Rewrite the application

See [Migration Guides](../migration/from-react.md) for help.

### Does PhilJS support TypeScript?

Yes! PhilJS is built with TypeScript and provides excellent type inference:

```tsx
interface User {
  id: string;
  name: string;
}

// Full type inference
const user = signal<User | null>(null);

user.set({ id: '1', name: 'Alice' });  // ✅ Type-safe
user.set({ id: 1, name: 'Alice' });    // ❌ Type error
```

### How do I debug PhilJS apps?

See [Debugging Guide](./debugging.md) for comprehensive debugging techniques.

Quick tips:
- Use console.log in effects
- Set breakpoints with `debugger`
- Use browser DevTools
- Check signal values
- Monitor network requests

### What about SEO?

PhilJS supports SSR for SEO:

```tsx
// Server
import { renderToString } from 'philjs-ssr';

const html = await renderToString(<App />);

// Client
import { hydrate } from 'philjs-core';

hydrate(<App />, document.getElementById('app')!);
```

### Can I use PhilJS for mobile apps?

PhilJS is primarily for web applications. For mobile:
- Use PhilJS for mobile web apps (PWA)
- Consider React Native or similar for native apps
- PhilJS can power the web version

### What about testing?

PhilJS has excellent testing support:

```tsx
import { describe, it, expect } from 'vitest';
import { signal, effect } from 'philjs-core';

describe('Counter', () => {
  it('increments count', () => {
    const count = signal(0);
    count.set(count() + 1);
    expect(count()).toBe(1);
  });
});
```

See [Testing Guide](../best-practices/testing.md) for more.

## Performance Questions

### Is PhilJS fast?

Yes! PhilJS uses fine-grained reactivity:
- ✅ No virtual DOM overhead
- ✅ Only updates changed parts
- ✅ Automatic dependency tracking
- ✅ Minimal re-computation
- ✅ Small bundle size

### Should I use memo() everywhere?

No! Only use memo() for:
- ✅ Expensive computations
- ✅ Derived values used multiple times
- ✅ Complex filtering/sorting

Don't use for:
- ❌ Simple operations (x * 2)
- ❌ Single-use values
- ❌ Direct signal access

### How do I optimize large lists?

Use virtualization:

```tsx
import { VirtualList } from './VirtualList';

<VirtualList
  items={thousands}
  itemHeight={50}
  containerHeight={600}
  renderItem={(item) => <Item data={item} />}
/>
```

### What's the bundle size?

PhilJS core is very small:
- **Core**: ~5kb gzipped
- **Router**: ~2kb gzipped
- **SSR**: ~3kb gzipped

Total typical app: ~10-15kb for framework code.

## API Questions

### When should I use memo() vs effect()?

**memo()**: For computed values (no side effects)

```tsx
const doubled = memo(() => count() * 2);  // Computation
```

**effect()**: For side effects

```tsx
effect(() => {
  console.log('Count:', count());  // Side effect
});
```

### Can effects be async?

Yes:

```tsx
effect(async () => {
  const data = await fetchData();
  result.set(data);
});
```

But be careful with cleanup and race conditions!

### How do I share state between components?

**Option 1: Lift state up**

```tsx
function Parent() {
  const count = signal(0);

  return (
    <>
      <ChildA count={count} />
      <ChildB count={count} />
    </>
  );
}
```

**Option 2: Global store**

```tsx
// store.ts
export const count = signal(0);

// Component A
import { count } from './store';
```

**Option 3: Context**

```tsx
const CountContext = createContext(0);

// Provider
<CountContext.Provider value={count()}>
  <Children />
</CountContext.Provider>

// Consumer
const count = useContext(CountContext);
```

### Do I need dependency arrays?

No! PhilJS automatically tracks dependencies:

```tsx
// React (manual dependencies)
useEffect(() => {
  console.log(count);
}, [count]);  // Must list dependencies

// PhilJS (automatic tracking)
effect(() => {
  console.log(count());  // Automatically tracked
});
```

### Can I use hooks outside components?

Yes! PhilJS "hooks" (signal, memo, effect) can be used anywhere:

```tsx
// ✅ In component
function Component() {
  const count = signal(0);
  return <div>{count()}</div>;
}

// ✅ In store
export const userStore = {
  user: signal(null),
  isAuthenticated: memo(() => user() !== null)
};

// ✅ In utility function
export function createCounter(initial = 0) {
  const count = signal(initial);
  const doubled = memo(() => count() * 2);
  return { count, doubled };
}
```

## Ecosystem Questions

### What tools work with PhilJS?

- **Build tools**: Vite, Webpack, Rollup
- **Testing**: Vitest, Jest
- **TypeScript**: Full support
- **ESLint**: Compatible
- **Prettier**: Compatible
- **VS Code**: Excellent support

### Are there UI component libraries?

The PhilJS ecosystem is growing. You can:
1. Build your own components
2. Adapt headless UI libraries
3. Use CSS frameworks (Tailwind, etc.)
4. Create component libraries

### Can I use React libraries?

Not directly. PhilJS is a separate framework. However:
- Headless libraries may work with adapters
- CSS-only libraries work fine
- Port React components to PhilJS (usually straightforward)

### Is there a PhilJS devtools?

Check the PhilJS ecosystem for devtools extensions. Features may include:
- Signal inspection
- Effect tracking
- Component tree
- Performance profiling
- Time-travel debugging

## Deployment Questions

### How do I deploy PhilJS apps?

PhilJS apps deploy like any web application:

**Static hosting:**
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

**Server-side rendering:**
- Vercel
- AWS
- DigitalOcean
- Your own server

### Do I need a server for SSR?

Only if you want server-side rendering. For client-only apps:
- ✅ Static hosting is sufficient
- ✅ No server needed
- ✅ Deploy anywhere

### What about CI/CD?

Standard CI/CD works:

```yaml
# .github/workflows/deploy.yml
- run: npm ci
- run: npm test
- run: npm run build
- run: npm run deploy
```

## Community Questions

### Where can I get help?

1. **Documentation**: You're reading it!
2. **GitHub Discussions**: Ask questions
3. **Discord**: Real-time chat
4. **Stack Overflow**: Tag questions with `philjs`
5. **GitHub Issues**: Report bugs

### How can I contribute?

- Report bugs
- Submit PRs
- Improve documentation
- Create examples
- Help others
- Write blog posts

### Is PhilJS open source?

Check the PhilJS repository for licensing information. Most modern frameworks are open source (MIT or similar license).

## Migration Questions

### Should I migrate from React to PhilJS?

Consider PhilJS if:
- ✅ You want better performance
- ✅ You like fine-grained reactivity
- ✅ You want simpler state management
- ✅ You're starting a new project

Stick with React if:
- ❌ You have a large existing codebase
- ❌ You depend heavily on React ecosystem
- ❌ Your team isn't ready to learn new tools

### How long does migration take?

Depends on app size:
- **Small app** (10 components): 1-2 days
- **Medium app** (50 components): 1-2 weeks
- **Large app** (200+ components): 1-2 months

Can be done incrementally with micro-frontends.

### What about React hooks I use?

Most React hooks have PhilJS equivalents:

| React | PhilJS |
|-------|--------|
| useState | signal() |
| useMemo | memo() |
| useEffect | effect() |
| useContext | useContext() |
| useReducer | Custom store |
| useCallback | Not needed |
| useRef | signal() or ref attribute |
| useLayoutEffect | effect() |

## Still Have Questions?

- 📚 Read the [Documentation](../README.md)
- 💬 Ask on [GitHub Discussions](https://github.com/philjs/philjs/discussions)
- 🐛 Report bugs on [GitHub Issues](https://github.com/philjs/philjs/issues)
- 💡 Check [Common Issues](./common-issues.md)
- 🔧 See [Debugging Guide](./debugging.md)

---

**Can't find your answer?** Ask the community! We're here to help.

Return to [Troubleshooting Overview](./overview.md) for more resources.
