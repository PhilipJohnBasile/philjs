'use client';

import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';
import clsx from 'clsx';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const lines = code.split('\n');

  return (
    <div className={clsx('relative group', className)}>
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-surface-800 border-b border-surface-700 rounded-t-lg">
          <span className="text-sm text-surface-400 font-mono">{filename}</span>
          <span className="text-xs text-surface-500 uppercase">{language}</span>
        </div>
      )}

      <div className="relative">
        <pre className={clsx(
          'bg-surface-900 text-surface-100 p-4 overflow-x-auto text-sm leading-relaxed',
          filename ? 'rounded-b-lg' : 'rounded-lg'
        )}>
          <code className="font-mono">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlighted = highlightLines.includes(lineNumber);

              return (
                <div
                  key={index}
                  className={clsx(
                    'flex',
                    isHighlighted && 'bg-primary-500/10 -mx-4 px-4 border-l-2 border-primary-500'
                  )}
                >
                  {showLineNumbers && (
                    <span className="select-none text-surface-500 w-10 flex-shrink-0 text-right pr-4">
                      {lineNumber}
                    </span>
                  )}
                  <span className="flex-1">{line || ' '}</span>
                </div>
              );
            })}
          </code>
        </pre>

        <button
          onClick={handleCopy}
          className={clsx(
            'absolute right-2 top-2 p-2 rounded-md transition-all',
            'opacity-0 group-hover:opacity-100',
            'bg-surface-700 text-surface-300 hover:bg-surface-600 hover:text-white'
          )}
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// Inline code component for MDX
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-accent-600 dark:text-accent-400 text-sm font-mono">
      {children}
    </code>
  );
}

// Terminal/command line code block
interface TerminalProps {
  commands: string[];
  className?: string;
}

export function Terminal({ commands, className }: TerminalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(commands.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [commands]);

  return (
    <div className={clsx('relative group', className)}>
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 rounded-t-lg border-b border-surface-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-surface-500 ml-2">Terminal</span>
      </div>

      <pre className="bg-surface-900 text-surface-100 p-4 rounded-b-lg overflow-x-auto">
        <code className="font-mono text-sm">
          {commands.map((command, index) => (
            <div key={index} className="flex">
              <span className="text-green-400 select-none mr-2">$</span>
              <span>{command}</span>
            </div>
          ))}
        </code>
      </pre>

      <button
        onClick={handleCopy}
        className={clsx(
          'absolute right-2 top-12 p-2 rounded-md transition-all',
          'opacity-0 group-hover:opacity-100',
          'bg-surface-700 text-surface-300 hover:bg-surface-600 hover:text-white'
        )}
        aria-label={copied ? 'Copied!' : 'Copy commands'}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
