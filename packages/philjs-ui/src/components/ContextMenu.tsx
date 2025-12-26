// @ts-nocheck
/**
 * PhilJS UI - ContextMenu Component
 *
 * Right-click context menu with submenus, keyboard navigation,
 * and accessibility support.
 */

import { signal, effect } from 'philjs-core';

export interface MenuItemBase {
  id: string;
  label: string;
  icon?: any;
  shortcut?: string;
  disabled?: boolean;
}

export interface MenuItemAction extends MenuItemBase {
  type?: 'item';
  onSelect?: () => void;
}

export interface MenuItemSeparator {
  type: 'separator';
  id: string;
}

export interface MenuItemSubmenu extends MenuItemBase {
  type: 'submenu';
  items: MenuItem[];
}

export interface MenuItemCheckbox extends MenuItemBase {
  type: 'checkbox';
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface MenuItemRadioGroup {
  type: 'radio-group';
  id: string;
  value?: string;
  onValueChange?: (value: string) => void;
  items: Array<{
    id: string;
    label: string;
    value: string;
    disabled?: boolean;
  }>;
}

export type MenuItem =
  | MenuItemAction
  | MenuItemSeparator
  | MenuItemSubmenu
  | MenuItemCheckbox
  | MenuItemRadioGroup;

export interface ContextMenuProps {
  items: MenuItem[];
  children: any;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function ContextMenu(props: ContextMenuProps) {
  const { items, children, disabled = false, onOpenChange, className = '' } = props;

  const isOpen = signal(false);
  const position = signal({ x: 0, y: 0 });
  const highlightedPath = signal<string[]>([]);

  const handleContextMenu = (e: MouseEvent) => {
    if (disabled) return;
    e.preventDefault();

    // Ensure menu stays within viewport
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 300);

    position.set({ x, y });
    isOpen.set(true);
    highlightedPath.set([]);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    isOpen.set(false);
    highlightedPath.set([]);
    onOpenChange?.(false);
  };

