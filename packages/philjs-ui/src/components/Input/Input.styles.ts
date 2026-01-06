/**
 * PhilJS UI - Input Styles
 */

export const inputStyles = `
  .philjs-input {
    --input-height: var(--philjs-input-height, 2.5rem);
    --input-padding-x: var(--philjs-input-padding-x, 1rem);
    --input-font-size: var(--philjs-input-font-size, 1rem);
    --input-border-color: var(--philjs-input-border-color, #d1d5db);
    --input-border-radius: var(--philjs-input-border-radius, 0.375rem);
    --input-bg: var(--philjs-input-bg, #ffffff);
    --input-focus-ring: var(--philjs-input-focus-ring, #3b82f6);
    --input-error-color: var(--philjs-input-error-color, #ef4444);

    display: block;
    width: 100%;
    height: var(--input-height);
    padding: 0 var(--input-padding-x);
    font-size: var(--input-font-size);
    line-height: 1.5;
    color: var(--philjs-text-color, #1f2937);
    background-color: var(--input-bg);
    border: 1px solid var(--input-border-color);
    border-radius: var(--input-border-radius);
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .philjs-input:focus {
    outline: none;
    border-color: var(--input-focus-ring);
    box-shadow: 0 0 0 1px var(--input-focus-ring);
  }

  .philjs-input:disabled {
    background-color: var(--philjs-disabled-bg, #f3f4f6);
    color: var(--philjs-disabled-text, #9ca3af);
    cursor: not-allowed;
  }

  .philjs-input::placeholder {
    color: var(--philjs-placeholder-color, #9ca3af);
  }

  .philjs-input--error {
    --input-border-color: var(--input-error-color);
    --input-focus-ring: var(--input-error-color);
  }

  .philjs-input--sm {
    --input-height: 2rem;
    --input-padding-x: 0.75rem;
    --input-font-size: 0.875rem;
  }

  .philjs-input--lg {
    --input-height: 3rem;
    --input-padding-x: 1.25rem;
    --input-font-size: 1.125rem;
  }

  @media (prefers-color-scheme: dark) {
    .philjs-input {
      --input-border-color: var(--philjs-input-border-color-dark, #4b5563);
      --input-bg: var(--philjs-input-bg-dark, #1f2937);
    }
  }
`;

export default inputStyles;
