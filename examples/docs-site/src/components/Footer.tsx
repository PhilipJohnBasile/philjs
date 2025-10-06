export function Footer({ navigate }: { navigate: (path: string) => void }) {
  const footerLinks = {
    docs: [
      { label: "Getting Started", path: "/docs/getting-started" },
      { label: "Core Concepts", path: "/docs/core-concepts" },
      { label: "API Reference", path: "/docs/api" },
      { label: "Examples", path: "/examples" },
    ],
    community: [
      { label: "GitHub", href: "https://github.com/philjs/philjs" },
      { label: "Discord", href: "https://discord.gg/philjs" },
      { label: "Twitter", href: "https://twitter.com/philjs" },
      { label: "Blog", path: "/blog" },
    ],
    more: [
      { label: "About", path: "/about" },
      { label: "Team", path: "/team" },
      { label: "Releases", path: "/releases" },
      { label: "Ecosystem", path: "/ecosystem" },
    ],
  };

  return (
    <footer style={styles.footer}>
      <div class="container">
        <div style={styles.footerContent}>
          {/* Logo and Description */}
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="var(--color-accent)" />
                <path
                  d="M10 12h7c1.657 0 3 1.343 3 3s-1.343 3-3 3h-3v4"
                  stroke="white"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span style={styles.footerLogoText}>PhilJS</span>
            </div>
            <p style={styles.footerDescription}>
              The framework that thinks ahead. Built for performance,
              designed for developers.
            </p>
            <div style={styles.socialLinks}>
              <a
                href="https://github.com/philjs/philjs"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialLink}
                aria-label="GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/philjs"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialLink}
                aria-label="Twitter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/philjs"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialLink}
                aria-label="Discord"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Documentation Links */}
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Documentation</h4>
            <ul style={styles.footerList}>
              {footerLinks.docs.map((link) => (
                <li>
                  <a
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                    }}
                    style={styles.footerLink}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Community</h4>
            <ul style={styles.footerList}>
              {footerLinks.community.map((link) =>
                link.href ? (
                  <li>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.footerLink}
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li>
                    <a
                      href={link.path}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(link.path!);
                      }}
                      style={styles.footerLink}
                    >
                      {link.label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* More Links */}
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>More</h4>
            <ul style={styles.footerList}>
              {footerLinks.more.map((link) => (
                <li>
                  <a
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                    }}
                    style={styles.footerLink}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={styles.footerBottom}>
          <p style={styles.copyright}>
            © {new Date().getFullYear()} PhilJS. MIT Licensed.
          </p>
          <div style={styles.footerBottomLinks}>
            <a href="/privacy" style={styles.footerLink}>
              Privacy
            </a>
            <a href="/terms" style={styles.footerLink}>
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: "var(--color-bg-secondary)",
    borderTop: "1px solid var(--color-border)",
    padding: "var(--space-16) 0 var(--space-8)",
  },
  footerContent: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: "var(--space-12)",
    marginBottom: "var(--space-12)",
  },
  footerBrand: {
    maxWidth: "300px",
  },
  footerLogo: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    marginBottom: "var(--space-4)",
  },
  footerLogoText: {
    fontSize: "var(--text-xl)",
    fontWeight: 700,
    color: "var(--color-text)",
  },
  footerDescription: {
    color: "var(--color-text-secondary)",
    fontSize: "var(--text-sm)",
    lineHeight: 1.6,
    marginBottom: "var(--space-6)",
  },
  socialLinks: {
    display: "flex",
    gap: "var(--space-3)",
  },
  socialLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-text-secondary)",
    transition: "all var(--transition-fast)",
  },
  footerSection: {
    marginBottom: 0,
  },
  footerTitle: {
    fontSize: "var(--text-sm)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "var(--space-4)",
    color: "var(--color-text)",
  },
  footerList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  footerLink: {
    display: "block",
    padding: "var(--space-2) 0",
    fontSize: "var(--text-sm)",
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    transition: "color var(--transition-fast)",
  },
  footerBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "var(--space-8)",
    borderTop: "1px solid var(--color-border)",
  },
  copyright: {
    fontSize: "var(--text-sm)",
    color: "var(--color-text-secondary)",
    margin: 0,
  },
  footerBottomLinks: {
    display: "flex",
    gap: "var(--space-6)",
  },
};
