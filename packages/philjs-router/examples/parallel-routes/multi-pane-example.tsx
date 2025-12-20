/**
 * Example: Email Client with Multi-Pane Layout
 *
 * This example demonstrates:
 * - @folders slot for folder tree
 * - @list slot for email list
 * - @preview slot for email preview
 * - @compose slot for compose modal
 * - Conditional slot rendering based on route
 * - Complex state management across slots
 *
 * File structure:
 * app/
 *   mail/
 *     layout.tsx                    - Email client layout
 *     @folders/page.tsx             - Folder tree
 *     @list/[folder]/page.tsx       - Email list for folder
 *     @preview/[id]/page.tsx        - Email preview
 *     @compose/(.)compose/page.tsx  - Compose modal (intercepted)
 */

import { h } from "philjs-core";
import type { VNode } from "philjs-core";
import {
  createParallelRouteConfig,
  matchParallelRoutes,
  loadParallelSlots,
  renderParallelSlots,
  useSlot,
  useSlots,
  type ParallelRouteConfig,
  type SlotComponentProps,
} from "../../src/parallel-routes.js";

// ============================================================================
// Data Types
// ============================================================================

type Folder = {
  id: string;
  name: string;
  icon: string;
  count: number;
  children?: Folder[];
};

type Email = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  folder: string;
};

// ============================================================================
// Mock Data
// ============================================================================

const folders: Folder[] = [
  { id: "inbox", name: "Inbox", icon: "📥", count: 12 },
  { id: "sent", name: "Sent", icon: "📤", count: 45 },
  { id: "drafts", name: "Drafts", icon: "📝", count: 3 },
  { id: "starred", name: "Starred", icon: "⭐", count: 8 },
  { id: "trash", name: "Trash", icon: "🗑️", count: 5 },
  {
    id: "labels",
    name: "Labels",
    icon: "🏷️",
    count: 0,
    children: [
      { id: "work", name: "Work", icon: "💼", count: 23 },
      { id: "personal", name: "Personal", icon: "🏠", count: 15 },
    ],
  },
];

const emails: Email[] = [
  {
    id: "1",
    from: "alice@example.com",
    subject: "Project Update",
    preview: "Here's the latest update on the project...",
    body: "Hi team,\n\nHere's the latest update on the project. We've made great progress...",
    timestamp: "10:30 AM",
    read: false,
    starred: true,
    folder: "inbox",
  },
  {
    id: "2",
    from: "bob@example.com",
    subject: "Meeting Notes",
    preview: "Following up on today's meeting...",
    body: "Thanks for attending today's meeting. Here are the key takeaways...",
    timestamp: "9:15 AM",
    read: true,
    starred: false,
    folder: "inbox",
  },
  {
    id: "3",
    from: "carol@example.com",
    subject: "Q4 Report",
    preview: "Attached is the Q4 financial report...",
    body: "Please find attached the Q4 financial report for review...",
    timestamp: "Yesterday",
    read: false,
    starred: false,
    folder: "inbox",
  },
];

// ============================================================================
// API Functions
// ============================================================================

async function getFolders(): Promise<Folder[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return folders;
}

async function getEmailsForFolder(folderId: string): Promise<Email[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return emails.filter((email) => email.folder === folderId);
}

async function getEmail(id: string): Promise<Email | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return emails.find((email) => email.id === id) || null;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Folder Tree Component
 */
function FolderTree({ data }: SlotComponentProps): VNode {
  const folders = data as Folder[];

  const renderFolder = (folder: Folder, level = 0): VNode => {
    return h("div", { class: `folder-item level-${level}` }, [
      h(
        "a",
        {
          href: `/mail/${folder.id}`,
          class: "folder-link",
        },
        [
          h("span", { class: "folder-icon" }, folder.icon),
          h("span", { class: "folder-name" }, folder.name),
          folder.count > 0 && h("span", { class: "folder-count" }, String(folder.count)),
        ]
      ),
      folder.children &&
        h(
          "div",
          { class: "folder-children" },
          folder.children.map((child) => renderFolder(child, level + 1))
        ),
    ]);
  };

  return h("div", { class: "folder-tree" }, [
    h("div", { class: "folder-tree-header" }, [
      h("h2", {}, "Folders"),
      h("button", { class: "btn-compose", onclick: () => window.location.href = "/mail/compose" }, "✍️ Compose"),
    ]),
    h("div", { class: "folder-list" }, folders.map((folder) => renderFolder(folder))),
  ]);
}

/**
 * Email List Component
 */
