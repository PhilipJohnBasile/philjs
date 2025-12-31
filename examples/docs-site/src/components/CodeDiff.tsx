import { signal } from '@philjs/core';

export interface DiffLine {
  type: 'add' | 'remove' | 'normal' | 'info';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface CodeDiffProps {
  /** Original code (before changes) */
  oldCode: string;
  /** New code (after changes) */
  newCode: string;
  /** Language for syntax highlighting */
  language?: string;
  /** Filename or title */
  filename?: string;
  /** View mode: side-by-side or unified */
  viewMode?: 'split' | 'unified';
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Number of context lines around changes */
  context?: number;
  /** Expandable unchanged regions */
  collapsible?: boolean;
  /** Show diff statistics */
  showStats?: boolean;
  className?: string;
}

/**
 * CodeDiff Component
 *
 * Displays code differences with syntax highlighting, line numbers,
 * and support for both unified and split views.
 * Perfect for migration guides, version comparisons, and API changes.
 */
export function CodeDiff({
  oldCode,
  newCode,
  language = 'typescript',
  filename,
  viewMode: initialViewMode = 'split',
  showLineNumbers = true,
  context = 3,
  collapsible = true,
  showStats = true,
  className = '',
}: CodeDiffProps) {
  const viewMode = signal<'split' | 'unified'>(initialViewMode);
  const expandedSections = signal<Set<number>>(new Set());

  // Simple diff algorithm (Myers diff would be more accurate)
  const generateDiff = (): DiffLine[] => {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const diff: DiffLine[] = [];

    // Simple line-by-line comparison
    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];

      if (oldLine === newLine) {
        diff.push({
          type: 'normal',
          content: oldLine || '',
          oldLineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1,
        });
        oldIndex++;
        newIndex++;
      } else {
        // Look ahead to find matching lines
        const oldNextIndex = newLines.indexOf(oldLine, newIndex);
        const newNextIndex = oldLines.indexOf(newLine, oldIndex);

        if (oldNextIndex !== -1 && (newNextIndex === -1 || oldNextIndex < newNextIndex)) {
          // Lines added
          for (let i = newIndex; i < oldNextIndex; i++) {
            diff.push({
              type: 'add',
              content: newLines[i],
              newLineNumber: i + 1,
            });
          }
          newIndex = oldNextIndex;
        } else if (newNextIndex !== -1) {
          // Lines removed
          for (let i = oldIndex; i < newNextIndex; i++) {
            diff.push({
              type: 'remove',
              content: oldLines[i],
              oldLineNumber: i + 1,
            });
          }
          oldIndex = newNextIndex;
        } else {
          // Modified line (remove old, add new)
          diff.push({
            type: 'remove',
            content: oldLine,
            oldLineNumber: oldIndex + 1,
          });
          diff.push({
            type: 'add',
            content: newLine,
            newLineNumber: newIndex + 1,
          });
          oldIndex++;
          newIndex++;
        }
      }
    }

