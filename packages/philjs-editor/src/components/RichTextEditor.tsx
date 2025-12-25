/**
 * RichTextEditor Component
 *
 * Full-featured WYSIWYG editor with all formatting options
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import type { Editor, JSONContent } from '@tiptap/react';

import { MenuBar, menuBarStyles } from './MenuBar';
import { BubbleMenu, bubbleMenuStyles } from './BubbleMenu';
import { createLinkExtension } from '../extensions/link';
import { createImageExtension } from '../extensions/image';
import { createTableExtensions } from '../extensions/table';
import { createTaskListExtensions } from '../extensions/task-list';
import { createCodeBlockExtension } from '../extensions/code-block';

export interface RichTextEditorProps {
  /**
   * Initial content (HTML string)
   */
  content?: string;
  /**
   * Initial JSON content
   */
  jsonContent?: JSONContent;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Maximum character count
   */
  maxLength?: number;
  /**
   * Editor is read-only
   */
  readOnly?: boolean;
  /**
   * Auto-focus on mount
   */
  autoFocus?: boolean;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Show menu bar
   */
  showMenuBar?: boolean;
  /**
   * Show bubble menu on selection
   */
  showBubbleMenu?: boolean;
  /**
   * Show character count
   */
  showCharacterCount?: boolean;
  /**
   * Enable spell checking
   */
  spellCheck?: boolean;
  /**
   * Callback when content changes
   */
  onChange?: (html: string, json: JSONContent) => void;
  /**
   * Callback when editor is ready
   */
  onReady?: (editor: Editor) => void;
  /**
   * Callback on focus
   */
  onFocus?: () => void;
  /**
   * Callback on blur
   */
  onBlur?: () => void;
  /**
   * Image upload function
   */
  onImageUpload?: (file: File) => Promise<string>;
  /**
   * Custom extensions
   */
  extensions?: any[];
  /**
   * Enable table support
   */
  enableTables?: boolean;
  /**
   * Enable task lists
   */
  enableTaskLists?: boolean;
  /**
   * Enable code blocks with syntax highlighting
   */
  enableCodeBlocks?: boolean;
}

/**
 * RichTextEditor component
 */
export function RichTextEditor({
  content = '',
  jsonContent,
  placeholder = 'Start writing...',
  maxLength,
  readOnly = false,
  autoFocus = false,
  className = '',
  showMenuBar = true,
  showBubbleMenu = true,
  showCharacterCount = false,
  spellCheck = true,
  onChange,
  onReady,
  onFocus,
  onBlur,
  onImageUpload,
  extensions: customExtensions = [],
  enableTables = true,
  enableTaskLists = true,
  enableCodeBlocks = true,
}: RichTextEditorProps) {
  // Build extensions list
  const extensions = useMemo(() => {
    const exts = [
      StarterKit.configure({
        codeBlock: false, // We use our own code block extension
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      createLinkExtension(),
      ...createImageExtension({
        uploadFn: onImageUpload,
      }),
    ];

    if (maxLength) {
      exts.push(
        CharacterCount.configure({
          limit: maxLength,
        })
      );
    } else if (showCharacterCount) {
      exts.push(CharacterCount);
    }

    if (enableTables) {
      exts.push(...createTableExtensions());
    }

    if (enableTaskLists) {
      exts.push(...createTaskListExtensions());
    }

    if (enableCodeBlocks) {
      exts.push(createCodeBlockExtension());
    }

    return [...exts, ...customExtensions];
  }, [
    placeholder,
    maxLength,
    showCharacterCount,
    onImageUpload,
    enableTables,
    enableTaskLists,
    enableCodeBlocks,
    customExtensions,
  ]);

  // Initialize editor
  const editor = useEditor({
    extensions,
    content: jsonContent || content,
    editable: !readOnly,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'philjs-editor-content',
        spellcheck: spellCheck ? 'true' : 'false',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getJSON());
    },
    onFocus: () => {
      onFocus?.();
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  // Call onReady when editor is ready
  useEffect(() => {
    if (editor) {
      onReady?.(editor);
    }
  }, [editor, onReady]);

  // Update content when prop changes
  useEffect(() => {
    if (editor && jsonContent) {
      editor.commands.setContent(jsonContent);
    }
  }, [editor, jsonContent]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Character count component
  const CharacterCountDisplay = useCallback(() => {
    if (!editor || !showCharacterCount) {
      return null;
    }

    const count = editor.storage.characterCount?.characters() || 0;
    const words = editor.storage.characterCount?.words() || 0;

    return (
      <div className="philjs-character-count">
        {maxLength ? (
          <span>
            {count} / {maxLength} characters
          </span>
        ) : (
          <span>{count} characters</span>
        )}
        <span className="philjs-word-count">{words} words</span>
      </div>
    );
  }, [editor, showCharacterCount, maxLength]);

  return (
    <div className={`philjs-rich-text-editor ${className}`}>
      {showMenuBar && <MenuBar editor={editor} disabled={readOnly} />}

      <div className="philjs-editor-wrapper">
        {showBubbleMenu && editor && (
          <BubbleMenu editor={editor} showLink showHeadings showColor />
        )}
        <EditorContent editor={editor} />
      </div>

      {showCharacterCount && <CharacterCountDisplay />}
    </div>
  );
}

/**
 * Export content in various formats
 */
export function exportEditorContent(editor: Editor) {
  return {
    html: editor.getHTML(),
    json: editor.getJSON(),
    text: editor.getText(),
  };
}

/**
 * RichTextEditor styles
 */
export const richTextEditorStyles = `
${menuBarStyles}
${bubbleMenuStyles}

.philjs-rich-text-editor {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.philjs-editor-wrapper {
  min-height: 200px;
  padding: 1rem;
}

.philjs-editor-content {
  outline: none;
}

.philjs-editor-content > * + * {
  margin-top: 0.75rem;
}

.philjs-editor-content h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.philjs-editor-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.philjs-editor-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}

.philjs-editor-content p {
  line-height: 1.6;
}

.philjs-editor-content ul,
.philjs-editor-content ol {
  padding-left: 1.5rem;
}

.philjs-editor-content blockquote {
  border-left: 3px solid #e2e8f0;
  color: #64748b;
  margin-left: 0;
  padding-left: 1rem;
}

.philjs-editor-content pre {
  background: #1e293b;
  border-radius: 0.5rem;
  color: #e2e8f0;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
  padding: 1rem;
}

.philjs-editor-content code {
  background: #f1f5f9;
  border-radius: 0.25rem;
  color: #0f172a;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.875rem;
  padding: 0.125rem 0.25rem;
}

.philjs-editor-content pre code {
  background: none;
  color: inherit;
  padding: 0;
}

.philjs-editor-content hr {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.5rem 0;
}

.philjs-editor-content a {
  color: #2563eb;
  text-decoration: underline;
}

.philjs-editor-content img {
  border-radius: 0.25rem;
  max-width: 100%;
}

.philjs-editor-content table {
  border-collapse: collapse;
  margin: 0;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

.philjs-editor-content table td,
.philjs-editor-content table th {
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
  min-width: 1em;
  padding: 0.5rem;
  position: relative;
  vertical-align: top;
}

.philjs-editor-content table th {
  background: #f8fafc;
  font-weight: 600;
}

.philjs-editor-content .ProseMirror-selectednode {
  outline: 2px solid #3b82f6;
}

.philjs-editor-content p.is-editor-empty:first-child::before {
  color: #94a3b8;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.philjs-character-count {
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  font-size: 0.75rem;
  gap: 1rem;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
}

.philjs-word-count {
  color: #94a3b8;
}
`;

export default RichTextEditor;
