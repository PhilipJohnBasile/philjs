import React, { useState, useMemo, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { useEditorStore } from '../state/EditorStore';
import type { ComponentNode, ComponentStyle, SpacingValue } from '../state/EditorStore';

// ============================================================================
// Types
// ============================================================================

export interface CodePreviewProps {
  className?: string;
  style?: React.CSSProperties;
  language?: 'jsx' | 'tsx';
  showLineNumbers?: boolean;
}

type CodeFormat = 'jsx' | 'json';

// ============================================================================
// Code Generation Utilities
// ============================================================================

const formatStyleValue = (value: unknown): string => {
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    // Check if it's a pure number string
    if (/^\d+$/.test(value)) {
      return value;
    }
    return `"${value}"`;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}: ${formatStyleValue(v)}`)
      .join(', ');
    return `{ ${entries} }`;
  }
  return String(value);
};

const formatSpacingValue = (value: SpacingValue | number | string | undefined): string => {
  if (value === undefined) return '';
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'string') return value;

  const { top, right, bottom, left } = value;
  if (top === right && right === bottom && bottom === left) {
    return `${top}px`;
  }
  if (top === bottom && left === right) {
    return `${top}px ${right}px`;
  }
  return `${top}px ${right}px ${bottom}px ${left}px`;
};

const styleToCssString = (styles: ComponentStyle): string => {
  const cssProps: string[] = [];

  if (styles.display) cssProps.push(`display: ${styles.display}`);
  if (styles.flexDirection) cssProps.push(`flexDirection: "${styles.flexDirection}"`);
  if (styles.justifyContent) cssProps.push(`justifyContent: "${styles.justifyContent}"`);
  if (styles.alignItems) cssProps.push(`alignItems: "${styles.alignItems}"`);
  if (styles.gap) cssProps.push(`gap: ${formatStyleValue(styles.gap)}`);

  if (styles.width) cssProps.push(`width: ${formatStyleValue(styles.width)}`);
  if (styles.height) cssProps.push(`height: ${formatStyleValue(styles.height)}`);
  if (styles.minWidth) cssProps.push(`minWidth: ${formatStyleValue(styles.minWidth)}`);
  if (styles.maxWidth) cssProps.push(`maxWidth: ${formatStyleValue(styles.maxWidth)}`);
  if (styles.minHeight) cssProps.push(`minHeight: ${formatStyleValue(styles.minHeight)}`);
  if (styles.maxHeight) cssProps.push(`maxHeight: ${formatStyleValue(styles.maxHeight)}`);

  const padding = formatSpacingValue(styles.padding);
  if (padding) cssProps.push(`padding: "${padding}"`);

  const margin = formatSpacingValue(styles.margin);
  if (margin) cssProps.push(`margin: "${margin}"`);

  if (styles.backgroundColor) cssProps.push(`backgroundColor: "${styles.backgroundColor}"`);
  if (styles.color) cssProps.push(`color: "${styles.color}"`);
  if (styles.borderColor) cssProps.push(`borderColor: "${styles.borderColor}"`);

  if (styles.borderWidth) cssProps.push(`borderWidth: ${formatStyleValue(styles.borderWidth)}`);
  if (styles.borderRadius) cssProps.push(`borderRadius: ${formatStyleValue(styles.borderRadius)}`);
  if (styles.borderStyle) cssProps.push(`borderStyle: "${styles.borderStyle}"`);

  if (styles.opacity !== undefined) cssProps.push(`opacity: ${styles.opacity}`);
  if (styles.boxShadow) cssProps.push(`boxShadow: "${styles.boxShadow}"`);

  return cssProps.join(', ');
};

const formatProps = (props: Record<string, unknown>, indent: string): string => {
  const propStrings: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'children') continue; // Handle separately

    if (typeof value === 'string') {
      propStrings.push(`${indent}${key}="${value}"`);
    } else if (typeof value === 'boolean') {
      if (value) {
        propStrings.push(`${indent}${key}`);
      }
    } else if (typeof value === 'number') {
      propStrings.push(`${indent}${key}={${value}}`);
    } else {
      propStrings.push(`${indent}${key}={${JSON.stringify(value)}}`);
    }
  }

  return propStrings.join('\n');
};

const generateComponentCode = (
  component: ComponentNode,
  components: Record<string, ComponentNode>,
  indent: string = ''
): string => {
  const { type, props, styles, children: childIds, events } = component;

  const lines: string[] = [];
  const childIndent = indent + '  ';

  // Start tag
  let openTag = `${indent}<${type}`;

  // Add props
  const propsString = formatProps(props, '\n' + childIndent);
  if (propsString) {
    openTag += '\n' + propsString;
  }

  // Add styles
  const styleString = styleToCssString(styles.base || {});
  if (styleString) {
    if (propsString) {
      openTag += '\n' + childIndent + `style={{ ${styleString} }}`;
    } else {
      openTag += `\n${childIndent}style={{ ${styleString} }}`;
    }
  }

  // Add event handlers
  for (const event of events) {
    const handlerName = event.event;
    if (event.action === 'navigate' && event.config.url) {
      openTag += `\n${childIndent}${handlerName}={() => navigate("${event.config.url}")}`;
    } else if (event.action === 'custom' && event.config.code) {
      openTag += `\n${childIndent}${handlerName}={() => { ${event.config.code} }}`;
    } else {
      openTag += `\n${childIndent}${handlerName}={() => {}}`;
    }
  }

  // Get children (text content or nested components)
  const textContent = props.children as string | undefined;
  const hasNestedChildren = childIds.length > 0;

  if (!textContent && !hasNestedChildren) {
    // Self-closing tag
    if (propsString || styleString || events.length > 0) {
      lines.push(openTag + '\n' + indent + '/>');
    } else {
      lines.push(`${indent}<${type} />`);
    }
  } else {
    // Opening tag
    if (propsString || styleString || events.length > 0) {
      lines.push(openTag + '\n' + indent + '>');
    } else {
      lines.push(`${indent}<${type}>`);
    }

    // Children content
    if (textContent) {
      lines.push(`${childIndent}${textContent}`);
    }

    // Nested children
    for (const childId of childIds) {
      const child = components[childId];
      if (child) {
        lines.push(generateComponentCode(child, components, childIndent));
      }
    }

    // Closing tag
    lines.push(`${indent}</${type}>`);
  }

  return lines.join('\n');
};

const generateFullCode = (
  rootIds: string[],
  components: Record<string, ComponentNode>,
  isTypeScript: boolean
): string => {
  const lines: string[] = [];

  // Imports
  lines.push("import React from 'react';");

  // Collect unique component types
  const usedTypes = new Set<string>();
  for (const comp of Object.values(components)) {
    usedTypes.add(comp.type);
  }

  // Add philjs-ui import if needed
  const uiComponents = ['Button', 'Input', 'Card', 'Container', 'Text', 'Image', 'Badge', 'Alert'];
  const usedUiComponents = [...usedTypes].filter((t) => uiComponents.includes(t));
  if (usedUiComponents.length > 0) {
    lines.push(`import { ${usedUiComponents.join(', ')} } from 'philjs-ui';`);
  }

  lines.push('');

  // Component definition
  const componentName = 'GeneratedComponent';
  if (isTypeScript) {
    lines.push(`export const ${componentName}: React.FC = () => {`);
  } else {
    lines.push(`export const ${componentName} = () => {`);
  }

  lines.push('  return (');
  lines.push('    <>');

  // Generate code for each root component
  for (const rootId of rootIds) {
    const component = components[rootId];
    if (component) {
      lines.push(generateComponentCode(component, components, '      '));
    }
  }

  lines.push('    </>');
  lines.push('  );');
  lines.push('};');
  lines.push('');
  lines.push(`export default ${componentName};`);

  return lines.join('\n');
};

// ============================================================================
// Code Preview Component
// ============================================================================

export const CodePreview: React.FC<CodePreviewProps> = ({
  className,
  style,
  language = 'tsx',
  showLineNumbers = true,
}) => {
  const [format, setFormat] = useState<CodeFormat>('jsx');
  const [copied, setCopied] = useState(false);

  const components = useEditorStore((state) => state.components);
  const rootIds = useEditorStore((state) => state.rootIds);

  const generatedCode = useMemo(() => {
    if (format === 'json') {
      const schema = {
        version: '1.0',
        components: Object.values(components).map((comp) => ({
          id: comp.id,
          type: comp.type,
          name: comp.name,
          props: comp.props,
          styles: comp.styles,
          events: comp.events,
          children: comp.children,
          parentId: comp.parentId,
          bounds: comp.bounds,
        })),
        rootIds,
      };
      return JSON.stringify(schema, null, 2);
    }

    return generateFullCode(rootIds, components, language === 'tsx');
  }, [components, rootIds, format, language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [generatedCode]);

  const handleDownload = useCallback(() => {
    const extension = format === 'json' ? 'json' : language;
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([generatedCode], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, format, language]);

  return (
    <div
      className={`code-preview ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#2D2D2D',
          borderBottom: '1px solid #3C3C3C',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              color: '#E5E5E5',
            }}
          >
            Code Preview
          </h4>

          {/* Format toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1E1E1E',
              borderRadius: 4,
              padding: 2,
            }}
          >
            <button
              onClick={() => setFormat('jsx')}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: format === 'jsx' ? '#3C3C3C' : 'transparent',
                color: format === 'jsx' ? '#E5E5E5' : '#808080',
                fontSize: 11,
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              JSX
            </button>
            <button
              onClick={() => setFormat('json')}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: format === 'json' ? '#3C3C3C' : 'transparent',
                color: format === 'json' ? '#E5E5E5' : '#808080',
                fontSize: 11,
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              JSON
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              border: 'none',
              backgroundColor: copied ? '#22C55E' : '#3C3C3C',
              color: '#E5E5E5',
              fontSize: 12,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="2,7 5,10 12,3" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="4" width="8" height="8" rx="1" />
                  <path d="M2 10V2h8" />
                </svg>
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              border: 'none',
              backgroundColor: '#3C3C3C',
              color: '#E5E5E5',
              fontSize: 12,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 2v8M3 7l4 4 4-4" />
              <path d="M2 12h10" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Code content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
        }}
      >
        {rootIds.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#808080',
              fontSize: 13,
            }}
          >
            Add components to see generated code
          </div>
        ) : (
          <Highlight
            theme={themes.vsDark}
            code={generatedCode}
            language={format === 'json' ? 'json' : 'tsx'}
          >
            {({ className: highlightClassName, style: highlightStyle, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={highlightClassName}
                style={{
                  ...highlightStyle,
                  margin: 0,
                  padding: 0,
                  backgroundColor: 'transparent',
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
                }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })} style={{ display: 'flex' }}>
                    {showLineNumbers && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 40,
                          textAlign: 'right',
                          paddingRight: 16,
                          color: '#606060',
                          userSelect: 'none',
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                    <span>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  );
};

export default CodePreview;
