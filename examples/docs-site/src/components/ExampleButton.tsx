import { memo } from 'philjs-core';

interface ExampleButtonProps {
  label: string;
  isActive: () => boolean;
  onClick: () => void;
}

export function ExampleButton(props: ExampleButtonProps) {
  // Create reactive styles using memos
  const backgroundColor = memo(() =>
    props.isActive() ? 'var(--color-brand)' : 'var(--color-bg-alt)'
  );

  const textColor = memo(() =>
    props.isActive() ? 'white' : 'var(--color-text)'
  );

  const borderColor = memo(() =>
    props.isActive() ? 'var(--color-brand)' : 'var(--color-border)'
  );

  // Create reactive style object
  const buttonStyle = memo(() => ({
    background: backgroundColor(),
    color: textColor(),
    borderColor: borderColor(),
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    borderWidth: '1px',
    borderStyle: 'solid',
  }));

  return (
    <button
      onClick={props.onClick}
      style={buttonStyle}
    >
      {props.label}
    </button>
  );
}
