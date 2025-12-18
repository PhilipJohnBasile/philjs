import { jsx as _jsx } from "philjs-core/jsx-runtime";
/**
 * PhilJS Head Component
 *
 * Manages document head tags (title, meta, link)
 */
import { createContext, useContext, effect, signal } from 'philjs-core';
const HeadContext = createContext(null);
/**
 * Head Provider - Should wrap the app root
 */
export function HeadProvider(props) {
    const metaTags = signal([]);
    const linkTags = signal([]);
    const title = signal('');
    const addMeta = (tag) => {
        const key = tag.key || `${tag.name || tag.property}-${tag.content}`;
        const existing = metaTags().find(t => (t.key && t.key === key) ||
            ((t.name === tag.name || t.property === tag.property) && !t.key));
        if (existing) {
            // Update existing
            metaTags.set(metaTags().map(t => (t.key === key || (t.name === tag.name || t.property === tag.property)) ? tag : t));
        }
        else {
            // Add new
            metaTags.set([...metaTags(), { ...tag, key }]);
        }
        // Return cleanup function
        return () => {
            metaTags.set(metaTags().filter(t => t.key !== key));
        };
    };
    const addLink = (tag) => {
        const key = `${tag.rel}-${tag.href}`;
        linkTags.set([...linkTags().filter(t => !(t.rel === tag.rel && t.href === tag.href)), tag]);
        return () => {
            linkTags.set(linkTags().filter(t => !(t.rel === tag.rel && t.href === tag.href)));
        };
    };
    const setTitle = (newTitle) => {
        title.set(newTitle);
    };
    // Apply to actual document
    effect(() => {
        const cleanup = [];
        // Update title
        const titleUnsubscribe = title.subscribe(t => {
            if (t)
                document.title = t;
        });
        cleanup.push(titleUnsubscribe);
        // Update meta tags
        const metaUnsubscribe = metaTags.subscribe(tags => {
            // Remove old meta tags managed by us
            document.querySelectorAll('meta[data-philjs]').forEach(el => el.remove());
            // Add new meta tags
            tags.forEach(tag => {
                const meta = document.createElement('meta');
                meta.setAttribute('data-philjs', 'true');
                if (tag.name)
                    meta.setAttribute('name', tag.name);
                if (tag.property)
                    meta.setAttribute('property', tag.property);
                meta.setAttribute('content', tag.content);
                document.head.appendChild(meta);
            });
        });
        cleanup.push(metaUnsubscribe);
        // Update link tags
        const linkUnsubscribe = linkTags.subscribe(tags => {
            // Remove old link tags managed by us
            document.querySelectorAll('link[data-philjs]').forEach(el => el.remove());
            // Add new link tags
            tags.forEach(tag => {
                const link = document.createElement('link');
                link.setAttribute('data-philjs', 'true');
                link.setAttribute('rel', tag.rel);
                link.setAttribute('href', tag.href);
                if (tag.as)
                    link.setAttribute('as', tag.as);
                if (tag.type)
                    link.setAttribute('type', tag.type);
                if (tag.sizes)
                    link.setAttribute('sizes', tag.sizes);
                if (tag.media)
                    link.setAttribute('media', tag.media);
                if (tag.crossOrigin)
                    link.setAttribute('crossorigin', tag.crossOrigin);
                document.head.appendChild(link);
            });
        });
        cleanup.push(linkUnsubscribe);
        return () => {
            cleanup.forEach(fn => fn());
        };
    });
    return (_jsx(HeadContext.Provider, { value: { addMeta, addLink, setTitle }, children: props.children }));
}
/**
 * Head Component - Declarative head management
 */
export function Head(props) {
    const context = useContext(HeadContext);
    if (!context) {
        throw new Error('Head must be used within HeadProvider');
    }
    effect(() => {
        const cleanups = [];
        // Process children
        const children = Array.isArray(props.children) ? props.children : [props.children];
        children.forEach(child => {
            if (!child || typeof child !== 'object')
                return;
            // Handle <title>
            if (child.type === 'title' && child.props?.children) {
                context.setTitle(String(child.props.children));
            }
            // Handle <meta>
            if (child.type === 'meta') {
                const cleanup = context.addMeta({
                    name: child.props?.name,
                    property: child.props?.property,
                    content: child.props?.content,
                });
                cleanups.push(cleanup);
            }
            // Handle <link>
            if (child.type === 'link') {
                const cleanup = context.addLink({
                    rel: child.props?.rel,
                    href: child.props?.href,
                    as: child.props?.as,
                    type: child.props?.type,
                    sizes: child.props?.sizes,
                    media: child.props?.media,
                    crossOrigin: child.props?.crossOrigin,
                });
                cleanups.push(cleanup);
            }
        });
        return () => {
            cleanups.forEach(fn => fn());
        };
    });
    return null; // Head doesn't render anything
}
/**
 * Meta Component - Convenience component for meta tags
 */
export function Meta(props) {
    const context = useContext(HeadContext);
    if (!context) {
        throw new Error('Meta must be used within HeadProvider');
    }
    effect(() => {
        return context.addMeta(props);
    });
    return null;
}
/**
 * Link Component - Convenience component for link tags
 */
export function Link(props) {
    const context = useContext(HeadContext);
    if (!context) {
        throw new Error('Link must be used within HeadProvider');
    }
    effect(() => {
        return context.addLink(props);
    });
    return null;
}
/**
 * Title Component - Convenience component for title
 */
export function Title(props) {
    const context = useContext(HeadContext);
    if (!context) {
        throw new Error('Title must be used within HeadProvider');
    }
    effect(() => {
        const title = props.template
            ? props.template.replace('%s', props.children)
            : props.children;
        context.setTitle(title);
    });
    return null;
}
/**
 * useHead hook - Programmatic head management
 */
export function useHead() {
    const context = useContext(HeadContext);
    if (!context) {
        throw new Error('useHead must be used within HeadProvider');
    }
    return context;
}
//# sourceMappingURL=Head.js.map