import { signal } from 'philjs-core';

export interface AccordionItem {
  id: string;
  title: string;
  content: any;
  icon?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple panels open at once */
  allowMultiple?: boolean;
  /** Initially open item IDs */
  defaultOpen?: string[];
  /** Callback when item is toggled */
  onToggle?: (id: string, isOpen: boolean) => void;
  className?: string;
}

/**
 * Accordion Component
 *
 * Collapsible sections for FAQs, documentation, and content organization.
 * Supports single or multiple open panels with smooth animations.
 */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  onToggle,
  className = '',
}: AccordionProps) {
  const openItems = signal<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    const current = openItems();
    const isOpen = current.has(id);

    if (allowMultiple) {
      if (isOpen) {
        current.delete(id);
      } else {
        current.add(id);
      }
      openItems.set(new Set(current));
    } else {
      openItems.set(isOpen ? new Set() : new Set([id]));
    }

    onToggle?.(id, !isOpen);
  };

  return (
    <div
      className={`accordion ${className}`}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => {
        const isOpen = openItems().has(item.id);

        return (
          <div
            key={item.id}
            style={{
              borderBottom: index < items.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            {/* Header */}
            <button
              onClick={() => toggle(item.id)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                background: isOpen ? 'var(--color-bg-alt)' : 'var(--color-bg)',
                border: 'none',
                color: 'var(--color-text)',
                fontSize: '1rem',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                {item.icon && <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>}
                <span>{item.title}</span>
              </div>

              {/* Chevron indicator */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  flexShrink: 0,
                  transition: 'transform var(--transition-fast)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Content */}
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              style={{
                maxHeight: isOpen ? '1000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-out',
              }}
            >
              <div style={{ padding: '1.5rem' }}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * FAQ Component - Pre-styled for frequently asked questions
 */
export function FAQ({
  questions,
  className = '',
}: {
  questions: Array<{ question: string; answer: any }>;
  className?: string;
}) {
  const items: AccordionItem[] = questions.map((q, index) => ({
    id: `faq-${index}`,
    title: q.question,
    content: q.answer,
    icon: '❓',
  }));

  return <Accordion items={items} className={className} />;
}

/**
 * Simple collapsible section
 */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: any;
  defaultOpen?: boolean;
}) {
  return (
    <Accordion
      items={[
        {
          id: 'collapsible',
          title,
          content: children,
        },
      ]}
      defaultOpen={defaultOpen ? ['collapsible'] : []}
    />
  );
}

/**
 * Example usage:
 *
 * // Basic accordion
 * <Accordion
 *   items={[
 *     {
 *       id: '1',
 *       title: 'What is PhilJS?',
 *       content: <p>PhilJS is a modern JavaScript framework...</p>,
 *       icon: '📚'
 *     },
 *     {
 *       id: '2',
 *       title: 'How do I install it?',
 *       content: <CodeBlock>npm install philjs-core</CodeBlock>
 *     }
 *   ]}
 *   allowMultiple
 * />
 *
 * // FAQ component
 * <FAQ
 *   questions={[
 *     {
 *       question: 'How does reactivity work?',
 *       answer: 'PhilJS uses fine-grained reactivity with signals...'
 *     },
 *     {
 *       question: 'Is it production ready?',
 *       answer: 'Yes! PhilJS is stable and used in production.'
 *     }
 *   ]}
 * />
 *
 * // Simple collapsible
 * <Collapsible title="Advanced Configuration" defaultOpen>
 *   <p>Configuration details here...</p>
 * </Collapsible>
 */
