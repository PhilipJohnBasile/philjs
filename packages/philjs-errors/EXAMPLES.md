# PhilJS Enhanced Error System - Examples

Real-world examples of how the enhanced error system improves the developer experience.

## Example 1: Signal Read During Update

### Before Enhancement

```typescript
const count = signal(0);
count.set(count() + 1);
```

**Error:**
```
Error: Maximum call stack size exceeded
    at signal.set (signals.js:71)
    at Component (App.tsx:12)
    at render (core.js:45)
    ... 50 more framework lines
```

Developer thinks: "What? Where's the infinite loop? I don't see any loops in my code!"

### After Enhancement

```
[PHIL-001] Cannot read signal 'count' during its own update. This creates an infinite loop.

Location: App.tsx:12:15

Suggestions:
  1. Use signal.peek() to read the current value without tracking dependencies
     Confidence: 95% • Auto-fixable

     Before: count.set(count() + 1);
     After:  count.set(count.peek() + 1);

  2. Use an updater function to access the previous value
     Confidence: 90% • Auto-fixable

     Before: count.set(count() + 1);
     After:  count.set(prev => prev + 1);

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-001-signal-read-during-update

Stack Trace:
→ at App.tsx:12:15
→ at handleClick (App.tsx:8:3)
```

Developer thinks: "Oh! I should use peek() or an updater function. That makes sense!"

---

## Example 2: Hydration Mismatch

### Before Enhancement

```typescript
function Timestamp() {
  return <div>{new Date().toLocaleString()}</div>;
}
```

**Error:**
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
    at hydrate (ssr.js:234)
    at mount (core.js:89)
    ... more framework lines
```

Developer thinks: "Why doesn't it match? Everything looks fine!"

### After Enhancement

```
[PHIL-100] Hydration mismatch detected at /components/Timestamp.
Server HTML does not match client render.

Location: Timestamp.tsx:3:15

Server HTML: <div>12/17/2025, 3:45:23 PM</div>
Client HTML: <div>12/17/2025, 3:45:24 PM</div>

Issue detected: Date/time values differ between server and client

Suggestions:
  1. Ensure the initial state matches between server and client
     Confidence: 85%

     Before: const value = signal(Math.random());
     After:  const value = signal(window.__INITIAL_STATE__.value);

  2. Avoid using browser-only APIs during SSR
     Confidence: 80%

     Before: const width = signal(window.innerWidth);
     After:  const width = signal(typeof window !== 'undefined' ? window.innerWidth : 0);

  3. Check for date/time rendering differences between server and client
     Confidence: 70%

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-100-hydration-mismatch

Stack Trace:
→ at Timestamp (Timestamp.tsx:3:15)
→ at Header (Header.tsx:12:5)
```

Developer thinks: "Ah! The timestamp is different on server vs client. I need to handle that!"

---

## Example 3: Missing Route Parameter

### Before Enhancement

```typescript
navigate('/users');  // Missing :id parameter
```

**Error:**
```
TypeError: Cannot read property 'id' of undefined
    at UserProfile (UserProfile.tsx:5)
    at render (core.js:45)
```

Developer thinks: "What? Why is id undefined? I passed it!"

### After Enhancement

```
[PHIL-201] Route parameter 'id' is required but not provided in navigation.

Location: App.tsx:23:8

Suggestions:
  1. Provide all required route parameters when navigating
     Confidence: 95%

     Before: navigate('/users');
     After:  navigate('/users/123');

  2. Make the parameter optional in the route pattern
     Confidence: 80%

     Before: <Route path="/users/:id" />
     After:  <Route path="/users/:id?" />

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-201-missing-route-parameter

Stack Trace:
→ at handleUserClick (App.tsx:23:8)
→ at UserList (UserList.tsx:15:12)
```

Developer thinks: "Oh! I forgot to include the user ID in the navigation. Easy fix!"

---

## Example 4: Unbatched Updates

### Before Enhancement

```typescript
function handleSubmit() {
  firstName.set('John');
  lastName.set('Doe');
  email.set('john@example.com');
  age.set(30);
}
```

**No error**, but 4 separate re-renders occur.

### After Enhancement

```
[PHIL-003] 4 signals updated consecutively without batching.
This may cause unnecessary re-renders.

Location: Form.tsx:15:3

Suggestion:
  1. Wrap multiple signal updates in batch() to prevent unnecessary re-computations
     Confidence: 90% • Auto-fixable

     Before:
       firstName.set('John');
       lastName.set('Doe');
       age.set(30);

     After:
       batch(() => {
         firstName.set('John');
         lastName.set('Doe');
         age.set(30);
       });

Performance Impact:
  - Without batching: 4 separate update cycles
  - With batching: 1 update cycle

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-003-signal-updated-outside-batch
```

Developer thinks: "Good catch! I'll batch these for better performance."

---

## Example 5: JSX Syntax Error

### Before Enhancement

```typescript
function Component() {
  return (
    <div>
      <p>Hello
    </div>
  );
}
```

**Error:**
```
SyntaxError: Unexpected token '<'
    at parse (parser.js:234)
```

Developer thinks: "What's wrong with my JSX? It looks fine!"

### After Enhancement

```
[PHIL-300] Invalid JSX syntax at Form.tsx:5:5: Unclosed or mismatched JSX tag

