/**
 * Component Testing Utilities
 *
 * Advanced component testing with:
 * - Visual regression testing
 * - Accessibility testing
 * - Performance testing
 * - Interactive testing
 */

// =============================================================================
// Types
// =============================================================================

export interface ComponentTestConfig {
  /** Component to test */
  component: unknown;
  /** Component props */
  props?: Record<string, unknown>;
  /** Container options */
  container?: HTMLElement;
  /** Whether to enable accessibility checking */
  a11y?: boolean;
  /** Whether to capture performance metrics */
  performance?: boolean;
  /** Viewport size for visual testing */
  viewport?: { width: number; height: number };
}

export interface ComponentTestResult {
  /** Rendered element */
  element: HTMLElement;
  /** Component instance */
  instance: unknown;
  /** Unmount function */
  unmount: () => void;
  /** Rerender with new props */
  rerender: (props: Record<string, unknown>) => void;
  /** Get accessibility report */
  getA11yReport: () => Promise<A11yReport>;
  /** Get performance metrics */
  getPerformance: () => PerformanceMetrics;
  /** Take screenshot */
  screenshot: () => Promise<string>;
  /** Fire event and wait for update */
  act: (fn: () => void | Promise<void>) => Promise<void>;
  /** Query helpers bound to component */
  queries: ComponentQueries;
}

export interface A11yReport {
  violations: A11yViolation[];
  passes: A11yPass[];
  incomplete: A11yIncomplete[];
  score: number;
}

export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface A11yPass {
  id: string;
  description: string;
  nodes: number;
}

export interface A11yIncomplete {
  id: string;
  description: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

export interface PerformanceMetrics {
  renderTime: number;
  rerenderTime: number;
  mountTime: number;
  updateCount: number;
  memoryUsage: number;
  domNodes: number;
  eventListeners: number;
}

export interface ComponentQueries {
  getByRole: (role: string, options?: QueryOptions) => HTMLElement;
  getByText: (text: string | RegExp, options?: QueryOptions) => HTMLElement;
  getByTestId: (testId: string) => HTMLElement;
  getByLabelText: (text: string | RegExp, options?: QueryOptions) => HTMLElement;
  getByPlaceholderText: (text: string | RegExp) => HTMLElement;
  getAllByRole: (role: string, options?: QueryOptions) => HTMLElement[];
  getAllByText: (text: string | RegExp, options?: QueryOptions) => HTMLElement[];
  queryByRole: (role: string, options?: QueryOptions) => HTMLElement | null;
  queryByText: (text: string | RegExp, options?: QueryOptions) => HTMLElement | null;
  findByRole: (role: string, options?: QueryOptions) => Promise<HTMLElement>;
  findByText: (text: string | RegExp, options?: QueryOptions) => Promise<HTMLElement>;
}

export interface QueryOptions {
  name?: string | RegExp;
  hidden?: boolean;
  exact?: boolean;
  selector?: string;
}

export interface VisualTestOptions {
  threshold?: number;
  includeAA?: boolean;
  diffColor?: { r: number; g: number; b: number };
  alpha?: number;
}

export interface VisualDiff {
  match: boolean;
  diffPercentage: number;
  diffPixels: number;
  diffImage?: string;
}

// =============================================================================
// Component Test Runner
// =============================================================================

let renderCount = 0;
let lastRenderTime = 0;

/**
 * Test a component with full lifecycle tracking
 */
export async function testComponent(config: ComponentTestConfig): Promise<ComponentTestResult> {
  const container = config.container || document.createElement('div');
  const startTime = performance.now();
  let instance: unknown = null;
  let updateCount = 0;

  // Set viewport if specified
  if (config.viewport) {
    setViewport(config.viewport.width, config.viewport.height);
  }

  // Render component
  const element = await renderComponent(config.component, config.props, container);
  const mountTime = performance.now() - startTime;
  renderCount++;

  // Track performance
  const performanceMetrics: PerformanceMetrics = {
    renderTime: mountTime,
    rerenderTime: 0,
    mountTime,
    updateCount: 0,
    memoryUsage: getMemoryUsage(),
    domNodes: container.querySelectorAll('*').length,
    eventListeners: countEventListeners(container),
  };

  const result: ComponentTestResult = {
    element,
    instance,
    unmount: () => {
      container.innerHTML = '';
      if (config.container === undefined) {
        container.remove();
      }
    },
    rerender: (props) => {
      const start = performance.now();
      renderComponent(config.component, props, container);
      performanceMetrics.rerenderTime = performance.now() - start;
      performanceMetrics.updateCount++;
      updateCount++;
    },
    getA11yReport: () => runA11yAudit(container),
    getPerformance: () => ({
      ...performanceMetrics,
      domNodes: container.querySelectorAll('*').length,
      eventListeners: countEventListeners(container),
    }),
    screenshot: () => captureScreenshot(container),
    act: async (fn) => {
      await fn();
      await waitForUpdates();
    },
    queries: createQueries(container),
  };

  return result;
}

/**
 * Render component to container
 */
async function renderComponent(
  component: unknown,
  props: Record<string, unknown> | undefined,
  container: HTMLElement
): Promise<HTMLElement> {
  // This is a simplified mock - actual implementation would use PhilJS render
  const el = document.createElement('div');
  el.setAttribute('data-testid', 'component-root');
  el.setAttribute('data-component', String(component));

  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      el.setAttribute(`data-prop-${key}`, JSON.stringify(value));
    });
  }

  container.appendChild(el);
  return el;
}

