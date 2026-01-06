/**
 * PhilJS UI - Textarea Styles
 */

export const textareaStyles = `
  .philjs-textarea {
    --textarea-min-height: var(--philjs-textarea-min-height, 6rem);
    --textarea-padding: var(--philjs-textarea-padding, 0.75rem 1rem);
    --textarea-font-size: var(--philjs-textarea-font-size, 1rem);
    --textarea-border-color: var(--philjs-textarea-border-color, #d1d5db);
    --textarea-border-radius: var(--philjs-textarea-border-radius, 0.375rem);
    --textarea-bg: var(--philjs-textarea-bg, #ffffff);
    --textarea-focus-ring: var(--philjs-textarea-focus-ring, #3b82f6);

    display: block;
    width: 100%;
    min-height: var(--textarea-min-height);
    padding: var(--textarea-padding);
    font-size: var(--textarea-font-size);
    line-height: 1.5;
    color: var(--philjs-text-color, #1f2937);
    background-color: var(--textarea-bg);
    border: 1px solid var(--textarea-border-color);
    border-radius: var(--textarea-border-radius);
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    resize: vertical;
  }

  .philjs-textarea:focus {
    outline: none;
    border-color: var(--textarea-focus-ring);
    box-shadow: 0 0 0 1px var(--textarea-focus-ring);
  }

  .philjs-textarea:disabled {
    background-color: var(--philjs-disabled-bg, #f3f4f6);
    color: var(--philjs-disabled-text, #9ca3af);
    cursor: not-allowed;
    resize: none;
  }

  .philjs-textarea--no-resize {
    resize: none;
  }

  .philjs-textarea--auto-resize {
    overflow: hidden;
  }
`;

export default textareaStyles;
