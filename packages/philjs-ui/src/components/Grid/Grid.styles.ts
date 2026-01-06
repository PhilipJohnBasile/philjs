/**
 * PhilJS UI - Grid Styles
 */

export const gridStyles = `
  .philjs-grid {
    --grid-cols: var(--philjs-grid-cols, 12);
    --grid-gap: var(--philjs-grid-gap, 1rem);

    display: grid;
    grid-template-columns: repeat(var(--grid-cols), minmax(0, 1fr));
    gap: var(--grid-gap);
  }

  .philjs-grid--auto {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--philjs-grid-min-col-width, 250px)), 1fr));
  }
`;

export default gridStyles;