// =============================================================================
// Query Helpers
// =============================================================================

function createQueries(container: HTMLElement): ComponentQueries {
  return {
    getByRole: (role, options) => {
      const element = container.querySelector(`[role="${role}"]`) as HTMLElement;
      if (!element) throw new Error(`Unable to find element with role: ${role}`);
      return element;
    },
    getByText: (text, options) => {
      const elements = Array.from(container.querySelectorAll('*'));
      const element = elements.find(el => {
        const content = el.textContent || '';
        return text instanceof RegExp ? text.test(content) : content.includes(text);
      }) as HTMLElement;
      if (!element) throw new Error(`Unable to find element with text: ${text}`);
      return element;
    },
    getByTestId: (testId) => {
      const element = container.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
      if (!element) throw new Error(`Unable to find element with testid: ${testId}`);
      return element;
    },
    getByLabelText: (text, options) => {
      const labels = Array.from(container.querySelectorAll('label'));
      const label = labels.find(l => {
        const content = l.textContent || '';
        return text instanceof RegExp ? text.test(content) : content.includes(text);
      });
      if (!label) throw new Error(`Unable to find label with text: ${text}`);
      const id = label.getAttribute('for');
      if (id) {
        return container.querySelector(`#${id}`) as HTMLElement;
      }
      return label.querySelector('input, select, textarea') as HTMLElement;
    },
    getByPlaceholderText: (text) => {
      const elements = container.querySelectorAll('[placeholder]');
      const element = Array.from(elements).find(el => {
        const placeholder = el.getAttribute('placeholder') || '';
        return text instanceof RegExp ? text.test(placeholder) : placeholder.includes(text);
      }) as HTMLElement;
      if (!element) throw new Error(`Unable to find element with placeholder: ${text}`);
      return element;
    },
    getAllByRole: (role, options) => {
      return Array.from(container.querySelectorAll(`[role="${role}"]`)) as HTMLElement[];
    },
    getAllByText: (text, options) => {
      const elements = Array.from(container.querySelectorAll('*'));
      return elements.filter(el => {
        const content = el.textContent || '';
        return text instanceof RegExp ? text.test(content) : content.includes(text);
      }) as HTMLElement[];
    },
    queryByRole: (role, options) => {
      return container.querySelector(`[role="${role}"]`) as HTMLElement | null;
    },
    queryByText: (text, options) => {
      const elements = Array.from(container.querySelectorAll('*'));
      return (elements.find(el => {
        const content = el.textContent || '';
        return text instanceof RegExp ? text.test(content) : content.includes(text);
      }) as HTMLElement) || null;
    },
    findByRole: async (role, options) => {
      return waitForElement(() => container.querySelector(`[role="${role}"]`) as HTMLElement);
    },
    findByText: async (text, options) => {
      return waitForElement(() => {
        const elements = Array.from(container.querySelectorAll('*'));
        return elements.find(el => {
          const content = el.textContent || '';
          return text instanceof RegExp ? text.test(content) : content.includes(text);
        }) as HTMLElement;
      });
    },
  };
}

// =============================================================================
// Visual Testing
// =============================================================================

/**
 * Compare component screenshot with baseline
 */
export async function visualTest(
  config: ComponentTestConfig,
  baselineImage: string,
  options: VisualTestOptions = {}
): Promise<VisualDiff> {
  const result = await testComponent(config);
  const currentImage = await result.screenshot();

  const diff = await compareImages(currentImage, baselineImage, options);

  result.unmount();
  return diff;
}

/**
 * Create visual snapshot
 */
export async function createVisualSnapshot(
  config: ComponentTestConfig,
  name: string
): Promise<string> {
  const result = await testComponent(config);
  const screenshot = await result.screenshot();
  result.unmount();

  // Store snapshot
  storeSnapshot(name, screenshot);
  return screenshot;
}

