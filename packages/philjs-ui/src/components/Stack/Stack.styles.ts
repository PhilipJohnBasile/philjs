/**
 * PhilJS UI - Stack Styles
 */

export const stackStyles = `
  .philjs-stack {
    --stack-spacing: var(--philjs-stack-spacing, 1rem);
    display: flex;
    gap: var(--stack-spacing);
  }

  .philjs-stack--vertical {
    flex-direction: column;
  }

  .philjs-stack--horizontal {
    flex-direction: row;
  }

  .philjs-stack--dividers.philjs-stack--vertical > *:not(:last-child) {
    border-bottom: 1px solid var(--philjs-divider-color, #e5e7eb);
    padding-bottom: var(--stack-spacing);
  }

  .philjs-stack--dividers.philjs-stack--horizontal > *:not(:last-child) {
    border-right: 1px solid var(--philjs-divider-color, #e5e7eb);
    padding-right: var(--stack-spacing);
  }
`;

export default stackStyles;
