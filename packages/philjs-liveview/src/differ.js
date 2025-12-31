/**
 * PhilJS LiveView - DOM Differ
 *
 * Computes minimal DOM patches between two HTML strings.
 * Uses morphdom concepts for efficient updates.
 */
/**
 * Create a new differ instance
 */
export function createDiffer() {
    return {
        diff(oldHtml, newHtml) {
            // If identical, no patches needed
            if (oldHtml === newHtml) {
                return [];
            }
            // Parse both HTML strings into virtual DOM
            const oldVdom = parseHtml(oldHtml);
            const newVdom = parseHtml(newHtml);
            // Generate patches
            const patches = diffVdom(oldVdom, newVdom, '');
            // If we can't diff efficiently, just replace the whole thing
            if (patches.length === 0 && oldHtml !== newHtml) {
                return [{ type: 'morph', target: 'body', html: newHtml }];
            }
            return patches;
        },
        patch(html, patches) {
            // For now, if there's a full morph, return the new HTML
            const morphPatch = patches.find(p => p.type === 'morph' && p.target === 'body');
            if (morphPatch && morphPatch.html) {
                return morphPatch.html;
            }
            // Otherwise return unchanged (real implementation would apply patches)
            return html;
        },
    };
}
/**
 * Parse HTML string into virtual DOM
 */
function parseHtml(html) {
    const trimmed = html.trim();
    // Handle text-only content
    if (!trimmed.startsWith('<')) {
        return { type: 'text', content: trimmed };
    }
    // Simple regex-based parser (production would use a proper parser)
    const root = { type: 'element', tag: 'root', children: [] };
    const stack = [root];
    let pos = 0;
    while (pos < trimmed.length) {
        const currentParent = stack[stack.length - 1];
        // Check for comment
        if (trimmed.startsWith('<!--', pos)) {
            const endComment = trimmed.indexOf('-->', pos);
            if (endComment !== -1) {
                const content = trimmed.slice(pos + 4, endComment);
                currentParent.children.push({ type: 'comment', content });
                pos = endComment + 3;
                continue;
            }
        }
        // Check for closing tag
        if (trimmed.startsWith('</', pos)) {
            const endTag = trimmed.indexOf('>', pos);
            if (endTag !== -1) {
                stack.pop();
                pos = endTag + 1;
                continue;
            }
        }
        // Check for opening tag
        if (trimmed[pos] === '<') {
            const tagEnd = trimmed.indexOf('>', pos);
            if (tagEnd !== -1) {
                const tagContent = trimmed.slice(pos + 1, tagEnd);
                const isSelfClosing = tagContent.endsWith('/');
                const cleanContent = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent;
                // Parse tag name and attributes
                const spaceIndex = cleanContent.indexOf(' ');
                const tagName = spaceIndex === -1 ? cleanContent : cleanContent.slice(0, spaceIndex);
                const attrString = spaceIndex === -1 ? '' : cleanContent.slice(spaceIndex + 1);
                const node = {
                    type: 'element',
                    tag: tagName.toLowerCase(),
                    attributes: parseAttributes(attrString),
                    children: [],
                };
                // Extract key from phx-key or data-phx-key
                node.key = node.attributes?.['phx-key'] ?? node.attributes?.['data-phx-key'];
                currentParent.children.push(node);
                // Self-closing tags don't go on the stack
                const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
                if (!isSelfClosing && !selfClosingTags.includes(tagName.toLowerCase())) {
                    stack.push(node);
                }
                pos = tagEnd + 1;
                continue;
            }
        }
        // Text content
        const nextTag = trimmed.indexOf('<', pos);
        if (nextTag === -1) {
            const text = trimmed.slice(pos).trim();
            if (text) {
                currentParent.children.push({ type: 'text', content: text });
            }
            break;
        }
        else {
            const text = trimmed.slice(pos, nextTag).trim();
            if (text) {
                currentParent.children.push({ type: 'text', content: text });
            }
            pos = nextTag;
        }
    }
    return root.children.length === 1 ? root.children[0] : root;
}
/**
 * Parse HTML attributes string
 */
