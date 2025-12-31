// @ts-nocheck
import sgMail from '@sendgrid/mail';
import { renderReactEmail, formatAddress, normalizeAddress, withRetry } from '../utils';
/**
 * SendGrid Email Provider
 *
 * Features:
 * - High deliverability
 * - Native template support
 * - Bulk sending (up to 1000 per API call)
 * - Email tracking (opens, clicks)
 * - Webhooks for events
 */
export class SendGridProvider {
    name = 'sendgrid';
    config;
    constructor(config) {
        this.config = config;
        sgMail.setApiKey(config.apiKey);
        if (config.timeout) {
            sgMail.setTimeout(config.timeout);
        }
    }
    /**
     * Send a single email via SendGrid
     */
    async send(message) {
        const sendFn = async () => {
            try {
                // Render React template if provided
                let html = message.html;
                let text = message.text;
                if (message.react) {
                    const rendered = await renderReactEmail(message.react);
                    html = rendered.html;
                    text = text ?? rendered.text;
                }
                const from = message.from ?? this.config.defaultFrom;
                if (!from) {
                    throw new Error('From address is required');
                }
                // Build SendGrid message
                const sgMessage = {
                    from: this.toSendGridAddress(from),
                    to: this.toSendGridAddresses(message.to),
                    subject: message.subject,
                    text: text || undefined,
                    html: html || undefined,
                    cc: message.cc ? this.toSendGridAddresses(message.cc) : undefined,
                    bcc: message.bcc ? this.toSendGridAddresses(message.bcc) : undefined,
                    replyTo: message.replyTo
                        ? this.toSendGridAddress(message.replyTo)
                        : undefined,
                    attachments: message.attachments?.map((att) => ({
                        filename: att.filename,
                        content: att.content instanceof Buffer
                            ? att.content.toString('base64')
                            : att.content,
                        type: att.contentType,
                        disposition: att.disposition || 'attachment',
                        contentId: att.cid,
                    })),
                    headers: this.buildHeaders(message),
                    categories: message.tags,
                    customArgs: message.metadata,
                    mailSettings: {
                        sandboxMode: {
                            enable: this.config.sandbox ?? false,
                        },
                    },
                    trackingSettings: message.tracking
                        ? {
                            clickTracking: {
                                enable: message.tracking.clicks ?? false,
                            },
                            openTracking: {
                                enable: message.tracking.opens ?? false,
                            },
                        }
                        : undefined,
                };
                // Handle scheduled sending
                if (message.scheduledAt) {
                    const sendAt = message.scheduledAt instanceof Date
                        ? Math.floor(message.scheduledAt.getTime() / 1000)
                        : Math.floor(new Date(message.scheduledAt).getTime() / 1000);
                    sgMessage.sendAt = sendAt;
                }
                // Add unsubscribe settings
                if (message.unsubscribe) {
                    sgMessage.asm = {
                        groupId: 0, // Would need to be configured
                    };
                }
                const [response] = await sgMail.send(sgMessage);
                if (this.config.debug) {
                    console.log(`[SendGrid] Email sent: ${response.headers['x-message-id']}`);
                }
                return {
                    success: true,
                    messageId: response.headers['x-message-id'],
                    response,
                    timestamp: new Date(),
                };
            }
            catch (error) {
                if (this.config.debug) {
                    console.error('[SendGrid] Send error:', error);
                }
                return {
                    success: false,
                    error: error instanceof Error ? error : new Error(String(error)),
                    timestamp: new Date(),
                };
            }
        };
        if (this.config.retry) {
            return withRetry(sendFn, this.config.retry);
        }
        return sendFn();
    }
    /**
     * Send bulk emails via SendGrid
     * SendGrid supports up to 1000 personalizations per request
     */
    async sendBulk(message) {
        const results = [];
        const batchSize = 1000;
        // Render template once
        let html = message.html;
        let text = message.text;
        if (message.react) {
            const rendered = await renderReactEmail(message.react);
            html = rendered.html;
            text = text ?? rendered.text;
        }
        const from = message.from ?? this.config.defaultFrom;
        if (!from) {
            throw new Error('From address is required');
        }
        // Process in batches
        for (let i = 0; i < message.recipients.length; i += batchSize) {
            const batch = message.recipients.slice(i, i + batchSize);
            try {
                const sgMessage = {
                    from: this.toSendGridAddress(from),
                    subject: message.subject,
                    text: text || undefined,
                    html: html || undefined,
                    personalizations: batch.map((recipient) => ({
                        to: [this.toSendGridAddress(recipient.to)],
                        substitutions: recipient.variables,
                        customArgs: recipient.metadata,
                    })),
                    mailSettings: {
                        sandboxMode: {
                            enable: this.config.sandbox ?? false,
                        },
                    },
                };
                const [response] = await sgMail.send(sgMessage);
                // Mark all in batch as successful
                batch.forEach(() => {
                    results.push({
                        success: true,
                        messageId: response.headers['x-message-id'],
                        timestamp: new Date(),
                    });
                });
            }
            catch (error) {
                // Mark all in batch as failed
                batch.forEach(() => {
                    results.push({
                        success: false,
                        error: error instanceof Error ? error : new Error(String(error)),
                        timestamp: new Date(),
                    });
                });
            }
        }
        return {
            total: message.recipients.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        };
    }
    /**
     * Send using a SendGrid dynamic template
     */
    async sendTemplate(message) {
        try {
            const from = message.from ?? this.config.defaultFrom;
            if (!from) {
                throw new Error('From address is required');
            }
            const sgMessage = {
                from: this.toSendGridAddress(from),
                to: this.toSendGridAddresses(message.to),
                templateId: message.template,
                dynamicTemplateData: message.variables,
                subject: message.subject,
                ...this.mapOptions(message.options),
            };
            const [response] = await sgMail.send(sgMessage);
            return {
                success: true,
                messageId: response.headers['x-message-id'],
                response,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
                timestamp: new Date(),
            };
        }
    }
    /**
     * Verify SendGrid API key
     */
    async verify() {
        try {
            // SendGrid doesn't have a dedicated verify endpoint
            // We attempt to get account info instead
            const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    toSendGridAddress(address) {
        const normalized = normalizeAddress(address);
        return {
            email: normalized.email,
            name: normalized.name,
        };
    }
    toSendGridAddresses(addresses) {
        const list = Array.isArray(addresses) ? addresses : [addresses];
        return list.map((addr) => this.toSendGridAddress(addr));
    }
    buildHeaders(message) {
        const headers = { ...message.headers };
        if (message.unsubscribe) {
            const unsubValues = [];
            if (message.unsubscribe.url) {
                unsubValues.push(`<${message.unsubscribe.url}>`);
            }
            if (message.unsubscribe.email) {
                unsubValues.push(`<mailto:${message.unsubscribe.email}>`);
            }
            if (unsubValues.length > 0) {
                headers['List-Unsubscribe'] = unsubValues.join(', ');
            }
        }
        return headers;
    }
    mapOptions(options) {
        if (!options)
            return {};
        return {
            cc: options.cc ? this.toSendGridAddresses(options.cc) : undefined,
            bcc: options.bcc ? this.toSendGridAddresses(options.bcc) : undefined,
            replyTo: options.replyTo
                ? this.toSendGridAddress(options.replyTo)
                : undefined,
            headers: options.headers,
            categories: options.tags,
        };
    }
}
/**
 * Create a SendGrid provider
 */
export function createSendGridProvider(config) {
    return new SendGridProvider(config);
}
//# sourceMappingURL=sendgrid.js.map