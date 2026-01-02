/**
 * PhilJS Head Component
 *
 * Manages document head tags (title, meta, link)
 */
import { createContext, useContext, effect, signal } from '@philjs/core';
import type { JSX } from '@philjs/core/jsx-runtime';
import type { LinkTag, MetaTag } from './types';

interface HeadContextValue {
  addMeta: (tag: MetaTag) => () => void;
  addLink: (tag: LinkTag) => () => void;
  setTitle: (title: string) => void;
}

const HeadContext = createContext<HeadContextValue | null>(null);

export interface HeadProviderProps {
  children?: JSX.Element | JSX.Element[] | string | null;
}

/**
 * Head Provider - Should wrap the app root
 */
export function HeadProvider(props: HeadProviderProps): JSX.Element {
  const metaTags = signal<MetaTag[]>([]);
  const linkTags = signal<LinkTag[]>([]);
  const title = signal('');

  const addMeta = (tag: MetaTag): (() => void) => {
    const key = tag.key || `${tag.name || tag.property}-${tag.content}`;
    const existing = metaTags().find(
      (t) =>
        (t.key && t.key === key) ||
        ((t.name === tag.name || t.property === tag.property) && !t.key)
    );

    if (existing) {
      // Update existing
      metaTags.set(
        metaTags().map((t) =>
          t.key === key || t.name === tag.name || t.property === tag.property ? tag : t
        )
      );
    } else {
      // Add new
      metaTags.set([...metaTags(), { ...tag, key }]);
    }

    // Return cleanup function
    return () => {
      metaTags.set(metaTags().filter((t) => t.key !== key));
    };
  };

  const addLink = (tag: LinkTag): (() => void) => {
    const key = `${tag.rel}-${tag.href}`;
    linkTags.set([
      ...linkTags().filter((t) => !(t.rel === tag.rel && t.href === tag.href)),
      { ...tag, key },
    ]);

    return () => {
      linkTags.set(linkTags().filter((t) => !(t.rel === tag.rel && t.href === tag.href)));
    };
  };

  const setTitle = (newTitle: string): void => {
    title.set(newTitle);
  };

  // Apply to actual document
  effect(() => {
    const cleanup: Array<() => void> = [];

    // Update title
    const titleUnsubscribe = title.subscribe((t) => {
      if (t) document.title = t;
    });
    cleanup.push(titleUnsubscribe);

    // Update meta tags
    const metaUnsubscribe = metaTags.subscribe((tags) => {
      // Remove old meta tags managed by us
      document.querySelectorAll('meta[data-philjs]').forEach((el) => el.remove());

      // Add new meta tags
      tags.forEach((tag) => {
        const meta = document.createElement('meta');
        meta.setAttribute('data-philjs', 'true');
        if (tag.name) meta.setAttribute('name', tag.name);
        if (tag.property) meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        document.head.appendChild(meta);
      });
    });
    cleanup.push(metaUnsubscribe);

    // Update link tags
    const linkUnsubscribe = linkTags.subscribe((tags) => {
      // Remove old link tags managed by us
      document.querySelectorAll('link[data-philjs]').forEach((el) => el.remove());

      // Add new link tags
      tags.forEach((tag) => {
        const link = document.createElement('link');
        link.setAttribute('data-philjs', 'true');
        link.setAttribute('rel', tag.rel);
        link.setAttribute('href', tag.href);
        if (tag.as) link.setAttribute('as', tag.as);
        if (tag.type) link.setAttribute('type', tag.type);
        if (tag.sizes) link.setAttribute('sizes', tag.sizes);
        if (tag.media) link.setAttribute('media', tag.media);
        if (tag.crossOrigin) link.setAttribute('crossorigin', tag.crossOrigin);
        if (tag.hrefLang) link.setAttribute('hreflang', tag.hrefLang);
        document.head.appendChild(link);
      });
    });
    cleanup.push(linkUnsubscribe);

    return () => {
      cleanup.forEach((fn) => fn());
    };
  });

  return (
    <HeadContext.Provider value={{ addMeta, addLink, setTitle }}>
      {props.children}
    </HeadContext.Provider>
  );
}

export interface HeadProps {
  children?: JSX.Element | JSX.Element[] | string | null;
}

/**
 * Head Component - Declarative head management
 */
export function Head(props: HeadProps): null {
  const context = useContext(HeadContext);
  if (!context) {
    throw new Error('Head must be used within HeadProvider');
  }

  effect(() => {
    const cleanups: Array<() => void> = [];

    const children = Array.isArray(props.children)
      ? props.children
      : props.children
        ? [props.children]
        : [];

    children.forEach((child) => {
      if (!child || typeof child !== 'object') return;

      const typedChild = child as { type?: string; props?: Record<string, unknown> };
      if (!typedChild.type) return;

      // Handle <title>
      if (typedChild.type === 'title' && typedChild.props?.children) {
        context.setTitle(String(typedChild.props.children));
      }

      // Handle <meta>
      if (typedChild.type === 'meta') {
        const cleanup = context.addMeta({
          name: typedChild.props?.name as string | undefined,
          property: typedChild.props?.property as string | undefined,
          content: String(typedChild.props?.content ?? ''),
        });
        cleanups.push(cleanup);
      }

      // Handle <link>
      if (typedChild.type === 'link') {
        const cleanup = context.addLink({
          rel: String(typedChild.props?.rel ?? ''),
          href: String(typedChild.props?.href ?? ''),
          as: typedChild.props?.as as string | undefined,
          type: typedChild.props?.type as string | undefined,
          sizes: typedChild.props?.sizes as string | undefined,
          media: typedChild.props?.media as string | undefined,
          crossOrigin: typedChild.props?.crossOrigin as string | undefined,
          hrefLang: typedChild.props?.hrefLang as string | undefined,
        });
        cleanups.push(cleanup);
      }
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  });

  return null; // Head doesn't render anything
}

/**
 * Meta Component - Convenience component for meta tags
 */
export function Meta(props: MetaTag): null {
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
export function Link(props: LinkTag): null {
  const context = useContext(HeadContext);
  if (!context) {
    throw new Error('Link must be used within HeadProvider');
  }

  effect(() => {
    return context.addLink(props);
  });

  return null;
}

export interface TitleProps {
  children: string | number;
  template?: string;
}

/**
 * Title Component - Convenience component for title
 */
export function Title(props: TitleProps): null {
  const context = useContext(HeadContext);
  if (!context) {
    throw new Error('Title must be used within HeadProvider');
  }

  effect(() => {
    const resolvedTitle = props.template
      ? props.template.replace('%s', String(props.children))
      : String(props.children);
    context.setTitle(resolvedTitle);
  });

  return null;
}

/**
 * useHead hook - Programmatic head management
 */
export function useHead(): HeadContextValue {
  const context = useContext(HeadContext);
  if (!context) {
    throw new Error('useHead must be used within HeadProvider');
  }
  return context;
}
