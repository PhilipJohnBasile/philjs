# Migrating from Aurelia to PhilJS

This guide outlines the conceptual mapping and migration strategies for moving from Aurelia (1 or 2) to PhilJS.

## Conceptual Mapping

| Aurelia Concept | PhilJS Equivalent | Notes |
|:----------------|:------------------|:------|
| **Binding Engine** | Signals | PhilJS signals are fine-grained and do not require dirty checking. |
| **`@bindable`** | `props` | Passed directly to component functions. |
| **`attached()`** | `effect(() => ...)` | Use effects for lifecycle-like behavior. |
| **Dependency Injection** | `@philjs/di` | Use `Injectable` and `Injector` for similar patterns. |
| **Value Converters** | Derived Signals / Helper Functions | Just use standard JS/TS functions in your templates. |
| **Custom Elements** | Components | PhilJS components are just functions. |
| **HTML Templates** | JSX / TSX | PhilJS uses JSX for type safety and expressiveness. |

## Strategy

1. **Hybrid Approach**: Use the `Universal Component Protocol` to mount PhilJS components inside your Aurelia app during transition.
2. **DI Migration**: Move services to `@philjs/di` first, as it can be used standalone.
3. **Route-by-Route**: Replace top-level routes one by one.

## Example

### Aurelia

```javascript
export class UserProfile {
  @bindable userId;
  
  attached() {
    this.loadUser();
  }
}
```

### PhilJS

```typescript
import { signal, effect } from '@philjs/core';

export function UserProfile({ userId }) {
    const user = signal(null);
    
    effect(async () => {
        user.value = await fetchUser(userId);
    });
    
    return <div>{user.value?.name}</div>;
}
```
