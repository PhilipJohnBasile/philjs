/**
 * @philjs/rich-text - Slash Command Menu
 * Notion-style command palette for inserting blocks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SlashCommand } from '../types';

export interface SlashCommandMenuProps {
  commands: SlashCommand[];
  query: string;
  position: { x: number; y: number };
  onSelect: (command: SlashCommand) => void;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  commands,
  query,
  position,
  onSelect,
  onQueryChange,
  onClose,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands based on query
  const filteredCommands = commands.filter((cmd) => {
    const searchText = query.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(searchText) ||
      cmd.description.toLowerCase().includes(searchText) ||
      cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchText))
    );
  });

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Backspace':
          if (query.length === 0) {
            onClose();
          } else {
            onQueryChange(query.slice(0, -1));
          }
          break;
        default:
          if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
            onQueryChange(query + e.key);
          }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query, selectedIndex, filteredCommands, onSelect, onQueryChange, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = menuRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleItemClick = useCallback(
    (command: SlashCommand) => {
      onSelect(command);
    },
    [onSelect]
  );

  if (filteredCommands.length === 0) {
    return (
      <div
        ref={menuRef}
        className="philjs-slash-menu"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '0.5rem',
          zIndex: 1000,
          minWidth: '200px',
        }}
      >
        <div style={{ color: '#9ca3af', padding: '0.5rem' }}>
          No commands found
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="philjs-slash-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '0.25rem',
        zIndex: 1000,
        minWidth: '240px',
        maxHeight: '320px',
        overflowY: 'auto',
      }}
    >
      {filteredCommands.map((command, index) => (
        <div
          key={command.name}
          data-index={index}
          className={`philjs-slash-item ${index === selectedIndex ? 'selected' : ''}`}
          style={{
            padding: '0.5rem 0.75rem',
            cursor: 'pointer',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: index === selectedIndex ? '#f3f4f6' : 'transparent',
          }}
          onClick={() => handleItemClick(command)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {command.icon && (
            <span
              className="philjs-slash-icon"
              style={{
                width: '1.5rem',
                height: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              {command.icon}
            </span>
          )}
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              {command.name}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              {command.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SlashCommandMenu;
