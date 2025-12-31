import { signal, effect, render } from '@philjs/core';
import hljs from 'highlight.js';

interface CodePlaygroundProps {
  initialCode: string;
  language?: string;
}

export function CodePlayground({ initialCode, language = 'javascript' }: CodePlaygroundProps) {
  const code = signal(initialCode);
  const output = signal('');
  const error = signal('');

  // Store the original code for reset
  const originalCode = initialCode;

  const runCode = () => {
    error.set('');
    output.set('');

    try {
      // Create a safe execution context
      const logs: string[] = [];

      // Override console.log to capture output
      const mockConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        },
        error: (...args: any[]) => {
          logs.push('ERROR: ' + args.join(' '));
        },
        warn: (...args: any[]) => {
          logs.push('WARN: ' + args.join(' '));
        }
      };

      // Execute the code
      const executionContext = {
        signal,
        effect,
        render,
        console: mockConsole,
      };

      // Create function with the code
      const func = new Function(
        ...Object.keys(executionContext),
        code()
      );

      // Execute with context
      const result = func(...Object.values(executionContext));

      // If there's a return value, add it to logs
      if (result !== undefined) {
        logs.push(`Return: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
      }

      output.set(logs.join('\n') || 'Code executed successfully (no output)');
    } catch (err: any) {
      error.set(err.message || 'An error occurred');
      console.error('Code execution error:', err);
    }
  };

  const resetCode = () => {
    code.set(originalCode);
    output.set('');
    error.set('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code());
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Highlight code on change
  effect(() => {
    const editorEl = document.getElementById('code-editor-content');
    if (editorEl) {
      editorEl.textContent = code();
      hljs.highlightElement(editorEl);
    }
  });

  return (
    <div class="code-playground">
      <div class="code-playground-header">
        <div class="code-playground-toolbar">
          <button
            class="playground-btn playground-btn-run"
            onClick={runCode}
          >
            ▶ Run
          </button>
          <button
            class="playground-btn playground-btn-reset"
            onClick={resetCode}
          >
            ↻ Reset
          </button>
          <button
            class="playground-btn playground-btn-copy"
            onClick={copyCode}
          >
            📋 Copy
          </button>
        </div>
      </div>

      <div class="code-playground-content">
        <div class="code-playground-editor">
          <textarea
            class="code-editor-textarea"
            value={code()}
            onInput={(e: InputEvent) => {
              const target = e.target as HTMLTextAreaElement;
              code.set(target.value);
            }}
            spellCheck={false}
          />
          <pre class="code-editor-highlight">
            <code id="code-editor-content" class={`language-${language}`}>
              {code()}
            </code>
          </pre>
        </div>

        <div class="code-playground-preview">
          <div class="preview-header">Output</div>
          <div class="preview-content">
            {error() ? (
              <div class="preview-error">
                ❌ {error()}
              </div>
            ) : output() ? (
              <pre class="preview-output">{output()}</pre>
            ) : (
              <div class="preview-empty">
                Click "Run" to see output
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
