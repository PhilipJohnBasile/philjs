/**
 * PhilJS Cells - Type Definitions
 *
 * RedwoodJS-style Cells pattern for declarative data loading.
 */
/**
 * Built-in empty checkers
 */
export const defaultIsEmpty = (data) => {
    if (data === null || data === undefined)
        return true;
    if (Array.isArray(data))
        return data.length === 0;
    if (typeof data === 'object') {
        const values = Object.values(data);
        // Check if all top-level values are empty arrays or null/undefined
        return values.every(v => {
            if (v === null || v === undefined)
                return true;
            if (Array.isArray(v))
                return v.length === 0;
            return false;
        });
    }
    return false;
};
//# sourceMappingURL=types.js.map