/**
 * PhilJS Maps - Popup Component
 * Information popups for map elements
 */

import type { PopupProps, LatLng, MapInstance, Point } from '../types';
import { getMapContext } from './Map';

// ============================================================================
// Popup Abstraction
// ============================================================================

/**
 * Abstract popup instance
 */
export interface PopupInstance {
  native: unknown;
  getPosition(): LatLng;
  setPosition(position: LatLng): void;
  getContent(): unknown;
  setContent(content: unknown): void;
  isOpen(): boolean;
  open(): void;
  close(): void;
  remove(): void;
  setOffset(offset: Point): void;
  setMaxWidth(maxWidth: number): void;
  on(event: string, handler: () => void): void;
  off(event: string, handler: () => void): void;
}

/**
 * Popup factory function type
 */
export type CreatePopupFn = (
  map: MapInstance,
  props: PopupProps
) => PopupInstance;

// Provider-specific popup factories
const popupFactories: Record<string, CreatePopupFn> = {};

/**
 * Register a popup factory for a provider
 */
export function registerPopupFactory(provider: string, factory: CreatePopupFn): void {
  popupFactories[provider] = factory;
}

/**
 * Get the popup factory for a provider
 */
export function getPopupFactory(provider: string): CreatePopupFn | undefined {
  return popupFactories[provider];
}

// ============================================================================
// Popup Component
// ============================================================================

/**
 * Create a popup on the map
 */
export function createPopup(props: PopupProps): PopupInstance | null {
  const context = getMapContext();

  if (!context || !context.map) {
    console.warn('Popup: No map context available.');
    return null;
  }

  const factory = getPopupFactory(context.provider);

  if (!factory) {
    // Fallback to custom popup implementation
    return createCustomPopup(context.map, props);
  }

  const popup = factory(context.map, props);

  // Set up event handlers
  if (props.onClose) {
    popup.on('close', props.onClose);
  }

  // Handle close on escape
  if (props.closeOnEscape !== false) {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popup.isOpen()) {
        popup.close();
      }
    };
    document.addEventListener('keydown', handleEscape);
    popup.on('close', () => document.removeEventListener('keydown', handleEscape));
  }

  // Open if specified
  if (props.open) {
    popup.open();
  }

  return popup;
}

/**
 * Popup component (for use with JSX)
 */
export function Popup(props: PopupProps): unknown {
  return {
    type: 'philjs-popup',
    props,
    create: () => createPopup(props),
  };
}

// ============================================================================
// Custom Popup Implementation (Fallback)
// ============================================================================

/**
 * Create a custom popup when provider doesn't have native support
 */
function createCustomPopup(map: MapInstance, props: PopupProps): PopupInstance {
  const container = document.createElement('div');
  container.className = `philjs-popup ${props.className || ''}`;
  container.setAttribute('role', props.role || 'dialog');
  container.setAttribute('aria-label', props.ariaLabel || 'Map popup');

  // Styles
  container.style.cssText = `
    position: absolute;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 12px;
    z-index: 1000;
    max-width: ${props.maxWidth || 300}px;
    min-width: ${props.minWidth || 150}px;
    transform: translate(-50%, -100%);
    margin-top: -10px;
  `;

  // Arrow
  const arrow = document.createElement('div');
  arrow.style.cssText = `
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid white;
  `;
  container.appendChild(arrow);

  // Content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'philjs-popup-content';
  container.appendChild(contentContainer);

  // Close button
  if (props.closeButton !== false) {
    const closeButton = document.createElement('button');
    closeButton.className = 'philjs-popup-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close popup');
    closeButton.style.cssText = `
      position: absolute;
      top: 4px;
      right: 8px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 0;
      line-height: 1;
    `;
    closeButton.addEventListener('click', () => {
      instance.close();
    });
    container.appendChild(closeButton);
  }

  // State
  let isOpen = false;
  let position = props.position;
  const eventHandlers: Record<string, (() => void)[]> = {};

  // Update position on map
  function updatePosition(): void {
    if (!isOpen) return;

    // Convert lat/lng to pixel position
    const bounds = map.getBounds();
    const mapContainer = (map.native as { getContainer?: () => HTMLElement }).getContainer?.();

    if (!mapContainer) return;

    const rect = mapContainer.getBoundingClientRect();

    const x =
      ((position.lng - bounds.west) / (bounds.east - bounds.west)) * rect.width +
      (props.offset?.x || 0);
    const y =
      ((bounds.north - position.lat) / (bounds.north - bounds.south)) * rect.height +
      (props.offset?.y || 0);

    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
  }

  // Render content
  function renderContent(content: unknown): void {
    contentContainer.innerHTML = '';

    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentContainer.appendChild(content);
    } else if (content && typeof content === 'object') {
      // JSX-like object
      const text = document.createElement('div');
      text.textContent = String(content);
      contentContainer.appendChild(text);
    }
  }

  // Instance
  const instance: PopupInstance = {
    native: container,

    getPosition(): LatLng {
      return position;
    },

    setPosition(pos: LatLng): void {
      position = pos;
      updatePosition();
    },

    getContent(): unknown {
      return contentContainer.innerHTML;
    },

    setContent(content: unknown): void {
      renderContent(content);
    },

    isOpen(): boolean {
      return isOpen;
    },

    open(): void {
      if (isOpen) return;

      const mapContainer = (map.native as { getContainer?: () => HTMLElement }).getContainer?.();
      if (mapContainer) {
        mapContainer.appendChild(container);
      } else {
        document.body.appendChild(container);
      }

      isOpen = true;
      updatePosition();

      // Focus first focusable element for accessibility
      const focusable = container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) {
        (focusable as HTMLElement).focus();
      }
    },

    close(): void {
      if (!isOpen) return;

      container.remove();
      isOpen = false;

      // Trigger close handlers
      eventHandlers['close']?.forEach((handler) => handler());
      props.onClose?.();
    },

    remove(): void {
      instance.close();
    },

    setOffset(offset: Point): void {
      props.offset = offset;
      updatePosition();
    },

    setMaxWidth(maxWidth: number): void {
      container.style.maxWidth = `${maxWidth}px`;
    },

    on(event: string, handler: () => void): void {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
    },

    off(event: string, handler: () => void): void {
      if (eventHandlers[event]) {
        const index = eventHandlers[event].indexOf(handler);
        if (index !== -1) {
          eventHandlers[event].splice(index, 1);
        }
      }
    },
  };

  // Set initial content
  renderContent(props.children);

  // Update position on map move
  map.on('move', updatePosition);

  // Close on map click if specified
  if (props.closeOnClick !== false) {
    map.on('click', () => {
      instance.close();
    });
  }

  // Open if specified
  if (props.open) {
    instance.open();
  }

  return instance;
}