function parseAttributes(attrString) {
    const attrs = {};
    // Match attribute patterns: name="value" or name='value' or name or name=value
    const regex = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        const name = match[1];
        const value = match[2] ?? match[3] ?? match[4] ?? '';
        attrs[name] = value;
    }
    return attrs;
}
// ============================================================================
// Diffing Algorithm
// ============================================================================
/**
 * Diff two virtual DOM trees
 */
function diffVdom(oldNode, newNode, path) {
    const patches = [];
    // Different types - replace entirely
    if (oldNode.type !== newNode.type) {
        if (newNode.type === 'element') {
            patches.push({
                type: 'replace',
                target: path || 'body',
                html: vnodeToHtml(newNode),
            });
        }
        else {
            patches.push({
                type: 'replace',
                target: path || 'body',
                html: newNode.content || '',
            });
        }
        return patches;
    }
    // Text nodes
    if (oldNode.type === 'text' && newNode.type === 'text') {
        if (oldNode.content !== newNode.content) {
            patches.push({
                type: 'replace',
                target: path || 'body',
                html: newNode.content || '',
            });
        }
        return patches;
    }
    // Element nodes
    if (oldNode.type === 'element' && newNode.type === 'element') {
        // Different tags - replace
        if (oldNode.tag !== newNode.tag) {
            patches.push({
                type: 'replace',
                target: path || 'body',
                html: vnodeToHtml(newNode),
            });
            return patches;
        }
        // Diff attributes
        const oldAttrs = oldNode.attributes || {};
        const newAttrs = newNode.attributes || {};
        // Check for changed/new attributes
        for (const [key, value] of Object.entries(newAttrs)) {
            if (oldAttrs[key] !== value) {
                const selector = getSelector(oldNode, path);
                patches.push({
                    type: 'update_attr',
                    target: selector,
                    attr: key,
                    value,
                });
            }
        }
        // Check for removed attributes
        for (const key of Object.keys(oldAttrs)) {
            if (!(key in newAttrs)) {
                const selector = getSelector(oldNode, path);
                patches.push({
                    type: 'remove_attr',
                    target: selector,
                    attr: key,
                });
            }
        }
        // Diff children
        const oldChildren = oldNode.children || [];
        const newChildren = newNode.children || [];
        // Build key maps for keyed diffing
        const oldKeyMap = new Map();
        const newKeyMap = new Map();
        oldChildren.forEach((child, i) => {
            if (child.key)
                oldKeyMap.set(child.key, { node: child, index: i });
        });
        newChildren.forEach((child, i) => {
            if (child.key)
                newKeyMap.set(child.key, { node: child, index: i });
        });
        // Use keyed diffing if keys are present
        if (oldKeyMap.size > 0 || newKeyMap.size > 0) {
            patches.push(...diffKeyedChildren(oldChildren, newChildren, path, oldKeyMap, newKeyMap));
        }
        else {
            // Simple index-based diffing
            patches.push(...diffIndexedChildren(oldChildren, newChildren, path));
        }
    }
    return patches;
}
/**
 * Diff keyed children
 */
function diffKeyedChildren(oldChildren, newChildren, path, oldKeyMap, newKeyMap) {
    const patches = [];
    // Find removed keys
    for (const [key, { index }] of oldKeyMap) {
        if (!newKeyMap.has(key)) {
            patches.push({
                type: 'remove',
                target: `${path} > [phx-key="${key}"], ${path} > [data-phx-key="${key}"]`,
            });
        }
    }
    // Find added keys and updates
    for (const [key, { node: newNode, index: newIndex }] of newKeyMap) {
        const old = oldKeyMap.get(key);
        if (!old) {
            // New element
            const html = vnodeToHtml(newNode);
            if (newIndex === 0) {
                patches.push({ type: 'prepend', target: path, html });
            }
            else {
                patches.push({ type: 'append', target: path, html });
            }
        }
        else {
            // Existing element - diff it
            const childPath = `${path} > [phx-key="${key}"]`;
            patches.push(...diffVdom(old.node, newNode, childPath));
        }
    }
    return patches;
}
/**
 * Diff children by index
 */
