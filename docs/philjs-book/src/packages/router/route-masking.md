# Route Masking

Route masking allows you to display a URL in the browser's address bar that is different from the route being actually rendered. This is commonly used for "modal routes" or "drawer routes" where you want the state to be shareable but the UI to overlay the previous context.

## Concept

-   **Actual Route**: The route component being rendered (e.g., `/photos/123`).
-   **Masked URL**: The URL shown in the address bar (e.g., `/photos/123/modal` or usually specific to the context, like just `/photos/123` while the background remains).

*Note: PhilJS Router's implementation typically sets the `maskAs` to what you want to *show*, while navigating to the *actual* route.*

## Usage

### Basic Masking

```typescript
import { navigateWithMask } from '@philjs/router';

// Navigate to the photo detail route, but keep the URL looking like the feed
navigateWithMask('/photos/123', {
  maskAs: '/feed', 
  state: { modal: true }
});
```

### Modals (`navigateAsModal`)

A common pattern for Instagram-style photo modals.

```typescript
import { navigateAsModal } from '@philjs/router';

// Opens /photos/123 as a modal overlay
// The URL will update to /photos/123, but the background page preserves its state
navigateAsModal('/photos/123', {
  backgroundRoute: '/feed' // Optional fallback
});
```

### Drawers (`navigateAsDrawer`)

Similar to modals but for side panels.

```typescript
import { navigateAsDrawer } from '@philjs/router';

navigateAsDrawer('/settings/profile', {
  side: 'right', // 'left' | 'right' | 'top' | 'bottom'
  backgroundRoute: '/dashboard'
});
```

## History Management

The masking system integrates with the History API to ensure back/forward navigation works intuitively.

-   **Preserve Mask**: Options to keep the mask active across subsequent navigations (nested masking).
-   **Restoration**: Masks are restored on page reload or history traversal if configured.

### Configuration

```typescript
import { initRouteMasking } from '@philjs/router';

initRouteMasking({
  enabled: true,
  maxStackDepth: 10,
  restoreOptions: {
    onPopState: true, // Restore mask on back button
    fromHistory: true // Restore from history state on reload
  }
});
```

## Check Current Mask

```typescript
import { useRouteMask, useIsRouteMasked } from '@philjs/router';

function MyComponent() {
  const isMasked = useIsRouteMasked();
  const mask = useRouteMask();

  if (isMasked) {
    console.log('Actual:', mask.actualRoute);
    console.log('Shown:', mask.maskedUrl);
  }
}
```
