/**
 * React Portal compatibility for PhilJS.
 * Renders children into a DOM node outside the parent component's hierarchy.
 */

import { effect, onCleanup } from 'philjs-core';
import type { VNode, JSXElement } from 'philjs-core';
import { render } from 'philjs-core';

/**
 * Portal component props.
 */
export interface PortalProps {
  /** Children to render in the portal */
  children: VNode;
  /** Target container element or selector */
  container?: HTMLElement | string;
}

/**
 * React-compatible Portal component (similar to ReactDOM.createPortal).
 * Renders children into a different part of the DOM tree.
 *
 * @example
 * ```tsx
 * import { Portal } from 'philjs-react-compat';
 *
 * function Modal({ isOpen, children }) {
 *   if (!isOpen) return null;
 *
 *   return (
 *     <Portal container="body">
 *       <div className="modal-overlay">
 *         <div className="modal">
 *           {children}
 *         </div>
 *       </div>
 *     </Portal>
 *   );
 * }
 * ```
 */
export function Portal(props: PortalProps): null {
  const { children, container } = props;

  effect(() => {
    // Get or create container element
    let targetElement: HTMLElement;

    if (typeof container === 'string') {
      const found = document.querySelector(container);
      if (!found) {
        console.warn(`Portal: Container "${container}" not found. Using document.body.`);
        targetElement = document.body;
      } else {
        targetElement = found as HTMLElement;
      }
    } else if (container instanceof HTMLElement) {
      targetElement = container;
    } else {
      targetElement = document.body;
    }

    // Create a container div for this portal
    const portalContainer = document.createElement('div');
    portalContainer.setAttribute('data-portal', 'true');
    targetElement.appendChild(portalContainer);

    // Render children into the portal container
    render(children, portalContainer);

    // Cleanup: remove portal container when component unmounts
    onCleanup(() => {
      if (portalContainer.parentNode) {
        portalContainer.parentNode.removeChild(portalContainer);
      }
    });
  });

  // Portal doesn't render anything in its original location
  return null;
}

/**
 * Hook to create a portal programmatically.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const createPortal = usePortal();
 *
 *   const showModal = () => {
 *     createPortal(
 *       <div className="modal">Modal Content</div>,
 *       document.body
 *     );
 *   };
 *
 *   return <button onClick={showModal}>Show Modal</button>;
 * }
 * ```
 */
export function usePortal(): (children: VNode, container?: HTMLElement | string) => void {
  return (children: VNode, container?: HTMLElement | string) => {
    let targetElement: HTMLElement;

    if (typeof container === 'string') {
      const found = document.querySelector(container);
      if (!found) {
        console.warn(`usePortal: Container "${container}" not found. Using document.body.`);
        targetElement = document.body;
      } else {
        targetElement = found as HTMLElement;
      }
    } else if (container instanceof HTMLElement) {
      targetElement = container;
    } else {
      targetElement = document.body;
    }

    const portalContainer = document.createElement('div');
    portalContainer.setAttribute('data-portal', 'true');
    targetElement.appendChild(portalContainer);

    render(children, portalContainer);

    // Return cleanup function
    return () => {
      if (portalContainer.parentNode) {
        portalContainer.parentNode.removeChild(portalContainer);
      }
    };
  };
}

/**
 * Modal portal component with built-in overlay and styles.
 *
 * @example
 * ```tsx
 * import { ModalPortal } from 'philjs-react-compat';
 *
 * function App() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setIsOpen(true)}>Open Modal</button>
 *
 *       <ModalPortal
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *       >
 *         <h2>Modal Title</h2>
 *         <p>Modal content goes here</p>
 *       </ModalPortal>
 *     </div>
 *   );
 * }
 * ```
 */
export function ModalPortal(props: {
  isOpen: boolean;
  onClose?: () => void;
  children: VNode;
  container?: HTMLElement | string;
}): JSXElement | null {
  const { isOpen, onClose, children, container } = props;

  if (!isOpen) return null;

  return (
    <Portal container={container}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
          onClick={(e: Event) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </Portal>
  ) as JSXElement;
}

/**
 * Tooltip portal component.
 *
 * @example
 * ```tsx
 * import { TooltipPortal } from 'philjs-react-compat';
 *
 * function Button() {
 *   const [showTooltip, setShowTooltip] = useState(false);
 *   const buttonRef = useRef(null);
 *
 *   return (
 *     <>
 *       <button
 *         ref={buttonRef}
 *         onMouseEnter={() => setShowTooltip(true)}
 *         onMouseLeave={() => setShowTooltip(false)}
 *       >
 *         Hover me
 *       </button>
 *
 *       <TooltipPortal
 *         isOpen={showTooltip}
 *         targetRef={buttonRef}
 *       >
 *         This is a tooltip
 *       </TooltipPortal>
 *     </>
 *   );
 * }
 * ```
 */
export function TooltipPortal(props: {
  isOpen: boolean;
  targetRef: { current: HTMLElement | null };
  children: VNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}): JSXElement | null {
  const { isOpen, targetRef, children, position = 'top' } = props;

  if (!isOpen || !targetRef.current) return null;

  // Calculate position based on target element
  const rect = targetRef.current.getBoundingClientRect();
  const offset = 8;

  let style: any = {
    position: 'fixed',
    backgroundColor: '#333',
    color: 'white',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    zIndex: 2000,
  };

  switch (position) {
    case 'top':
      style.bottom = `${window.innerHeight - rect.top + offset}px`;
      style.left = `${rect.left + rect.width / 2}px`;
      style.transform = 'translateX(-50%)';
      break;
    case 'bottom':
      style.top = `${rect.bottom + offset}px`;
      style.left = `${rect.left + rect.width / 2}px`;
      style.transform = 'translateX(-50%)';
      break;
    case 'left':
      style.top = `${rect.top + rect.height / 2}px`;
      style.right = `${window.innerWidth - rect.left + offset}px`;
      style.transform = 'translateY(-50%)';
      break;
    case 'right':
      style.top = `${rect.top + rect.height / 2}px`;
      style.left = `${rect.right + offset}px`;
      style.transform = 'translateY(-50%)';
      break;
  }

  return (
    <Portal>
      <div style={style}>{children}</div>
    </Portal>
  ) as JSXElement;
}
