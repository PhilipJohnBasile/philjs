/**
 * @philjs/rich-text - Floating Toolbar
 * Context-aware formatting toolbar that appears on text selection
 */

import { useState, useEffect, useRef } from 'react';
import type { EditorInstance } from '../types';

export interface FloatingToolbarProps {
  editor: EditorInstance;
}

interface ToolbarButton {
  name: string;
  icon: string;
  command: keyof EditorInstance['commands'];
  isActive?: () => boolean;
}

const defaultButtons: ToolbarButton[] = [
  { name: 'Bold', icon: 'B', command: 'bold' },
  { name: 'Italic', icon: 'I', command: 'italic' },
  { name: 'Underline', icon: 'U', command: 'underline' },
  { name: 'Strikethrough', icon: 'S', command: 'strike' },
  { name: 'Code', icon: '</>', command: 'code' },
];

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setIsVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0) {
        setIsVisible(false);
        return;
      }

      // Position toolbar above selection
      const toolbarHeight = 40;
      const toolbarWidth = toolbarRef.current?.offsetWidth || 200;

      setPosition({
        x: rect.left + rect.width / 2 - toolbarWidth / 2,
        y: rect.top - toolbarHeight - 8,
      });
      setIsVisible(true);
    };

    document.addEventListener('selectionchange', updatePosition);
    return () => document.removeEventListener('selectionchange', updatePosition);
  }, []);

  const handleCommand = (command: keyof EditorInstance['commands']) => {
    const cmd = editor.commands[command];
    if (typeof cmd === 'function') {
      (cmd as () => boolean)();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="philjs-floating-toolbar"
      style={{
        position: 'fixed',
        left: Math.max(8, position.x),
        top: Math.max(8, position.y),
        display: 'flex',
        gap: '2px',
        backgroundColor: '#1f2937',
        padding: '4px',
        borderRadius: '6px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
      }}
    >
      {defaultButtons.map((button) => (
        <button
          key={button.name}
          title={button.name}
          onClick={() => handleCommand(button.command)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: button.command === 'bold' ? 700 : 400,
            fontStyle: button.command === 'italic' ? 'italic' : 'normal',
            textDecoration: button.command === 'underline' ? 'underline' :
                           button.command === 'strike' ? 'line-through' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {button.icon}
        </button>
      ))}

      <div style={{ width: '1px', backgroundColor: '#4b5563', margin: '4px' }} />

      <button
        title="Link"
        onClick={() => {
          const url = prompt('Enter URL:');
          if (url) {
            // Add link mark
          }
        }}
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        🔗
      </button>
    </div>
  );
}

export default FloatingToolbar;
