/**
 * PhilJS UI - Divider Styles
 */

export const dividerStyles = `
  .philjs-divider {
    --divider-color: var(--philjs-divider-color, #e5e7eb);
    --divider-size: var(--philjs-divider-size, 1px);

    flex-shrink: 0;
    background-color: var(--divider-color);
  }

  .philjs-divider--horizontal {
    width: 100%;
    height: var(--divider-size);
  }

  .philjs-divider--vertical {
    height: 100%;
    width: var(--divider-size);
  }

  .philjs-divider--dashed {
    background: none;
    background-image: linear-gradient(
      to right,
      var(--divider-color) 50%,
      transparent 50%
    );
    background-size: 8px 1px;
  }

  .philjs-divider--dotted {
    background: none;
    background-image: radial-gradient(
      circle,
      var(--divider-color) 1px,
      transparent 1px
    );
    background-size: 4px 1px;
  }

  .philjs-divider-with-label {
    display: flex;
    align-items: center;
  }

  .philjs-divider-with-label__line {
    flex: 1;
    height: var(--divider-size);
    background-color: var(--divider-color);
  }

  .philjs-divider-with-label__text {
    padding: 0 0.75rem;
    font-size: 0.875rem;
    color: var(--philjs-text-muted, #6b7280);
    white-space: nowrap;
  }

  @media (prefers-color-scheme: dark) {
    .philjs-divider {
      --divider-color: var(--philjs-divider-color-dark, #374151);
    }
  }
`;

export default dividerStyles;
