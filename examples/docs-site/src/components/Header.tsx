import { signal } from "philjs-core";
import { theme, toggleTheme } from "../lib/theme";
import { VersionSwitcher } from "./VersionSwitcher";
import { LocaleSwitcher } from "./LocaleSwitcher";

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
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
              window.dispatchEvent(event);
            }}
            style={styles.searchButton}
            aria-label="Search documentation"
            title="Search (⌘K)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span style={styles.searchShortcut}>⌘K</span>
          </button>

          <LocaleSwitcher />

          <VersionSwitcher />

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
            onClick={toggleTheme}
            aria-label={theme() === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            title={theme() === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme() === 'dark' ? (
              // Sun icon for dark mode
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            ) : (
              // Moon icon for light mode
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            style={styles.mobileMenuButton}
            onClick={() => mobileMenuOpen.set(!mobileMenuOpen())}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {mobileMenuOpen() ? (
                // X icon when menu is open
                <>
                  <path d="M18 6L6 18" stroke-width="2" stroke-linecap="round" />
                  <path d="M6 6l12 12" stroke-width="2" stroke-linecap="round" />
                </>
              ) : (
                // Hamburger icon when menu is closed
                <>
                  <path d="M3 12h18" stroke-width="2" stroke-linecap="round" />
                  <path d="M3 6h18" stroke-width="2" stroke-linecap="round" />
                  <path d="M3 18h18" stroke-width="2" stroke-linecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen() && (
          <div
            style={styles.mobileMenuBackdrop}
            onClick={() => mobileMenuOpen.set(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen() && (
          <div
            style={styles.mobileMenu}
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div style={styles.mobileMenuContent}>
              {/* Mobile Menu Header */}
              <div style={styles.mobileMenuHeader}>
                <span style={styles.mobileMenuTitle}>Navigation</span>
                <button
                  onClick={() => mobileMenuOpen.set(false)}
                  style={styles.mobileMenuClose}
                  aria-label="Close menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav style={styles.mobileMenuNav}>
                {navLinks.map((link) => (
                  <a
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                      mobileMenuOpen.set(false);
                    }}
                    style={{
                      ...styles.mobileMenuLink,
                      ...(currentPage().startsWith(link.path)
                        ? styles.mobileMenuLinkActive
                        : {}),
                    }}
                  >
                    <span style={styles.mobileMenuLinkText}>{link.label}</span>
                    {currentPage().startsWith(link.path) && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        style={styles.mobileMenuLinkIcon}
                      >
                        <polyline
                          points="9 18 15 12 9 6"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    )}
                  </a>
                ))}
              </nav>

              {/* Mobile Menu Footer */}
              <div style={styles.mobileMenuFooter}>
                <a
                  href="https://github.com/philjs/philjs"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.mobileMenuFooterLink}
                >
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
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
  searchButton: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: "var(--space-2) var(--space-3)",
    background: "var(--color-bg-alt)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    fontSize: "var(--text-sm)",
  },
  searchShortcut: {
    padding: "0.125rem 0.375rem",
    fontSize: "0.6875rem",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "3px",
    color: "var(--color-text-tertiary)",
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
  mobileMenuBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    animation: "fadeIn 0.2s ease-out",
  },
  mobileMenu: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "85%",
    maxWidth: "360px",
    background: "var(--color-bg)",
    boxShadow: "-2px 0 12px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    animation: "slideInRight 0.3s ease-out",
    display: "flex",
    flexDirection: "column",
  },
  mobileMenuContent: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  mobileMenuHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--color-border)",
    flexShrink: 0,
  },
  mobileMenuTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "var(--color-text)",
  },
  mobileMenuClose: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "var(--color-bg-alt)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  mobileMenuNav: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  mobileMenuLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    fontSize: "1rem",
    fontWeight: 500,
    color: "var(--color-text)",
    background: "var(--color-bg-alt)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    transition: "all var(--transition-fast)",
    textDecoration: "none",
  },
  mobileMenuLinkActive: {
    background: "var(--color-accent-light)",
    borderColor: "var(--color-accent)",
    color: "var(--color-accent)",
  },
  mobileMenuLinkText: {
    flex: 1,
  },
  mobileMenuLinkIcon: {
    flexShrink: 0,
  },
  mobileMenuFooter: {
    padding: "1.5rem",
    borderTop: "1px solid var(--color-border)",
    flexShrink: 0,
  },
  mobileMenuFooterLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem",
    background: "var(--color-bg-alt)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    color: "var(--color-text)",
    textDecoration: "none",
    fontSize: "0.9375rem",
    fontWeight: 500,
    transition: "all var(--transition-fast)",
  },
};
