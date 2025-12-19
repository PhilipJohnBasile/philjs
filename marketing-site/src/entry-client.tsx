import { mountIslands } from "philjs-islands";
import { showOverlay } from "philjs-devtools";

declare global {
  interface Window {
    __PHIL_STATE__?: string;
  }
}

type PhilState = {
  data?: any;
  params?: Record<string, string>;
};

function readState(): PhilState {
  try {
    if (!window.__PHIL_STATE__) return {};
    return deserialize(window.__PHIL_STATE__);
  } catch (error) {
    console.warn("Failed to parse PhilJS state", error);
    return {};
  }
}

function deserialize(b64: string) {
  if (typeof atob === "function") {
    return JSON.parse(atob(b64));
  }

  if (typeof Buffer !== "undefined") {
    return JSON.parse(Buffer.from(b64, "base64").toString());
  }

  throw new Error("deserialize: base64 decoding not supported in this environment");
}

// Enable View Transitions
function enableViewTransitions() {
  if (!("startViewTransition" in document)) {
    return;
  }

  // Intercept navigation clicks
  document.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest("a");
    if (!link || !link.href) return;

    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    if (link.hasAttribute("target")) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    // @ts-ignore - View Transitions API
    document.startViewTransition(() => {
      location.href = link.href;
    });
  });
}

// Enable hover prefetch
function enableHoverPrefetch() {
  const prefetched = new Set<string>();

  document.addEventListener("mouseover", (event) => {
    const link = (event.target as HTMLElement).closest("a[data-prefetch]");
    if (!link || !link.href) return;

    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    if (prefetched.has(url.href)) return;

    prefetched.add(url.href);

    const linkEl = document.createElement("link");
    linkEl.rel = "prefetch";
    linkEl.href = url.href;
    document.head.appendChild(linkEl);
  });
}

// Smooth scroll for anchor links
function enableSmoothScroll() {
  document.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest("a[href^='#']");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    // Update URL without triggering navigation
    history.pushState(null, "", href);
  });
}

// Initialize theme toggle
function initThemeToggle() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  const updateTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    updateTheme(savedTheme === "dark");
  } else {
    updateTheme(prefersDark.matches);
  }

  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    updateTheme(!isDark);
  });

  prefersDark.addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      updateTheme(e.matches);
    }
  });
}

// Add scroll animations
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    }
  );

  document.querySelectorAll("[data-animate]").forEach((el) => {
    observer.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const state = readState();
  void state;

  mountIslands();
  enableViewTransitions();
  enableHoverPrefetch();
  enableSmoothScroll();
  initThemeToggle();
  initScrollAnimations();

  if (import.meta.env.DEV) {
    showOverlay();
  }
});
