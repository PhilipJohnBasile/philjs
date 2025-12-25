/**
 * MarkdownEditor Component
 *
 * Markdown editor with live preview
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { Editor, JSONContent } from '@tiptap/react';

import { createLinkExtension } from '../extensions/link';
import { createCodeBlockExtension } from '../extensions/code-block';
import { createTaskListExtensions } from '../extensions/task-list';
import { htmlToMarkdown } from '../utils/html-to-markdown';
import { markdownToHtml } from '../utils/markdown-to-html';

export type ViewMode = 'write' | 'preview' | 'split';

export interface MarkdownEditorProps {
  /**
   * Initial markdown content
   */
  content?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Initial view mode
   */
  defaultViewMode?: ViewMode;
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
   * Callback when content changes
   */
  onChange?: (markdown: string) => void;
  /**
   * Callback when editor is ready
   */
  onReady?: (editor: Editor) => void;
  /**
   * Show view mode toggle
   */
  showModeToggle?: boolean;
  /**
   * Sync scroll between editor and preview
   */
  syncScroll?: boolean;
}

/**
 * View mode toggle component
 */
function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="philjs-md-mode-toggle">
      <button
        type="button"
        className={`philjs-md-mode-button ${mode === 'write' ? 'active' : ''}`}
        onClick={() => onChange('write')}
      >
        Write
      </button>
      <button
        type="button"
        className={`philjs-md-mode-button ${mode === 'preview' ? 'active' : ''}`}
        onClick={() => onChange('preview')}
      >
        Preview
      </button>
      <button
        type="button"
        className={`philjs-md-mode-button ${mode === 'split' ? 'active' : ''}`}
        onClick={() => onChange('split')}
      >
        Split
      </button>
    </div>
  );
}

/**
 * Markdown toolbar
 */
function MarkdownToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const insertMarkdown = (prefix: string, suffix = prefix) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    editor
      .chain()
      .focus()
      .deleteSelection()
      .insertContent(`${prefix}${selectedText}${suffix}`)
      .run();
  };

  return (
    <div className="philjs-md-toolbar">
      <button
        type="button"
        onClick={() => insertMarkdown('**')}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('*')}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('~~')}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('`')}
        title="Inline Code"
      >
        {'</>'}
      </button>
      <div className="philjs-md-toolbar-divider" />
      <button
        type="button"
        onClick={() => insertMarkdown('# ', '')}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('## ', '')}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('### ', '')}
        title="Heading 3"
      >
        H3
      </button>
      <div className="philjs-md-toolbar-divider" />
      <button
        type="button"
        onClick={() => insertMarkdown('- ', '')}
        title="Bullet List"
      >
        &#8226;
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('1. ', '')}
        title="Numbered List"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('- [ ] ', '')}
        title="Task List"
      >
        &#9744;
      </button>
      <div className="philjs-md-toolbar-divider" />
      <button
        type="button"
        onClick={() => insertMarkdown('[', '](url)')}
        title="Link"
      >
        &#128279;
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('![alt](', ')')}
        title="Image"
      >
        &#128247;
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('> ', '')}
        title="Quote"
      >
        &ldquo;
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('```\n', '\n```')}
        title="Code Block"
      >
        {'{ }'}
      </button>
    </div>
  );
}

/**
 * MarkdownEditor component
 */
