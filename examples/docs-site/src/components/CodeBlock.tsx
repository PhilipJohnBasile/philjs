import { signal, memo } from '@philjs/core';

interface CodeBlockProps {
  code: string | (() => string);
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock(props: CodeBlockProps) {
  const copied = signal(false);

  // Create a memo that handles both string and function props
  const codeValue = memo(() =>
    typeof props.code === 'function' ? props.code() : props.code
  );

  const copyCode = async () => {
    await navigator.clipboard.writeText(codeValue());
    copied.set(true);
    setTimeout(() => copied.set(false), 2000);
  };
  
  return (
    <div style="position: relative; margin: 1.5rem 0;">
      {props.filename && (
        <div style="
          background: var(--color-bg-alt);
          padding: 0.5rem 1rem;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-bottom: 1px solid var(--color-border);
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
        ">
          {props.filename}
        </div>
      )}
      
      <div style="position: relative;">
        <pre style="
          background: var(--color-bg-code);
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.7;
          border: 1px solid var(--color-code-border);
        ">
          <code style="font-family: var(--font-mono); color: var(--color-code-text);">
            {codeValue}
          </code>
        </pre>
        
        <button
          onClick={copyCode}
          style="
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            padding: 0.5rem 0.75rem;
            background: var(--color-bg-alt);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            font-size: 0.75rem;
            color: var(--color-text-secondary);
            transition: all var(--transition-fast);
            cursor: pointer;
          "
          aria-label="Copy code"
        >
          {copied() ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
