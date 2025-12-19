/**
 * Layout Component
 *
 * Provides consistent page structure across the docs site
 */

import { signal } from 'philjs-core';
import { Header } from './Header';
import { Footer } from './Footer';
import { theme } from '../lib/theme';

export interface LayoutProps {
  children: any;
  navigate: (path: string) => void;
  showSidebar?: boolean;
  sidebar?: any;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Layout({
  children,
  navigate,
  showSidebar = false,
  sidebar,
  maxWidth = 'xl'
}: LayoutProps) {
  const mobileMenuOpen = signal(false);

  const maxWidthMap = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    'full': '100%',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
    }}>
      {/* Header */}
      <Header navigate={navigate} onMenuToggle={() => mobileMenuOpen.set(!mobileMenuOpen())} />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
      }}>
        {/* Sidebar (if provided) */}
        {showSidebar && sidebar && (
          <>
            {/* Overlay for mobile */}
            {mobileMenuOpen() && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 40,
                }}
                onClick={() => mobileMenuOpen.set(false)}
              />
            )}

            {/* Sidebar */}
            <aside
              style={{
                width: '280px',
                flexShrink: 0,
                borderRight: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                position: 'sticky',
                top: '64px',
                height: 'calc(100vh - 64px)',
                overflowY: 'auto',
                transition: 'transform 0.3s ease',
                zIndex: 50,
                ...(mobileMenuOpen() ? {} : {
                  transform: 'translateX(-100%)',
                  position: 'fixed',
                }),
                '@media (min-width: 1024px)': {
                  transform: 'translateX(0)',
                  position: 'sticky',
                },
              }}
            >
              {sidebar}
            </aside>
          </>
        )}

        {/* Content */}
        <main
          style={{
            flex: 1,
            width: '100%',
            maxWidth: maxWidthMap[maxWidth],
            margin: '0 auto',
            padding: '2rem 1.5rem',
          }}
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer navigate={navigate} />
    </div>
  );
}

/**
 * DocLayout - Specialized layout for documentation pages
 */
export interface DocLayoutProps {
  children: any;
  navigate: (path: string) => void;
  sidebar: any;
  tableOfContents?: any;
  breadcrumbs?: any;
}

export function DocLayout({
  children,
  navigate,
  sidebar,
  tableOfContents,
  breadcrumbs,
}: DocLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
    }}>
      {/* Header */}
      <Header navigate={navigate} />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '280px 1fr 240px',
        gap: '2rem',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        padding: '2rem 1.5rem',
      }}>
        {/* Sidebar */}
        <aside style={{
          position: 'sticky',
          top: '80px',
          height: 'calc(100vh - 100px)',
          overflowY: 'auto',
        }}>
          {sidebar}
        </aside>

        {/* Main Content */}
        <main style={{
          minWidth: 0,
          maxWidth: '900px',
        }}>
          {breadcrumbs}
          {children}
        </main>

        {/* Table of Contents */}
        <aside style={{
          position: 'sticky',
          top: '80px',
          height: 'fit-content',
        }}>
          {tableOfContents}
        </aside>
      </div>

      {/* Footer */}
      <Footer navigate={navigate} />
    </div>
  );
}

/**
 * CenteredLayout - For landing pages and centered content
 */
export interface CenteredLayoutProps {
  children: any;
  navigate: (path: string) => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function CenteredLayout({
  children,
  navigate,
  maxWidth = 'lg',
}: CenteredLayoutProps) {
  const maxWidthMap = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Header navigate={navigate} />

      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: maxWidthMap[maxWidth],
        }}>
          {children}
        </div>
      </main>

      <Footer navigate={navigate} />
    </div>
  );
}
