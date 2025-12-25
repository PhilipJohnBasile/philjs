/**
 * MenuBar Component
 *
 * Formatting toolbar for the rich text editor
 */

import React, { useCallback } from 'react';
import type { Editor } from '@tiptap/react';

export interface MenuBarProps {
  /**
   * Editor instance
   */
  editor: Editor | null;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Show all formatting options
   */
  full?: boolean;
  /**
   * Custom buttons to add
   */
  customButtons?: React.ReactNode;
  /**
   * Disable the menu bar
   */
  disabled?: boolean;
}

export interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Individual menu button
 */
export function MenuButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  className = '',
}: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`philjs-menu-button ${isActive ? 'philjs-menu-button-active' : ''} ${className}`}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );
}

/**
 * Menu divider
 */
export function MenuDivider() {
  return <div className="philjs-menu-divider" />;
}

/**
 * MenuBar component
 */
export function MenuBar({
  editor,
  className = '',
  full = true,
  customButtons,
  disabled = false,
}: MenuBarProps) {
  if (!editor) {
    return null;
  }

  const handleHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  const handleLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleImage = useCallback(() => {
    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  return (
    <div className={`philjs-menu-bar ${className}`}>
      {/* Text Formatting */}
      <div className="philjs-menu-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          disabled={disabled}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          disabled={disabled}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          disabled={disabled}
          title="Underline (Ctrl+U)"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          disabled={disabled}
          title="Strikethrough"
        >
          <s>S</s>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          disabled={disabled}
          title="Inline Code"
        >
          {'</>'}
        </MenuButton>
      </div>

      <MenuDivider />

      {/* Headings */}
      <div className="philjs-menu-group">
        <MenuButton
          onClick={() => handleHeading(1)}
          isActive={editor.isActive('heading', { level: 1 })}
          disabled={disabled}
          title="Heading 1"
        >
          H1
        </MenuButton>
        <MenuButton
          onClick={() => handleHeading(2)}
          isActive={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          title="Heading 2"
        >
          H2
        </MenuButton>
        <MenuButton
          onClick={() => handleHeading(3)}
          isActive={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
          title="Heading 3"
        >
          H3
        </MenuButton>
      </div>

      <MenuDivider />

      {/* Lists */}
      <div className="philjs-menu-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          disabled={disabled}
          title="Bullet List"
        >
          &#8226;
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          disabled={disabled}
          title="Numbered List"
        >
          1.
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          disabled={disabled}
          title="Task List"
        >
          &#9744;
        </MenuButton>
      </div>

      <MenuDivider />

      {/* Block Elements */}
      <div className="philjs-menu-group">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          disabled={disabled}
          title="Quote"
        >
          &ldquo;
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          disabled={disabled}
          title="Code Block"
        >
          {'{ }'}
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          title="Horizontal Rule"
        >
          &#8212;
        </MenuButton>
      </div>

      {full && (
        <>
          <MenuDivider />

          {/* Insert */}
          <div className="philjs-menu-group">
            <MenuButton
              onClick={handleLink}
              isActive={editor.isActive('link')}
              disabled={disabled}
              title="Insert Link (Ctrl+K)"
            >
              &#128279;
            </MenuButton>
            <MenuButton
              onClick={handleImage}
              disabled={disabled}
              title="Insert Image"
            >
              &#128247;
            </MenuButton>
            <MenuButton
              onClick={handleTable}
              disabled={disabled}
              title="Insert Table"
            >
              &#9638;
            </MenuButton>
          </div>

          <MenuDivider />

          {/* Text Alignment */}
          <div className="philjs-menu-group">
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              disabled={disabled}
              title="Align Left"
            >
              &#8676;
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              disabled={disabled}
              title="Align Center"
            >
              &#8596;
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              disabled={disabled}
              title="Align Right"
            >
              &#8677;
            </MenuButton>
          </div>
        </>
      )}

      <MenuDivider />

      {/* History */}
      <div className="philjs-menu-group">
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          &#8630;
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          &#8631;
        </MenuButton>
      </div>

      {customButtons && (
        <>
          <MenuDivider />
          {customButtons}
        </>
      )}
    </div>
  );
}

/**
 * Default MenuBar styles
 */
export const menuBarStyles = `
.philjs-menu-bar {
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
}

.philjs-menu-group {
  display: flex;
  gap: 0.125rem;
}

.philjs-menu-button {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.875rem;
  height: 2rem;
  justify-content: center;
  min-width: 2rem;
  padding: 0 0.5rem;
  transition: background-color 0.15s, color 0.15s;
}

.philjs-menu-button:hover:not(:disabled) {
  background: #e2e8f0;
}

.philjs-menu-button:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.philjs-menu-button-active {
  background: #e0f2fe;
  color: #0369a1;
}

.philjs-menu-divider {
  background: #e2e8f0;
  height: 1.5rem;
  margin: 0 0.25rem;
  width: 1px;
}
`;

export default MenuBar;
