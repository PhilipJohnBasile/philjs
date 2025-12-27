/**
 * @philjs/rich-text - Main Editor Component
 * Block-based rich text editor with slash commands
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type {
  EditorConfig,
  EditorInstance,
  EditorState,
  Block,
  Selection,
  SlashCommand,
} from '../types';
import { createEditor } from '../core/editor';
import { SlashCommandMenu } from './SlashCommandMenu';
import { BlockRenderer } from './BlockRenderer';
import { FloatingToolbar } from './FloatingToolbar';

export interface EditorProps extends EditorConfig {
  initialContent?: Block[];
  className?: string;
  style?: React.CSSProperties;
}

export function Editor({
  initialContent = [],
  placeholder = 'Type \'/\' for commands...',
  readOnly = false,
  autofocus = false,
  extensions = [],
  onUpdate,
  onSelectionChange,
  slashCommands = [],
  collaborationConfig,
  className,
  style,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  const [state, setState] = useState<EditorState>({
    blocks: initialContent,
    selection: null,
  });

  const [slashMenuState, setSlashMenuState] = useState<{
    isOpen: boolean;
    query: string;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    query: '',
    position: { x: 0, y: 0 },
  });

  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = createEditor({
      container: containerRef.current,
      initialContent,
      extensions,
      readOnly,
      collaborationConfig,
      onUpdate: (newState) => {
        setState(newState);
        onUpdate?.(newState);
      },
      onSelectionChange: (selection) => {
        setShowFloatingToolbar(selection !== null);
        onSelectionChange?.(selection);
      },
    });

    editorRef.current = editor;

    if (autofocus) {
      editor.focus();
    }

    return () => {
      editor.destroy();
    };
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (readOnly) return;

    // Slash command trigger
    if (e.key === '/' && !slashMenuState.isOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSlashMenuState({
          isOpen: true,
          query: '',
          position: { x: rect.left, y: rect.bottom + 8 },
        });
      }
    }

    // Close slash menu on escape
    if (e.key === 'Escape' && slashMenuState.isOpen) {
      setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
    }
  }, [readOnly, slashMenuState.isOpen]);

  // Handle slash command selection
  const handleSlashCommand = useCallback((command: SlashCommand) => {
    if (editorRef.current) {
      command.execute(editorRef.current);
    }
    setSlashMenuState({ isOpen: false, query: '', position: { x: 0, y: 0 } });
  }, []);

  // Handle slash command query update
  const handleSlashQueryChange = useCallback((query: string) => {
    setSlashMenuState((prev) => ({ ...prev, query }));
  }, []);

  return (
    <div
      ref={containerRef}
      className={`philjs-editor ${className || ''}`}
      style={{
        outline: 'none',
        minHeight: '100px',
        ...style,
      }}
      onKeyDown={handleKeyDown}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      data-placeholder={placeholder}
    >
      {state.blocks.length === 0 && (
        <div className="philjs-editor-placeholder" style={{ color: '#9ca3af' }}>
          {placeholder}
        </div>
      )}

      {state.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          editor={editorRef.current}
          readOnly={readOnly}
        />
      ))}

      {showFloatingToolbar && editorRef.current && !readOnly && (
        <FloatingToolbar editor={editorRef.current} />
      )}

      {slashMenuState.isOpen && (
        <SlashCommandMenu
          commands={slashCommands}
          query={slashMenuState.query}
          position={slashMenuState.position}
          onSelect={handleSlashCommand}
          onQueryChange={handleSlashQueryChange}
          onClose={() => setSlashMenuState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}

export default Editor;
