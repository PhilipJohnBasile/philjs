interface StackBlitzButtonProps {
  projectId?: string;
  files?: Record<string, string>;
  template?: 'node' | 'javascript' | 'typescript' | 'angular' | 'react' | 'vue';
  title?: string;
  description?: string;
}

export function StackBlitzButton({
  projectId,
  files,
  template = 'typescript',
  title = 'PhilJS Example',
  description = 'Open this example in StackBlitz',
}: StackBlitzButtonProps) {
  const openInStackBlitz = () => {
    if (projectId) {
      // Open existing StackBlitz project
      window.open(`https://stackblitz.com/edit/${projectId}`, '_blank', 'noopener,noreferrer');
    } else if (files) {
      // Create new StackBlitz project with files
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://stackblitz.com/run';
      form.target = '_blank';

      // Add project files
      Object.entries(files).forEach(([path, content]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = `project[files][${path}]`;
        input.value = content;
        form.appendChild(input);
      });

      // Add project metadata
      const titleInput = document.createElement('input');
      titleInput.type = 'hidden';
      titleInput.name = 'project[title]';
      titleInput.value = title;
      form.appendChild(titleInput);

      const descInput = document.createElement('input');
      descInput.type = 'hidden';
      descInput.name = 'project[description]';
      descInput.value = description;
      form.appendChild(descInput);

      const templateInput = document.createElement('input');
      templateInput.type = 'hidden';
      templateInput.name = 'project[template]';
      templateInput.value = template;
      form.appendChild(templateInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    }
  };

  return (
    <button
      onClick={openInStackBlitz}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1rem',
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        color: 'var(--color-text)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      onMouseOver={(e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        if (target) {
          target.style.background = 'var(--color-brand)';
          target.style.color = 'white';
          target.style.borderColor = 'var(--color-brand)';
        }
      }}
      onMouseOut={(e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        if (target) {
          target.style.background = 'var(--color-bg-alt)';
          target.style.color = 'var(--color-text)';
          target.style.borderColor = 'var(--color-border)';
        }
      }}
      aria-label="Open in StackBlitz"
    >
      {/* StackBlitz Icon */}
      <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
        <path
          d="M12.747 16.273h-7.46L18.925 1.5l-3.671 10.227h7.46L9.076 26.5l3.671-10.227z"
          fill="currentColor"
        />
      </svg>
      Open in StackBlitz
    </button>
  );
}

// Companion component for CodeSandbox
export function CodeSandboxButton({
  sandboxId,
  title = 'PhilJS Example',
}: {
  sandboxId?: string;
  title?: string;
}) {
  const openInCodeSandbox = () => {
    if (sandboxId) {
      window.open(`https://codesandbox.io/s/${sandboxId}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={openInCodeSandbox}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1rem',
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        color: 'var(--color-text)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      onMouseOver={(e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        if (target) {
          target.style.background = '#151515';
          target.style.color = 'white';
          target.style.borderColor = '#151515';
        }
      }}
      onMouseOut={(e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        if (target) {
          target.style.background = 'var(--color-bg-alt)';
          target.style.color = 'var(--color-text)';
          target.style.borderColor = 'var(--color-border)';
        }
      }}
      aria-label="Open in CodeSandbox"
    >
      {/* CodeSandbox Icon */}
      <svg width="16" height="16" viewBox="0 0 256 296" fill="none">
        <path
          d="M115.498 261.088v-106.61L23.814 101.73v60.773l41.996 24.347v45.7l49.688 28.54zm23.814.627l50.605-29.151V185.78l42.269-24.495v-60.011l-92.874 53.621v106.82zm80.66-180.887l-48.817-28.289-42.863 24.872-43.188-24.897-49.252 28.667 91.914 52.882 92.206-53.235zM0 222.212V74.495L127.987 0 256 74.182v147.797l-128.016 73.744L0 222.212z"
          fill="currentColor"
        />
      </svg>
      Open in CodeSandbox
    </button>
  );
}
