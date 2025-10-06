# Portals

Render components outside the normal DOM hierarchy.

## What You'll Learn

- Portal basics
- Modal dialogs
- Tooltips and popovers
- Notifications
- Dropdown menus
- Best practices

## Portal Basics

### Creating a Portal

```typescript
import { effect } from 'philjs-core';

export function createPortal(
  children: JSX.Element,
  container: HTMLElement
): JSX.Element {
  effect(() => {
    // Render children into portal container
    const childElement = children as any;

    if (typeof childElement === 'object' && childElement.type) {
      container.appendChild(childElement);

      return () => {
        if (container.contains(childElement)) {
          container.removeChild(childElement);
        }
      };
    }
  });

  return null as any;
}

// Usage
function App() {
  return (
    <div>
      <h1>Main Content</h1>

      {createPortal(
        <div className="modal">Modal Content</div>,
        document.body
      )}
    </div>
  );
}
```

### Portal Component

```typescript
interface PortalProps {
  children: JSX.Element;
  container?: HTMLElement;
}

export function Portal({ children, container = document.body }: PortalProps) {
  let portalElement: HTMLElement | null = null;

  effect(() => {
    // Create portal container
    portalElement = document.createElement('div');
    portalElement.className = 'portal-container';
    container.appendChild(portalElement);

    // Render children
    render(children, portalElement);

    return () => {
      if (portalElement && container.contains(portalElement)) {
        container.removeChild(portalElement);
      }
    };
  });

  return null as any;
}
```

## Modal Dialogs

### Basic Modal

```typescript
import { signal } from 'philjs-core';

interface ModalProps {
  isOpen: () => boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen()) return null;

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{title}</h2>
            <button onClick={onClose} className="close-button">
              ✕
            </button>
          </div>

          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// Usage
function App() {
  const isOpen = signal(false);

  return (
    <div>
      <button onClick={() => isOpen.set(true)}>
        Open Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => isOpen.set(false)}
        title="My Modal"
      >
        <p>Modal content goes here</p>
      </Modal>
    </div>
  );
}
```

### Focus Trap

```typescript
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  let modalRef: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;

  effect(() => {
    if (!isOpen()) return;

    // Save current focus
    previousFocus = document.activeElement as HTMLElement;

    // Focus modal
    if (modalRef) {
      modalRef.focus();
    }

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef) return;

      const focusableElements = modalRef.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);

      // Restore focus
      if (previousFocus) {
        previousFocus.focus();
      }
    };
  });

  if (!isOpen()) return null;

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div
          ref={modalRef}
          className="modal-content"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="modal-body">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
```

### Lock Body Scroll

```typescript
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  effect(() => {
    if (isOpen()) {
      // Lock body scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Unlock body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  });

  // ...
}
```

## Tooltips

### Tooltip Component

```typescript
interface TooltipProps {
  content: string;
  children: JSX.Element;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({
  content,
  children,
  placement = 'top'
}: TooltipProps) {
  const isVisible = signal(false);
  const position = signal({ x: 0, y: 0 });
  let targetRef: HTMLElement | undefined;

  const updatePosition = () => {
    if (!targetRef) return;

    const rect = targetRef.getBoundingClientRect();

    const positions = {
      top: { x: rect.left + rect.width / 2, y: rect.top },
      bottom: { x: rect.left + rect.width / 2, y: rect.bottom },
      left: { x: rect.left, y: rect.top + rect.height / 2 },
      right: { x: rect.right, y: rect.top + rect.height / 2 }
    };

    position.set(positions[placement]);
  };

  const handleMouseEnter = () => {
    isVisible.set(true);
    updatePosition();
  };

  const handleMouseLeave = () => {
    isVisible.set(false);
  };

  return (
    <>
      <div
        ref={targetRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible() && (
        <Portal>
          <div
            className={`tooltip tooltip-${placement}`}
            style={{
              left: `${position().x}px`,
              top: `${position().y}px`
            }}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}

// Usage
<Tooltip content="Click to save" placement="top">
  <button>Save</button>
</Tooltip>
```

## Notifications

### Toast Notifications

```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const toasts = signal<Toast[]>([]);

export function useToast() {
  const show = (
    message: string,
    type: Toast['type'] = 'info',
    duration = 3000
  ) => {
    const id = Math.random().toString(36);

    toasts.set([...toasts(), { id, message, type, duration }]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toasts.set(toasts().filter(t => t.id !== id));
      }, duration);
    }
  };

  const remove = (id: string) => {
    toasts.set(toasts().filter(t => t.id !== id));
  };

  return {
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    info: (message: string) => show(message, 'info'),
    warning: (message: string) => show(message, 'warning'),
    remove
  };
}

export function ToastContainer() {
  return (
    <Portal>
      <div className="toast-container">
        {toasts().map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button
              onClick={() => {
                toasts.set(toasts().filter(t => t.id !== toast.id));
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Portal>
  );
}

// Usage in App
function App() {
  return (
    <>
      <MainContent />
      <ToastContainer />
    </>
  );
}

// Usage in components
function SaveButton() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Saved successfully!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## Dropdown Menus

### Dropdown Portal

```typescript
interface DropdownProps {
  trigger: JSX.Element;
  children: JSX.Element;
}

