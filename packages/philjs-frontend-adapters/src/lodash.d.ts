
/**
 * PhilJS Lodash Replacement Guide
 * 
 * Instead of: import { map } from 'lodash';
 * Use: items.map(...)
 * 
 * Instead of: import { get } from 'lodash';
 * Use: Optional chaining ?.
 * 
 * This file serves as a documentation hint for IDEs.
 */
export type LodashReplacements = {
    map: 'Array.prototype.map',
    filter: 'Array.prototype.filter',
    reduce: 'Array.prototype.reduce'
};
