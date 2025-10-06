import { signal, effect } from 'philjs-core';
import { docsStructure } from '../lib/docs-structure';

interface SidebarProps {
  currentSection: string;
  currentFile: string;
  navigate: (path: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

// Global signal to persist scroll position across component re-renders
const savedScrollPosition = signal(0);
let isRestoring = false;

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
    // Scroll position is already saved by the scroll listener
    navigate(path);
    if (onClose) onClose();
  };

  // Continuously save scroll position as user scrolls
  effect(() => {
    let cleanup: (() => void) | null = null;

    // Wait for sidebar to be in DOM
    setTimeout(() => {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;

      const handleScroll = () => {
        // Don't save scroll position while we're restoring it
        if (isRestoring) return;

        const scrollValue = sidebar.scrollTop;
        // Only save if scrollTop > 0 to avoid saving the reset position
        if (scrollValue > 0) {
          savedScrollPosition.set(scrollValue);
        }
      };

      sidebar.addEventListener('scroll', handleScroll);

      cleanup = () => {
        sidebar.removeEventListener('scroll', handleScroll);
      };
    }, 0);

    return () => {
      if (cleanup) cleanup();
    };
  });

  // Restore sidebar scroll position after render (run once per mount)
  effect(() => {
    const scrollValue = savedScrollPosition();
    if (scrollValue > 0) {
      isRestoring = true;
      setTimeout(() => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.scrollTop = scrollValue;
          // Allow saving scroll position again after restoration is complete
          setTimeout(() => {
            isRestoring = false;
          }, 100);
        }
      }, 300);
    }
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
      {/* Logo */}
      <div style="padding: 0 1.5rem; margin-bottom: 2rem;">
        <button
          onClick={() => handleNavClick('/')}
          style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--color-text); background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0;"
        >
          <span style="font-size: 2rem;">⚡</span>
          <span style="font-weight: 700; font-size: 1.5rem; background: linear-gradient(135deg, var(--color-brand), var(--color-brand-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            PhilJS
          </span>
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
                  onMouseEnter={(e) => {
                    if (!hasActiveItem) {
                      (e.target as HTMLElement).style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e) => {
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
                  onMouseEnter={(e) => {
                    if (!hasActiveItem) {
                      (e.target as HTMLElement).style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e) => {
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
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.target as HTMLElement).style.background = 'var(--color-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
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
