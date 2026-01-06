/**
 * @philjs/testing - Stagehand AI Browser Testing
 *
 * Integration with Stagehand for AI-driven browser testing.
 * Uses natural language instructions to interact with web pages.
 *
 * @see https://github.com/browserbase/stagehand
 */

export interface StagehandConfig {
    /** Browser to use */
    browser?: 'chromium' | 'firefox' | 'webkit';
    /** Headless mode */
    headless?: boolean;
    /** AI model to use for instructions */
    model?: string;
    /** OpenAI API key (for AI features) */
    apiKey?: string;
    /** Slow motion delay (ms) */
    slowMo?: number;
    /** Screenshot on failure */
    screenshotOnFailure?: boolean;
    /** Video recording */
    video?: boolean;
    /** Viewport size */
    viewport?: { width: number; height: number };
    /** Base URL for relative navigation */
    baseURL?: string;
    /** Timeout for operations (ms) */
    timeout?: number;
}

export interface StagehandTestOptions {
    /** Test timeout (ms) */
    timeout?: number;
    /** Retry failed tests */
    retries?: number;
    /** Tags for test filtering */
    tags?: string[];
}

export interface StagehandAction {
    type: 'click' | 'type' | 'navigate' | 'wait' | 'extract' | 'assert' | 'screenshot';
    selector?: string;
    value?: string;
    description?: string;
}

export interface StagehandResult {
    success: boolean;
    steps: StagehandStepResult[];
    duration: number;
    screenshots?: string[];
    video?: string;
    error?: string;
}

export interface StagehandStepResult {
    action: string;
    success: boolean;
    duration: number;
    error?: string;
    screenshot?: string;
    extractedData?: any;
}

/**
 * Stagehand page wrapper with AI-powered interactions
 */
export class StagehandPage {
    private page: any; // Playwright Page
    private config: StagehandConfig;
    private steps: StagehandStepResult[] = [];
    private startTime: number = 0;

    constructor(page: any, config: StagehandConfig = {}) {
        this.page = page;
        this.config = {
            timeout: 30000,
            headless: true,
            ...config,
        };
    }

