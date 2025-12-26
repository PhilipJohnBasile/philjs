// @ts-nocheck
/**
 * PhilJS UI - Command Component
 *
 * A command palette component similar to cmdk.
 * Provides fast keyboard-driven navigation and search.
 */

import { signal, effect, memo, batch } from 'philjs-core';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: any;
  shortcut?: string[];
  group?: string;
  disabled?: boolean;
  keywords?: string[];
  onSelect?: () => void;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

export interface CommandProps {
  items?: CommandItem[];
  groups?: CommandGroup[];
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  filter?: (item: CommandItem, search: string) => boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: CommandItem) => void;
  onSearch?: (search: string) => void;
  className?: string;
}

export function Command(props: CommandProps) {
  const {
    items = [],
    groups = [],
    placeholder = 'Type a command or search...',
    emptyMessage = 'No results found.',
    loading = false,
    open,
    defaultOpen = false,
    filter,
    onOpenChange,
    onSelect,
    onSearch,
    className = '',
  } = props;

  const isOpen = signal(open ?? defaultOpen);
  const search = signal('');
  const highlightedIndex = signal(0);
  const inputRef = signal<HTMLInputElement | null>(null);

  // Sync external open state
  effect(() => {
    if (open !== undefined) {
      isOpen.set(open);
    }
  });

  // Focus input when opened
  effect(() => {
    if (isOpen()) {
      setTimeout(() => inputRef()?.focus(), 0);
    }
  });

  // All items (flattened from groups + standalone items)
  const allItems = memo(() => {
    const result: CommandItem[] = [...items];
    groups.forEach(group => {
      group.items.forEach(item => {
        result.push({ ...item, group: group.label });
      });
    });
    return result;
  });

  // Default filter function
  const defaultFilter = (item: CommandItem, searchText: string): boolean => {
    const lowerSearch = searchText.toLowerCase();
    return (
      item.label.toLowerCase().includes(lowerSearch) ||
      (item.description?.toLowerCase().includes(lowerSearch) ?? false) ||
      (item.keywords?.some(k => k.toLowerCase().includes(lowerSearch)) ?? false)
    );
  };

  const filterFn = filter || defaultFilter;

  // Filtered items
  const filteredItems = memo(() => {
    const searchText = search();
    if (!searchText) return allItems();
    return allItems().filter(item => filterFn(item, searchText));
  });

  // Grouped filtered items
  const groupedFiltered = memo(() => {
    const filtered = filteredItems();
    const result = new Map<string, CommandItem[]>();
    const ungrouped: CommandItem[] = [];

    filtered.forEach(item => {
      if (item.group) {
        const group = result.get(item.group) || [];
        group.push(item);
        result.set(item.group, group);
      } else {
        ungrouped.push(item);
      }
    });

    return { groups: result, ungrouped };
  });

  const handleClose = () => {
    isOpen.set(false);
    search.set('');
    highlightedIndex.set(0);
    onOpenChange?.(false);
  };

  const handleSelect = (item: CommandItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    onSelect?.(item);
    handleClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const filtered = filteredItems();
    const currentIndex = highlightedIndex();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightedIndex.set((currentIndex + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightedIndex.set((currentIndex - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[currentIndex]) {
          handleSelect(filtered[currentIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Home':
        e.preventDefault();
        highlightedIndex.set(0);
        break;
      case 'End':
        e.preventDefault();
        highlightedIndex.set(filtered.length - 1);
        break;
    }
  };

  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    batch(() => {
      search.set(target.value);
      highlightedIndex.set(0);
    });
    onSearch?.(target.value);
  };

  if (!isOpen()) return null;

  const renderItem = (item: CommandItem, globalIndex: number) => {
    const isHighlighted = highlightedIndex() === globalIndex;

    return (
      <div
        key={item.id}
        role="option"
        aria-selected={isHighlighted}
        aria-disabled={item.disabled}
        data-highlighted={isHighlighted}
        className={`
          px-4 py-3 cursor-pointer flex items-center gap-3
          ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isHighlighted ? 'bg-gray-100' : ''}
          hover:bg-gray-50
        `}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => highlightedIndex.set(globalIndex)}
      >
        {item.icon && (
          <span className="flex-shrink-0 w-5 h-5 text-gray-400">
            {item.icon}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.label}</div>
          {item.description && (
            <div className="text-sm text-gray-500 truncate">{item.description}</div>
          )}
        </div>

        {item.shortcut && (
          <div className="flex items-center gap-1">
            {item.shortcut.map((key, i) => (
              <kbd
                key={i}
                className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-200 rounded"
              >
                {key}
              </kbd>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`
          fixed left-1/2 top-1/4 z-50
          w-full max-w-lg -translate-x-1/2
          bg-white rounded-xl shadow-2xl overflow-hidden
          border border-gray-200
          ${className}
        `}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-200">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={(el: HTMLInputElement) => inputRef.set(el)}
            type="text"
            className="flex-1 py-4 text-base outline-none bg-transparent"
            placeholder={placeholder}
            value={search()}
            onInput={handleSearchChange}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
          />
          {search() && (
            <button
              type="button"
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => search.set('')}
            >
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Results */}
        <div
          role="listbox"
          className="max-h-80 overflow-auto py-2"
        >
          {loading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg className="animate-spin h-5 w-5 mx-auto mb-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </div>
          )}

          {!loading && filteredItems().length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              {emptyMessage}
            </div>
          )}

          {!loading && (() => {
            const { groups: groupMap, ungrouped } = groupedFiltered();
            let globalIndex = 0;

            return (
              <>
                {ungrouped.length > 0 && (
                  <div>
                    {ungrouped.map(item => {
                      const idx = globalIndex++;
                      return renderItem(item, idx);
                    })}
                  </div>
                )}

                {Array.from(groupMap.entries()).map(([groupName, groupItems]) => (
                  <div key={groupName}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {groupName}
                    </div>
                    {groupItems.map(item => {
                      const idx = globalIndex++;
                      return renderItem(item, idx);
                    })}
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to control Command component
 */
export function useCommand() {
  const isOpen = signal(false);
  const search = signal('');

  const open = () => {
    isOpen.set(true);
    search.set('');
  };

  const close = () => {
    isOpen.set(false);
    search.set('');
  };

  const toggle = () => {
    if (isOpen()) {
      close();
    } else {
      open();
    }
  };

  // Global keyboard shortcut (Cmd+K or Ctrl+K)
  effect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  });

  return {
    isOpen: () => isOpen(),
    search: () => search(),
    open,
    close,
    toggle,
    setSearch: (value: string) => search.set(value),
  };
}

/**
 * CommandDialog - Modal variant of Command
 */
export interface CommandDialogProps extends CommandProps {
  trigger?: any;
}

export function CommandDialog(props: CommandDialogProps) {
  const { trigger, ...commandProps } = props;
  const command = useCommand();

  return (
    <>
      {trigger && (
        <div onClick={command.open}>
          {trigger}
        </div>
      )}
      <Command
        {...commandProps}
        open={command.isOpen()}
        onOpenChange={(open) => {
          if (!open) command.close();
          props.onOpenChange?.(open);
        }}
      />
    </>
  );
}