Location: Form.tsx:5:5

    3 | function Component() {
    4 |   return (
>   5 |     <div>
          ^
    6 |       <p>Hello
    7 |     </div>
    8 |   );

Suggestions:
  1. Ensure all JSX tags are properly closed and nested correctly
     Confidence: 90%

     Before:
       <div>
         <p>Hello
       </div>

     After:
       <div>
         <p>Hello</p>
       </div>

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-300-invalid-jsx-syntax
```

Developer thinks: "Oh! I forgot to close the <p> tag. Clear now!"

---

## Example 6: Browser API During SSR

### Before Enhancement

```typescript
function Component() {
  const theme = localStorage.getItem('theme');
  return <div className={theme}>Content</div>;
}
```

**Error:**
```
ReferenceError: localStorage is not defined
    at Component (Component.tsx:2)
    at renderToString (ssr.js:45)
```

Developer thinks: "Why is localStorage undefined? This is weird!"

### After Enhancement

```
[PHIL-101] Browser API 'localStorage' called during server-side rendering.
This API is not available on the server.

Location: Component.tsx:2:15

Suggestions:
  1. Guard browser API usage with environment checks
     Confidence: 95% • Auto-fixable

     Before: const data = localStorage.getItem('key');
     After:  const data = typeof window !== 'undefined'
               ? localStorage.getItem('key')
               : null;

  2. Use effects to run code only on the client
     Confidence: 90%

     Before:
       document.title = 'My App';

     After:
       effect(() => {
         if (typeof document !== 'undefined') {
           document.title = 'My App';
         }
       });

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-101-browser-api-during-ssr
```

Developer thinks: "Right! SSR doesn't have localStorage. I need to guard it!"

---

## Example 7: Effect Missing Cleanup

### Before Enhancement

```typescript
effect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  // Missing cleanup
});
```

**Warning:**
```
Warning: Effect in Component.tsx may cause memory leak
```

### After Enhancement

```
[PHIL-004] Effect at Component.tsx:15 does not return a cleanup function.
This may cause memory leaks.

Location: Component.tsx:15:3

Suggestions:
  1. Return a cleanup function from your effect to prevent memory leaks
     Confidence: 85%

     Before:
       effect(() => {
         const timer = setInterval(() => {}, 1000);
         // Missing cleanup!
       });

     After:
       effect(() => {
         const timer = setInterval(() => {}, 1000);
         return () => clearInterval(timer);
       });

  2. Use onCleanup() for more complex cleanup scenarios
     Confidence: 80%

     Before:
       effect(() => {
         const sub = observable.subscribe();
       });

     After:
       effect(() => {
         const sub = observable.subscribe();
         onCleanup(() => sub.unsubscribe());
       });

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-004-effect-missing-cleanup
```

Developer thinks: "Good point! I should clean up that timer."

---

## Example 8: Null Reference Error

### Before Enhancement

```typescript
function UserProfile() {
  const name = user.profile.name;
  return <h1>{name}</h1>;
}
```

**Error:**
```
TypeError: Cannot read property 'name' of undefined
    at UserProfile (UserProfile.tsx:2)
```

Developer thinks: "Which property is undefined? user? profile?"

### After Enhancement

```
[PHIL-500] Cannot read property 'name' of undefined

Location: UserProfile.tsx:2:28

Suggestions:
  1. Use optional chaining to safely access properties
     Confidence: 90% • Auto-fixable

     Before: const name = user.profile.name;
     After:  const name = user?.profile?.name;

  2. Add null checks before accessing properties
     Confidence: 85%

     Before: return <div>{user.name}</div>;
     After:  return <div>{user ? user.name : 'Guest'}</div>;

Learn more: https://philjs.dev/docs/troubleshooting/error-codes#phil-500-null-reference-error

Stack Trace:
→ at UserProfile (UserProfile.tsx:2:28)
→ at App (App.tsx:45:12)
```

Developer thinks: "Ah! profile is undefined. I should use optional chaining!"

---

## Error Overlay Visual

When an error occurs in development, developers see a beautiful overlay like this:

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️  PhilJSError [PHIL-001]                               Close  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cannot read signal 'count' during its own update.               │
│  This creates an infinite loop.                                  │
│                                                                  │
│  Location: App.tsx:12:15                                         │
│                                                                  │
│  💡 Suggestions                                                  │
│                                                                  │
│  1. Use signal.peek() to read the current value without         │
│     tracking dependencies                                        │
│     Confidence: 95% • Auto-fixable                               │
│                                                                  │
│     Before:  count.set(count() + 1);                             │
│     After:   count.set(count.peek() + 1);                        │
│                                                                  │
│  2. Use an updater function to access the previous value         │
│     Confidence: 90% • Auto-fixable                               │
│                                                                  │
│     Before:  count.set(count() + 1);                             │
│     After:   count.set(prev => prev + 1);                        │
│                                                                  │
│  📚 Learn more in the documentation                              │
│  https://philjs.dev/docs/troubleshooting/error-codes#phil-001    │
│                                                                  │
│  Stack Trace                                                     │
│  → at App.tsx:12:15                                              │
│  → at handleClick (App.tsx:8:3)                                  │
│                                                                  │
│  Press Esc to close this overlay                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Conclusion

The enhanced error system transforms cryptic error messages into:
- **Clear explanations** of what went wrong
- **Actionable suggestions** on how to fix it
- **Code examples** showing the right way
- **Documentation links** for learning more
- **Beautiful presentation** that's easy to read

This dramatically improves the developer experience and helps developers learn best practices while debugging.
