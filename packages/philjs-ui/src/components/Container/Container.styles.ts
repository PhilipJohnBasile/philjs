/**
 * PhilJS UI - Container Styles
 *
 * CSS custom properties for theming the Container component.
 */

export const containerStyles = `
  .philjs-container {
    --container-padding-x: var(--philjs-container-padding-x, 1rem);
    --container-padding-y: var(--philjs-container-padding-y, 0);
    --container-max-width: var(--philjs-container-max-width, 1280px);

    margin-left: auto;
    margin-right: auto;
    width: 100%;
    padding-left: var(--container-padding-x);
    padding-right: var(--container-padding-x);
    padding-top: var(--container-padding-y);
    padding-bottom: var(--container-padding-y);
    max-width: var(--container-max-width);
  }

  .philjs-container--sm { --container-max-width: 640px; }
  .philjs-container--md { --container-max-width: 768px; }
  .philjs-container--lg { --container-max-width: 1024px; }
  .philjs-container--xl { --container-max-width: 1280px; }
  .philjs-container--2xl { --container-max-width: 1536px; }
  .philjs-container--full { --container-max-width: 100%; }
  .philjs-container--prose { --container-max-width: 65ch; }

  .philjs-container--center {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  @media (min-width: 640px) {
    .philjs-container {
      --container-padding-x: var(--philjs-container-padding-x-sm, 1.5rem);
    }
  }

  @media (min-width: 1024px) {
    .philjs-container {
      --container-padding-x: var(--philjs-container-padding-x-lg, 2rem);
    }
  }
`;

export default containerStyles;
