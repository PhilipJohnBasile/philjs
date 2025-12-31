/**
 * Tracking event types
 */
export interface TrackingEvent {
    type: 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe';
    messageId: string;
    recipient: string;
    timestamp: Date;
    url?: string;
    userAgent?: string;
    ip?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Tracking webhook interface
 */
export interface TrackingWebhook {
    on(type: TrackingEvent['type'], handler: (event: TrackingEvent) => Promise<void>): void;
    handle(event: TrackingEvent): Promise<void>;
    verify(payload: unknown, signature: string): boolean;
}
/**
 * Tracking event handler callback
 */
export type TrackingEventHandler = (event: TrackingEvent) => Promise<void>;
/**
 * Generic tracking webhook implementation
 */
export declare class GenericTrackingWebhook implements TrackingWebhook {
    private handlers;
    private secret?;
    constructor(options?: {
        secret?: string;
    });
    /**
     * Register a handler for tracking events
     */
    on(type: TrackingEvent['type'], handler: TrackingEventHandler): void;
    /**
     * Register a handler for all tracking events
     */
    onAll(handler: TrackingEventHandler): void;
    /**
     * Handle incoming tracking event
     */
    handle(event: TrackingEvent): Promise<void>;
    /**
     * Verify webhook signature
     */
    verify(payload: unknown, signature: string): boolean;
    /**
     * Parse tracking pixel request
     */
    parseOpenEvent(query: Record<string, string>, headers?: Record<string, string>): TrackingEvent;
    /**
     * Parse click tracking request
     */
    parseClickEvent(query: Record<string, string>, headers?: Record<string, string>): TrackingEvent & {
        redirectUrl: string;
    };
}
/**
 * SendGrid webhook parser
 */
export declare class SendGridWebhook implements TrackingWebhook {
    private handlers;
    private verificationKey?;
    constructor(options?: {
        verificationKey?: string;
    });
    on(type: TrackingEvent['type'], handler: TrackingEventHandler): void;
    handle(event: TrackingEvent): Promise<void>;
    verify(_payload: unknown, signature: string): boolean;
    /**
     * Parse SendGrid webhook payload
     */
    parseEvents(payload: unknown[]): TrackingEvent[];
}
/**
 * Mailgun webhook parser
 */
export declare class MailgunWebhook implements TrackingWebhook {
    private handlers;
    private signingKey?;
    constructor(options?: {
        signingKey?: string;
    });
    on(type: TrackingEvent['type'], handler: TrackingEventHandler): void;
    handle(event: TrackingEvent): Promise<void>;
    verify(payload: unknown, _signature: string): boolean;
    /**
     * Parse Mailgun webhook payload
     */
    parseEvent(payload: unknown): TrackingEvent;
}
/**
 * AWS SES webhook parser (via SNS)
 */
export declare class SesWebhook implements TrackingWebhook {
    private handlers;
    on(type: TrackingEvent['type'], handler: TrackingEventHandler): void;
    handle(event: TrackingEvent): Promise<void>;
    verify(_payload: unknown, _signature: string): boolean;
    /**
     * Parse SES/SNS webhook payload
     */
    parseEvent(payload: unknown): TrackingEvent;
}
/**
 * Create a tracking webhook handler
 */
export declare function createTrackingWebhook(provider: 'generic' | 'sendgrid' | 'mailgun' | 'ses', options?: {
    secret?: string;
    signingKey?: string;
    verificationKey?: string;
}): TrackingWebhook;
//# sourceMappingURL=tracking.d.ts.map