export function Dropdown({ trigger, children }: DropdownProps) {
  const isOpen = signal(false);
  const position = signal({ x: 0, y: 0 });
  let triggerRef: HTMLElement | undefined;

  const updatePosition = () => {
    if (!triggerRef) return;

    const rect = triggerRef.getBoundingClientRect();

    position.set({
      x: rect.left,
      y: rect.bottom + 4 // 4px gap
    });
  };

  const toggle = () => {
    isOpen.set(!isOpen());
    if (!isOpen()) {
      updatePosition();
    }
  };

  // Close on outside click
  effect(() => {
    if (!isOpen()) return;

    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef &&
        !triggerRef.contains(e.target as Node)
      ) {
        isOpen.set(false);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  });

  // Close on Escape
  effect(() => {
    if (!isOpen()) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isOpen.set(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  });

  return (
    <>
      <div ref={triggerRef} onClick={toggle}>
        {trigger}
      </div>

      {isOpen() && (
        <Portal>
          <div
            className="dropdown-menu"
            style={{
              left: `${position().x}px`,
              top: `${position().y}px`
            }}
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}

// Usage
<Dropdown trigger={<button>Options</button>}>
  <div className="dropdown-content">
    <button onClick={() => console.log('Edit')}>Edit</button>
    <button onClick={() => console.log('Delete')}>Delete</button>
  </div>
</Dropdown>
```

## Context Menu

### Right-Click Menu

```typescript
export function useContextMenu() {
  const isOpen = signal(false);
  const position = signal({ x: 0, y: 0 });

  const open = (e: MouseEvent) => {
    e.preventDefault();
    position.set({ x: e.clientX, y: e.clientY });
    isOpen.set(true);
  };

  const close = () => {
    isOpen.set(false);
  };

  return {
    isOpen,
    position,
    open,
    close
  };
}

export function ContextMenu({
  children,
  menu
}: {
  children: JSX.Element;
  menu: JSX.Element;
}) {
  const contextMenu = useContextMenu();
  let containerRef: HTMLElement | undefined;

  // Close on click outside
  effect(() => {
    if (!contextMenu.isOpen()) return;

    const handleClick = () => contextMenu.close();

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  });

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={contextMenu.open}
      >
        {children}
      </div>

      {contextMenu.isOpen() && (
        <Portal>
          <div
            className="context-menu"
            style={{
              left: `${contextMenu.position().x}px`,
              top: `${contextMenu.position().y}px`
            }}
          >
            {menu}
          </div>
        </Portal>
      )}
    </>
  );
}

// Usage
<ContextMenu
  menu={
    <div>
      <button onClick={() => console.log('Copy')}>Copy</button>
      <button onClick={() => console.log('Paste')}>Paste</button>
    </div>
  }
>
  <div className="editor">Right-click me</div>
</ContextMenu>
```

## Best Practices

### Use Semantic HTML

```typescript
// ✅ Proper ARIA attributes
<Portal>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <h2 id="modal-title">Title</h2>
    <p id="modal-description">Description</p>
  </div>
</Portal>

// ❌ No ARIA attributes
<Portal>
  <div>
    <h2>Title</h2>
    <p>Description</p>
  </div>
</Portal>
```

### Clean Up Portal Containers

```typescript
export function Portal({ children, container = document.body }: PortalProps) {
  let portalElement: HTMLElement | null = null;

  effect(() => {
    portalElement = document.createElement('div');
    container.appendChild(portalElement);

    render(children, portalElement);

    // ✅ Always clean up
    return () => {
      if (portalElement && container.contains(portalElement)) {
        container.removeChild(portalElement);
      }
    };
  });

  return null as any;
}
```

### Handle Keyboard Navigation

```typescript
// ✅ Keyboard support
<Modal
  isOpen={isOpen}
  onClose={() => {
    isOpen.set(false);
  }}
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      isOpen.set(false);
    }
  }}
>
  {children}
</Modal>
```

### Prevent Z-Index Issues

```css
/* Use high z-index for portals */
.portal-container {
  z-index: 9999;
}

.modal-overlay {
  z-index: 10000;
}

.tooltip {
  z-index: 10001;
}
```

## Summary

You've learned:

✅ Creating portals
✅ Modal dialogs with focus trap
✅ Tooltips with positioning
✅ Toast notifications
✅ Dropdown menus
✅ Context menus
✅ Accessibility best practices
✅ Portal cleanup

Portals enable flexible UI components that escape DOM hierarchy!

---

**Next:** [Advanced Patterns →](./advanced-patterns.md) Expert techniques
