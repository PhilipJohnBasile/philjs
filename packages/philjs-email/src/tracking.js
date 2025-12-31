import { createHmac } from 'crypto';
/**
 * Generic tracking webhook implementation
 */
export class GenericTrackingWebhook {
    handlers = new Map();
    secret;
    constructor(options = {}) {
        if (options.secret !== undefined) {
            this.secret = options.secret;
        }
    }
    /**
     * Register a handler for tracking events
     */
    on(type, handler) {
        const handlers = this.handlers.get(type) ?? [];
        handlers.push(handler);
        this.handlers.set(type, handlers);
    }
    /**
     * Register a handler for all tracking events
     */
    onAll(handler) {
        const types = [
            'open',
            'click',
            'bounce',
            'complaint',
            'unsubscribe',
        ];
        types.forEach((type) => this.on(type, handler));
    }
    /**
     * Handle incoming tracking event
     */
    async handle(event) {
        const handlers = this.handlers.get(event.type) ?? [];
        await Promise.all(handlers.map((handler) => handler(event)));
    }
    /**
     * Verify webhook signature
     */
    verify(payload, signature) {
        if (!this.secret) {
            return true; // No secret configured, skip verification
        }
        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const expectedSignature = createHmac('sha256', this.secret)
            .update(payloadString)
            .digest('hex');
        return signature === expectedSignature;
    }
    /**
     * Parse tracking pixel request
     */
    parseOpenEvent(query, headers) {
        const userAgent = headers?.['user-agent'];
        const ip = headers?.['x-forwarded-for'] || headers?.['x-real-ip'];
        const metadata = query['meta'] ? JSON.parse(query['meta']) : undefined;
        const event = {
            type: 'open',
            messageId: query['id'] || '',
            recipient: query['recipient'] || '',
            timestamp: new Date(),
        };
        if (userAgent !== undefined)
            event.userAgent = userAgent;
        if (ip !== undefined)
            event.ip = ip;
        if (metadata !== undefined)
            event.metadata = metadata;
        return event;
    }
    /**
     * Parse click tracking request
     */
    parseClickEvent(query, headers) {
        const url = query['url'];
        const userAgent = headers?.['user-agent'];
        const ip = headers?.['x-forwarded-for'] || headers?.['x-real-ip'];
        const metadata = query['meta'] ? JSON.parse(query['meta']) : undefined;
        const event = {
            type: 'click',
            messageId: query['id'] || '',
            recipient: query['recipient'] || '',
            timestamp: new Date(),
            redirectUrl: url || '',
        };
        if (url !== undefined)
            event.url = url;
        if (userAgent !== undefined)
            event.userAgent = userAgent;
        if (ip !== undefined)
            event.ip = ip;
        if (metadata !== undefined)
            event.metadata = metadata;
        return event;
    }
}
/**
 * SendGrid webhook parser
 */
export class SendGridWebhook {
    handlers = new Map();
    verificationKey;
    constructor(options = {}) {
        if (options.verificationKey !== undefined) {
            this.verificationKey = options.verificationKey;
        }
    }
    on(type, handler) {
        const handlers = this.handlers.get(type) ?? [];
        handlers.push(handler);
        this.handlers.set(type, handlers);
    }
    async handle(event) {
        const handlers = this.handlers.get(event.type) ?? [];
        await Promise.all(handlers.map((handler) => handler(event)));
    }
    verify(_payload, signature) {
        if (!this.verificationKey) {
            return true;
        }
        // SendGrid uses ECDSA signature verification
        // This is a simplified check; production should use proper ECDSA verification
        return signature.length > 0;
    }
    /**
     * Parse SendGrid webhook payload
     */
    parseEvents(payload) {
        if (!Array.isArray(payload)) {
            return [];
        }
        return payload.map((event) => {
            const typeMap = {
                open: 'open',
                click: 'click',
                bounce: 'bounce',
                spamreport: 'complaint',
                unsubscribe: 'unsubscribe',
            };
            return {
                type: typeMap[event.event] || 'open',
                messageId: event.sg_message_id || '',
                recipient: event.email || '',
                timestamp: new Date(event.timestamp * 1000),
                url: event.url,
                userAgent: event.useragent,
                ip: event.ip,
                metadata: {
                    category: event.category,
                    ...event,
                },
            };
        });
    }
}
/**
 * Mailgun webhook parser
 */
