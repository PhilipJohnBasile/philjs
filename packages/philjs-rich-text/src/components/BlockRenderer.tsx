/**
 * @philjs/rich-text - Block Renderer
 * Renders individual blocks based on their type
 */

import type { Block, EditorInstance, TextNode } from '../types';

export interface BlockRendererProps {
  block: Block;
  editor: EditorInstance | null;
  readOnly: boolean;
}

export function BlockRenderer({ block, editor, readOnly }: BlockRendererProps) {
  const renderContent = (content: TextNode[] | Block[]) => {
    if (!content || content.length === 0) return null;

    return content.map((node, index) => {
      if ('text' in node) {
        // Text node
        let element: React.ReactNode = node.text;

        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                element = <strong key={index}>{element}</strong>;
                break;
              case 'italic':
                element = <em key={index}>{element}</em>;
                break;
              case 'underline':
                element = <u key={index}>{element}</u>;
                break;
              case 'strike':
                element = <s key={index}>{element}</s>;
                break;
              case 'code':
                element = <code key={index}>{element}</code>;
                break;
              case 'link':
                element = (
                  <a
                    key={index}
                    href={mark.attrs?.href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {element}
                  </a>
                );
                break;
              case 'highlight':
                element = (
                  <mark
                    key={index}
                    style={{ backgroundColor: mark.attrs?.color as string || '#fef08a' }}
                  >
                    {element}
                  </mark>
                );
                break;
              case 'textColor':
                element = (
                  <span key={index} style={{ color: mark.attrs?.color as string }}>
                    {element}
                  </span>
                );
                break;
            }
          }
        }

        return <span key={index}>{element}</span>;
      } else {
        // Nested block
        return <BlockRenderer key={node.id} block={node} editor={editor} readOnly={readOnly} />;
      }
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) return;
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const baseProps = {
    'data-block-id': block.id,
    'data-block-type': block.type,
    draggable: !readOnly,
    onDragStart: handleDragStart,
    className: `philjs-block philjs-block-${block.type}`,
  };

  switch (block.type) {
    case 'paragraph':
      return (
        <p {...baseProps}>
          {renderContent(block.content as TextNode[])}
        </p>
      );

    case 'heading1':
      return (
        <h1 {...baseProps}>
          {renderContent(block.content as TextNode[])}
        </h1>
      );

    case 'heading2':
      return (
        <h2 {...baseProps}>
          {renderContent(block.content as TextNode[])}
        </h2>
      );

    case 'heading3':
      return (
        <h3 {...baseProps}>
          {renderContent(block.content as TextNode[])}
        </h3>
      );

    case 'bulletList':
      return (
        <ul {...baseProps}>
          {(block.children || []).map((child) => (
            <li key={child.id}>
              <BlockRenderer block={child} editor={editor} readOnly={readOnly} />
            </li>
          ))}
        </ul>
      );

    case 'numberedList':
      return (
        <ol {...baseProps}>
          {(block.children || []).map((child) => (
            <li key={child.id}>
              <BlockRenderer block={child} editor={editor} readOnly={readOnly} />
            </li>
          ))}
        </ol>
      );

    case 'todoList':
      return (
        <div {...baseProps}>
          {(block.children || []).map((child) => (
            <div key={child.id} className="philjs-todo-item">
              <input
                type="checkbox"
                checked={child.attrs?.checked as boolean || false}
                onChange={() => {
                  if (editor && !readOnly) {
                    // Toggle todo checked state
                  }
                }}
                disabled={readOnly}
              />
              <BlockRenderer block={child} editor={editor} readOnly={readOnly} />
            </div>
          ))}
        </div>
      );

    case 'quote':
      return (
        <blockquote {...baseProps}>
          {renderContent(block.content as TextNode[])}
        </blockquote>
      );

    case 'code':
      return (
        <pre {...baseProps} data-language={block.attrs?.language || 'plaintext'}>
          <code>
            {renderContent(block.content as TextNode[])}
          </code>
        </pre>
      );

    case 'divider':
      return <hr {...baseProps} />;

    case 'image':
      return (
        <figure {...baseProps}>
          <img
            src={block.attrs?.src as string}
            alt={block.attrs?.alt as string || ''}
            style={{
              maxWidth: '100%',
              width: block.attrs?.width as string,
            }}
          />
          {block.attrs?.caption && (
            <figcaption>{block.attrs.caption as string}</figcaption>
          )}
        </figure>
      );

    case 'video':
      return (
        <figure {...baseProps}>
          <video
            src={block.attrs?.src as string}
            controls
            style={{ maxWidth: '100%' }}
          />
          {block.attrs?.caption && (
            <figcaption>{block.attrs.caption as string}</figcaption>
          )}
        </figure>
      );

    case 'embed':
      return (
        <div {...baseProps} className="philjs-embed">
          <iframe
            src={block.attrs?.src as string}
            title={block.attrs?.title as string || 'Embedded content'}
            style={{ width: '100%', border: 'none' }}
          />
        </div>
      );

    case 'callout':
      return (
        <div
          {...baseProps}
          style={{
            backgroundColor: block.attrs?.backgroundColor as string || '#f3f4f6',
            padding: '1rem',
            borderRadius: '0.375rem',
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          {block.attrs?.icon && (
            <span className="philjs-callout-icon">{block.attrs.icon as string}</span>
          )}
          <div>{renderContent(block.content as TextNode[])}</div>
        </div>
      );

    case 'toggle':
      return (
        <details {...baseProps}>
          <summary>{renderContent(block.content as TextNode[])}</summary>
          {block.children?.map((child) => (
            <BlockRenderer key={child.id} block={child} editor={editor} readOnly={readOnly} />
          ))}
        </details>
      );

    case 'columns':
      return (
        <div
          {...baseProps}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${block.attrs?.columns || 2}, 1fr)`,
            gap: '1rem',
          }}
        >
          {block.children?.map((child) => (
            <div key={child.id} className="philjs-column">
              <BlockRenderer block={child} editor={editor} readOnly={readOnly} />
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <table {...baseProps}>
          <tbody>
            {(block.children || []).map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {(row.children || []).map((cell, cellIndex) => (
                  <td key={cell.id || cellIndex}>
                    {renderContent(cell.content as TextNode[])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return (
        <div {...baseProps}>
          {renderContent(block.content as TextNode[])}
        </div>
      );
  }
}

export default BlockRenderer;