export function MarkdownEditor({
  content = '',
  placeholder = 'Write markdown here...',
  defaultViewMode = 'write',
  readOnly = false,
  autoFocus = false,
  className = '',
  onChange,
  onReady,
  showModeToggle = true,
  syncScroll = true,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [previewHtml, setPreviewHtml] = useState('');
  const [markdown, setMarkdown] = useState(content);

  // Convert initial markdown to HTML for editor
  const initialHtml = useMemo(() => {
    return markdownToHtml(content);
  }, [content]);

  // Extensions
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      createLinkExtension(),
      createCodeBlockExtension(),
      ...createTaskListExtensions(),
    ],
    [placeholder]
  );

  // Initialize editor
  const editor = useEditor({
    extensions,
    content: initialHtml,
    editable: !readOnly,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'philjs-md-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      setMarkdown(md);
      onChange?.(md);
    },
  });

  // Update preview when markdown changes
  useEffect(() => {
    if (viewMode !== 'write') {
      const html = markdownToHtml(markdown);
      setPreviewHtml(html);
    }
  }, [markdown, viewMode]);

  // Call onReady when editor is ready
  useEffect(() => {
    if (editor) {
      onReady?.(editor);
    }
  }, [editor, onReady]);

  // Handle scroll sync
  const handleEditorScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!syncScroll || viewMode !== 'split') return;

      const source = e.currentTarget;
      const preview = document.querySelector('.philjs-md-preview') as HTMLDivElement;

      if (!preview) return;

      const scrollPercentage =
        source.scrollTop / (source.scrollHeight - source.clientHeight);
      preview.scrollTop =
        scrollPercentage * (preview.scrollHeight - preview.clientHeight);
    },
    [syncScroll, viewMode]
  );

  return (
    <div className={`philjs-markdown-editor ${className}`}>
      {showModeToggle && (
        <div className="philjs-md-header">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
      )}

      {viewMode !== 'preview' && <MarkdownToolbar editor={editor} />}

      <div className={`philjs-md-container philjs-md-${viewMode}`}>
        {viewMode !== 'preview' && (
          <div
            className="philjs-md-editor-wrapper"
            onScroll={handleEditorScroll}
          >
            <EditorContent editor={editor} />
          </div>
        )}

        {viewMode !== 'write' && (
          <div
            className="philjs-md-preview"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Get markdown from editor
 */
export function getMarkdown(editor: Editor): string {
  return htmlToMarkdown(editor.getHTML());
}

/**
 * Set markdown content in editor
 */
export function setMarkdown(editor: Editor, markdown: string): void {
  const html = markdownToHtml(markdown);
  editor.commands.setContent(html);
}

/**
 * MarkdownEditor styles
 */
export const markdownEditorStyles = `
.philjs-markdown-editor {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.philjs-md-header {
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem;
}

.philjs-md-mode-toggle {
  background: #f1f5f9;
  border-radius: 0.375rem;
  display: flex;
  padding: 0.125rem;
}

.philjs-md-mode-button {
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: #64748b;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  transition: all 0.15s;
}

.philjs-md-mode-button:hover {
  color: #334155;
}

.philjs-md-mode-button.active {
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  color: #0f172a;
}

.philjs-md-toolbar {
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 0.125rem;
  padding: 0.5rem;
}

.philjs-md-toolbar button {
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
}

.philjs-md-toolbar button:hover {
  background: #e2e8f0;
}

.philjs-md-toolbar-divider {
  background: #e2e8f0;
  height: 1.5rem;
  margin: 0 0.25rem;
  width: 1px;
}

.philjs-md-container {
  display: flex;
  flex: 1;
  min-height: 300px;
}

.philjs-md-container.philjs-md-write .philjs-md-editor-wrapper {
  width: 100%;
}

.philjs-md-container.philjs-md-preview .philjs-md-preview {
  width: 100%;
}

.philjs-md-container.philjs-md-split .philjs-md-editor-wrapper,
.philjs-md-container.philjs-md-split .philjs-md-preview {
  width: 50%;
}

.philjs-md-container.philjs-md-split .philjs-md-editor-wrapper {
  border-right: 1px solid #e2e8f0;
}

.philjs-md-editor-wrapper {
  overflow-y: auto;
  padding: 1rem;
}

.philjs-md-editor-content {
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  outline: none;
}

.philjs-md-preview {
  font-size: 1rem;
  line-height: 1.7;
  overflow-y: auto;
  padding: 1rem;
}

.philjs-md-preview h1 {
  border-bottom: 1px solid #e2e8f0;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}

.philjs-md-preview h2 {
  border-bottom: 1px solid #e2e8f0;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
  padding-bottom: 0.25rem;
}

.philjs-md-preview h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  margin-top: 1.25rem;
}

.philjs-md-preview p {
  margin-bottom: 1rem;
}

.philjs-md-preview ul,
.philjs-md-preview ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.philjs-md-preview blockquote {
  border-left: 4px solid #e2e8f0;
  color: #64748b;
  margin: 1rem 0;
  padding-left: 1rem;
}

.philjs-md-preview code {
  background: #f1f5f9;
  border-radius: 0.25rem;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.875rem;
  padding: 0.125rem 0.25rem;
}

.philjs-md-preview pre {
  background: #1e293b;
  border-radius: 0.5rem;
  color: #e2e8f0;
  margin: 1rem 0;
  overflow-x: auto;
  padding: 1rem;
}

.philjs-md-preview pre code {
  background: none;
  padding: 0;
}

.philjs-md-preview a {
  color: #2563eb;
  text-decoration: underline;
}

.philjs-md-preview img {
  max-width: 100%;
}

.philjs-md-preview table {
  border-collapse: collapse;
  margin: 1rem 0;
  width: 100%;
}

.philjs-md-preview th,
.philjs-md-preview td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
}

.philjs-md-preview th {
  background: #f8fafc;
  font-weight: 600;
}
`;

export default MarkdownEditor;
