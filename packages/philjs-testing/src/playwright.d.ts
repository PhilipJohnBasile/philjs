// Type declarations for playwright (optional peer dependency)
declare module 'playwright' {
    interface Browser {
        newContext(options?: any): Promise<BrowserContext>;
        close(): Promise<void>;
    }

    interface BrowserContext {
        newPage(): Promise<Page>;
        close(): Promise<void>;
    }

    interface Page {
        goto(url: string, options?: any): Promise<any>;
        click(selector: string): Promise<void>;
        fill(selector: string, value: string): Promise<void>;
        waitForSelector(selector: string, options?: any): Promise<any>;
        screenshot(options?: any): Promise<Buffer>;
        evaluate<T>(fn: () => T): Promise<T>;
        close(): Promise<void>;
        content(): Promise<string>;
        $(selector: string): Promise<any>;
        $$(selector: string): Promise<any[]>;
        locator(selector: string): any;
    }

    interface BrowserType {
        launch(options?: any): Promise<Browser>;
    }

    const chromium: BrowserType;
    const firefox: BrowserType;
    const webkit: BrowserType;
}
