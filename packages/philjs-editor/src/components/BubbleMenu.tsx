/**
 * BubbleMenu Component
 *
 * Context menu that appears on text selection
 */

import React, { useCallback } from 'react';
import { BubbleMenu as TipTapBubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import type { BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';

export interface BubbleMenuProps {
  /**
   * Editor instance
   */
  editor: Editor | null;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Custom tippy options
   */
  tippyOptions?: Partial<BubbleMenuPluginProps['tippyOptions']>;
  /**
   * Should show function
   */
  shouldShow?: BubbleMenuPluginProps['shouldShow'];
  /**
   * Custom buttons to show
   */
  customButtons?: React.ReactNode;
  /**
   * Show link editing button
   */
  showLink?: boolean;
  /**
   * Show heading options
   */
  showHeadings?: boolean;
  /**
   * Show color picker
   */
  showColor?: boolean;
}

/**
 * Default should show function
 */
const defaultShouldShow: BubbleMenuPluginProps['shouldShow'] = ({ editor, state }) => {
  const { selection } = state;
  const { empty } = selection;

  // Don't show bubble menu if:
  // - Selection is empty
  // - We're in a code block
  // - We're in a node that shouldn't have formatting

  if (empty) {
    return false;
  }

  if (editor.isActive('codeBlock')) {
    return false;
  }

  return true;
};

/**
 * BubbleMenu component
 */
export function BubbleMenu({
  editor,
  className = '',
  tippyOptions = {},
  shouldShow = defaultShouldShow,
  customButtons,
  showLink = true,
  showHeadings = false,
  showColor = false,
}: BubbleMenuProps) {
  if (!editor) {
    return null;
  }

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

  const handleColor = useCallback(
    (color: string) => {
      editor.chain().focus().setColor(color).run();
    },
    [editor]
  );

  const handleHighlight = useCallback(
    (color: string) => {
      editor.chain().focus().toggleHighlight({ color }).run();
    },
    [editor]
  );

  return (
    <TipTapBubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        ...tippyOptions,
      }}
      shouldShow={shouldShow}
      className={`philjs-bubble-menu ${className}`}
    >
      <div className="philjs-bubble-menu-content">
        {/* Basic formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`philjs-bubble-button ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`philjs-bubble-button ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`philjs-bubble-button ${editor.isActive('underline') ? 'active' : ''}`}
          title="Underline"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`philjs-bubble-button ${editor.isActive('strike') ? 'active' : ''}`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`philjs-bubble-button ${editor.isActive('code') ? 'active' : ''}`}
          title="Code"
        >
          {'</>'}
        </button>

        {showLink && (
          <>
            <div className="philjs-bubble-divider" />
            <button
              type="button"
              onClick={handleLink}
              className={`philjs-bubble-button ${editor.isActive('link') ? 'active' : ''}`}
              title="Link"
            >
              &#128279;
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetLink().run()}
                className="philjs-bubble-button"
                title="Remove Link"
              >
                &#10006;
              </button>
            )}
          </>
        )}

        {showHeadings && (
          <>
            <div className="philjs-bubble-divider" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`philjs-bubble-button ${
                editor.isActive('heading', { level: 1 }) ? 'active' : ''
              }`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`philjs-bubble-button ${
                editor.isActive('heading', { level: 2 }) ? 'active' : ''
              }`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`philjs-bubble-button ${
                editor.isActive('heading', { level: 3 }) ? 'active' : ''
              }`}
              title="Heading 3"
            >
              H3
            </button>
          </>
        )}

        {showColor && (
          <>
            <div className="philjs-bubble-divider" />
            <div className="philjs-bubble-color-group">
              <button
                type="button"
                onClick={() => handleColor('#ef4444')}
                className="philjs-bubble-color"
                style={{ backgroundColor: '#ef4444' }}
                title="Red"
              />
              <button
                type="button"
                onClick={() => handleColor('#f97316')}
                className="philjs-bubble-color"
                style={{ backgroundColor: '#f97316' }}
                title="Orange"
              />
              <button
                type="button"
                onClick={() => handleColor('#22c55e')}
                className="philjs-bubble-color"
                style={{ backgroundColor: '#22c55e' }}
                title="Green"
              />
              <button
                type="button"
                onClick={() => handleColor('#3b82f6')}
                className="philjs-bubble-color"
                style={{ backgroundColor: '#3b82f6' }}
                title="Blue"
              />
              <button
                type="button"
                onClick={() => handleColor('#8b5cf6')}
                className="philjs-bubble-color"
                style={{ backgroundColor: '#8b5cf6' }}
                title="Purple"
              />
            </div>
            <div className="philjs-bubble-color-group">
              <button
                type="button"
                onClick={() => handleHighlight('#fef08a')}
                className="philjs-bubble-highlight"
                style={{ backgroundColor: '#fef08a' }}
                title="Highlight Yellow"
              />
              <button
                type="button"
                onClick={() => handleHighlight('#bbf7d0')}
                className="philjs-bubble-highlight"
                style={{ backgroundColor: '#bbf7d0' }}
                title="Highlight Green"
              />
              <button
                type="button"
                onClick={() => handleHighlight('#bfdbfe')}
                className="philjs-bubble-highlight"
                style={{ backgroundColor: '#bfdbfe' }}
                title="Highlight Blue"
              />
            </div>
          </>
        )}

        {customButtons}
      </div>
    </TipTapBubbleMenu>
  );
}

/**
 * BubbleMenu styles
 */
export const bubbleMenuStyles = `
.philjs-bubble-menu {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.philjs-bubble-menu-content {
  align-items: center;
  display: flex;
  gap: 0.125rem;
  padding: 0.25rem;
}

.philjs-bubble-button {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.875rem;
  height: 1.75rem;
  justify-content: center;
  min-width: 1.75rem;
  padding: 0 0.375rem;
  transition: background-color 0.15s, color 0.15s;
}

.philjs-bubble-button:hover {
  background: #f1f5f9;
}

.philjs-bubble-button.active {
  background: #e0f2fe;
  color: #0369a1;
}

.philjs-bubble-divider {
  background: #e2e8f0;
  height: 1.25rem;
  margin: 0 0.25rem;
  width: 1px;
}

.philjs-bubble-color-group {
  display: flex;
  gap: 0.125rem;
}

.philjs-bubble-color,
.philjs-bubble-highlight {
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  cursor: pointer;
  height: 1.25rem;
  width: 1.25rem;
}

.philjs-bubble-color:hover,
.philjs-bubble-highlight:hover {
  transform: scale(1.1);
}
`;

export default BubbleMenu;
