import { signal, effect } from 'philjs-core';
import { docsStructure } from '../lib/docs-structure';
import { theme, toggleTheme } from '../lib/theme';

interface SidebarProps {
  currentSection: string;
  currentFile: string;
  navigate: (path: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

const SIDEBAR_SCROLL_KEY = 'philjs-docs-sidebar-scroll';

export function Sidebar({ currentSection, currentFile, navigate, isOpen, onClose }: SidebarProps) {
  // Track which sections are expanded
  const expandedSections = signal<Set<string>>(new Set([currentSection]));

  const toggleSection = (path: string) => {
    const expanded = new Set(expandedSections());
    if (expanded.has(path)) {
      expanded.delete(path);
    } else {
      expanded.add(path);
    }
    expandedSections.set(expanded);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  // Save and restore scroll position using sessionStorage
  effect(() => {
    let cleanup: (() => void) | null = null;

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;

      // Restore scroll position from sessionStorage
      const saved = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
      if (saved) {
        const scrollPos = parseInt(saved, 10);
        sidebar.scrollTop = scrollPos;
      }

      const handleScroll = () => {
        sessionStorage.setItem(SIDEBAR_SCROLL_KEY, sidebar.scrollTop.toString());
      };

      sidebar.addEventListener('scroll', handleScroll, { passive: true });

      cleanup = () => {
        sidebar.removeEventListener('scroll', handleScroll);
        clearTimeout(timer);
      };
    }, 10);

    return () => {
      if (cleanup) cleanup();
    };
  });

  return (
    <aside
      class="sidebar"
      style={`
        width: 280px;
        background: var(--color-bg-alt);
        border-right: 1px solid var(--color-border);
        padding: 1.5rem 0;
        overflow-y: auto;
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 1000;
        transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'};
        transition: transform 0.3s ease;
      `}
    >
      {/* Logo and Theme Toggle */}
      <div style="padding: 0 1.5rem; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <button
            onClick={() => handleNavClick('/')}
            style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--color-text); background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0;"
          >
            <span style="font-size: 2rem;">⚡</span>
            <span style="font-weight: 700; font-size: 1.5rem; background: linear-gradient(135deg, var(--color-brand), var(--color-brand-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              PhilJS
            </span>
          </button>
          <button
            onClick={toggleTheme}
            aria-label={theme() === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            title={theme() === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            style="display: flex; align-items: center; padding: 0.5rem; background: none; border: none; color: var(--color-text-secondary); cursor: pointer; border-radius: 6px; transition: color 0.2s;"
            onMouseEnter={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-text)'}
            onMouseLeave={(e: MouseEvent) => (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'}
          >
            {theme() === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            )}
          </button>
        </div>
        {/* Search Button */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(event);
          }}
          style="
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.625rem 0.875rem;
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
          "
          onMouseEnter={(e: MouseEvent) => {
            (e.target as HTMLElement).style.borderColor = 'var(--color-brand)';
            (e.target as HTMLElement).style.background = 'var(--color-hover)';
          }}
          onMouseLeave={(e: MouseEvent) => {
            (e.target as HTMLElement).style.borderColor = 'var(--color-border)';
            (e.target as HTMLElement).style.background = 'var(--color-bg)';
          }}
          aria-label="Search documentation"
          title="Search (⌘K)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span style="flex: 1; text-align: left;">Search...</span>
          <kbd style="padding: 0.125rem 0.375rem; font-size: 0.6875rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 3px;">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav style="padding: 0 0.75rem;">
        {docsStructure.map(section => {
          const isExpanded = expandedSections().has(section.path);
          const hasActiveItem = section.path === currentSection;

          return (
            <div style="margin-bottom: 0.5rem;">
              {/* Section Header */}
              <div style="display: flex; width: 100%; align-items: center; gap: 0.25rem;">
                <button
                  onClick={() => handleNavClick(`/docs/${section.path}`)}
                  style={`
                    flex: 1;
                    display: flex;
                    align-items: center;
                    padding: 0.625rem 0.75rem;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: ${hasActiveItem ? 'var(--color-brand)' : 'var(--color-text-secondary)'};
                    background: none;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    transition: color 0.2s;
                    border-radius: 6px;
                  `}
                  onMouseEnter={(e: MouseEvent) => {
                    if (!hasActiveItem) {
                      (e.target as HTMLElement).style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e: MouseEvent) => {
                    if (!hasActiveItem) {
                      (e.target as HTMLElement).style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  <span>{section.title}</span>
                </button>
                <button
                  onClick={() => toggleSection(section.path)}
                  style={`
                    padding: 0.625rem 0.5rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: ${hasActiveItem ? 'var(--color-brand)' : 'var(--color-text-secondary)'};
                    transition: transform 0.2s;
                  `}
                  onMouseEnter={(e: MouseEvent) => {
                    if (!hasActiveItem) {
                      (e.target as HTMLElement).style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e: MouseEvent) => {
                    if (!hasActiveItem) {
                      (e.target as HTMLElement).style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  <span style={`transform: rotate(${isExpanded ? '90deg' : '0deg'}); transition: transform 0.2s; display: inline-block;`}>
                    ▸
                  </span>
                </button>
              </div>

              {/* Section Items */}
              {isExpanded && (
                <div style="padding-left: 0.5rem; margin-top: 0.25rem;">
                  {section.items.map(item => {
                    const isActive = section.path === currentSection && item.file === currentFile;

                    return (
                      <button
                        onClick={() => handleNavClick(`/docs/${section.path}/${item.file}`)}
                        style={`
                          width: 100%;
                          text-align: left;
                          padding: 0.5rem 0.75rem;
                          border-radius: 6px;
                          background: ${isActive ? 'var(--color-brand)' : 'transparent'};
                          color: ${isActive ? 'white' : 'var(--color-text)'};
                          border: none;
                          cursor: pointer;
                          font-size: 0.875rem;
                          transition: all 0.2s;
                          display: block;
                          margin-bottom: 2px;
                        `}
                        onMouseEnter={(e: MouseEvent) => {
                          if (!isActive) {
                            (e.target as HTMLElement).style.background = 'var(--color-hover)';
                          }
                        }}
                        onMouseLeave={(e: MouseEvent) => {
                          if (!isActive) {
                            (e.target as HTMLElement).style.background = 'transparent';
                          }
                        }}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
