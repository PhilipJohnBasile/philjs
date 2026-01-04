/**
 * Smart Preloading System
 *
 * Predicts user navigation based on:
 * - Hover patterns (time on link, distance traveled)
 * - Mouse trajectory (moving toward a link)
 * - User behavior patterns (frequently visited routes)
 * - Viewport visibility (links about to enter viewport)
 */

export type PreloadStrategy = "hover" | "visible" | "intent" | "eager" | "manual";

export type PreloadOptions = {
  strategy?: PreloadStrategy;
  hoverDelay?: number; // ms to wait before preloading on hover
  intentThreshold?: number; // 0-1, confidence threshold for intent prediction
  maxConcurrent?: number; // max concurrent preload requests
  priority?: "high" | "low" | "auto";
};

export type UserIntentData = {
  mouseX: number;
  mouseY: number;
  mouseVelocity: number;
  mouseDirection: { x: number; y: number };
  hoverDuration: number;
  visitHistory: string[];
  currentPath: string;
};

type PreloadQueueItem = {
  url: string;
  priority: number;
  timestamp: number;
  strategy: PreloadStrategy;
};

// ============================================================================
// Intent Prediction Algorithm
// ============================================================================

/**
 * Calculate probability that user intends to click a link
 * based on mouse trajectory and position
 */
export function calculateClickIntent(
  mousePos: { x: number; y: number },
  mouseVelocity: { x: number; y: number },
  linkBounds: DOMRect
): number {
  // Calculate distance from mouse to link center
  const linkCenter = {
    x: linkBounds.left + linkBounds.width / 2,
    y: linkBounds.top + linkBounds.height / 2,
  };

  const distance = Math.hypot(
    mousePos.x - linkCenter.x,
    mousePos.y - linkCenter.y
  );

  // Normalize distance (closer = higher score)
  const maxDistance = 500; // pixels
  const distanceScore = Math.max(0, 1 - distance / maxDistance);

  // Calculate if mouse is moving toward link
  const vectorToLink = {
    x: linkCenter.x - mousePos.x,
    y: linkCenter.y - mousePos.y,
  };

  const velocityMagnitude = Math.hypot(
    mouseVelocity.x,
    mouseVelocity.y
  );

  let directionScore = 0;
  if (velocityMagnitude > 0) {
    // Dot product of velocity and vector to link
    const dotProduct =
      mouseVelocity.x * vectorToLink.x + mouseVelocity.y * vectorToLink.y;
    const vectorMagnitude = Math.hypot(
      vectorToLink.x,
      vectorToLink.y
    );

    // Cosine similarity (-1 to 1, where 1 is directly toward)
    const cosineSimilarity = dotProduct / (velocityMagnitude * vectorMagnitude);
    directionScore = Math.max(0, cosineSimilarity); // 0 to 1
  }

  // Combined score (weighted average)
  const intent = distanceScore * 0.4 + directionScore * 0.6;

  return Math.max(0, Math.min(1, intent));
}

/**
 * Predict next navigation based on user history
 */
export function predictNextRoute(
  currentPath: string,
  visitHistory: string[]
): Map<string, number> {
  const predictions = new Map<string, number>();

  // Build transition matrix from history
  for (let i = 0; i < visitHistory.length - 1; i++) {
    const from = visitHistory[i];
    const to = visitHistory[i + 1];

    if (from === undefined || to === undefined) continue;

    if (from === currentPath) {
      const current = predictions.get(to) || 0;
      predictions.set(to, current + 1);
    }
  }

  // Normalize to probabilities
  const total = Array.from(predictions.values()).reduce((a, b) => a + b, 0);
  if (total > 0) {
    predictions.forEach((count, route) => {
      predictions.set(route, count / total);
    });
  }

  return predictions;
}

// ============================================================================
// Smart Preloader
// ============================================================================

export class SmartPreloader {
  private queue: PreloadQueueItem[] = [];
  private queueStart = 0;
  private loading = new Set<string>();
  private loaded = new Set<string>();
  private options: Required<PreloadOptions>;

  private mousePos = { x: 0, y: 0 };
  private lastMousePos = { x: 0, y: 0 };
  private mouseVelocity = { x: 0, y: 0 };
  private visitHistory: string[] = [];
  private intentFrame: number | null = null;

