/**
 * Example: Photo Gallery with Modal using Parallel Routes
 *
 * This example demonstrates:
 * - @modal slot for intercepted routes
 * - Soft navigation (client-only modal)
 * - Hard navigation (full page)
 * - State preservation during interception
 *
 * File structure:
 * app/
 *   layout.tsx                    - Root layout with modal slot
 *   page.tsx                      - Gallery grid
 *   @modal/
 *     (.)photos/[id]/page.tsx    - Intercepted modal view
 *   photos/
 *     [id]/page.tsx              - Full page view
 */

import { h } from "philjs-core";
import type { VNode } from "philjs-core";
import {
  createParallelRouteConfig,
  matchParallelRoutes,
  loadParallelSlots,
  renderParallelSlots,
  useSlot,
  useInterceptedNavigation,
  type ParallelRouteConfig,
  type SlotComponentProps,
} from "../../src/parallel-routes.js";

// ============================================================================
// Data Layer
// ============================================================================

type Photo = {
  id: string;
  title: string;
  url: string;
  author: string;
  description: string;
};

const photos: Photo[] = [
  {
    id: "1",
    title: "Mountain Sunset",
    url: "/images/mountain-sunset.jpg",
    author: "Jane Doe",
    description: "A beautiful sunset over the mountains",
  },
  {
    id: "2",
    title: "Ocean Waves",
    url: "/images/ocean-waves.jpg",
    author: "John Smith",
    description: "Crashing waves on a rocky shore",
  },
  {
    id: "3",
    title: "Forest Path",
    url: "/images/forest-path.jpg",
    author: "Alice Johnson",
    description: "A winding path through a dense forest",
  },
];

async function getPhotos(): Promise<Photo[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100));
  return photos;
}

async function getPhoto(id: string): Promise<Photo | null> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100));
  return photos.find((p) => p.id === id) || null;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Gallery Grid - Main page
 */
function GalleryPage({ data }: SlotComponentProps): VNode {
  const photos = data as Photo[];

  return h("div", { class: "gallery-container" }, [
    h("h1", {}, "Photo Gallery"),
    h(
      "div",
      { class: "gallery-grid" },
      photos.map((photo) =>
        h("a", { href: `/photos/${photo.id}`, class: "gallery-item" }, [
          h("img", { src: photo.url, alt: photo.title }),
          h("h3", {}, photo.title),
          h("p", { class: "author" }, `By ${photo.author}`),
        ])
      )
    ),
  ]);
}

/**
 * Photo Modal - Intercepted view
 */
function PhotoModal({ params, data }: SlotComponentProps): VNode {
  const photo = data as Photo | null;
  const { close, isIntercepted } = useInterceptedNavigation();

  if (!photo) {
    return h("div", { class: "modal-error" }, "Photo not found");
  }

  return h("div", { class: "modal-backdrop", onclick: () => close() }, [
    h(
      "div",
      {
        class: "modal-content",
        onclick: (e: Event) => e.stopPropagation(),
      },
      [
        h("div", { class: "modal-header" }, [
          h("h2", {}, photo.title),
          h("button", { class: "close-btn", onclick: () => close() }, "×"),
        ]),
        h("div", { class: "modal-body" }, [
          h("img", { src: photo.url, alt: photo.title, class: "modal-image" }),
          h("div", { class: "modal-info" }, [
            h("p", { class: "author" }, `By ${photo.author}`),
            h("p", { class: "description" }, photo.description),
            h(
              "a",
              {
                href: `/photos/${photo.id}`,
                class: "view-full",
              },
              "View full page"
            ),
          ]),
        ]),
      ]
    ),
  ]);
}

/**
 * Photo Full Page - Full page view
 */
function PhotoPage({ params, data }: SlotComponentProps): VNode {
  const photo = data as Photo | null;

  if (!photo) {
    return h("div", { class: "error-page" }, [
      h("h1", {}, "Photo not found"),
      h("a", { href: "/" }, "Back to gallery"),
    ]);
  }

  return h("div", { class: "photo-page" }, [
    h("a", { href: "/", class: "back-link" }, "← Back to gallery"),
    h("div", { class: "photo-detail" }, [
      h("img", { src: photo.url, alt: photo.title, class: "full-image" }),
      h("div", { class: "photo-info" }, [
        h("h1", {}, photo.title),
        h("p", { class: "author" }, `By ${photo.author}`),
        h("p", { class: "description" }, photo.description),
      ]),
    ]),
  ]);
}

/**
 * Root Layout - Renders children and modal slot
 */