    return diff;
  };

  const diffLines = generateDiff();

  // Calculate diff statistics
  const stats = {
    additions: diffLines.filter((l) => l.type === 'add').length,
    deletions: diffLines.filter((l) => l.type === 'remove').length,
    changes: diffLines.filter((l) => l.type !== 'normal' && l.type !== 'info').length,
  };

  // Group lines into collapsible sections
  const groupLines = () => {
    const groups: { type: 'change' | 'context'; lines: DiffLine[]; startIndex: number }[] = [];
    let currentGroup: DiffLine[] = [];
    let currentType: 'change' | 'context' = 'context';
    let startIndex = 0;

    diffLines.forEach((line, index) => {
      const isChange = line.type === 'add' || line.type === 'remove';

      if (isChange !== (currentType === 'change')) {
        if (currentGroup.length > 0) {
          groups.push({ type: currentType, lines: currentGroup, startIndex });
        }
        currentGroup = [line];
        currentType = isChange ? 'change' : 'context';
        startIndex = index;
      } else {
        currentGroup.push(line);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ type: currentType, lines: currentGroup, startIndex });
    }

    return groups;
  };

  const groups = groupLines();

  // Toggle section expansion
  const toggleSection = (index: number) => {
    const expanded = expandedSections();
    if (expanded.has(index)) {
      expanded.delete(index);
    } else {
      expanded.add(index);
    }
    expandedSections.set(new Set(expanded));
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Could show toast notification here
  };

  // Render a single line in unified view
  const renderUnifiedLine = (line: DiffLine) => {
    const bgColor =
      line.type === 'add'
        ? 'rgba(46, 160, 67, 0.15)'
        : line.type === 'remove'
        ? 'rgba(248, 81, 73, 0.15)'
        : 'transparent';
    const borderColor =
      line.type === 'add'
        ? 'rgba(46, 160, 67, 0.4)'
        : line.type === 'remove'
        ? 'rgba(248, 81, 73, 0.4)'
        : 'transparent';

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: bgColor,
          borderLeft: `3px solid ${borderColor}`,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
        }}
      >
        {showLineNumbers && (
          <>
            <div
              style={{
                width: '50px',
                padding: '0 0.5rem',
                textAlign: 'right',
                color: 'var(--color-text-tertiary)',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              {line.oldLineNumber || ''}
            </div>
            <div
              style={{
                width: '50px',
                padding: '0 0.5rem',
                textAlign: 'right',
                color: 'var(--color-text-tertiary)',
                userSelect: 'none',
                flexShrink: 0,
                borderRight: '1px solid var(--color-border)',
              }}
            >
              {line.newLineNumber || ''}
            </div>
          </>
        )}
        <div
          style={{
            flex: 1,
            padding: '0 1rem',
            whiteSpace: 'pre',
            overflow: 'auto',
          }}
        >
          <span
            style={{
              color:
                line.type === 'add'
                  ? 'var(--color-success)'
                  : line.type === 'remove'
                  ? 'var(--color-error)'
                  : 'var(--color-text)',
            }}
          >
            {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
            {line.content}
          </span>
        </div>
      </div>
    );
  };

  // Render a line in split view
  const renderSplitLine = (line: DiffLine) => {
    const renderSide = (side: 'old' | 'new') => {
      const isRelevant =
        (side === 'old' && (line.type === 'remove' || line.type === 'normal')) ||
        (side === 'new' && (line.type === 'add' || line.type === 'normal'));

      if (!isRelevant) {
        return (
          <div style={{ flex: 1, background: 'var(--color-bg-alt)', opacity: 0.3 }} />
        );
      }

      const bgColor =
        side === 'old' && line.type === 'remove'
          ? 'rgba(248, 81, 73, 0.15)'
          : side === 'new' && line.type === 'add'
          ? 'rgba(46, 160, 67, 0.15)'
          : 'transparent';

      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            background: bgColor,
          }}
        >
          {showLineNumbers && (
            <div
              style={{
                width: '50px',
                padding: '0 0.5rem',
                textAlign: 'right',
                color: 'var(--color-text-tertiary)',
                userSelect: 'none',
                borderRight: '1px solid var(--color-border)',
              }}
            >
              {side === 'old' ? line.oldLineNumber || '' : line.newLineNumber || ''}
            </div>
          )}
          <div
            style={{
              flex: 1,
              padding: '0 1rem',
              whiteSpace: 'pre',
              overflow: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color:
                line.type === 'remove' && side === 'old'
                  ? 'var(--color-error)'
                  : line.type === 'add' && side === 'new'
                  ? 'var(--color-success)'
                  : 'var(--color-text)',
            }}
          >
            {line.content}
          </div>
        </div>
      );
    };

    return (
      <div
        style={{
          display: 'flex',
          gap: '1px',
          background: 'var(--color-border)',
        }}
      >
        {renderSide('old')}
        {renderSide('new')}
      </div>
    );
  };

  return (
    <div
      className={`code-diff ${className}`}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        marginTop: '1rem',
        marginBottom: '1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--color-bg-alt)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {filename && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {filename}
            </span>
          )}
          {showStats && (
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-success)' }}>+{stats.additions}</span>
              <span style={{ color: 'var(--color-error)' }}>-{stats.deletions}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* View mode toggle */}
          <button
            onClick={() => viewMode.set(viewMode() === 'split' ? 'unified' : 'split')}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {viewMode() === 'split' ? 'Unified' : 'Split'}
          </button>

          {/* Copy buttons */}
          <button
            onClick={() => copyCode(oldCode)}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="Copy old code"
          >
            Copy Old
          </button>
          <button
            onClick={() => copyCode(newCode)}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="Copy new code"
          >
            Copy New
          </button>
        </div>
      </div>

      {/* Split view header */}
      {viewMode() === 'split' && (
        <div
          style={{
            display: 'flex',
            gap: '1px',
            background: 'var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgba(248, 81, 73, 0.1)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-error)',
            }}
          >
            Before
          </div>
          <div
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgba(46, 160, 67, 0.1)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-success)',
            }}
          >
            After
          </div>
        </div>
      )}

      {/* Diff content */}
      <div
        style={{
          maxHeight: '600px',
          overflow: 'auto',
          background: 'var(--color-bg)',
        }}
      >
        {collapsible ? (
          // Grouped with collapsible sections
          groups.map((group, groupIndex) => {
            if (group.type === 'change') {
              return (
                <div key={groupIndex}>
                  {group.lines.map((line, lineIndex) =>
                    viewMode() === 'unified'
                      ? renderUnifiedLine(line)
                      : renderSplitLine(line)
                  )}
                </div>
              );
            }

            // Context section - show first/last few lines, hide middle
            const showAll = expandedSections().has(groupIndex);
            const hasMany = group.lines.length > context * 2;

            if (!hasMany || showAll) {
              return (
                <div key={groupIndex}>
                  {group.lines.map((line, lineIndex) =>
                    viewMode() === 'unified'
                      ? renderUnifiedLine(line)
                      : renderSplitLine(line)
                  )}
                </div>
              );
            }

            return (
              <div key={groupIndex}>
                {group.lines.slice(0, context).map((line, lineIndex) =>
                  viewMode() === 'unified' ? renderUnifiedLine(line) : renderSplitLine(line)
                )}
                <button
                  onClick={() => toggleSection(groupIndex)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    background: 'var(--color-bg-alt)',
                    border: 'none',
                    borderTop: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-brand)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  ↕ Expand {group.lines.length - context * 2} unchanged lines
                </button>
                {group.lines.slice(-context).map((line, lineIndex) =>
                  viewMode() === 'unified' ? renderUnifiedLine(line) : renderSplitLine(line)
                )}
              </div>
            );
          })
        ) : (
          // Show all lines without collapsing
          diffLines.map((line, index) =>
            viewMode() === 'unified' ? (
              <div key={index}>{renderUnifiedLine(line)}</div>
            ) : (
              <div key={index}>{renderSplitLine(line)}</div>
            )
          )
        )}
      </div>
    </div>
  );
}