function diffIndexedChildren(oldChildren, newChildren, path) {
    const patches = [];
    const maxLen = Math.max(oldChildren.length, newChildren.length);
    for (let i = 0; i < maxLen; i++) {
        const childPath = `${path} > :nth-child(${i + 1})`;
        if (i >= oldChildren.length) {
            // New child
            patches.push({
                type: 'append',
                target: path,
                html: vnodeToHtml(newChildren[i]),
            });
        }
        else if (i >= newChildren.length) {
            // Removed child
            patches.push({
                type: 'remove',
                target: childPath,
            });
        }
        else {
            // Diff existing child
            patches.push(...diffVdom(oldChildren[i], newChildren[i], childPath));
        }
    }
    return patches;
}
/**
 * Get CSS selector for a node
 */
function getSelector(node, path) {
    if (node.attributes?.['id']) {
        return `#${node.attributes['id']}`;
    }
    if (node.key) {
        return `[phx-key="${node.key}"]`;
    }
    return path || node.tag || 'body';
}
/**
 * Convert VNode back to HTML string
 */
function vnodeToHtml(node) {
    if (node.type === 'text') {
        return node.content || '';
    }
    if (node.type === 'comment') {
        return `<!--${node.content}-->`;
    }
    if (node.type === 'element') {
        const attrs = node.attributes
            ? Object.entries(node.attributes)
                .map(([k, v]) => (v === '' ? k : `${k}="${v}"`))
                .join(' ')
            : '';
        const children = (node.children || []).map(vnodeToHtml).join('');
        const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        if (selfClosing.includes(node.tag)) {
            return `<${node.tag}${attrs ? ' ' + attrs : ''} />`;
        }
        return `<${node.tag}${attrs ? ' ' + attrs : ''}>${children}</${node.tag}>`;
    }
    return '';
}
// ============================================================================
// Morphdom Integration
// ============================================================================
/**
 * Apply DOM patches using morphdom (client-side)
 * This is a wrapper that works with morphdom library
 */
export function applyPatches(container, patches) {
    for (const patch of patches) {
        switch (patch.type) {
            case 'morph':
                // Full morph - replace entire container innerHTML
                if (patch.html) {
                    container.innerHTML = patch.html;
                }
                break;
            case 'replace':
                const replaceTarget = container.querySelector(patch.target);
                if (replaceTarget && patch.html) {
                    replaceTarget.outerHTML = patch.html;
                }
                break;
            case 'append':
                const appendTarget = patch.target === 'body' ? container : container.querySelector(patch.target);
                if (appendTarget && patch.html) {
                    appendTarget.insertAdjacentHTML('beforeend', patch.html);
                }
                break;
            case 'prepend':
                const prependTarget = patch.target === 'body' ? container : container.querySelector(patch.target);
                if (prependTarget && patch.html) {
                    prependTarget.insertAdjacentHTML('afterbegin', patch.html);
                }
                break;
            case 'remove':
                const removeTarget = container.querySelector(patch.target);
                if (removeTarget) {
                    removeTarget.remove();
                }
                break;
            case 'update_attr':
                const attrTarget = container.querySelector(patch.target);
                if (attrTarget && patch.attr) {
                    attrTarget.setAttribute(patch.attr, patch.value || '');
                }
                break;
            case 'remove_attr':
                const removeAttrTarget = container.querySelector(patch.target);
                if (removeAttrTarget && patch.attr) {
                    removeAttrTarget.removeAttribute(patch.attr);
                }
                break;
        }
    }
}
// ============================================================================
// Export
// ============================================================================
export { parseHtml, vnodeToHtml };
//# sourceMappingURL=differ.js.map