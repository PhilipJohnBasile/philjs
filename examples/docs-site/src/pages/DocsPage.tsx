import { signal } from "philjs-core";
import { createDocContent } from "../utils/docContent";

export function DocsPage({
  navigate,
  path,
}: {
  navigate: (path: string) => void;
  path: string;
}) {
  const mobileMenuOpen = signal(false);

  const docSections = [
    {
      title: "Getting Started",
      items: [
        { title: "Introduction", path: "/docs" },
        { title: "Installation", path: "/docs/installation" },
        { title: "Quick Start", path: "/docs/quick-start" },
        { title: "Tutorial", path: "/docs/tutorial" },
      ],
    },
    {
      title: "Core Concepts",
      items: [
        { title: "Components", path: "/docs/components" },
        { title: "Signals", path: "/docs/signals" },
        { title: "Effects", path: "/docs/effects" },
        { title: "Context", path: "/docs/context" },
        { title: "JSX & Templates", path: "/docs/jsx" },
      ],
    },
    {
      title: "Routing",
      items: [
        { title: "File-based Routing", path: "/docs/routing" },
        { title: "Navigation", path: "/docs/navigation" },
        { title: "Layouts", path: "/docs/layouts" },
        { title: "Smart Preloading", path: "/docs/smart-preloading" },
      ],
    },
    {
      title: "Data Fetching",
      items: [
        { title: "Server Functions", path: "/docs/server-functions" },
        { title: "Data Layer", path: "/docs/data-layer" },
        { title: "Caching", path: "/docs/caching" },
        { title: "Mutations", path: "/docs/mutations" },
      ],
    },
    {
      title: "Rendering",
      items: [
        { title: "SSR", path: "/docs/ssr" },
        { title: "Streaming", path: "/docs/streaming" },
        { title: "Resumability", path: "/docs/resumability" },
        { title: "Islands", path: "/docs/islands" },
        { title: "Static Generation", path: "/docs/ssg" },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { title: "Cost Tracking", path: "/docs/cost-tracking" },
        { title: "Usage Analytics", path: "/docs/usage-analytics" },
        { title: "Performance Budgets", path: "/docs/performance-budgets" },
        { title: "Time Travel", path: "/docs/time-travel" },
      ],
    },
    {
      title: "Advanced",
      items: [
        { title: "Forms", path: "/docs/forms" },
        { title: "Animations", path: "/docs/animations" },
        { title: "Error Boundaries", path: "/docs/error-boundaries" },
        { title: "i18n", path: "/docs/i18n" },
        { title: "Testing", path: "/docs/testing" },
      ],
    },
    {
      title: "API Reference",
      items: [
        { title: "Core API", path: "/docs/api/core" },
        { title: "Router API", path: "/docs/api/router" },
        { title: "SSR API", path: "/docs/api/ssr" },
        { title: "Islands API", path: "/docs/api/islands" },
        { title: "DevTools API", path: "/docs/api/devtools" },
        { title: "AI API", path: "/docs/api/ai" },
      ],
    },
  ];

  const content = createDocContent(path, navigate, styles);

  return (
    <div style={styles.docsPage}>
      {/* Mobile Menu Toggle */}
      <button
        style={styles.mobileMenuToggle}
        onClick={() => mobileMenuOpen.set(!mobileMenuOpen())}
        aria-label="Toggle documentation menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M3 12h18M3 6h18M3 18h18"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          ...(mobileMenuOpen() ? styles.sidebarOpen : {}),
        }}
      >
        <div style={styles.sidebarContent}>
          <div style={styles.searchBox}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              style={styles.searchIcon}
            >
              <circle cx="11" cy="11" r="8" stroke-width="2" />
              <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search docs... (⌘K)"
              style={styles.searchInput}
            />
          </div>

          <nav style={styles.nav}>
            {docSections.map((section) => (
              <div style={styles.navSection}>
                <div style={styles.navSectionTitle}>{section.title}</div>
                <ul style={styles.navList}>
                  {section.items.map((item) => (
                    <li>
                      <a
                        href={item.path}
                        onClick={(e: MouseEvent) => {
                          e.preventDefault();
                          navigate(item.path);
                          mobileMenuOpen.set(false);
                        }}
                        style={{
                          ...styles.navLink,
                          ...(path === item.path ? styles.navLinkActive : {}),
                        }}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.content}>
        <article style={styles.article}>{content.content}</article>

        {/* Table of Contents */}
        <aside style={styles.toc}>
          <div style={styles.tocTitle}>On this page</div>
          <nav style={styles.tocNav}>
            <a href="#" style={styles.tocLink}>
              {content.title}
            </a>
          </nav>
        </aside>
      </main>
    </div>
  );
}

const styles: Record<string, Record<string, any>> = {
  docsPage: {
    display: "grid",
    gridTemplateColumns: "280px 1fr 200px",
    gap: "var(--space-8)",
    maxWidth: "var(--max-width-2xl)",
    margin: "0 auto",
    padding: "var(--space-8) var(--space-6)",
    position: "relative",
  },
  mobileMenuToggle: {
    display: "none",
    position: "fixed",
    bottom: "var(--space-6)",
    right: "var(--space-6)",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "var(--color-accent)",
    color: "white",
    border: "none",
    boxShadow: "var(--shadow-lg)",
    cursor: "pointer",
    zIndex: 100,
  },
  sidebar: {
    position: "sticky",
    top: "80px",
    height: "calc(100vh - 100px)",
    overflowY: "auto",
  },
  sidebarOpen: {
    display: "block",
  },
  sidebarContent: {
    paddingRight: "var(--space-4)",
  },
  searchBox: {
    position: "relative",
    marginBottom: "var(--space-6)",
  },
  searchIcon: {
    position: "absolute",
    left: "var(--space-3)",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--color-text-secondary)",
  },
  searchInput: {
    width: "100%",
    padding: "var(--space-2) var(--space-3) var(--space-2) var(--space-12)",
    background: "var(--color-bg-secondary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: "var(--text-sm)",
    color: "var(--color-text)",
    fontFamily: "var(--font-sans)",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-6)",
  },
  navSection: {
    marginBottom: 0,
  },
  navSectionTitle: {
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-text-secondary)",
    marginBottom: "var(--space-3)",
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  navLink: {
    display: "block",
    padding: "var(--space-2) var(--space-3)",
    fontSize: "var(--text-sm)",
    color: "var(--color-text-secondary)",
    borderRadius: "var(--radius-sm)",
    transition: "all var(--transition-fast)",
    textDecoration: "none",
  },
  navLinkActive: {
    color: "var(--color-accent)",
    background: "var(--color-accent-light)",
    fontWeight: 500,
  },
  content: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "1fr 200px",
    gap: "var(--space-8)",
  },
  article: {
    minWidth: 0,
    maxWidth: "720px",
  },
  toc: {
    position: "sticky",
    top: "80px",
    height: "fit-content",
  },
  tocTitle: {
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-text-secondary)",
    marginBottom: "var(--space-3)",
  },
  tocNav: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  tocLink: {
    fontSize: "var(--text-sm)",
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    transition: "color var(--transition-fast)",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "var(--space-4)",
    margin: "var(--space-6) 0",
  },
  featureBox: {
    padding: "var(--space-4)",
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
  },
  codeBlock: {
    background: "var(--color-code-bg)",
    padding: "var(--space-4)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-code-border)",
    overflow: "auto",
    fontSize: "var(--text-sm)",
    lineHeight: 1.7,
  },
};