// ============================================================================
// Popup Utilities
// ============================================================================

/**
 * Create a simple text popup
 */
export function createTextPopup(text: string, position: LatLng): PopupInstance | null {
  return createPopup({
    position,
    children: text,
  });
}

/**
 * Create an HTML popup
 */
export function createHtmlPopup(html: string, position: LatLng): PopupInstance | null {
  const content = document.createElement('div');
  content.innerHTML = html;

  return createPopup({
    position,
    children: content,
  });
}

/**
 * Create a popup with action buttons
 */
export interface PopupAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export function createActionPopup(
  title: string,
  actions: PopupAction[],
  position: LatLng
): PopupInstance | null {
  const content = document.createElement('div');

  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  titleElement.style.cssText = 'margin: 0 0 12px 0; font-size: 16px;';
  content.appendChild(titleElement);

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.textContent = action.label;
    button.style.cssText = `
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      ${action.primary
        ? 'background: #3498db; color: white;'
        : 'background: #eee; color: #333;'}
    `;
    button.addEventListener('click', action.onClick);
    buttonContainer.appendChild(button);
  });

  content.appendChild(buttonContainer);

  return createPopup({
    position,
    children: content,
    closeButton: true,
  });
}

/**
 * Create an info card popup
 */
export interface InfoCardData {
  title: string;
  subtitle?: string;
  image?: string;
  description?: string;
  link?: { text: string; url: string };
}

export function createInfoCardPopup(data: InfoCardData, position: LatLng): PopupInstance | null {
  const content = document.createElement('div');
  content.style.cssText = 'min-width: 200px;';

  if (data.image) {
    const img = document.createElement('img');
    img.src = data.image;
    img.alt = data.title;
    img.style.cssText = 'width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;';
    content.appendChild(img);
  }

  const title = document.createElement('h3');
  title.textContent = data.title;
  title.style.cssText = 'margin: 0 0 4px 0; font-size: 16px; font-weight: 600;';
  content.appendChild(title);

  if (data.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.textContent = data.subtitle;
    subtitle.style.cssText = 'margin: 0 0 8px 0; font-size: 12px; color: #666;';
    content.appendChild(subtitle);
  }

  if (data.description) {
    const desc = document.createElement('p');
    desc.textContent = data.description;
    desc.style.cssText = 'margin: 0 0 8px 0; font-size: 14px;';
    content.appendChild(desc);
  }

  if (data.link) {
    const link = document.createElement('a');
    link.href = data.link.url;
    link.textContent = data.link.text;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'color: #3498db; text-decoration: none; font-size: 14px;';
    content.appendChild(link);
  }

  return createPopup({
    position,
    children: content,
    closeButton: true,
    maxWidth: 300,
  });
}

// Default export
export default Popup;