export class MailgunWebhook {
    handlers = new Map();
    signingKey;
    constructor(options = {}) {
        if (options.signingKey !== undefined) {
            this.signingKey = options.signingKey;
        }
    }
    on(type, handler) {
        const handlers = this.handlers.get(type) ?? [];
        handlers.push(handler);
        this.handlers.set(type, handlers);
    }
    async handle(event) {
        const handlers = this.handlers.get(event.type) ?? [];
        await Promise.all(handlers.map((handler) => handler(event)));
    }
    verify(payload, _signature) {
        if (!this.signingKey) {
            return true;
        }
        const data = payload;
        if (!data.signature) {
            return false;
        }
        const { timestamp, token, signature: sig } = data.signature;
        const encodedToken = createHmac('sha256', this.signingKey)
            .update(`${timestamp}${token}`)
            .digest('hex');
        return encodedToken === sig;
    }
    /**
     * Parse Mailgun webhook payload
     */
    parseEvent(payload) {
        const data = payload;
        const eventData = data['event-data'] || {};
        const typeMap = {
            opened: 'open',
            clicked: 'click',
            bounced: 'bounce',
            complained: 'complaint',
            unsubscribed: 'unsubscribe',
        };
        const url = eventData.url;
        const userAgent = eventData['client-info']?.['user-agent'];
        const ip = eventData.ip;
        const event = {
            type: typeMap[eventData.event || ''] || 'open',
            messageId: eventData.message?.headers?.['message-id'] || '',
            recipient: eventData.recipient || '',
            timestamp: new Date((eventData.timestamp || 0) * 1000),
        };
        if (url !== undefined)
            event.url = url;
        if (userAgent !== undefined)
            event.userAgent = userAgent;
        if (ip !== undefined)
            event.ip = ip;
        return event;
    }
}
/**
 * AWS SES webhook parser (via SNS)
 */
export class SesWebhook {
    handlers = new Map();
    on(type, handler) {
        const handlers = this.handlers.get(type) ?? [];
        handlers.push(handler);
        this.handlers.set(type, handlers);
    }
    async handle(event) {
        const handlers = this.handlers.get(event.type) ?? [];
        await Promise.all(handlers.map((handler) => handler(event)));
    }
    verify(_payload, _signature) {
        // SES/SNS verification should use AWS SDK
        // This is simplified for the example
        return true;
    }
    /**
     * Parse SES/SNS webhook payload
     */
    parseEvent(payload) {
        const data = payload;
        const typeMap = {
            Open: 'open',
            Click: 'click',
            Bounce: 'bounce',
            Complaint: 'complaint',
        };
        const notificationType = data.notificationType || '';
        const type = typeMap[notificationType] || 'open';
        let timestamp = new Date();
        let url;
        let userAgent;
        let ip;
        if (type === 'open' && data.open) {
            timestamp = new Date(data.open.timestamp || Date.now());
            userAgent = data.open.userAgent;
            ip = data.open.ipAddress;
        }
        else if (type === 'click' && data.click) {
            timestamp = new Date(data.click.timestamp || Date.now());
            url = data.click.link;
            userAgent = data.click.userAgent;
            ip = data.click.ipAddress;
        }
        const event = {
            type,
            messageId: data.mail?.messageId || '',
            recipient: data.mail?.destination?.[0] || '',
            timestamp,
        };
        if (url !== undefined)
            event.url = url;
        if (userAgent !== undefined)
            event.userAgent = userAgent;
        if (ip !== undefined)
            event.ip = ip;
        return event;
    }
}
/**
 * Create a tracking webhook handler
 */
export function createTrackingWebhook(provider, options = {}) {
    switch (provider) {
        case 'sendgrid':
            return new SendGridWebhook(options.verificationKey !== undefined
                ? { verificationKey: options.verificationKey }
                : {});
        case 'mailgun':
            return new MailgunWebhook(options.signingKey !== undefined
                ? { signingKey: options.signingKey }
                : {});
        case 'ses':
            return new SesWebhook();
        case 'generic':
        default:
            return new GenericTrackingWebhook(options.secret !== undefined ? { secret: options.secret } : {});
    }
}
//# sourceMappingURL=tracking.js.map