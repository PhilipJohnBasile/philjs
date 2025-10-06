import { signal } from 'philjs-core';

interface LivePreviewProps {
  html?: string;
  css?: string;
  js?: string;
  height?: string;
  title?: string;
}

export function LivePreview({
  html = '',
  css = '',
  js = '',
  height = '400px',
  title = 'Live Preview',
}: LivePreviewProps) {
  const isRefreshing = signal(false);
  const iframeKey = signal(0);

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 1rem;
      background: #fff;
      color: #0f0f0f;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script type="module">
    ${js}
  </script>
</body>
</html>`;
  };

  const refresh = () => {
    isRefreshing.set(true);
    iframeKey.set(iframeKey() + 1);
    setTimeout(() => isRefreshing.set(false), 300);
  };

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        margin: '2rem 0',
        background: 'var(--color-bg-alt)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ff5f57',
            }}
          />
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ffbd2e',
            }}
          />
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#28c840',
            }}
          />
          <span
            style={{
              marginLeft: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        </div>

        <button
          onClick={refresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text-secondary)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          aria-label="Refresh preview"
          title="Refresh preview"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{
              transform: isRefreshing() ? 'rotate(360deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            <path
              d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Preview iframe */}
      <iframe
        key={iframeKey()}
        srcDoc={generateHTML()}
        style={{
          width: '100%',
          height,
          border: 'none',
          display: 'block',
          background: 'white',
        }}
        sandbox="allow-scripts allow-modals"
        title={title}
      />
    </div>
  );
}
