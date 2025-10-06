# Portals

Portals let you render components outside their parent DOM hierarchy. Perfect for modals, tooltips, and overlays.

## What You'll Learn

- What portals are and why they're useful
- Creating portals
- Common portal patterns
- Accessibility considerations
- Best practices

## What is a Portal?

A portal renders a component's children into a different part of the DOM:

```typescript
// Renders into #modal-root instead of parent
<Portal target="#modal-root">
  <Modal>
    <h2>Modal Content</h2>
  </Modal>
</Portal>
```

**Why?** Some components need to break out of their parent's styling or z-index constraints.

## Creating a Portal

```typescript
interface PortalProps {
  children: any;
  target?: string | HTMLElement;
}

function Portal({ children, target = 'body' }: PortalProps) {
  const containerRef = signal<HTMLElement | null>(null);

  effect(() => {
    // Get target element
    const targetEl = typeof target === 'string'
      ? document.querySelector(target)
      : target;

    if (!targetEl) {
      console.error('Portal target not found:', target);
      return;
    }

    // Create container
    const container = document.createElement('div');
    containerRef.set(container);

    // Append to target
    targetEl.appendChild(container);

    // Cleanup
    return () => {
      targetEl.removeChild(container);
    };
  });

  const container = containerRef();
  if (!container) return null;

  // In real PhilJS, use createPortal API
  // This is a simplified version
  return <div ref={(el) => {
    if (el && container) {
      container.appendChild(el);
    }
  }}>{children}</div>;
}

// HTML setup
// <div id="root"></div>
// <div id="modal-root"></div>
```

## Common Use Cases

### Modal Dialog

```typescript
function Modal({ isOpen, onClose, children }: {
  isOpen: boolean;
  onClose: () => void;
  children: any;
}) {
  if (!isOpen) return null;

  return (
    <Portal target="body">
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}

// Usage:
function App() {
  const modalOpen = signal(false);

  return (
    <div>
      <button onClick={() => modalOpen.set(true)}>
        Open Modal
      </button>

      <Modal
        isOpen={modalOpen()}
        onClose={() => modalOpen.set(false)}
      >
        <h2>Modal Title</h2>
        <p>Modal content goes here</p>
        <button onClick={() => modalOpen.set(false)}>Close</button>
      </Modal>
    </div>
  );
}
```

### Tooltip

```typescript
function Tooltip({ children, text }: { children: any; text: string }) {
  const showTooltip = signal(false);
  const position = signal({ x: 0, y: 0 });

  const handleMouseEnter = (e: MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    position.set({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
    showTooltip.set(true);
  };

  const handleMouseLeave = () => {
    showTooltip.set(false);
  };

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {showTooltip() && (
        <Portal>
          <div
            style={{
              position: 'fixed',
              left: `${position().x}px`,
              top: `${position().y}px`,
              transform: 'translate(-50%, -100%)',
              background: '#333',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              zIndex: 9999
            }}
          >
            {text}
          </div>
        </Portal>
      )}
    </>
  );
}

// Usage:
<Tooltip text="This is helpful info">
  Hover me
</Tooltip>
```

### Dropdown Menu

```typescript
function Dropdown({ trigger, children }: {
  trigger: any;
  children: any;
}) {
  const isOpen = signal(false);
  const triggerRef = signal<HTMLElement | null>(null);
  const position = signal({ top: 0, left: 0 });

  const updatePosition = () => {
    const trigger = triggerRef();
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    position.set({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
  };

  const toggle = () => {
    if (!isOpen()) {
      updatePosition();
    }
    isOpen.set(!isOpen());
  };

  // Close on outside click
  effect(() => {
    if (!isOpen()) return;

    const handleClick = (e: MouseEvent) => {
      const trigger = triggerRef();
      if (trigger && !trigger.contains(e.target as Node)) {
        isOpen.set(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });

  return (
    <>
      <div ref={(el) => triggerRef.set(el)} onClick={toggle}>
        {trigger}
      </div>

      {isOpen() && (
        <Portal>
          <div
            style={{
              position: 'absolute',
              top: `${position().top}px`,
              left: `${position().left}px`,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              minWidth: '200px',
              zIndex: 1000
            }}
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}

// Usage:
<Dropdown trigger={<button>Menu</button>}>
  <div style={{ padding: '0.5rem' }}>
    <div>Option 1</div>
    <div>Option 2</div>
    <div>Option 3</div>
  </div>
</Dropdown>
```

### Notification/Toast

