import { marked } from 'marked';
import hljs from 'highlight.js';

// Store playground code for later component mounting
// @ts-ignore - Using globalThis to persist across HMR reloads
if (!(globalThis as any).__philjs_playgroundCode) {
  (globalThis as any).__philjs_playgroundCode = new Map();
  (globalThis as any).__philjs_playgroundCounter = 0;
}
export const playgroundCode: Map<string, { code: string; lang: string }> = (globalThis as any).__philjs_playgroundCode;
let playgroundCounter = (globalThis as any).__philjs_playgroundCounter;

// Custom renderer for marked
const renderer = new marked.Renderer();

// Add IDs to headings for TOC
renderer.heading = function({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  const rawText = tokens.map((t: any) => t.raw || t.text || '').join('');
  const id = rawText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

// Enhance code blocks with copy button and language label
renderer.code = function({ text, lang }) {
  const code = text;
  const language = lang || '';

  console.log('[Renderer] Processing code block. Lang:', JSON.stringify(language), 'Code snippet:', code.substring(0, 50));

  // Check if this should be an interactive playground
  const isLive = language.endsWith(' live') || language.includes('playground');

  if (isLive) {
    console.log('[Renderer] 🎮 DETECTED LIVE CODE BLOCK!');
    // Extract the actual language (remove "live" or "playground")
    const actualLang = language.replace(/ live$/, '').replace(/playground/, '').trim() || 'javascript';
    const playgroundId = `playground-${playgroundCounter++}`;
    (globalThis as any).__philjs_playgroundCounter = playgroundCounter; // Persist counter

    // Store the code for later component mounting
    playgroundCode.set(playgroundId, { code, lang: actualLang });
    console.log('[Renderer] Created playground:', playgroundId, 'Map size:', playgroundCode.size);

    // Return a placeholder div
    return `<div id="${playgroundId}" class="code-playground-placeholder"></div>`;
  }

  // Regular code block
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
renderer.blockquote = function(quote: any) {
  const { tokens } = quote;
  const content = this.parser.parse(tokens);
  // Check for callout patterns
  const tipPattern = /^<p>💡\s*<strong>Tip:?<\/strong>/i;
  const warningPattern = /^<p>⚠️\s*<strong>Warning:?<\/strong>/i;
  const notePattern = /^<p>ℹ️\s*<strong>Note:?<\/strong>/i;
  const importantPattern = /^<p>❗\s*<strong>Important:?<\/strong>/i;

  let type = '';
  let icon = '';
  let color = '';

  if (tipPattern.test(content)) {
    type = 'tip';
    icon = '💡';
    color = '#10b981'; // green
  } else if (warningPattern.test(content)) {
    type = 'warning';
    icon = '⚠️';
    color = '#f59e0b'; // amber
  } else if (notePattern.test(content)) {
    type = 'note';
    icon = 'ℹ️';
    color = '#3b82f6'; // blue
  } else if (importantPattern.test(content)) {
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
        ${content}
      </div>
    `;
  }

  return originalBlockquote.call(this, quote);
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
  breaks: true,
  gfm: true,
});

export function renderMarkdown(markdown: string): string {
  return marked(markdown) as string;
}
