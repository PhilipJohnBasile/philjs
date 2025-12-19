/**
 * API Reference Page
 *
 * Displays auto-generated API documentation from TypeScript source
 */

import { signal, effect } from 'philjs-core';
import {
  generateApiMarkdown,
  philjsCoreApiDocs,
  type ApiDocModule,
} from '../lib/api-doc-generator';
import { renderMarkdown } from '../lib/markdown-renderer';

export interface ApiReferencePageProps {
  navigate: (path: string) => void;
  module?: string;
}

export function ApiReferencePage({ navigate, module = 'core' }: ApiReferencePageProps) {
  const currentModule = signal(module);
  const renderedContent = signal('');

  // Available API modules
  const modules = [
    { id: 'core', name: 'philjs-core', description: 'Core reactivity primitives' },
    { id: 'router', name: 'philjs-router', description: 'File-based routing' },
    { id: 'ssr', name: 'philjs-ssr', description: 'Server-side rendering' },
    { id: 'islands', name: 'philjs-islands', description: 'Islands architecture' },
    { id: 'devtools', name: 'philjs-devtools', description: 'Developer tools' },
  ];

  // Load and render API docs for selected module
  effect(() => {
    const moduleId = currentModule();

    // For now, only core module has docs
    if (moduleId === 'core') {
      const markdown = generateApiMarkdown(philjsCoreApiDocs);
      renderedContent.set(renderMarkdown(markdown));
    } else {
      renderedContent.set(
        renderMarkdown(`# ${modules.find(m => m.id === moduleId)?.name || moduleId}\n\nAPI documentation coming soon...`)
      );
    }
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <button
            onClick={() => navigate('/docs')}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Back to docs"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}>
            API Reference
          </h1>
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '2rem',
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
      }}>
        {/* Module Selector */}
        <aside style={{
          position: 'sticky',
          top: '80px',
          height: 'fit-content',
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.5rem',
            }}>
              Packages
            </div>
            {modules.map(mod => (
              <button
                key={mod.id}
                onClick={() => currentModule.set(mod.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  background: currentModule() === mod.id ? 'var(--color-bg-alt)' : 'transparent',
                  border: currentModule() === mod.id ? '1px solid var(--color-border)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: currentModule() === mod.id ? 'var(--color-brand)' : 'var(--color-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: currentModule() === mod.id ? 600 : 400,
                }}
              >
                <div style={{ fontSize: '0.875rem' }}>{mod.name}</div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '0.25rem',
                }}>
                  {mod.description}
                </div>
              </button>
            ))}
          </nav>

          {/* Quick Links */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'var(--color-bg-alt)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              color: 'var(--color-text)',
            }}>
              Quick Links
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <a
                href="/docs/getting-started/installation"
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  navigate('/docs/getting-started/installation');
                }}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                }}
              >
                Getting Started →
              </a>
              <a
                href="/docs/learn/signals"
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  navigate('/docs/learn/signals');
                }}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                }}
              >
                Core Concepts →
              </a>
              <a
                href="/examples"
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  navigate('/examples');
                }}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                }}
              >
                Examples →
              </a>
            </div>
          </div>
        </aside>

        {/* API Documentation Content */}
        <main style={{
          minWidth: 0,
        }}>
          <article
            class="prose"
            style={{
              maxWidth: '900px',
            }}
            dangerouslySetInnerHTML={{ __html: renderedContent() }}
          />

          {/* Feedback Section */}
          <div style={{
            marginTop: '4rem',
            padding: '1.5rem',
            background: 'var(--color-bg-alt)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontWeight: 600,
              marginBottom: '0.75rem',
              color: 'var(--color-text)',
            }}>
              Was this helpful?
            </div>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
            }}>
              <button
                onClick={() => alert('Thanks for your feedback!')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Yes
              </button>
              <button
                onClick={() => {
                  const feedback = prompt('What could we improve?');
                  if (feedback) {
                    console.log('Feedback:', feedback);
                    alert('Thank you for your feedback!');
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                No
              </button>
            </div>
          </div>

          {/* Edit on GitHub */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            <a
              href={`https://github.com/philjs/philjs/edit/main/packages/philjs-${currentModule()}/src/index.ts`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit this page on GitHub
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