```typescript
const notifications = signal<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

function addNotification(message: string, type: 'success' | 'error' = 'success') {
  const id = Date.now();
  notifications.set([...notifications(), { id, message, type }]);

  setTimeout(() => {
    notifications.set(notifications().filter(n => n.id !== id));
  }, 3000);
}

function NotificationContainer() {
  return (
    <Portal>
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        {notifications().map(notification => (
          <div
            key={notification.id}
            style={{
              background: notification.type === 'success' ? '#4caf50' : '#f44336',
              color: 'white',
              padding: '1rem',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              minWidth: '300px'
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </Portal>
  );
}

// Usage:
function App() {
  return (
    <div>
      <button onClick={() => addNotification('Success!', 'success')}>
        Show Success
      </button>
      <button onClick={() => addNotification('Error!', 'error')}>
        Show Error
      </button>

      <NotificationContainer />
    </div>
  );
}
```

## Accessibility

### Focus Management

```typescript
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = signal<HTMLDivElement | null>(null);
  const previousFocus = signal<HTMLElement | null>(null);

  effect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocus.set(document.activeElement as HTMLElement);

      // Focus modal
      const modal = modalRef();
      if (modal) {
        const focusable = modal.querySelector('button, input, [tabindex]') as HTMLElement;
        focusable?.focus();
      }

      return () => {
        // Restore previous focus
        previousFocus()?.focus();
      };
    }
  });

  if (!isOpen) return null;

  return (
    <Portal>
      <div ref={(el) => modalRef.set(el)} role="dialog" aria-modal="true">
        {children}
      </div>
    </Portal>
  );
}
```

### Keyboard Navigation

```typescript
function Modal({ isOpen, onClose, children }: ModalProps) {
  // Close on Escape
  effect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  return (
    <Portal>
      <div role="dialog" aria-modal="true">
        {children}
      </div>
    </Portal>
  );
}
```

### Screen Reader Support

```typescript
function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: any;
}) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <h2 id="modal-title">{title}</h2>
        <div id="modal-description">
          {children}
        </div>
        <button onClick={onClose} aria-label="Close modal">
          ×
        </button>
      </div>
    </Portal>
  );
}
```

## Best Practices

### Cleanup on Unmount

```typescript
// ✅ Good - cleans up portal element
effect(() => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  return () => {
    document.body.removeChild(container);
  };
});
```

### Event Bubbling

Events in portals bubble through the React tree, not the DOM tree:

```typescript
function Parent() {
  const handleClick = () => {
    console.log('Parent clicked');
  };

  return (
    <div onClick={handleClick}>
      <Portal>
        <button>
          Click me
          {/* Click event bubbles to Parent in React tree */}
        </button>
      </Portal>
    </div>
  );
}
```

### Z-Index Management

```typescript
const zIndexLevels = {
  modal: 1000,
  dropdown: 900,
  tooltip: 1100,
  notification: 9999
};

function Modal() {
  return (
    <Portal>
      <div style={{ zIndex: zIndexLevels.modal }}>
        Modal content
      </div>
    </Portal>
  );
}
```

## Common Patterns

### Confirm Dialog

```typescript
function useConfirm() {
  const isOpen = signal(false);
  const message = signal('');
  const resolveRef = signal<((value: boolean) => void) | null>(null);

  const confirm = (msg: string): Promise<boolean> => {
    message.set(msg);
    isOpen.set(true);

    return new Promise((resolve) => {
      resolveRef.set(() => resolve);
    });
  };

  const handleConfirm = (value: boolean) => {
    resolveRef()?.(value);
    isOpen.set(false);
  };

  const ConfirmDialog = () => (
    <Modal isOpen={isOpen()} onClose={() => handleConfirm(false)}>
      <h2>Confirm</h2>
      <p>{message()}</p>
      <button onClick={() => handleConfirm(false)}>Cancel</button>
      <button onClick={() => handleConfirm(true)}>OK</button>
    </Modal>
  );

  return { confirm, ConfirmDialog };
}

// Usage:
function App() {
  const { confirm, ConfirmDialog } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm('Are you sure you want to delete this?');
    if (confirmed) {
      // Delete item
    }
  };

  return (
    <div>
      <button onClick={handleDelete}>Delete</button>
      <ConfirmDialog />
    </div>
  );
}
```

## Summary

You've learned:

✅ What portals are and why they're useful
✅ Creating portals that render outside parent DOM
✅ Common patterns: modals, tooltips, dropdowns, notifications
✅ Accessibility: focus management, keyboard nav, ARIA
✅ Best practices and event handling

Portals are essential for overlays that break out of parent constraints!

---

**Next:** [Environment Variables →](./environment-variables.md) Manage configuration across environments
