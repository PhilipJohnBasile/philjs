interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: any;
}

export function Callout(props: CalloutProps) {
  const type = props.type || 'info';
  
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
  };
  
  const colors = {
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'var(--color-info)',
      text: 'var(--color-info)',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'var(--color-warning)',
      text: 'var(--color-warning)',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'var(--color-success)',
      text: 'var(--color-success)',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'var(--color-error)',
      text: 'var(--color-error)',
    },
  };
  
  const color = colors[type];
  
  return (
    <div style={`
      background: ${color.bg};
      border-left: 4px solid ${color.border};
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin: 1.5rem 0;
    `}>
      {props.title && (
        <div style={`
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: ${color.text};
          margin-bottom: 0.5rem;
        `}>
          <span>{icons[type]}</span>
          <span>{props.title}</span>
        </div>
      )}
      <div style="color: var(--color-text);">
        {props.children}
      </div>
    </div>
  );
}