/**
 * Inline diff variant - shows only changed lines
 */
export function InlineDiff(props: CodeDiffProps) {
  return <CodeDiff {...props} viewMode="unified" collapsible={true} context={1} />;
}

/**
 * Simple before/after comparison
 */
export function BeforeAfter({
  oldCode,
  newCode,
  language = 'typescript',
  oldTitle = 'Before',
  newTitle = 'After',
}: {
  oldCode: string;
  newCode: string;
  language?: string;
  oldTitle?: string;
  newTitle?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginTop: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(248, 81, 73, 0.1)',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-error)',
          }}
        >
          {oldTitle}
        </div>
        <pre
          style={{
            margin: 0,
            padding: '1rem',
            background: 'var(--color-bg)',
            overflow: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          <code>{oldCode}</code>
        </pre>
      </div>

      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(46, 160, 67, 0.1)',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-success)',
          }}
        >
          {newTitle}
        </div>
        <pre
          style={{
            margin: 0,
            padding: '1rem',
            background: 'var(--color-bg)',
            overflow: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          <code>{newCode}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Example usage:
 *
 * ```tsx
 * // Full-featured diff viewer
 * <CodeDiff
 *   oldCode={oldCode}
 *   newCode={newCode}
 *   filename="api.ts"
 *   language="typescript"
 *   viewMode="split"
 *   showStats
 *   collapsible
 * />
 *
 * // Inline diff (unified view, minimal context)
 * <InlineDiff
 *   oldCode={oldCode}
 *   newCode={newCode}
 *   filename="config.json"
 * />
 *
 * // Simple before/after
 * <BeforeAfter
 *   oldCode="const x = 1;"
 *   newCode="const x = 2;"
 *   oldTitle="v1.0"
 *   newTitle="v2.0"
 * />
 * ```
 */
