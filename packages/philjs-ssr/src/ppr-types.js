/**
 * Partial Prerendering (PPR) Types and Interfaces
 *
 * PPR combines the benefits of static site generation (fast) with
 * server-side rendering (fresh data) by prerendering static shells
 * at build time and streaming dynamic content at request time.
 */
/**
 * PPR placeholder comment format
 */
export const PPR_PLACEHOLDER_START = (id) => `<!--ppr:start:${id}-->`;
export const PPR_PLACEHOLDER_END = (id) => `<!--ppr:end:${id}-->`;
export const PPR_FALLBACK_START = (id) => `<!--ppr:fallback:${id}-->`;
export const PPR_FALLBACK_END = (id) => `<!--ppr:fallback-end:${id}-->`;
/**
 * Extract boundary ID from placeholder comment
 */
export function extractBoundaryId(comment) {
    const startMatch = comment.match(/^ppr:start:(.+)$/);
    if (startMatch && startMatch[1])
        return { type: "start", id: startMatch[1] };
    const endMatch = comment.match(/^ppr:end:(.+)$/);
    if (endMatch && endMatch[1])
        return { type: "end", id: endMatch[1] };
    const fallbackMatch = comment.match(/^ppr:fallback:(.+)$/);
    if (fallbackMatch && fallbackMatch[1])
        return { type: "fallback", id: fallbackMatch[1] };
    return null;
}
/**
 * Hash content for cache invalidation
 */
export async function hashContent(content) {
    if (typeof crypto !== "undefined" && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback for environments without crypto.subtle
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
//# sourceMappingURL=ppr-types.js.map