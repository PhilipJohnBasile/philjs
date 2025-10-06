/**
 * View Transitions API wrapper for smooth page navigation.
 */

/**
 * Perform a navigation with View Transitions if supported.
 */
export function navigateWithTransition(url: string, callback: () => void) {
  if (!document.startViewTransition) {
    // Fallback for browsers without View Transitions support
    callback();
    return;
  }

  document.startViewTransition(() => {
    callback();
  });
}

/**
 * Enable View Transitions for all same-origin links.
 */
export function enableViewTransitions() {
  if (!document.startViewTransition) {
    return;
  }

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (!link || !link.href) return;

    const url = new URL(link.href);

    // Only handle same-origin links
    if (url.origin !== location.origin) return;

    e.preventDefault();

    navigateWithTransition(url.href, () => {
      history.pushState({}, "", url.href);
      // In a real app, this would trigger a client-side route change
    });
  });
}
