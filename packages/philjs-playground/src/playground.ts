/**
 * PhilJS Playground Component
 *
 * The main playground component that brings together the editor, preview, and console.
 */

import type { PlaygroundConfig, CompileResult, ConsoleMessage } from './types.js';
import { createEditor } from './editor.js';
import { createPreview } from './preview.js';
import { createConsole } from './console.js';
import { compileCode } from './compiler.js';
import { exampleCode } from './examples.js';

/**
 * Create a PhilJS playground
 */
export function createPlayground(container: HTMLElement, config: PlaygroundConfig = {}) {
  const {
    initialCode = exampleCode.helloWorld,
    theme = 'dark',
    layout = 'horizontal',
    autoRun = true,
    showConsole = true,
    showShare = true,
    onCompile,
    onError,
  } = config;

  // Create DOM structure
  container.innerHTML = '';
  container.className = `philjs-playground philjs-playground--${theme} philjs-playground--${layout}`;

  const header = createHeader(showShare);
  const editorPane = document.createElement('div');
  editorPane.className = 'philjs-playground__editor';

  const previewPane = document.createElement('div');
  previewPane.className = 'philjs-playground__preview';

  const consolePane = document.createElement('div');
  consolePane.className = 'philjs-playground__console';
  consolePane.style.display = showConsole ? 'block' : 'none';

  const mainContent = document.createElement('div');
  mainContent.className = 'philjs-playground__main';
  mainContent.appendChild(editorPane);
  mainContent.appendChild(previewPane);

  container.appendChild(header);
  container.appendChild(mainContent);
  if (showConsole) {
    container.appendChild(consolePane);
  }

  // Initialize components
  const editor = createEditor(editorPane, {
    initialCode,
    theme,
    ...(autoRun ? { onChange: debounce(runCode, 500) } : {}),
  });

  const preview = createPreview(previewPane);
  const consoleView = createConsole(consolePane);

  // Run button
  const runButton = header.querySelector('.philjs-playground__run') as HTMLButtonElement;
  runButton?.addEventListener('click', runCode);

  // Share button
  const shareButton = header.querySelector('.philjs-playground__share') as HTMLButtonElement;
  shareButton?.addEventListener('click', shareCode);

  // Run code function
  async function runCode() {
    const code = editor.getValue();
    consoleView.clear();
    consoleView.log('info', 'Compiling...');

    try {
      const result = await compileCode(code);

      if (result.success) {
        consoleView.clear();
        consoleView.log('info', 'Running...');

        // Execute in preview
        preview.render(result.output, {
          onConsole: (type: string, ...args: unknown[]) => {
            consoleView.log(type as any, args.map(String).join(' '));
          },
          onError: (error: Error) => {
            consoleView.log('error', error.message);
            onError?.(error);
          },
        });

        onCompile?.(result);
      } else {
        consoleView.log('error', result.errors.join('\n'));
        onError?.(new Error(result.errors.join('\n')));
      }
    } catch (error) {
      consoleView.log('error', (error as Error).message);
      onError?.(error as Error);
    }
  }

  // Share code function
  async function shareCode() {
    const code = editor.getValue();
    const compressed = btoa(encodeURIComponent(code));
    const url = `${window.location.origin}/playground?code=${compressed}`;

    try {
      await navigator.clipboard.writeText(url);
      consoleView.log('info', 'Share URL copied to clipboard!');
    } catch {
      consoleView.log('error', 'Failed to copy URL');
    }
  }

  // Initial run
  if (autoRun) {
    setTimeout(runCode, 100);
  }

  // Inject styles
  injectStyles();

  return {
    editor,
    preview,
    console: consoleView,
    run: runCode,
    share: shareCode,
    setCode(code: string) {
      editor.setValue(code);
      if (autoRun) runCode();
    },
    getCode() {
      return editor.getValue();
    },
    destroy() {
      container.innerHTML = '';
    },
  };
}

function createHeader(showShare: boolean): HTMLElement {
  const header = document.createElement('div');
  header.className = 'philjs-playground__header';
  header.innerHTML = `
    <div class="philjs-playground__logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      <span>PhilJS Playground</span>
    </div>
    <div class="philjs-playground__actions">
      <button class="philjs-playground__run" title="Run (Ctrl+Enter)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Run
      </button>
      ${showShare ? `
        <button class="philjs-playground__share" title="Share">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
          Share
        </button>
      ` : ''}
    </div>
  `;
  return header;
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function injectStyles() {
  if (document.getElementById('philjs-playground-styles')) return;

  const style = document.createElement('style');
  style.id = 'philjs-playground-styles';
  style.textContent = `
    .philjs-playground {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .philjs-playground--dark {
      background: #1e1e1e;
      color: #fff;
    }

    .philjs-playground--light {
      background: #fff;
      color: #333;
    }

    .philjs-playground__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #252526;
      border-bottom: 1px solid #3c3c3c;
    }

    .philjs-playground__logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .philjs-playground__actions {
      display: flex;
      gap: 8px;
    }

    .philjs-playground__run,
    .philjs-playground__share {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: #0e639c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .philjs-playground__run:hover,
    .philjs-playground__share:hover {
      background: #1177bb;
    }

    .philjs-playground__share {
      background: #3c3c3c;
    }

    .philjs-playground__share:hover {
      background: #4c4c4c;
    }

    .philjs-playground__main {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .philjs-playground--horizontal .philjs-playground__main {
      flex-direction: row;
    }

    .philjs-playground--vertical .philjs-playground__main {
      flex-direction: column;
    }

    .philjs-playground__editor,
    .philjs-playground__preview {
      flex: 1;
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }

    .philjs-playground__editor {
      border-right: 1px solid #3c3c3c;
    }

    .philjs-playground__preview {
      background: white;
    }

    .philjs-playground__console {
      height: 150px;
      background: #1e1e1e;
      border-top: 1px solid #3c3c3c;
      overflow: auto;
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      padding: 8px;
    }

    .philjs-playground__console-message {
      padding: 2px 0;
    }

    .philjs-playground__console-message--error {
      color: #f48771;
    }

    .philjs-playground__console-message--warn {
      color: #cca700;
    }

    .philjs-playground__console-message--info {
      color: #75beff;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Standalone Playground component
 */
export function Playground(props: PlaygroundConfig & { className?: string }) {
  const container = document.createElement('div');
  container.className = props.className || '';

  setTimeout(() => {
    createPlayground(container, props);
  }, 0);

  return container;
}