    /**
     * Navigate to a URL
     */
    async goto(url: string): Promise<void> {
        const fullUrl = this.config.baseURL
            ? new URL(url, this.config.baseURL).href
            : url;

        const stepStart = Date.now();
        try {
            await this.page.goto(fullUrl, { timeout: this.config.timeout });
            this.steps.push({
                action: `Navigate to ${url}`,
                success: true,
                duration: Date.now() - stepStart,
            });
        } catch (error) {
            this.steps.push({
                action: `Navigate to ${url}`,
                success: false,
                duration: Date.now() - stepStart,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * AI-powered action: perform an action described in natural language
     */
    async act(instruction: string): Promise<void> {
        const stepStart = Date.now();
        const action = await this.parseInstruction(instruction);

        try {
            await this.executeAction(action);
            this.steps.push({
                action: instruction,
                success: true,
                duration: Date.now() - stepStart,
            });
        } catch (error) {
            const screenshot = this.config.screenshotOnFailure
                ? await this.captureScreenshot()
                : undefined;

            this.steps.push({
                action: instruction,
                success: false,
                duration: Date.now() - stepStart,
                error: error instanceof Error ? error.message : 'Unknown error',
                screenshot,
            });
            throw error;
        }
    }

    /**
     * AI-powered extraction: extract data described in natural language
     */
    async extract<T = string>(instruction: string): Promise<T> {
        const stepStart = Date.now();

        try {
            // Use AI to determine what to extract
            const extractionPlan = await this.planExtraction(instruction);
            const result = await this.executeExtraction(extractionPlan);

            this.steps.push({
                action: `Extract: ${instruction}`,
                success: true,
                duration: Date.now() - stepStart,
                extractedData: result,
            });

            return result as T;
        } catch (error) {
            this.steps.push({
                action: `Extract: ${instruction}`,
                success: false,
                duration: Date.now() - stepStart,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * AI-powered observation: check page state described in natural language
     */
    async observe(instruction: string): Promise<boolean> {
        const stepStart = Date.now();

        try {
            const result = await this.checkObservation(instruction);

            this.steps.push({
                action: `Observe: ${instruction}`,
                success: true,
                duration: Date.now() - stepStart,
                extractedData: { observed: result },
            });

            return result;
        } catch (error) {
            this.steps.push({
                action: `Observe: ${instruction}`,
                success: false,
                duration: Date.now() - stepStart,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Click on an element matching the selector or description
     */
    async click(selectorOrDescription: string): Promise<void> {
        const stepStart = Date.now();

        try {
            const selector = await this.resolveSelector(selectorOrDescription);
            await this.page.click(selector, { timeout: this.config.timeout });

            this.steps.push({
                action: `Click: ${selectorOrDescription}`,
                success: true,
                duration: Date.now() - stepStart,
            });
        } catch (error) {
            this.steps.push({
                action: `Click: ${selectorOrDescription}`,
                success: false,
                duration: Date.now() - stepStart,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Type text into an element
     */
    async type(selectorOrDescription: string, text: string): Promise<void> {
        const stepStart = Date.now();

        try {
            const selector = await this.resolveSelector(selectorOrDescription);
            await this.page.fill(selector, text, { timeout: this.config.timeout });

            this.steps.push({
                action: `Type "${text}" into ${selectorOrDescription}`,
                success: true,
                duration: Date.now() - stepStart,
            });
        } catch (error) {
            this.steps.push({
                action: `Type "${text}" into ${selectorOrDescription}`,
                success: false,
                duration: Date.now() - stepStart,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Wait for an element or condition
     */
    async waitFor(selectorOrCondition: string, options?: { timeout?: number }): Promise<void> {
        const stepStart = Date.now();
        const timeout = options?.timeout || this.config.timeout;

        try {
            if (selectorOrCondition.startsWith('//') || selectorOrCondition.startsWith('#') || selectorOrCondition.startsWith('.')) {
                // CSS or XPath selector
                await this.page.waitForSelector(selectorOrCondition, { timeout });
            } else {
                // Natural language condition - resolve to selector
                const selector = await this.resolveSelector(selectorOrCondition);
                await this.page.waitForSelector(selector, { timeout });
            }

            this.steps.push({
                action: `Wait for: ${selectorOrCondition}`,
                success: true,
                duration: Date.now() - stepStart,
            });
        } catch (error) {
            this.steps.push({
                action: `Wait for: ${selectorOrCondition}`,
                success: false,
                duration: Date.now() - stepStart,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Take a screenshot
     */
    async screenshot(name?: string): Promise<string> {
        const path = name ? `screenshots/${name}.png` : await this.generateScreenshotPath();
        await this.page.screenshot({ path, fullPage: true });

        this.steps.push({
            action: `Screenshot: ${path}`,
            success: true,
            duration: 0,
            screenshot: path,
        });

        return path;
    }

    /**
     * Assert a condition using natural language
     */
    async assert(condition: string): Promise<void> {
        const result = await this.observe(condition);
        if (!result) {
            throw new Error(`Assertion failed: ${condition}`);
        }
    }

    /**
     * Get the result of the test run
     */
    getResult(): StagehandResult {
        return {
            success: this.steps.every(s => s.success),
            steps: this.steps,
            duration: Date.now() - this.startTime,
            screenshots: this.steps
                .filter(s => s.screenshot)
                .map(s => s.screenshot!),
        };
    }

    // Private helper methods

    private async parseInstruction(instruction: string): Promise<StagehandAction> {
        const lower = instruction.toLowerCase();

        // Simple pattern matching (production would use AI)
        if (lower.includes('click') || lower.includes('press') || lower.includes('tap')) {
            const target = instruction.replace(/click|press|tap|on|the|button|link/gi, '').trim();
            return { type: 'click', description: target };
        }

        if (lower.includes('type') || lower.includes('enter') || lower.includes('fill')) {
            const match = instruction.match(/(?:type|enter|fill)\s+["']?([^"']+)["']?\s+(?:in|into)\s+(.+)/i);
            if (match) {
                return { type: 'type', value: match[1], description: match[2] };
            }
        }

        if (lower.includes('go to') || lower.includes('navigate') || lower.includes('open')) {
            const url = instruction.replace(/go to|navigate to|open/gi, '').trim();
            return { type: 'navigate', value: url };
        }

        if (lower.includes('wait')) {
            const target = instruction.replace(/wait for|wait until/gi, '').trim();
            return { type: 'wait', description: target };
        }

        // Default to AI-based parsing (would call API)
        return { type: 'click', description: instruction };
    }

    private async executeAction(action: StagehandAction): Promise<void> {
        switch (action.type) {
            case 'click':
                if (action.description) {
                    await this.click(action.description);
                }
                break;
            case 'type':
                if (action.description && action.value) {
                    await this.type(action.description, action.value);
                }
                break;
            case 'navigate':
                if (action.value) {
                    await this.goto(action.value);
                }
                break;
            case 'wait':
                if (action.description) {
                    await this.waitFor(action.description);
                }
                break;
        }
    }

    private async resolveSelector(description: string): Promise<string> {
        // If it looks like a selector, use it directly
        if (description.match(/^[#.\[\]a-zA-Z]/)) {
            return description;
        }

        // Otherwise, try to find element by text or aria-label
        const page = this.page;

        // Try text content
        const textSelector = `text=${description}`;
        if (await page.locator(textSelector).count() > 0) {
            return textSelector;
        }

        // Try aria-label
        const ariaSelector = `[aria-label*="${description}" i]`;
        if (await page.locator(ariaSelector).count() > 0) {
            return ariaSelector;
        }

        // Try placeholder
        const placeholderSelector = `[placeholder*="${description}" i]`;
        if (await page.locator(placeholderSelector).count() > 0) {
            return placeholderSelector;
        }

        // Try role
        const roleSelector = `role=button[name*="${description}" i]`;
        if (await page.locator(roleSelector).count() > 0) {
            return roleSelector;
        }

        // Fall back to text
        return textSelector;
    }

    private async planExtraction(_instruction: string): Promise<{ selectors: string[]; transform?: string }> {
        // Production would use AI to plan extraction
        return { selectors: ['body'] };
    }

    private async executeExtraction(plan: { selectors: string[]; transform?: string }): Promise<any> {
        const results: any[] = [];
        for (const selector of plan.selectors) {
            const text = await this.page.locator(selector).textContent();
            results.push(text);
        }
        return results.length === 1 ? results[0] : results;
    }

    private async checkObservation(instruction: string): Promise<boolean> {
        const lower = instruction.toLowerCase();

        // Check for visibility
        if (lower.includes('visible') || lower.includes('see') || lower.includes('shows')) {
            const target = instruction.replace(/is visible|can see|shows|the|a|an/gi, '').trim();
            const selector = await this.resolveSelector(target);
            return await this.page.locator(selector).isVisible();
        }

        // Check for text content
        if (lower.includes('contains') || lower.includes('has text')) {
            const match = instruction.match(/contains?\s+["']?([^"']+)["']?/i);
            if (match) {
                const pageContent = await this.page.content();
                return pageContent.includes(match[1]);
            }
        }

        // Default: check if element exists
        const selector = await this.resolveSelector(instruction);
        return (await this.page.locator(selector).count()) > 0;
    }

    private async captureScreenshot(): Promise<string> {
        const path = await this.generateScreenshotPath();
        await this.page.screenshot({ path });
        return path;
    }

    private async generateScreenshotPath(): Promise<string> {
        return `screenshots/screenshot-${Date.now()}.png`;
    }
}

/**
 * Create a Stagehand test runner
 */
export class StagehandTestRunner {
    private config: StagehandConfig;
    private browser: any;
    private context: any;

    constructor(config: StagehandConfig = {}) {
        this.config = {
            browser: 'chromium',
            headless: true,
            viewport: { width: 1280, height: 720 },
            timeout: 30000,
            screenshotOnFailure: true,
            ...config,
        };
    }

    /**
     * Initialize the browser
     */
    async initialize(): Promise<void> {
        // Dynamic import Playwright
        const playwright = await import('playwright');
        const browserType = playwright[this.config.browser || 'chromium'];

        this.browser = await browserType.launch({
            headless: this.config.headless,
            slowMo: this.config.slowMo,
        });

        this.context = await this.browser.newContext({
            viewport: this.config.viewport,
            recordVideo: this.config.video ? { dir: 'videos/' } : undefined,
        });
    }

    /**
     * Create a new page for testing
     */
    async newPage(): Promise<StagehandPage> {
        if (!this.browser) {
            await this.initialize();
        }
        const page = await this.context.newPage();
        return new StagehandPage(page, this.config);
    }

    /**
     * Close the browser
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

/**
 * Decorator for Stagehand tests
 */
export function stagehandTest(
    description: string,
    options?: StagehandTestOptions
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const runner = new StagehandTestRunner();
            const page = await runner.newPage();

            try {
                const result = await originalMethod.apply(this, [page, ...args]);
                const testResult = page.getResult();

                if (!testResult.success && options?.retries) {
                    // Retry logic
                    for (let i = 0; i < options.retries; i++) {
                        const retryPage = await runner.newPage();
                        const retryResult = await originalMethod.apply(this, [retryPage, ...args]);
                        if (retryPage.getResult().success) {
                            return retryResult;
                        }
                    }
                }

                return result;
            } finally {
                await runner.close();
            }
        };

        // Store metadata
        descriptor.value._stagehandTest = {
            description,
            options,
        };

        return descriptor;
    };
}

/**
 * Create a Stagehand test runner with configuration
 */
export function createStagehandRunner(config?: StagehandConfig): StagehandTestRunner {
    return new StagehandTestRunner(config);
}
