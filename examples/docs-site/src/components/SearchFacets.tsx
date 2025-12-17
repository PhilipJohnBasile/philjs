import { signal } from 'philjs-core';

interface Facet {
  id: string;
  label: string;
  count?: number;
}

interface FacetGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range';
  facets: Facet[];
}

interface SearchFacetsProps {
  facetGroups?: FacetGroup[];
  selectedFacets?: Record<string, string[]>;
  onFacetChange?: (facetGroupId: string, facetId: string, selected: boolean) => void;
  onClearAll?: () => void;
  sortOptions?: { id: string; label: string }[];
  selectedSort?: string;
  onSortChange?: (sortId: string) => void;
  resultCount?: number;
}

// Mock facet data for demonstration
const defaultFacetGroups: FacetGroup[] = [
  {
    id: 'content-type',
    label: 'Content Type',
    type: 'checkbox',
    facets: [
      { id: 'guide', label: 'Guides', count: 42 },
      { id: 'api', label: 'API Reference', count: 156 },
      { id: 'example', label: 'Examples', count: 38 },
      { id: 'blog', label: 'Blog Posts', count: 24 },
    ],
  },
  {
    id: 'category',
    label: 'Category',
    type: 'checkbox',
    facets: [
      { id: 'getting-started', label: 'Getting Started', count: 12 },
      { id: 'core-concepts', label: 'Core Concepts', count: 28 },
      { id: 'routing', label: 'Routing', count: 15 },
      { id: 'state-management', label: 'State Management', count: 22 },
      { id: 'ssr', label: 'Server-Side Rendering', count: 18 },
      { id: 'performance', label: 'Performance', count: 14 },
    ],
  },
  {
    id: 'difficulty',
    label: 'Difficulty Level',
    type: 'radio',
    facets: [
      { id: 'beginner', label: 'Beginner', count: 45 },
      { id: 'intermediate', label: 'Intermediate', count: 68 },
      { id: 'advanced', label: 'Advanced', count: 32 },
    ],
  },
  {
    id: 'version',
    label: 'Version',
    type: 'checkbox',
    facets: [
      { id: 'v2', label: 'v2.x (Latest)', count: 180 },
      { id: 'v1', label: 'v1.x (Legacy)', count: 80 },
    ],
  },
];

const defaultSortOptions = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'date-desc', label: 'Newest First' },
  { id: 'date-asc', label: 'Oldest First' },
  { id: 'title-asc', label: 'Title (A-Z)' },
  { id: 'title-desc', label: 'Title (Z-A)' },
];

export function SearchFacets({
  facetGroups = defaultFacetGroups,
  selectedFacets: initialSelectedFacets = {},
  onFacetChange,
  onClearAll,
  sortOptions = defaultSortOptions,
  selectedSort: initialSort = 'relevance',
  onSortChange,
  resultCount,
}: SearchFacetsProps) {
  const selectedFacets = signal<Record<string, string[]>>(initialSelectedFacets);
  const selectedSort = signal(initialSort);
  const expandedGroups = signal<Record<string, boolean>>(
    Object.fromEntries(facetGroups.map((group) => [group.id, true]))
  );

  const handleFacetChange = (groupId: string, facetId: string, checked: boolean) => {
    const group = facetGroups.find((g) => g.id === groupId);
    if (!group) return;

    const currentSelections = selectedFacets()[groupId] || [];

    let newSelections: string[];
    if (group.type === 'radio') {
      // Radio: only one selection allowed
      newSelections = checked ? [facetId] : [];
    } else {
      // Checkbox: multiple selections allowed
      newSelections = checked
        ? [...currentSelections, facetId]
        : currentSelections.filter((id) => id !== facetId);
    }

    selectedFacets.set({
      ...selectedFacets(),
      [groupId]: newSelections,
    });

    if (onFacetChange) {
      onFacetChange(groupId, facetId, checked);
    }
  };

  const handleClearAll = () => {
    selectedFacets.set({});
    if (onClearAll) {
      onClearAll();
    }
  };

  const handleSortChange = (sortId: string) => {
    selectedSort.set(sortId);
    if (onSortChange) {
      onSortChange(sortId);
    }
  };

  const toggleGroup = (groupId: string) => {
    expandedGroups.set({
      ...expandedGroups(),
      [groupId]: !expandedGroups()[groupId],
    });
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedFacets()).reduce((sum, arr) => sum + arr.length, 0);
  };

  const isFacetSelected = (groupId: string, facetId: string) => {
    return (selectedFacets()[groupId] || []).includes(facetId);
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              margin: 0,
              marginBottom: '0.25rem',
            }}
          >
            🔍 Filter Results
          </h3>
          {resultCount !== undefined && (
            <div
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              {resultCount} {resultCount === 1 ? 'result' : 'results'} found
            </div>
          )}
        </div>

        {getTotalSelectedCount() > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-brand)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Clear All ({getTotalSelectedCount()})
          </button>
        )}
      </div>

      {/* Sort Options */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '0.5rem',
          }}
        >
          Sort By
        </label>
        <select
          value={selectedSort()}
          onChange={(e: Event) => handleSortChange((e.target as HTMLSelectElement).value)}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text)',
            fontSize: '0.9375rem',
            cursor: 'pointer',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Facet Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {facetGroups.map((group) => (
          <div
            key={group.id}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text)',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--transition-fast)',
              }}
            >
              <span>{group.label}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                style={{
                  transform: expandedGroups()[group.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                <polyline
                  points="6 9 12 15 18 9"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            {/* Group Facets */}
            {expandedGroups()[group.id] && (
              <div
                style={{
                  padding: '0.5rem 1rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                {group.facets.map((facet) => {
                  const isSelected = isFacetSelected(group.id, facet.id);
                  return (
                    <label
                      key={facet.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                        background: isSelected
                          ? 'var(--color-accent-light)'
                          : 'transparent',
                      }}
                    >
                      <input
                        type={group.type === 'radio' ? 'radio' : 'checkbox'}
                        name={group.type === 'radio' ? group.id : undefined}
                        checked={isSelected}
                        onChange={(e: Event) =>
                          handleFacetChange(
                            group.id,
                            facet.id,
                            (e.target as HTMLInputElement).checked
                          )
                        }
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: 'var(--color-brand)',
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.875rem',
                          color: 'var(--color-text)',
                        }}
                      >
                        {facet.label}
                      </span>
                      {facet.count !== undefined && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            background: 'var(--color-bg-alt)',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {facet.count}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Filters */}
      {getTotalSelectedCount() > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.75rem',
            }}
          >
            Active Filters
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(selectedFacets()).map(([groupId, facetIds]) =>
              facetIds.map((facetId) => {
                const group = facetGroups.find((g) => g.id === groupId);
                const facet = group?.facets.find((f) => f.id === facetId);
                if (!facet) return null;

                return (
                  <button
                    key={`${groupId}-${facetId}`}
                    onClick={() => handleFacetChange(groupId, facetId, false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      background: 'var(--color-brand)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span>{facet.label}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
