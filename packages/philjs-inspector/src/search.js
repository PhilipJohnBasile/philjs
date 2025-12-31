/**
 * Component search functionality
 */
import { INSPECTOR_STYLES, applyStyles } from './styles.js';
import { searchComponents } from './component-info.js';
let searchBox = null;
let searchInput = null;
let searchResults = null;
let onSelectCallback = null;
/**
 * Show search box
 */
export function showSearchBox(onSelect) {
    if (searchBox) {
        hideSearchBox();
    }
    onSelectCallback = onSelect;
    // Create search box
    searchBox = document.createElement('div');
    applyStyles(searchBox, INSPECTOR_STYLES.searchBox);
    // Create input
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search components... (Ctrl+F)';
    applyStyles(searchInput, INSPECTOR_STYLES.searchInput);
    // Create results container
    searchResults = document.createElement('div');
    applyStyles(searchResults, INSPECTOR_STYLES.searchResults);
    searchBox.appendChild(searchInput);
    searchBox.appendChild(searchResults);
    document.body.appendChild(searchBox);
    // Setup event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeyDown);
    // Focus input
    searchInput.focus();
}
/**
 * Hide search box
 */
export function hideSearchBox() {
    if (searchBox) {
        searchBox.remove();
        searchBox = null;
        searchInput = null;
        searchResults = null;
        onSelectCallback = null;
    }
}
/**
 * Check if search box is visible
 */
export function isSearchBoxVisible() {
    return searchBox !== null;
}
/**
 * Handle search input
 */
function handleSearchInput(event) {
    const query = event.target.value.trim();
    if (!searchResults)
        return;
    if (query.length === 0) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }
    // Search components
    const results = searchComponents(query);
    if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding: 12px; color: #9ca3af; text-align: center;">No components found</div>';
        searchResults.style.display = 'block';
        return;
    }
    // Render results
    searchResults.innerHTML = results
        .slice(0, 10) // Limit to 10 results
        .map((component, index) => `
      <div class="philjs-search-result" data-index="${index}" data-component-id="${component.id}"
           style="${stylesToString(INSPECTOR_STYLES.searchResultItem)}">
        <div style="font-weight: 600; color: #60a5fa;">${escapeHtml(component.name)}</div>
        <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
          ${component.path.slice(-3).join(' > ')}
        </div>
      </div>
    `)
        .join('');
    searchResults.style.display = 'block';
    // Add click handlers
    const resultElements = searchResults.querySelectorAll('.philjs-search-result');
    resultElements.forEach((element, index) => {
        element.addEventListener('click', () => {
            const result = results[index];
            if (result) {
                selectSearchResult(result);
            }
        });
        // Hover effect
        element.addEventListener('mouseenter', () => {
            element.style.background = 'rgba(59, 130, 246, 0.2)';
        });
        element.addEventListener('mouseleave', () => {
            element.style.background = 'transparent';
        });
    });
}
/**
 * Handle keyboard navigation in search
 */
function handleSearchKeyDown(event) {
    if (!searchResults)
        return;
    const resultElements = Array.from(searchResults.querySelectorAll('.philjs-search-result'));
    if (resultElements.length === 0)
        return;
    const selectedIndex = resultElements.findIndex((el) => el.style.background.includes('rgba(59, 130, 246, 0.2)'));
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = selectedIndex < resultElements.length - 1 ? selectedIndex + 1 : 0;
        selectResultByIndex(resultElements, nextIndex);
    }
    else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : resultElements.length - 1;
        selectResultByIndex(resultElements, prevIndex);
    }
    else if (event.key === 'Enter') {
        event.preventDefault();
        if (selectedIndex !== -1) {
            const selectedElement = resultElements[selectedIndex];
            if (selectedElement) {
                const componentId = selectedElement.getAttribute('data-component-id');
                if (componentId) {
                    const component = searchComponents('').find((c) => c.id === componentId);
                    if (component) {
                        selectSearchResult(component);
                    }
                }
            }
        }
        else if (resultElements.length > 0) {
            // Select first result
            const firstElement = resultElements[0];
            if (firstElement) {
                const componentId = firstElement.getAttribute('data-component-id');
                if (componentId) {
                    const component = searchComponents('').find((c) => c.id === componentId);
                    if (component) {
                        selectSearchResult(component);
                    }
                }
            }
        }
    }
    else if (event.key === 'Escape') {
        event.preventDefault();
        hideSearchBox();
    }
}
/**
 * Select result by index
 */
function selectResultByIndex(elements, index) {
    elements.forEach((el, i) => {
        el.style.background = i === index ? 'rgba(59, 130, 246, 0.2)' : 'transparent';
    });
    // Scroll into view
    const targetElement = elements[index];
    if (targetElement) {
        targetElement.scrollIntoView({ block: 'nearest' });
    }
}
/**
 * Select search result
 */
function selectSearchResult(component) {
    if (onSelectCallback) {
        onSelectCallback(component);
    }
    hideSearchBox();
}
/**
 * Convert styles object to CSS string
 */
function stylesToString(styles) {
    return Object.entries(styles)
        .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
    })
        .join('; ');
}
/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Filter components by criteria
 */
export function filterComponents(components, criteria) {
    return components.filter((component) => {
        if (criteria.name && !component.name.toLowerCase().includes(criteria.name.toLowerCase())) {
            return false;
        }
        if (criteria.isIsland !== undefined && component.isIsland !== criteria.isIsland) {
            return false;
        }
        if (criteria.isHydrated !== undefined && component.isHydrated !== criteria.isHydrated) {
            return false;
        }
        if (criteria.hasProp && !(criteria.hasProp in component.props)) {
            return false;
        }
        if (criteria.hasSignal &&
            !component.signals.some((s) => s.name.includes(criteria.hasSignal))) {
            return false;
        }
        return true;
    });
}
/**
 * Get search statistics
 */
export function getSearchStats(components) {
    return {
        total: components.length,
        islands: components.filter((c) => c.isIsland).length,
        hydrated: components.filter((c) => c.isHydrated).length,
        withSignals: components.filter((c) => c.signals.length > 0).length,
    };
}
//# sourceMappingURL=search.js.map