/**
 * Mention Extension
 *
 * @mentions for users, channels, or any entity
 */

import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export interface MentionItem {
  id: string;
  label: string;
  avatar?: string;
  description?: string;
  [key: string]: any;
}

export interface MentionOptions {
  /**
   * Function to fetch mention suggestions
   */
  getSuggestions: (query: string) => Promise<MentionItem[]> | MentionItem[];
  /**
   * Character that triggers mention
   */
  trigger?: string;
  /**
   * Allow spaces in mention search
   */
  allowSpaces?: boolean;
  /**
   * Custom render function for mention items
   */
  renderItem?: (item: MentionItem) => React.ReactNode;
  /**
   * Custom render function for inserted mention
   */
  renderLabel?: (item: MentionItem) => string;
  /**
   * Maximum number of suggestions to show
   */
  maxSuggestions?: number;
  /**
   * Debounce delay for suggestions
   */
  debounceMs?: number;
}

/**
 * Default mention list component
 */
interface MentionListProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
  renderItem?: (item: MentionItem) => React.ReactNode;
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command, renderItem }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="philjs-mention-list philjs-mention-empty">
          No results found
        </div>
      );
    }

    return (
      <div className="philjs-mention-list">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`philjs-mention-item ${
              index === selectedIndex ? 'philjs-mention-item-selected' : ''
            }`}
            onClick={() => selectItem(index)}
            type="button"
          >
            {renderItem ? (
              renderItem(item)
            ) : (
              <>
                {item.avatar && (
                  <img
                    src={item.avatar}
                    alt={item.label}
                    className="philjs-mention-avatar"
                  />
                )}
                <div className="philjs-mention-content">
                  <span className="philjs-mention-label">{item.label}</span>
                  {item.description && (
                    <span className="philjs-mention-description">
                      {item.description}
                    </span>
                  )}
                </div>
              </>
            )}
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';

/**
 * Create suggestion configuration for TipTap mention extension
 */
function createSuggestionConfig(options: MentionOptions) {
  const {
    getSuggestions,
    renderItem,
    maxSuggestions = 10,
    debounceMs = 200,
  } = options;

  let debounceTimer: ReturnType<typeof setTimeout>;

  return {
    items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
      return new Promise((resolve) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const results = await getSuggestions(query);
          resolve(results.slice(0, maxSuggestions));
        }, debounceMs);
      });
    },

    render: () => {
      let component: ReactRenderer<MentionListRef>;
      let popup: TippyInstance[];

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
            props: { ...props, renderItem },
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate: (props: any) => {
          component.updateProps({ ...props, renderItem });

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown: (props: any) => {
          if (props.event.key === 'Escape') {
            popup[0].hide();
            return true;
          }

          return component.ref?.onKeyDown(props) || false;
        },

        onExit: () => {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  };
}

/**
 * Create configured mention extension
 */
export function createMentionExtension(options: MentionOptions) {
  const {
    trigger = '@',
    allowSpaces = false,
    renderLabel = (item) => item.label,
  } = options;

  return Mention.configure({
    HTMLAttributes: {
      class: 'philjs-mention',
    },
    suggestion: createSuggestionConfig(options),
    renderLabel: ({ node }) => `${trigger}${node.attrs.label}`,
  });
}

/**
 * Default styles for mention list (CSS-in-JS)
 */
export const mentionStyles = `
.philjs-mention-list {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  padding: 0.25rem;
}

.philjs-mention-item {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  text-align: left;
  width: 100%;
}

.philjs-mention-item:hover,
.philjs-mention-item-selected {
  background: #f1f5f9;
}

.philjs-mention-avatar {
  border-radius: 50%;
  height: 32px;
  width: 32px;
}

.philjs-mention-content {
  display: flex;
  flex-direction: column;
}

.philjs-mention-label {
  font-weight: 500;
}

.philjs-mention-description {
  color: #64748b;
  font-size: 0.875rem;
}

.philjs-mention-empty {
  color: #64748b;
  padding: 0.5rem;
}

.philjs-mention {
  background: #e0f2fe;
  border-radius: 0.25rem;
  color: #0369a1;
  padding: 0 0.25rem;
}
`;

export { Mention };
export default createMentionExtension;
