
export interface ClerkAppearance {
  baseTheme?: any;
  layout?: {
    socialButtonsPlacement?: 'top' | 'bottom';
    logoPlacement?: 'inside' | 'none';
  };
  variables?: {
    colorPrimary?: string;
    borderRadius?: string;
    fontFamily?: string;
  };
}

export function SignIn(props: {
  appearance?: ClerkAppearance,
  redirectUrl?: string
}) {
  const styles = props.appearance?.variables || {};

  // Simulate Clerk Elements behavior
  const styleStr = Object.entries(styles)
    .map(([k, v]) => `--cl-internal-${k}: ${v}`)
    .join('; ');

  return `<div class="cl-root-box" style="${styleStr}">
    <div class="cl-signin-container">
      <h3>Sign In</h3>
      <div class="cl-social-buttons" data-placement="${props.appearance?.layout?.socialButtonsPlacement || 'top'}">
        <button>Google</button>
        <button>GitHub</button>
      </div>
      <form onsubmit="event.preventDefault(); console.log('Clerk: Submit')">
        <input type="email" placeholder="Email address" />
        <button type="submit" style="background: ${styles.colorPrimary || '#000'}">Continue</button>
      </form>
    </div>
  </div>`;
}