function RootLayout({
  children,
  modal,
}: {
  children: VNode | null;
  modal?: VNode | null;
}): VNode {
  return h("div", { class: "app" }, [
    h("header", { class: "header" }, [
      h("nav", {}, [h("a", { href: "/" }, "Photo Gallery")]),
    ]),
    h("main", { class: "main" }, children),
    modal, // Modal renders on top when intercepted
  ]);
}

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Configure parallel routes for photo gallery.
 */
export const photoGalleryConfig: ParallelRouteConfig = createParallelRouteConfig({
  basePath: "/",
  mainSlot: "children",
  softNavigation: true,
  slots: [
    // Main content slot
    {
      name: "children",
      path: "/",
      loader: async () => {
        return await getPhotos();
      },
      component: GalleryPage,
    },
    // Full page photo view
    {
      name: "children",
      path: "/photos/:id",
      loader: async ({ params }) => {
        return await getPhoto(params.id);
      },
      component: PhotoPage,
    },
    // Modal slot - intercepts /photos/:id for modal view
    {
      name: "@modal",
      path: "(.)photos/:id",
      loader: async ({ params }) => {
        return await getPhoto(params.id);
      },
      component: PhotoModal,
      optional: true, // Modal is optional - only shows when intercepted
    },
  ],
});

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Initialize and render the photo gallery.
 */
export async function renderPhotoGallery(container: HTMLElement): Promise<void> {
  const pathname = window.location.pathname;

  // Match routes
  const matches = matchParallelRoutes(pathname, photoGalleryConfig);

  if (!matches) {
    container.innerHTML = "<h1>404 - Page not found</h1>";
    return;
  }

  // Load data for all slots in parallel
  const request = new Request(window.location.href);
  const loadedSlots = await loadParallelSlots(matches, request);

  // Render all slots
  const searchParams = new URLSearchParams(window.location.search);
  const rendered = renderParallelSlots(loadedSlots, searchParams);

  // Create layout with slots
  const layout = RootLayout({
    children: rendered.children,
    modal: rendered["@modal"],
  });

  // Render to DOM
  container.innerHTML = "";
  container.appendChild(renderToDOM(layout));
}

/**
 * Simple helper to render VNode to DOM
 */
function renderToDOM(vnode: VNode | string | null): Node {
  if (!vnode || typeof vnode === "string") {
    return document.createTextNode(vnode || "");
  }

  const el = document.createElement(vnode.type);

  // Set props
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      if (key === "children") continue;
      if (key.startsWith("on")) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value as EventListener);
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  // Render children
  if (vnode.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];

    for (const child of children) {
      if (child) {
        el.appendChild(renderToDOM(child));
      }
    }
  }

  return el;
}

// ============================================================================
// CSS Styles (for reference)
// ============================================================================

/**
 * Suggested CSS for this example:
 *
 * ```css
 * .gallery-container {
 *   max-width: 1200px;
 *   margin: 0 auto;
 *   padding: 2rem;
 * }
 *
 * .gallery-grid {
 *   display: grid;
 *   grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
 *   gap: 1.5rem;
 * }
 *
 * .gallery-item {
 *   border: 1px solid #ddd;
 *   border-radius: 8px;
 *   overflow: hidden;
 *   transition: transform 0.2s;
 *   cursor: pointer;
 * }
 *
 * .gallery-item:hover {
 *   transform: scale(1.05);
 * }
 *
 * .modal-backdrop {
 *   position: fixed;
 *   inset: 0;
 *   background: rgba(0, 0, 0, 0.8);
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   z-index: 1000;
 * }
 *
 * .modal-content {
 *   background: white;
 *   border-radius: 12px;
 *   max-width: 800px;
 *   max-height: 90vh;
 *   overflow: auto;
 *   position: relative;
 * }
 *
 * .modal-header {
 *   display: flex;
 *   justify-content: space-between;
 *   align-items: center;
 *   padding: 1.5rem;
 *   border-bottom: 1px solid #eee;
 * }
 *
 * .close-btn {
 *   background: none;
 *   border: none;
 *   font-size: 2rem;
 *   cursor: pointer;
 * }
 *
 * .modal-image {
 *   width: 100%;
 *   height: auto;
 * }
 *
 * .photo-page {
 *   max-width: 1200px;
 *   margin: 0 auto;
 *   padding: 2rem;
 * }
 *
 * .full-image {
 *   width: 100%;
 *   max-height: 600px;
 *   object-fit: contain;
 * }
 * ```
 */
