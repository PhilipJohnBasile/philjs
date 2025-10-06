import { marked } from 'marked';
import hljs from 'highlight.js';

// Custom renderer for marked
const renderer = new marked.Renderer();

// Add IDs to headings for TOC
renderer.heading = function({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  const rawText = tokens.map(t => t.raw || t.text || '').join('');
  const id = rawText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

// Enhance code blocks with copy button and language label
renderer.code = function({ text, lang }) {
  const code = text;
  const language = lang;
  const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLanguage }).value;

  return `
    <div class="code-block" style="position: relative; margin: 1.5rem 0;">
      <div class="code-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--color-bg-alt);
        border: 1px solid var(--color-border);
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        font-size: 0.75rem;
        color: var(--color-text-secondary);
      ">
        <span style="font-weight: 500; text-transform: uppercase;">${validLanguage}</span>
        <button
          class="copy-button"
          onclick="navigator.clipboard.writeText(this.getAttribute('data-code')); this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 2000);"
          data-code="${code.replace(/"/g, '&quot;')}"
          style="
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: 4px;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            cursor: pointer;
            color: var(--color-text);
            transition: all 0.2s;
          "
          onmouseenter="this.style.background = 'var(--color-brand)'; this.style.color = 'white'; this.style.borderColor = 'var(--color-brand)';"
          onmouseleave="this.style.background = 'var(--color-bg)'; this.style.color = 'var(--color-text)'; this.style.borderColor = 'var(--color-border)';"
        >
          Copy
        </button>
      </div>
      <pre style="
        margin: 0;
        padding: 1rem;
        background: var(--color-bg-alt);
        border: 1px solid var(--color-border);
        border-radius: 0 0 8px 8px;
        overflow-x: auto;
      "><code class="hljs language-${validLanguage}">${highlighted}</code></pre>
    </div>
  `;
};

// Enhance blockquotes for callouts
const originalBlockquote = renderer.blockquote.bind(renderer);
renderer.blockquote = function({ tokens }) {
  const quote = this.parser.parse(tokens);
  // Check for callout patterns
  const tipPattern = /^<p>💡\s*<strong>Tip:?<\/strong>/i;
  const warningPattern = /^<p>⚠️\s*<strong>Warning:?<\/strong>/i;
  const notePattern = /^<p>ℹ️\s*<strong>Note:?<\/strong>/i;
  const importantPattern = /^<p>❗\s*<strong>Important:?<\/strong>/i;

  let type = '';
  let icon = '';
  let color = '';

  if (tipPattern.test(quote)) {
    type = 'tip';
    icon = '💡';
    color = '#10b981'; // green
  } else if (warningPattern.test(quote)) {
    type = 'warning';
    icon = '⚠️';
    color = '#f59e0b'; // amber
  } else if (notePattern.test(quote)) {
    type = 'note';
    icon = 'ℹ️';
    color = '#3b82f6'; // blue
  } else if (importantPattern.test(quote)) {
    type = 'important';
    icon = '❗';
    color = '#ef4444'; // red
  }

  if (type) {
    return `
      <div class="callout callout-${type}" style="
        margin: 1.5rem 0;
        padding: 1rem 1rem 1rem 3rem;
        background: color-mix(in srgb, ${color} 10%, var(--color-bg));
        border-left: 4px solid ${color};
        border-radius: 8px;
        position: relative;
      ">
        <div style="
          position: absolute;
          left: 1rem;
          top: 1rem;
          font-size: 1.25rem;
        ">${icon}</div>
        ${quote}
      </div>
    `;
  }

  return originalBlockquote.call(this, { tokens });
};

// Enhanced link rendering with external link indicator
renderer.link = function({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens);
  const isExternal = href?.startsWith('http');
  const titleAttr = title ? ` title="${title}"` : '';
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const externalIcon = isExternal ? ' <span style="font-size: 0.75em;">↗</span>' : '';

  return `<a href="${href}"${titleAttr}${targetAttr} style="
    color: var(--color-brand);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
  " onmouseenter="this.style.borderColor = 'var(--color-brand)';" onmouseleave="this.style.borderColor = 'transparent';">${text}${externalIcon}</a>`;
};

// Configure marked
marked.setOptions({
  renderer,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

export function renderMarkdown(markdown: string): string {
  return marked(markdown);
}
