/**
 * @philjs/rich-text
 * Rich text block editor for PhilJS
 *
 * Features:
 * - Notion-style block-based editing
 * - Slash commands for quick block insertion
 * - Floating toolbar for text formatting
 * - Multiple block types (headings, lists, code, etc.)
 * - Drag and drop block reordering
 * - Collaborative editing support
 * - Export to JSON, HTML, Markdown
 */

// Types
export type {
  BlockType,
  Block,
  TextMark,
  TextNode,
  EditorState,
  Selection,
  Position,
  EditorConfig,
  Extension,
  KeyBinding,
  NodeViewFactory,
  NodeView,
  SlashCommand,
  CollaborationConfig,
  CollaborationUser,
  Cursor,
  EditorInstance,
  EditorCommands,
  EditorView,
  ToolbarItem,
  ToolbarConfig,
  ExportOptions,
  ImportOptions,
} from './types';

// Components
export {
  Editor,
  createRichTextEditor,
  type EditorOptions,
  BlockRenderer,
  SlashCommandMenu,
  type SlashCommandMenuOptions,
  FloatingToolbar,
  type FloatingToolbarOptions,
} from './components';

// Core
export { createEditor } from './core/editor';

// Extensions
export { defaultSlashCommands } from './extensions/defaultCommands';

// Utility functions
export function createBlock(
  type: import('./types').BlockType,
  content: import('./types').TextNode[] = [],
  attrs?: Record<string, unknown>
): import('./types').Block {
  return {
    id: Math.random().toString(36).substring(2, 11),
    type,
    content,
    attrs,
  };
}

export function createTextNode(
  text: string,
  marks?: import('./types').TextMark[]
): import('./types').TextNode {
  return {
    type: 'text',
    text,
    marks,
  };
}

/**
 * Parse HTML string to blocks
 */
export function parseHTML(html: string): import('./types').Block[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: import('./types').Block[] = [];

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const block = elementToBlock(element);
      if (block) blocks.push(block);
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push(createBlock('paragraph', [createTextNode(node.textContent.trim())]));
    }
  });

  return blocks;
}

function elementToBlock(element: Element): import('./types').Block | null {
  const tag = element.tagName.toLowerCase();
  const text = element.textContent || '';

  switch (tag) {
    case 'h1':
      return createBlock('heading1', [createTextNode(text)]);
    case 'h2':
      return createBlock('heading2', [createTextNode(text)]);
    case 'h3':
      return createBlock('heading3', [createTextNode(text)]);
    case 'p':
      return createBlock('paragraph', [createTextNode(text)]);
    case 'blockquote':
      return createBlock('quote', [createTextNode(text)]);
    case 'pre':
      return createBlock('code', [createTextNode(text)], {
        language: element.getAttribute('data-language') || 'plaintext',
      });
    case 'hr':
      return createBlock('divider');
    case 'img':
      return createBlock('image', [], {
        src: element.getAttribute('src'),
        alt: element.getAttribute('alt'),
      });
    case 'ul':
      return createBlock('bulletList', [], undefined);
    case 'ol':
      return createBlock('numberedList', [], undefined);
    default:
      return createBlock('paragraph', [createTextNode(text)]);
  }
}

/**
 * Serialize blocks to HTML
 */
export function serializeToHTML(blocks: import('./types').Block[]): string {
  return blocks.map((block) => blockToHTML(block)).join('\n');
}

function blockToHTML(block: import('./types').Block): string {
  const content = renderTextContent(block.content as import('./types').TextNode[]);

  switch (block.type) {
    case 'heading1':
      return `<h1>${content}</h1>`;
    case 'heading2':
      return `<h2>${content}</h2>`;
    case 'heading3':
      return `<h3>${content}</h3>`;
    case 'paragraph':
      return `<p>${content}</p>`;
    case 'quote':
      return `<blockquote>${content}</blockquote>`;
    case 'code':
      return `<pre data-language="${block.attrs?.language || 'plaintext'}"><code>${content}</code></pre>`;
    case 'divider':
      return '<hr />';
    case 'image':
      return `<img src="${block.attrs?.src}" alt="${block.attrs?.alt || ''}" />`;
    case 'bulletList':
      return `<ul>${block.children?.map((c) => `<li>${blockToHTML(c)}</li>`).join('') || ''}</ul>`;
    case 'numberedList':
      return `<ol>${block.children?.map((c) => `<li>${blockToHTML(c)}</li>`).join('') || ''}</ol>`;
    default:
      return `<div>${content}</div>`;
  }
}

function renderTextContent(nodes: import('./types').TextNode[]): string {
  if (!nodes) return '';
  return nodes.map((node) => {
    if (!('text' in node)) return '';
    let html = escapeHtml(node.text);

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            html = `<strong>${html}</strong>`;
            break;
          case 'italic':
            html = `<em>${html}</em>`;
            break;
          case 'underline':
            html = `<u>${html}</u>`;
            break;
          case 'strike':
            html = `<s>${html}</s>`;
            break;
          case 'code':
            html = `<code>${html}</code>`;
            break;
          case 'link':
            html = `<a href="${mark.attrs?.href}">${html}</a>`;
            break;
        }
      }
    }

    return html;
  }).join('');
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Serialize blocks to Markdown
 */
export function serializeToMarkdown(blocks: import('./types').Block[]): string {
  return blocks.map((block) => {
    const text = getBlockText(block);

    switch (block.type) {
      case 'heading1':
        return `# ${text}`;
      case 'heading2':
        return `## ${text}`;
      case 'heading3':
        return `### ${text}`;
      case 'bulletList':
        return block.children?.map((c) => `- ${getBlockText(c)}`).join('\n') || '';
      case 'numberedList':
        return block.children?.map((c, i) => `${i + 1}. ${getBlockText(c)}`).join('\n') || '';
      case 'quote':
        return `> ${text}`;
      case 'code':
        return `\`\`\`${block.attrs?.language || ''}\n${text}\n\`\`\``;
      case 'divider':
        return '---';
      case 'image':
        return `![${block.attrs?.alt || ''}](${block.attrs?.src})`;
      default:
        return text;
    }
  }).join('\n\n');
}

function getBlockText(block: import('./types').Block): string {
  if (!block.content) return '';
  if (Array.isArray(block.content)) {
    return block.content
      .filter((node): node is { type: 'text'; text: string } => 'text' in node)
      .map((node) => node.text)
      .join('');
  }
  return '';
}