  const handleSelect = (item: MenuItem) => {
    if ('disabled' in item && item.disabled) return;

    if (item.type === 'checkbox') {
      item.onCheckedChange?.(!item.checked);
    } else if (item.type === 'submenu') {
      // Don't close for submenu
      return;
    } else if (!item.type || item.type === 'item') {
      (item as MenuItemAction).onSelect?.();
      handleClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen()) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateItems(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateItems(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        openSubmenu();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        closeSubmenu();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectHighlighted();
        break;
    }
  };

  const navigateItems = (direction: number) => {
    const path = highlightedPath();
    const currentItems = getItemsAtPath(items, path.slice(0, -1));
    const currentIndex = path.length > 0
      ? currentItems.findIndex(item => item.id === path[path.length - 1])
      : -1;

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = currentItems.length - 1;
    if (newIndex >= currentItems.length) newIndex = 0;

    // Skip separators
    while (currentItems[newIndex]?.type === 'separator') {
      newIndex += direction;
      if (newIndex < 0) newIndex = currentItems.length - 1;
      if (newIndex >= currentItems.length) newIndex = 0;
    }

    const newPath = [...path.slice(0, -1), currentItems[newIndex].id];
    highlightedPath.set(newPath);
  };

  const openSubmenu = () => {
    const path = highlightedPath();
    const currentItem = getItemAtPath(items, path);
    if (currentItem?.type === 'submenu' && currentItem.items.length > 0) {
      const firstItem = currentItem.items.find(i => i.type !== 'separator');
      if (firstItem) {
        highlightedPath.set([...path, firstItem.id]);
      }
    }
  };

  const closeSubmenu = () => {
    const path = highlightedPath();
    if (path.length > 1) {
      highlightedPath.set(path.slice(0, -1));
    }
  };

  const selectHighlighted = () => {
    const path = highlightedPath();
    const item = getItemAtPath(items, path);
    if (item) {
      handleSelect(item);
    }
  };

  effect(() => {
    if (isOpen()) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  });

  return (
    <div className={className} onContextMenu={handleContextMenu}>
      {children}

      {isOpen() && (
        <>
          <div className="fixed inset-0 z-50" onClick={handleClose} />
          <MenuContent
            items={items}
            position={position()}
            path={[]}
            highlightedPath={highlightedPath}
            onSelect={handleSelect}
            onHighlight={(path) => highlightedPath.set(path)}
          />
        </>
      )}
    </div>
  );
}

interface MenuContentProps {
  items: MenuItem[];
  position: { x: number; y: number };
  path: string[];
  highlightedPath: { (): string[]; set: (value: string[]) => void };
  onSelect: (item: MenuItem) => void;
  onHighlight: (path: string[]) => void;
}

function MenuContent(props: MenuContentProps) {
  const { items, position, path, highlightedPath, onSelect, onHighlight } = props;

  return (
    <div
      role="menu"
      className="fixed z-50 min-w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {items.map(item => {
        if (item.type === 'separator') {
          return <div key={item.id} className="my-1 border-t border-gray-200" />;
        }

        if (item.type === 'radio-group') {
          return (
            <div key={item.id} role="group">
              {item.items.map(radioItem => {
                const itemPath = [...path, radioItem.id];
                const isHighlighted = highlightedPath().join('/') === itemPath.join('/');

                return (
                  <div
                    key={radioItem.id}
                    role="menuitemradio"
                    aria-checked={item.value === radioItem.value}
                    aria-disabled={radioItem.disabled}
                    className={`
                      px-3 py-2 flex items-center gap-3 cursor-pointer
                      ${radioItem.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isHighlighted ? 'bg-gray-100' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => !radioItem.disabled && item.onValueChange?.(radioItem.value)}
                    onMouseEnter={() => onHighlight(itemPath)}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">
                      {item.value === radioItem.value && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </span>
                    <span className="flex-1">{radioItem.label}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        const itemPath = [...path, item.id];
        const isHighlighted = highlightedPath().join('/').startsWith(itemPath.join('/'));
        const hasSubmenu = item.type === 'submenu';

        return (
          <div
            key={item.id}
            role={item.type === 'checkbox' ? 'menuitemcheckbox' : 'menuitem'}
            aria-checked={item.type === 'checkbox' ? item.checked : undefined}
            aria-disabled={item.disabled}
            aria-haspopup={hasSubmenu ? 'menu' : undefined}
            className={`
              relative px-3 py-2 flex items-center gap-3 cursor-pointer text-sm
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isHighlighted ? 'bg-gray-100' : 'hover:bg-gray-50'}
            `}
            onClick={() => onSelect(item)}
            onMouseEnter={() => onHighlight(itemPath)}
          >
            {/* Icon or Checkbox */}
            <span className="w-4 h-4 flex items-center justify-center text-gray-500">
              {item.type === 'checkbox' && item.checked && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {item.icon && !item.type && item.icon}
            </span>

            {/* Label */}
            <span className="flex-1">{item.label}</span>

            {/* Shortcut */}
            {'shortcut' in item && item.shortcut && (
              <span className="text-xs text-gray-400 ml-4">{item.shortcut}</span>
            )}

            {/* Submenu Arrow */}
            {hasSubmenu && (
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}

            {/* Submenu */}
            {hasSubmenu && isHighlighted && (
              <MenuContent
                items={item.items}
                position={{ x: 192, y: 0 }}
                path={itemPath}
                highlightedPath={highlightedPath}
                onSelect={onSelect}
                onHighlight={onHighlight}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function getItemsAtPath(items: MenuItem[], path: string[]): MenuItem[] {
  if (path.length === 0) return items;

  const [first, ...rest] = path;
  const item = items.find(i => i.id === first);
  if (item && 'items' in item) {
    return getItemsAtPath(item.items, rest);
  }
  return items;
}

function getItemAtPath(items: MenuItem[], path: string[]): MenuItem | undefined {
  if (path.length === 0) return undefined;

  const [first, ...rest] = path;
  const item = items.find(i => i.id === first);

  if (rest.length === 0) return item;
  if (item && 'items' in item) {
    return getItemAtPath(item.items, rest);
  }
  return undefined;
}

/**
 * Dropdown Menu - Click-triggered menu
 */
export interface DropdownMenuProps {
  items: MenuItem[];
  trigger: any;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function DropdownMenu(props: DropdownMenuProps) {
  const {
    items,
    trigger,
    align = 'start',
    side = 'bottom',
    disabled = false,
    onOpenChange,
    className = '',
  } = props;

  const isOpen = signal(false);
  const triggerRef = signal<HTMLDivElement | null>(null);
  const highlightedPath = signal<string[]>([]);

  const handleOpen = () => {
    if (disabled) return;
    isOpen.set(!isOpen());
    highlightedPath.set([]);
    onOpenChange?.(!isOpen());
  };

  const handleClose = () => {
    isOpen.set(false);
    highlightedPath.set([]);
    onOpenChange?.(false);
  };

  const handleSelect = (item: MenuItem) => {
    if ('disabled' in item && item.disabled) return;

    if (item.type === 'checkbox') {
      item.onCheckedChange?.(!item.checked);
    } else if (item.type === 'submenu') {
      return;
    } else if (!item.type || item.type === 'item') {
      (item as MenuItemAction).onSelect?.();
      handleClose();
    }
  };

  const getPosition = () => {
    const trigger = triggerRef();
    if (!trigger) return { x: 0, y: 0 };

    const rect = trigger.getBoundingClientRect();
    let x = rect.left;
    let y = rect.bottom + 4;

    if (align === 'center') x = rect.left + rect.width / 2 - 96;
    if (align === 'end') x = rect.right - 192;

    if (side === 'top') y = rect.top - 4;
    if (side === 'left') { x = rect.left - 200; y = rect.top; }
    if (side === 'right') { x = rect.right + 4; y = rect.top; }

    return { x, y };
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div ref={(el: HTMLDivElement) => triggerRef.set(el)} onClick={handleOpen}>
        {trigger}
      </div>

      {isOpen() && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <MenuContent
            items={items}
            position={getPosition()}
            path={[]}
            highlightedPath={highlightedPath}
            onSelect={handleSelect}
            onHighlight={(path) => highlightedPath.set(path)}
          />
        </>
      )}
    </div>
  );
}
