/**
 * @philjs/rich-text - Slash Command Menu
 * Notion-style command palette - vanilla JS
 */

import type { SlashCommand } from '../types';

export interface SlashCommandMenuOptions {
  commands: SlashCommand[];
  onSelect: (command: SlashCommand) => void;
}

export class SlashCommandMenu {
  private commands: SlashCommand[];
  private onSelect: (command: SlashCommand) => void;
  private element: HTMLDivElement | null = null;
  private query: string = '';
  private selectedIndex: number = 0;
  private _isOpen: boolean = false;

  constructor(options: SlashCommandMenuOptions) {
    this.commands = options.commands;
    this.onSelect = options.onSelect;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  open(position: { x: number; y: number }): void {
    this.query = '';
    this.selectedIndex = 0;
    this._isOpen = true;
    this.render(position);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  close(): void {
    this._isOpen = false;
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  destroy(): void {
    this.close();
  }

  private getFilteredCommands(): SlashCommand[] {
    const search = this.query.toLowerCase();
    return this.commands.filter((cmd) =>
      cmd.name.toLowerCase().includes(search) ||
      cmd.description.toLowerCase().includes(search) ||
      cmd.keywords?.some((kw) => kw.toLowerCase().includes(search))
    );
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const filtered = this.getFilteredCommands();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = this.selectedIndex < filtered.length - 1 ? this.selectedIndex + 1 : 0;
        this.updateSelection();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : filtered.length - 1;
        this.updateSelection();
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[this.selectedIndex]) {
          this.onSelect(filtered[this.selectedIndex]);
          this.close();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Backspace':
        if (this.query.length === 0) {
          this.close();
        } else {
          this.query = this.query.slice(0, -1);
          this.selectedIndex = 0;
          this.updateItems();
        }
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          this.query += e.key;
          this.selectedIndex = 0;
          this.updateItems();
        }
    }
  }

  private handleClickOutside(e: MouseEvent): void {
    if (this.element && !this.element.contains(e.target as Node)) {
      this.close();
    }
  }

  private render(position: { x: number; y: number }): void {
    this.element = document.createElement('div');
    this.element.className = 'philjs-slash-menu';
    Object.assign(this.element.style, {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      padding: '0.25rem',
      zIndex: '1000',
      minWidth: '240px',
      maxHeight: '320px',
      overflowY: 'auto',
    });

    this.updateItems();
    document.body.appendChild(this.element);
  }

  private updateItems(): void {
    if (!this.element) return;

    const filtered = this.getFilteredCommands();
    this.element.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No commands found';
      empty.style.color = '#9ca3af';
      empty.style.padding = '0.5rem';
      this.element.appendChild(empty);
      return;
    }

    filtered.forEach((command, index) => {
      const item = document.createElement('div');
      item.className = 'philjs-slash-item';
      item.setAttribute('data-index', String(index));
      Object.assign(item.style, {
        padding: '0.5rem 0.75rem',
        cursor: 'pointer',
        borderRadius: '0.375rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backgroundColor: index === this.selectedIndex ? '#f3f4f6' : 'transparent',
      });

      if (command.icon) {
        const icon = document.createElement('span');
        icon.className = 'philjs-slash-icon';
        Object.assign(icon.style, {
          width: '1.5rem',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
        });
        icon.textContent = command.icon;
        item.appendChild(icon);
      }

      const textContainer = document.createElement('div');

      const name = document.createElement('div');
      name.style.fontWeight = '500';
      name.style.fontSize = '0.875rem';
      name.textContent = command.name;

      const desc = document.createElement('div');
      desc.style.color = '#6b7280';
      desc.style.fontSize = '0.75rem';
      desc.textContent = command.description;

      textContainer.appendChild(name);
      textContainer.appendChild(desc);
      item.appendChild(textContainer);

      item.addEventListener('click', () => {
        this.onSelect(command);
        this.close();
      });

      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.element!.appendChild(item);
    });
  }

  private updateSelection(): void {
    if (!this.element) return;

    const items = this.element.querySelectorAll('.philjs-slash-item');
    items.forEach((item, index) => {
      (item as HTMLElement).style.backgroundColor =
        index === this.selectedIndex ? '#f3f4f6' : 'transparent';
    });

    const selected = this.element.querySelector(`[data-index="${this.selectedIndex}"]`);
    selected?.scrollIntoView({ block: 'nearest' });
  }
}

export default SlashCommandMenu;
