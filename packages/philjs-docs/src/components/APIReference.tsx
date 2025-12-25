'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import clsx from 'clsx';

interface Parameter {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  default?: string;
}

interface APIMethod {
  name: string;
  signature: string;
  description: string;
  parameters?: Parameter[];
  returns?: {
    type: string;
    description: string;
  };
  example?: string;
  since?: string;
}

interface APIType {
  name: string;
  kind: 'interface' | 'type' | 'enum';
  description: string;
  properties?: Parameter[];
  example?: string;
}

interface APIReferenceProps {
  title: string;
  description: string;
  methods?: APIMethod[];
  types?: APIType[];
  sourceLink?: string;
}

export function APIReference({ title, description, methods, types, sourceLink }: APIReferenceProps) {
  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">{title}</h1>
          {sourceLink && (
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <span>View source</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        <p className="mt-2 text-lg text-surface-600 dark:text-surface-400">{description}</p>
      </div>

      {methods && methods.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white">Functions</h2>
          {methods.map((method) => (
            <MethodCard key={method.name} method={method} />
          ))}
        </div>
      )}

      {types && types.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white">Types</h2>
          {types.map((type) => (
            <TypeCard key={type.name} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}

function MethodCard({ method }: { method: APIMethod }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      id={method.name}
      className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden scroll-mt-20"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-surface-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-surface-400" />
          )}
          <code className="text-lg font-semibold text-primary-600 dark:text-primary-400">
            {method.name}()
          </code>
          {method.since && (
            <span className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
              v{method.since}+
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <p className="text-surface-600 dark:text-surface-400">{method.description}</p>

          <div className="bg-surface-100 dark:bg-surface-800 rounded-lg p-3">
            <code className="text-sm font-mono text-surface-700 dark:text-surface-300">
              {method.signature}
            </code>
          </div>

          {method.parameters && method.parameters.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-2">Parameters</h4>
              <div className="space-y-2">
                {method.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="flex flex-wrap items-start gap-2 text-sm"
                  >
                    <code className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 rounded font-mono text-accent-600 dark:text-accent-400">
                      {param.name}
                      {param.optional && '?'}
                    </code>
                    <code className="text-surface-500">{param.type}</code>
                    {param.default && (
                      <span className="text-surface-400">= {param.default}</span>
                    )}
                    <span className="text-surface-600 dark:text-surface-400 flex-1">
                      {param.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {method.returns && (
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-2">Returns</h4>
              <div className="flex items-start gap-2 text-sm">
                <code className="text-surface-500">{method.returns.type}</code>
                <span className="text-surface-600 dark:text-surface-400">
                  {method.returns.description}
                </span>
              </div>
            </div>
          )}

          {method.example && (
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-2">Example</h4>
              <CodeBlock code={method.example} language="typescript" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypeCard({ type }: { type: APIType }) {
  const [expanded, setExpanded] = useState(true);

  const kindColors = {
    interface: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    type: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    enum: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  };

  return (
    <div
      id={type.name}
      className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden scroll-mt-20"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-surface-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-surface-400" />
          )}
          <code className="text-lg font-semibold text-primary-600 dark:text-primary-400">
            {type.name}
          </code>
          <span className={clsx('px-2 py-0.5 text-xs rounded capitalize', kindColors[type.kind])}>
            {type.kind}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <p className="text-surface-600 dark:text-surface-400">{type.description}</p>

          {type.properties && type.properties.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-2">Properties</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left py-2 font-medium text-surface-900 dark:text-white">Property</th>
                      <th className="text-left py-2 font-medium text-surface-900 dark:text-white">Type</th>
                      <th className="text-left py-2 font-medium text-surface-900 dark:text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {type.properties.map((prop) => (
                      <tr key={prop.name} className="border-b border-surface-100 dark:border-surface-800">
                        <td className="py-2">
                          <code className="text-accent-600 dark:text-accent-400">
                            {prop.name}
                            {prop.optional && '?'}
                          </code>
                        </td>
                        <td className="py-2">
                          <code className="text-surface-500">{prop.type}</code>
                        </td>
                        <td className="py-2 text-surface-600 dark:text-surface-400">
                          {prop.description}
                          {prop.default && (
                            <span className="ml-1 text-surface-400">
                              (default: {prop.default})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {type.example && (
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-2">Example</h4>
              <CodeBlock code={type.example} language="typescript" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Callout component for documentation
interface CalloutProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type, title, children }: CalloutProps) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200',
  };

  const icons = {
    info: 'i',
    warning: '!',
    error: 'x',
    success: '✓',
  };

  return (
    <div className={clsx('p-4 rounded-lg border-l-4 my-4', styles[type])}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-current/10 flex items-center justify-center font-bold text-sm">
          {icons[type]}
        </span>
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="prose-sm dark:prose-invert">{children}</div>
        </div>
      </div>
    </div>
  );
}
