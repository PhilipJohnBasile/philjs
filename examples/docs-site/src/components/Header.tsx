import { signal } from "philjs-core";

export function Header({
  navigate,
  currentPage,
}: {
  navigate: (path: string) => void;
  currentPage: () => string;
}) {
  const mobileMenuOpen = signal(false);

  const navLinks = [
    { label: "Docs", path: "/docs" },
    { label: "Playground", path: "/playground" },
    { label: "Examples", path: "/examples" },
    { label: "Blog", path: "/blog" },
  ];

  return (
    <header style={styles.header}>
      <div class="container" style={styles.container}>
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          style={styles.logo}
          aria-label="PhilJS Home"
        >
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
          <span style={styles.logoText}>PhilJS</span>
        </button>

        {/* Desktop Navigation */}
        <nav style={styles.nav} aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              href={link.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(link.path);
              }}
              style={{
                ...styles.navLink,
                ...(currentPage().startsWith(link.path)
                  ? styles.navLinkActive
                  : {}),
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div style={styles.actions}>
          <a
            href="https://github.com/philjs/philjs"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.githubLink}
            aria-label="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>

          <button
            style={styles.themeToggle}
            aria-label="Toggle theme"
            title="Toggle dark mode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          {/* Mobile Menu Button */}
          <button
            style={styles.mobileMenuButton}
            onClick={() => mobileMenuOpen.set(!mobileMenuOpen())}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12h18M3 6h18M3 18h18" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen() && (
          <div style={styles.mobileMenu} class="slide-down">
            {navLinks.map((link) => (
              <a
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.path);
                  mobileMenuOpen.set(false);
                }}
                style={styles.mobileMenuLink}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background: "var(--color-bg)",
    borderBottom: "1px solid var(--color-border)",
    backdropFilter: "blur(10px)",
  },
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--space-4) var(--space-6)",
    gap: "var(--space-8)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    background: "none",
    border: "none",
    color: "var(--color-text)",
    cursor: "pointer",
    padding: 0,
    fontSize: "var(--text-lg)",
    fontWeight: 700,
  },
  logoText: {
    display: "none",
    "@media (min-width: 768px)": {
      display: "block",
    },
  },
  nav: {
    display: "none",
    gap: "var(--space-2)",
    "@media (min-width: 768px)": {
      display: "flex",
    },
  },
  navLink: {
    padding: "var(--space-2) var(--space-3)",
    fontSize: "var(--text-sm)",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    borderRadius: "var(--radius-sm)",
    transition: "all var(--transition-fast)",
  },
  navLinkActive: {
    color: "var(--color-accent)",
    background: "var(--color-accent-light)",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  },
  githubLink: {
    display: "flex",
    alignItems: "center",
    padding: "var(--space-2)",
    color: "var(--color-text-secondary)",
    borderRadius: "var(--radius-sm)",
    transition: "color var(--transition-fast)",
  },
  themeToggle: {
    display: "flex",
    alignItems: "center",
    padding: "var(--space-2)",
    background: "none",
    border: "none",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    borderRadius: "var(--radius-sm)",
    transition: "color var(--transition-fast)",
  },
  mobileMenuButton: {
    display: "flex",
    alignItems: "center",
    padding: "var(--space-2)",
    background: "none",
    border: "none",
    color: "var(--color-text)",
    cursor: "pointer",
    "@media (min-width: 768px)": {
      display: "none",
    },
  },
  mobileMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--color-bg)",
    borderBottom: "1px solid var(--color-border)",
    padding: "var(--space-4)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  mobileMenuLink: {
    padding: "var(--space-3)",
    fontSize: "var(--text-base)",
    fontWeight: 500,
    color: "var(--color-text)",
    borderRadius: "var(--radius-sm)",
    transition: "background var(--transition-fast)",
  },
};
