# Troubleshooting Overview

Guide to diagnosing and fixing issues in PhilJS applications.

## Quick Diagnosis

### Application Won't Start

**Symptoms:**
- Build fails
- Dev server won't start
- Blank page in browser

**Quick Checks:**
1. ✅ Node version >= 16
2. ✅ Dependencies installed (`npm install`)
3. ✅ No syntax errors
4. ✅ Check browser console for errors
5. ✅ Check terminal for build errors

**Solution:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite

# Restart dev server
npm run dev
```

### Changes Not Reflecting

**Symptoms:**
- Code changes don't appear
- Old content still showing

**Quick Checks:**
1. ✅ Dev server running
2. ✅ Browser auto-refresh enabled
3. ✅ No cached version
4. ✅ Correct file being edited

**Solution:**
```bash
# Hard refresh browser
Ctrl/Cmd + Shift + R

# Clear browser cache
# Or use incognito mode

# Restart dev server
npm run dev
```

### Signals Not Updating

**Symptoms:**
- UI doesn't update when signal changes
- Stale data displayed

**Common Causes:**
```tsx
// ❌ Forgetting to call signal
<p>Count: {count}</p>  // Shows function, not value

// ✅ Call the signal
<p>Count: {count()}</p>

// ❌ Mutating signal value
user().name = 'Bob';  // Doesn't trigger update

// ✅ Use .set() with new value
user.set({ ...user(), name: 'Bob' });
```

## Diagnostic Process

### 1. Identify the Problem

```
┌─────────────────────────────────┐
│  What's not working?            │
│  - Specific feature or behavior │
│  - Error messages               │
│  - Expected vs actual           │
└─────────────────────────────────┘
```

### 2. Gather Information

```tsx
// Enable detailed logging
localStorage.setItem('debug', 'philjs:*');

// Check browser console
console.log('State:', {
  user: user(),
  count: count(),
  items: items()
});

// Check network tab
// - API responses
// - Status codes
// - Timing
```

### 3. Isolate the Issue

```tsx
// Simplify to minimal reproduction
function MinimalExample() {
  const count = signal(0);

  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}

// Does this work? If yes, add complexity step by step
// If no, core PhilJS issue
```

### 4. Test Hypotheses

```tsx
// Hypothesis: Effect not running
effect(() => {
  console.log('Effect ran!');  // Add logging
  console.log('Count:', count());
});

// Hypothesis: Signal not updating
count.set(5);
console.log('After set:', count());  // Should be 5