/**
 * Update visual snapshot
 */
export async function updateVisualSnapshot(
  config: ComponentTestConfig,
  name: string
): Promise<void> {
  const result = await testComponent(config);
  const screenshot = await result.screenshot();
  result.unmount();

  storeSnapshot(name, screenshot);
}

// =============================================================================
// Accessibility Testing
// =============================================================================

/**
 * Run accessibility audit
 */
async function runA11yAudit(container: HTMLElement): Promise<A11yReport> {
  const violations: A11yViolation[] = [];
  const passes: A11yPass[] = [];
  const incomplete: A11yIncomplete[] = [];

  // Check for images without alt text
  const images = container.querySelectorAll('img:not([alt])');
  if (images.length > 0) {
    violations.push({
      id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternate text',
      help: 'Add alt attribute to img elements',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
      nodes: Array.from(images).map(img => ({
        html: img.outerHTML,
        target: [getSelector(img as HTMLElement)],
        failureSummary: 'Image missing alt attribute',
      })),
    });
  } else {
    passes.push({
      id: 'image-alt',
      description: 'All images have alternate text',
      nodes: container.querySelectorAll('img[alt]').length,
    });
  }

  // Check for form labels
  const inputs = container.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])');
  const unlabeledInputs = Array.from(inputs).filter(input => {
    const id = input.getAttribute('id');
    return !id || !container.querySelector(`label[for="${id}"]`);
  });

  if (unlabeledInputs.length > 0) {
    violations.push({
      id: 'label',
      impact: 'critical',
      description: 'Form elements must have labels',
      help: 'Add label element or aria-label attribute',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
      nodes: unlabeledInputs.map(input => ({
        html: input.outerHTML,
        target: [getSelector(input as HTMLElement)],
        failureSummary: 'Form element missing label',
      })),
    });
  }

  // Check for buttons without accessible names
  const buttons = container.querySelectorAll('button:empty:not([aria-label]):not([aria-labelledby])');
  if (buttons.length > 0) {
    violations.push({
      id: 'button-name',
      impact: 'critical',
      description: 'Buttons must have accessible names',
      help: 'Add text content or aria-label to buttons',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
      nodes: Array.from(buttons).map(btn => ({
        html: btn.outerHTML,
        target: [getSelector(btn as HTMLElement)],
        failureSummary: 'Button missing accessible name',
      })),
    });
  }

  // Check for links without accessible names
  const emptyLinks = container.querySelectorAll('a:empty:not([aria-label]):not([aria-labelledby])');
  if (emptyLinks.length > 0) {
    violations.push({
      id: 'link-name',
      impact: 'serious',
      description: 'Links must have discernible text',
      help: 'Add text content or aria-label to links',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/link-name',
      nodes: Array.from(emptyLinks).map(link => ({
        html: link.outerHTML,
        target: [getSelector(link as HTMLElement)],
        failureSummary: 'Link missing accessible name',
      })),
    });
  }

  // Check heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let prevLevel = 0;
  const skippedHeadings: HTMLElement[] = [];

  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]!);
    if (prevLevel > 0 && level > prevLevel + 1) {
      skippedHeadings.push(heading as HTMLElement);
    }
    prevLevel = level;
  });

  if (skippedHeadings.length > 0) {
    violations.push({
      id: 'heading-order',
      impact: 'moderate',
      description: 'Heading levels should not skip',
      help: 'Use sequential heading levels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
      nodes: skippedHeadings.map(h => ({
        html: h.outerHTML,
        target: [getSelector(h)],
        failureSummary: 'Heading level skipped',
      })),
    });
  }

  // Calculate score
  const totalChecks = violations.length + passes.length;
  const score = totalChecks > 0 ? Math.round((passes.length / totalChecks) * 100) : 100;

  return { violations, passes, incomplete, score };
}

/**
 * Assert no accessibility violations
 */
export async function expectNoA11yViolations(
  config: ComponentTestConfig,
  options?: { impact?: 'minor' | 'moderate' | 'serious' | 'critical' }
): Promise<void> {
  const result = await testComponent(config);
  const report = await result.getA11yReport();
  result.unmount();

  const impactOrder = ['minor', 'moderate', 'serious', 'critical'];
  const minImpactIndex = options?.impact ? impactOrder.indexOf(options.impact) : 0;

  const relevantViolations = report.violations.filter(v =>
    impactOrder.indexOf(v.impact) >= minImpactIndex
  );

  if (relevantViolations.length > 0) {
    const messages = relevantViolations.map(v =>
      `[${v.impact}] ${v.description}: ${v.nodes.length} element(s)`
    );
    throw new Error(`Accessibility violations found:\n${messages.join('\n')}`);
  }
}