  private observers = new Map<Element, IntersectionObserver>();
  private hoverTimers = new Map<string, number>();

  constructor(options: PreloadOptions = {}) {
    this.options = {
      strategy: options.strategy || "intent",
      hoverDelay: options.hoverDelay ?? 50,
      intentThreshold: options.intentThreshold ?? 0.6,
      maxConcurrent: options.maxConcurrent ?? 3,
      priority: options.priority || "auto",
    };

    this.initMouseTracking();
  }

  private initMouseTracking() {
    if (typeof window === "undefined") return;

    // Track mouse position and calculate velocity
    let lastUpdate = Date.now();
    window.addEventListener("mousemove", (e) => {
      const now = Date.now();
      const dt = (now - lastUpdate) / 1000; // seconds

      this.lastMousePos = { ...this.mousePos };
      this.mousePos = { x: e.clientX, y: e.clientY };

      if (dt > 0) {
        this.mouseVelocity = {
          x: (this.mousePos.x - this.lastMousePos.x) / dt,
          y: (this.mousePos.y - this.lastMousePos.y) / dt,
        };
      }

      lastUpdate = now;

      // Check intent for all visible links
      if (this.options.strategy === "intent") {
        this.scheduleIntentCheck();
      }
    });
  }

  private scheduleIntentCheck() {
    if (typeof requestAnimationFrame !== "function") {
      this.checkIntentForVisibleLinks();
      return;
    }
    if (this.intentFrame !== null) return;
    this.intentFrame = requestAnimationFrame(() => {
      this.intentFrame = null;
      this.checkIntentForVisibleLinks();
    });
  }

  private checkIntentForVisibleLinks() {
    const links = document.querySelectorAll("a[href]");

    links.forEach((link) => {
      const href = (link as HTMLAnchorElement).href;
      if (this.loaded.has(href) || this.loading.has(href)) return;

      const bounds = link.getBoundingClientRect();
      const intent = calculateClickIntent(this.mousePos, this.mouseVelocity, bounds);

      if (intent >= this.options.intentThreshold) {
        this.preload(href, { strategy: "intent", priority: "high" });
      }
    });
  }

  /**
   * Register a link for smart preloading
   */
  public register(element: HTMLAnchorElement, options: PreloadOptions = {}) {
    const href = element.href;
    const strategy = options.strategy || this.options.strategy;

    switch (strategy) {
      case "eager":
        this.preload(href, { strategy: "eager", priority: "high" });
        break;

      case "hover":
        this.registerHoverPreload(element, href);
        break;

      case "visible":
        this.registerVisibilityPreload(element, href);
        break;

      case "intent":
        // Intent prediction happens globally via mouse tracking
        break;

      case "manual":
        // Don't preload unless explicitly called
        break;
    }
  }