// Hypothesis: Memo not recomputing
const doubled = memo(() => {
  console.log('Memo recomputed');  // Should log when count changes
  return count() * 2;
});
```

### 5. Apply Solution

```tsx
// Fix identified issue
// Test that it works
// Clean up debug code
// Document if non-obvious
```

## Error Categories

### Build Errors

Issues during compilation or bundling.

**Common Causes:**
- Syntax errors
- Type errors
- Missing dependencies
- Import path errors

**Where to Look:**
- Terminal output
- TypeScript errors
- Vite/bundler errors

→ [See Common Issues](./common-issues.md)

### Runtime Errors

Issues during application execution.

**Common Causes:**
- Null/undefined access
- API errors
- State inconsistencies
- Event handler errors

**Where to Look:**
- Browser console
- Error boundaries
- Network tab
- Application logs

→ [See Debugging Guide](./debugging.md)

### Performance Issues

Application is slow or unresponsive.

**Common Causes:**
- Unnecessary re-renders
- Large list rendering
- Memory leaks
- Expensive computations

**Where to Look:**
- Browser DevTools Performance tab
- Memory profiler
- Network waterfall
- React DevTools Profiler

→ [See Performance Issues](./performance-issues.md)

### Logic Errors

Application works but produces wrong results.

**Common Causes:**
- Incorrect business logic
- State synchronization issues
- Race conditions
- Off-by-one errors

**Where to Look:**
- Unit tests
- State inspection
- Step-through debugging
- Console logs

→ [See Debugging Guide](./debugging.md)

## Debug Checklist

### Before Debugging

- [ ] Can you reproduce the issue consistently?
- [ ] Have you checked the browser console?
- [ ] Have you checked the network tab?
- [ ] Is your code saved and server restarted?
- [ ] Are you on the latest version of PhilJS?
- [ ] Have you searched existing GitHub issues?

### During Debugging

- [ ] Narrow down to smallest reproduction
- [ ] Add strategic console.logs
- [ ] Use debugger statements
- [ ] Check signal values
- [ ] Verify effect dependencies
- [ ] Test in isolation
- [ ] Check for timing issues

### After Fixing

- [ ] Document the fix
- [ ] Add tests to prevent regression
- [ ] Remove debug code
- [ ] Check for similar issues elsewhere
- [ ] Consider if it's a common pitfall

## Getting Help

### Self-Service Resources

1. **Documentation**
   - [Core Concepts](../core-concepts/overview.md)
   - [API Reference](../api-reference/overview.md)
   - [Best Practices](../best-practices/overview.md)

2. **Common Issues**
   - [Common Issues](./common-issues.md)
   - [FAQ](./faq.md)

3. **Examples**
   - Check examples directory
   - Study similar implementations

### Community Help

1. **GitHub Discussions**
   ```
   https://github.com/philjs/philjs/discussions
   ```
   - Ask questions
   - Share solutions
   - Get community input

2. **GitHub Issues**
   ```
   https://github.com/philjs/philjs/issues
   ```
   - Report bugs
   - Request features
   - Track fixes

3. **Discord Server**
   ```
   https://discord.gg/philjs
   ```
   - Real-time help
   - Community chat
   - Quick questions

### Creating Good Bug Reports

```markdown
**Description**
Clear description of the issue

**Reproduction**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- PhilJS version: X.X.X
- Node version: X.X.X
- Browser: Chrome 120
- OS: macOS 14

**Code Example**
```tsx
// Minimal reproduction
function BugExample() {
  const count = signal(0);
  // Issue occurs here...
}
```

**Screenshots/Logs**
Attach relevant screenshots or error logs
```

## Troubleshooting Tools

### Browser DevTools

```
Chrome DevTools:
- Elements: Inspect DOM
- Console: View logs and errors
- Sources: Debug with breakpoints
- Network: Monitor API calls
- Performance: Profile performance
- Memory: Check for leaks
```

### PhilJS DevTools (if available)

```tsx
// Enable devtools in development
import { enableDevTools } from '@philjs/devtools';

if (import.meta.env.DEV) {
  enableDevTools();
}

// Features:
// - Signal inspection
// - Effect tracking
// - Component tree
// - Time-travel debugging
```

### VS Code Extensions

- **ESLint**: Catch errors before runtime
- **TypeScript**: Type checking
- **Error Lens**: Inline error display
- **Console Ninja**: Enhanced console.log

## Prevention Strategies

### Write Tests

```tsx
// Catch issues before they reach production
describe('Counter', () => {
  it('increments count', () => {
    const counter = useCounter();
    counter.increment();
    expect(counter.count()).toBe(1);
  });
});
```

### Use TypeScript

```tsx
// Catch type errors at compile time
interface User {
  id: string;
  name: string;
}

const user = signal<User | null>(null);

// TypeScript error: Property 'email' does not exist
const email = user()?.email;  // ✗
```

### Enable Linting

```json
// .eslintrc
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "no-debugger": "error"
  }
}
```

### Code Reviews

- Peer review changes
- Catch issues early
- Share knowledge
- Enforce standards

## Summary

**Troubleshooting Process:**

1. 🔍 **Identify** - What's wrong?
2. 📊 **Gather** - Collect information
3. 🎯 **Isolate** - Minimal reproduction
4. 💡 **Hypothesize** - Test theories
5. ✅ **Fix** - Apply solution
6. 📝 **Document** - Prevent recurrence

**Next Steps:**

- [Common Issues →](./common-issues.md) - Specific problems and solutions
- [Debugging →](./debugging.md) - Debugging techniques
- [Performance Issues →](./performance-issues.md) - Performance troubleshooting
- [FAQ →](./faq.md) - Frequently asked questions