// =============================================================================
// Performance Testing
// =============================================================================

/**
 * Measure component render performance
 */
export async function measureRenderPerformance(
  config: ComponentTestConfig,
  iterations: number = 100
): Promise<{
  mean: number;
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await testComponent(config);
    times.push(performance.now() - start);
    result.unmount();
  }

  times.sort((a, b) => a - b);

  return {
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    median: times[Math.floor(times.length / 2)]!,
    min: times[0]!,
    max: times[times.length - 1]!,
    p95: times[Math.floor(times.length * 0.95)]!,
    p99: times[Math.floor(times.length * 0.99)]!,
  };
}

/**
 * Assert component renders within time budget
 */
export async function expectRenderWithinBudget(
  config: ComponentTestConfig,
  budgetMs: number
): Promise<void> {
  const start = performance.now();
  const result = await testComponent(config);
  const renderTime = performance.now() - start;
  result.unmount();

  if (renderTime > budgetMs) {
    throw new Error(
      `Component render time (${renderTime.toFixed(2)}ms) exceeded budget (${budgetMs}ms)`
    );
  }
}

// =============================================================================
// Interactive Testing
// =============================================================================

/**
 * Simulate user interaction sequence
 */
export async function interactionTest(
  config: ComponentTestConfig,
  interactions: Array<{
    action: 'click' | 'type' | 'focus' | 'blur' | 'hover' | 'select';
    target: string;
    value?: string;
  }>
): Promise<{ success: boolean; errors: string[] }> {
  const result = await testComponent(config);
  const errors: string[] = [];

  for (const interaction of interactions) {
    try {
      const element = result.element.querySelector(interaction.target) as HTMLElement;
      if (!element) {
        throw new Error(`Element not found: ${interaction.target}`);
      }

      switch (interaction.action) {
        case 'click':
          element.click();
          break;
        case 'type':
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = interaction.value || '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        case 'focus':
          element.focus();
          break;
        case 'blur':
          element.blur();
          break;
        case 'hover':
          element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          break;
        case 'select':
          if (element instanceof HTMLSelectElement) {
            element.value = interaction.value || '';
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
          break;
      }

      await waitForUpdates();
    } catch (error) {
      errors.push(`${interaction.action} on ${interaction.target}: ${(error as Error).message}`);
    }
  }

  result.unmount();
  return { success: errors.length === 0, errors };
}

// =============================================================================
// Utility Functions
// =============================================================================

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
  window.dispatchEvent(new Event('resize'));
}

function getMemoryUsage(): number {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

function countEventListeners(container: HTMLElement): number {
  // Simplified - actual implementation would need browser devtools access
  return container.querySelectorAll('[onclick], [onchange], [onsubmit], [onfocus], [onblur]').length;
}

async function captureScreenshot(element: HTMLElement): Promise<string> {
  // Simplified - actual implementation would use html2canvas or similar
  return `data:image/png;base64,${btoa(element.outerHTML)}`;
}

async function compareImages(
  current: string,
  baseline: string,
  options: VisualTestOptions
): Promise<VisualDiff> {
  // Simplified comparison
  const match = current === baseline;
  const result: VisualDiff = {
    match,
    diffPercentage: match ? 0 : 100,
    diffPixels: match ? 0 : 1000,
  };
  if (!match) {
    result.diffImage = current;
  }
  return result;
}

function storeSnapshot(name: string, data: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`snapshot:${name}`, data);
  }
}

async function waitForUpdates(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

async function waitForElement(
  fn: () => HTMLElement | null | undefined,
  timeout: number = 5000
): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = fn();
    if (element) return element;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error('Element not found within timeout');
}

function getSelector(element: HTMLElement): string {
  if (element.id) return `#${element.id}`;
  if (element.className) return `.${element.className.split(' ').join('.')}`;
  return element.tagName.toLowerCase();
}

// =============================================================================
// Test Fixtures
// =============================================================================

export interface TestFixture<T> {
  setup: () => T | Promise<T>;
  teardown: (data: T) => void | Promise<void>;
}

/**
 * Create reusable test fixture
 */
export function createFixture<T>(config: TestFixture<T>): () => Promise<{
  data: T;
  cleanup: () => Promise<void>;
}> {
  return async () => {
    const data = await config.setup();
    return {
      data,
      cleanup: async () => {
        await config.teardown(data);
      },
    };
  };
}

/**
 * Create component test fixture
 */
export function componentFixture(
  component: unknown,
  defaultProps?: Record<string, unknown>
): (props?: Record<string, unknown>) => Promise<ComponentTestResult> {
  return async (props) => {
    return testComponent({
      component,
      props: { ...defaultProps, ...props },
    });
  };
}