  private registerHoverPreload(element: HTMLAnchorElement, href: string) {
    const handleMouseEnter = () => {
      const timer = window.setTimeout(() => {
        this.preload(href, { strategy: "hover", priority: "low" });
      }, this.options.hoverDelay);

      this.hoverTimers.set(href, timer);
    };

    const handleMouseLeave = () => {
      const timer = this.hoverTimers.get(href);
      if (timer) {
        clearTimeout(timer);
        this.hoverTimers.delete(href);
      }
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
  }

  private registerVisibilityPreload(element: HTMLAnchorElement, href: string) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preload(href, { strategy: "visible", priority: "low" });
          }
        });
      },
      { rootMargin: "50px" } // Preload 50px before entering viewport
    );

    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * Preload a URL
   */
  public preload(
    url: string,
    options: { strategy: PreloadStrategy; priority?: "high" | "low" | "auto" } = {
      strategy: "manual",
    }
  ): Promise<void> {
    // Skip if already loaded or loading
    if (this.loaded.has(url) || this.loading.has(url)) {
      return Promise.resolve();
    }

    // Calculate priority score
    const priorityScore = this.calculatePriority(url, options);

    // Add to queue
    this.compactQueue();
    this.queue.push({
      url,
      priority: priorityScore,
      timestamp: Date.now(),
      strategy: options.strategy,
    });

    // Sort queue by priority
    this.queue.sort((a, b) => b.priority - a.priority);

    // Process queue
    return this.processQueue();
  }

  private calculatePriority(
    url: string,
    options: { priority?: "high" | "low" | "auto" }
  ): number {
    let score = 50; // Base priority

    // Strategy-based priority
    if (options.priority === "high") {
      score += 30;
    } else if (options.priority === "low") {
      score -= 20;
    }

    // History-based priority
    const predictions = predictNextRoute(
      window.location.pathname,
      this.visitHistory
    );
    const historyScore = predictions.get(url) || 0;
    score += historyScore * 40;

    return Math.max(0, Math.min(100, score));
  }

  private async processQueue(): Promise<void> {
    while (this.queueStart < this.queue.length) {
      const tasks: Array<Promise<void>> = [];

      while (
        this.queueStart < this.queue.length &&
        this.loading.size < this.options.maxConcurrent
      ) {
        const item = this.queue[this.queueStart++];
        if (!item) break;
        tasks.push(this.preloadItem(item));
      }

      if (tasks.length === 0) {
        break;
      }

      await Promise.all(tasks);
    }

    if (this.queueStart >= this.queue.length) {
      this.queue = [];
      this.queueStart = 0;
    }
  }

  private async preloadItem(item: PreloadQueueItem): Promise<void> {
    this.loading.add(item.url);

    try {
      await this.fetchRoute(item.url);
      this.loaded.add(item.url);
    } catch (error) {
      console.warn(`Failed to preload ${item.url}:`, error);
    } finally {
      this.loading.delete(item.url);
    }
  }

  private async fetchRoute(url: string): Promise<void> {
    // Use link prefetch for HTML
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "document";

    document.head.appendChild(link);

    // Also fetch via fetch API for better control
    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        priority: "low" as any, // Use low priority fetch
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Remove failed link
      link.remove();
      throw error;
    }
  }

  /**
   * Record navigation for history-based prediction
   */
  public recordNavigation(path: string) {
    this.visitHistory.push(path);

    // Keep history to last 50 navigations
    if (this.visitHistory.length > 50) {
      this.visitHistory.shift();
    }
  }

  /**
   * Get preload statistics
   */
  public getStats() {
    return {
      loaded: this.loaded.size,
      loading: this.loading.size,
      queued: this.queue.length - this.queueStart,
      visitHistory: this.visitHistory.length,
    };
  }

  /**
   * Clear all preload data
   */
  public clear() {
    this.queue = [];
    this.queueStart = 0;
    this.loading.clear();
    this.loaded.clear();
    this.hoverTimers.forEach((timer) => clearTimeout(timer));
    this.hoverTimers.clear();
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    if (this.intentFrame !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this.intentFrame);
    }
    this.intentFrame = null;
  }

  /**
   * Cleanup
   */
  public destroy() {
    this.clear();
    this.visitHistory = [];
  }

  private compactQueue(): void {
    if (this.queueStart === 0) return;
    this.queue = this.queue.slice(this.queueStart);
    this.queueStart = 0;
  }
}

// ============================================================================
// Global Preloader Instance
// ============================================================================

let globalPreloader: SmartPreloader | null = null;

export function initSmartPreloader(options?: PreloadOptions): SmartPreloader {
  if (globalPreloader) {
    globalPreloader.destroy();
  }

  globalPreloader = new SmartPreloader(options);
  return globalPreloader;
}

export function getSmartPreloader(): SmartPreloader | null {
  return globalPreloader;
}

// ============================================================================
// React-style Hook
// ============================================================================

export function usePreload(
  href: string,
  options: PreloadOptions = {}
): () => void {
  const preloader = getSmartPreloader();

  if (preloader) {
    const preloadOptions: { strategy: PreloadStrategy; priority?: "high" | "low" | "auto" } = {
      strategy: options.strategy || "manual",
    };
    if (options.priority !== undefined) {
      preloadOptions.priority = options.priority;
    }
    preloader.preload(href, preloadOptions);
  }

  return () => {
    // Return manual trigger function
    preloader?.preload(href, { strategy: "manual", priority: "high" });
  };
}

// ============================================================================
// Directive for Links
// ============================================================================

export function preloadLink(
  element: HTMLAnchorElement,
  options: PreloadOptions = {}
) {
  const preloader = getSmartPreloader();

  if (preloader) {
    preloader.register(element, options);
  }

  // Cleanup
  return () => {
    const href = element.href;
    preloader?.clear();
  };
}