function EmailList({ params, data }: SlotComponentProps): VNode {
  const emails = data as Email[];
  const { folder } = params;

  const folderName = folders.find((f) => f.id === folder)?.name || folder;

  return h("div", { class: "email-list" }, [
    h("div", { class: "email-list-header" }, [
      h("h2", {}, folderName),
      h("div", { class: "email-list-actions" }, [
        h("button", { class: "btn-icon" }, "🔄"),
        h("button", { class: "btn-icon" }, "⋮"),
      ]),
    ]),
    emails.length === 0
      ? h("div", { class: "email-list-empty" }, [
          h("p", {}, "No emails in this folder"),
        ])
      : h(
          "div",
          { class: "email-list-items" },
          emails.map((email) =>
            h(
              "a",
              {
                href: `/mail/${folder}/${email.id}`,
                class: `email-item ${email.read ? "read" : "unread"}`,
              },
              [
                h("div", { class: "email-header" }, [
                  h("span", { class: "email-from" }, email.from),
                  h("span", { class: "email-time" }, email.timestamp),
                ]),
                h("div", { class: "email-subject" }, [
                  email.starred && h("span", { class: "star" }, "⭐"),
                  email.subject,
                ]),
                h("div", { class: "email-preview" }, email.preview),
              ]
            )
          )
        ),
  ]);
}

/**
 * Email Preview Component
 */
function EmailPreview({ params, data }: SlotComponentProps): VNode {
  const email = data as Email | null;

  if (!email) {
    return h("div", { class: "email-preview-empty" }, [
      h("p", {}, "Select an email to view"),
    ]);
  }

  return h("div", { class: "email-preview" }, [
    h("div", { class: "email-preview-header" }, [
      h("div", { class: "email-subject-line" }, [
        h("h2", {}, email.subject),
        email.starred && h("button", { class: "btn-icon" }, "⭐"),
      ]),
      h("div", { class: "email-meta" }, [
        h("div", { class: "email-from-detail" }, [
          h("strong", {}, email.from),
          h("span", { class: "email-to" }, " to me"),
        ]),
        h("span", { class: "email-timestamp" }, email.timestamp),
      ]),
    ]),
    h("div", { class: "email-body" }, [
      h("pre", { class: "email-content" }, email.body),
    ]),
    h("div", { class: "email-actions" }, [
      h("button", { class: "btn-primary" }, "↩️ Reply"),
      h("button", { class: "btn-secondary" }, "↪️ Forward"),
      h("button", { class: "btn-secondary" }, "🗑️ Delete"),
    ]),
  ]);
}

/**
 * Compose Modal Component
 */
function ComposeModal({ data }: SlotComponentProps): VNode {
  return h("div", { class: "modal-backdrop" }, [
    h("div", { class: "compose-modal" }, [
      h("div", { class: "compose-header" }, [
        h("h3", {}, "New Message"),
        h(
          "button",
          {
            class: "close-btn",
            onclick: () => window.history.back(),
          },
          "×"
        ),
      ]),
      h("form", { class: "compose-form" }, [
        h("div", { class: "form-field" }, [
          h("label", {}, "To:"),
          h("input", { type: "email", placeholder: "recipient@example.com" }),
        ]),
        h("div", { class: "form-field" }, [
          h("label", {}, "Subject:"),
          h("input", { type: "text", placeholder: "Subject" }),
        ]),
        h("div", { class: "form-field" }, [
          h("label", {}, "Message:"),
          h("textarea", { rows: 10, placeholder: "Compose your message..." }),
        ]),
        h("div", { class: "compose-actions" }, [
          h("button", { type: "submit", class: "btn-primary" }, "Send"),
          h("button", { type: "button", class: "btn-secondary" }, "Save Draft"),
        ]),
      ]),
    ]),
  ]);
}

/**
 * Email Client Layout
 */
function EmailClientLayout({
  folders,
  list,
  preview,
  compose,
}: {
  folders: VNode | null;
  list: VNode | null;
  preview: VNode | null;
  compose?: VNode | null;
}): VNode {
  return h("div", { class: "email-client" }, [
    h("div", { class: "email-layout" }, [
      h("div", { class: "email-folders" }, folders),
      h("div", { class: "email-list-pane" }, list),
      h("div", { class: "email-preview-pane" }, preview),
    ]),
    compose, // Compose modal overlays everything
  ]);
}

// ============================================================================
// Route Configuration
// ============================================================================

