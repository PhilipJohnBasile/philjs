interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: any;
  onClick?: () => void;
  href?: string;
  class?: string;
}

export function Button(props: ButtonProps) {
  const variant = props.variant || 'primary';
  const size = props.size || 'md';
  
  const baseStyles = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    border-radius: 8px;
    transition: all var(--transition-fast);
    border: none;
    text-decoration: none;
    cursor: pointer;
  `;
  
  const variantStyles = {
    primary: `
      background-color: var(--color-brand);
      color: white;
      &:hover { background-color: var(--color-brand-dark); }
    `,
    secondary: `
      background-color: var(--color-bg-alt);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      &:hover { background-color: var(--color-bg-code); }
    `,
    ghost: `
      background-color: transparent;
      color: var(--color-brand);
      &:hover { background-color: var(--color-bg-alt); }
    `,
  };
  
  const sizeStyles = {
    sm: 'padding: 0.5rem 1rem; font-size: 0.875rem;',
    md: 'padding: 0.75rem 1.5rem; font-size: 1rem;',
    lg: 'padding: 1rem 2rem; font-size: 1.125rem;',
  };
  
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
  
  if (props.href) {
    return (
      <a href={props.href} style={combinedStyles} class={props.class}>
        {props.children}
      </a>
    );
  }
  
  return (
    <button onClick={props.onClick} style={combinedStyles} class={props.class}>
      {props.children}
    </button>
  );
}
