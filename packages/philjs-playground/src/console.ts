/**
 * PhilJS Playground Console
 */

import type { ConsoleMessage } from './types';

export function createConsole(container: HTMLElement) {
  const messages: ConsoleMessage[] = [];

  container.innerHTML = '<div class="philjs-playground__console-messages"></div>';
  const messagesEl = container.querySelector('.philjs-playground__console-messages')!;

  return {
    log(type: 'log' | 'info' | 'warn' | 'error', message: string) {
      const msg: ConsoleMessage = {
        type,
        message,
        timestamp: Date.now(),
      };
      messages.push(msg);

      const el = document.createElement('div');
      el.className = `philjs-playground__console-message philjs-playground__console-message--${type}`;
      el.textContent = `[${type.toUpperCase()}] ${message}`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    },
    clear() {
      messages.length = 0;
      messagesEl.innerHTML = '';
    },
    getMessages() {
      return [...messages];
    },
  };
}

export function Console(props: { className?: string }) {
  const container = document.createElement('div');
  container.className = props.className || '';
  return container;
}