export const emailClientConfig: ParallelRouteConfig = createParallelRouteConfig({
  basePath: "/mail",
  mainSlot: "@list",
  slots: [
    // Folders slot - always present
    {
      name: "@folders",
      path: "/",
      loader: async () => {
        return await getFolders();
      },
      component: FolderTree,
    },
    // List slot - shows emails for folder
    {
      name: "@list",
      path: "/:folder",
      loader: async ({ params }) => {
        return await getEmailsForFolder(params.folder);
      },
      component: EmailList,
    },
    // Preview slot - shows selected email
    {
      name: "@preview",
      path: "/:folder/:id",
      loader: async ({ params }) => {
        return await getEmail(params.id);
      },
      component: EmailPreview,
      optional: true, // Only shows when email is selected
    },
    // Compose slot - modal for composing emails
    {
      name: "@compose",
      path: "(.)compose",
      component: ComposeModal,
      optional: true,
    },
  ],
});

// ============================================================================
// Usage Example
// ============================================================================

export async function renderEmailClient(container: HTMLElement): Promise<void> {
  const pathname = window.location.pathname;

  // Match routes
  const matches = matchParallelRoutes(pathname, emailClientConfig);

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
  const layout = EmailClientLayout({
    folders: rendered["@folders"],
    list: rendered["@list"],
    preview: rendered["@preview"],
    compose: rendered["@compose"],
  });

  // Render to DOM
  container.innerHTML = "";
  container.appendChild(renderToDOM(layout));
}

/**
 * Simple helper to render VNode to DOM
 */
function renderToDOM(vnode: VNode | string | null | boolean): Node {
  if (!vnode || typeof vnode === "boolean" || typeof vnode === "string") {
    return document.createTextNode(typeof vnode === "string" ? vnode : "");
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
 * .email-client {
 *   height: 100vh;
 *   overflow: hidden;
 * }
 *
 * .email-layout {
 *   display: grid;
 *   grid-template-columns: 250px 350px 1fr;
 *   height: 100%;
 * }
 *
 * .email-folders {
 *   background: #f5f5f5;
 *   border-right: 1px solid #ddd;
 *   overflow-y: auto;
 * }
 *
 * .folder-tree-header {
 *   padding: 1rem;
 *   border-bottom: 1px solid #ddd;
 * }
 *
 * .btn-compose {
 *   width: 100%;
 *   padding: 0.75rem;
 *   background: #0066cc;
 *   color: white;
 *   border: none;
 *   border-radius: 6px;
 *   cursor: pointer;
 *   margin-top: 1rem;
 * }
 *
 * .folder-item {
 *   padding: 0.5rem 1rem;
 * }
 *
 * .folder-link {
 *   display: flex;
 *   align-items: center;
 *   gap: 0.5rem;
 *   padding: 0.5rem;
 *   border-radius: 6px;
 *   color: inherit;
 *   text-decoration: none;
 * }
 *
 * .folder-link:hover {
 *   background: #e5e5e5;
 * }
 *
 * .folder-count {
 *   margin-left: auto;
 *   background: #666;
 *   color: white;
 *   padding: 0.25rem 0.5rem;
 *   border-radius: 12px;
 *   font-size: 0.75rem;
 * }
 *
 * .email-list-pane {
 *   background: white;
 *   border-right: 1px solid #ddd;
 *   overflow-y: auto;
 * }
 *
 * .email-list-header {
 *   display: flex;
 *   justify-content: space-between;
 *   align-items: center;
 *   padding: 1rem;
 *   border-bottom: 1px solid #ddd;
 * }
 *
 * .email-item {
 *   display: block;
 *   padding: 1rem;
 *   border-bottom: 1px solid #eee;
 *   color: inherit;
 *   text-decoration: none;
 *   cursor: pointer;
 * }
 *
 * .email-item:hover {
 *   background: #f9f9f9;
 * }
 *
 * .email-item.unread {
 *   background: #f0f7ff;
 *   font-weight: 500;
 * }
 *
 * .email-preview-pane {
 *   background: white;
 *   overflow-y: auto;
 *   padding: 2rem;
 * }
 *
 * .email-preview-empty {
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   height: 100%;
 *   color: #999;
 * }
 *
 * .compose-modal {
 *   background: white;
 *   border-radius: 12px;
 *   max-width: 600px;
 *   width: 90%;
 *   max-height: 80vh;
 *   position: relative;
 *   box-shadow: 0 4px 6px rgba(0,0,0,0.1);
 * }
 *
 * .compose-header {
 *   display: flex;
 *   justify-content: space-between;
 *   align-items: center;
 *   padding: 1.5rem;
 *   border-bottom: 1px solid #eee;
 * }
 *
 * .compose-form {
 *   padding: 1.5rem;
 * }
 *
 * .form-field {
 *   margin-bottom: 1rem;
 * }
 *
 * .form-field input,
 * .form-field textarea {
 *   width: 100%;
 *   padding: 0.75rem;
 *   border: 1px solid #ddd;
 *   border-radius: 6px;
 *   font-family: inherit;
 * }
 * ```
 */
