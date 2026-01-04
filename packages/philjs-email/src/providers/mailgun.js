import { renderReactEmail, formatAddress, normalizeAddress, withRetry } from '../utils';
/**
 * Mailgun Email Provider
 *
 * Features:
 * - High deliverability
 * - Email validation
 * - Detailed analytics
 * - Template support
 * - Mailing lists
 */
export class MailgunProvider {
    name = 'mailgun';
    clientPromise = null;
    config;
    constructor(config) {
        this.config = config;
    }
    async getClient() {
        if (!this.clientPromise) {
            this.clientPromise = (async () => {
                try {
                    const mailgunModule = await import('mailgun.js');
                    const formDataModule = await import('form-data');
                    const MailgunCtor = mailgunModule.default ?? mailgunModule;
                    const formDataCtor = formDataModule.default ?? formDataModule;
                    const mailgun = new MailgunCtor(formDataCtor);
                    return mailgun.client({
                        username: 'api',
                        key: this.config.apiKey,
                        url: this.config.eu ? 'https://api.eu.mailgun.net' : undefined,
                    });
                }
                catch (error) {
                    throw new Error('Mailgun provider requires optional dependencies: install `mailgun.js` and `form-data`.');
                }
            })();
        }
        return this.clientPromise;
    }
    /**
     * Send a single email via Mailgun
     */
    async send(message) {
        const sendFn = async () => {
            try {
                const client = await this.getClient();
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
                // Build Mailgun message
                const mgMessage = {
                    from: formatAddress(from),
                    to: this.formatRecipients(message.to),
                    subject: message.subject,
                    text: text || undefined,
                    html: html || undefined,
                };
                // Add CC/BCC
                if (message.cc) {
                    mgMessage.cc = this.formatRecipients(message.cc);
                }
                if (message.bcc) {
                    mgMessage.bcc = this.formatRecipients(message.bcc);
                }
                // Add reply-to
                if (message.replyTo) {
                    mgMessage['h:Reply-To'] = formatAddress(message.replyTo);
                }
                // Add custom headers
                if (message.headers) {
                    for (const [key, value] of Object.entries(message.headers)) {
                        mgMessage[`h:${key}`] = value;
                    }
                }
                // Add attachments
                if (message.attachments && message.attachments.length > 0) {
                    mgMessage.attachment = message.attachments.map((att) => ({
                        filename: att.filename,
                        data: att.content,
                        contentType: att.contentType,
                    }));
                }
                // Add inline attachments
                const inlineAttachments = message.attachments?.filter((att) => att.disposition === 'inline');
                if (inlineAttachments && inlineAttachments.length > 0) {
                    mgMessage.inline = inlineAttachments.map((att) => ({
                        filename: att.filename,
                        data: att.content,
                        contentType: att.contentType,
                    }));
                }
                // Add tracking
                if (message.tracking) {
                    mgMessage['o:tracking'] = 'yes';
                    mgMessage['o:tracking-clicks'] = message.tracking.clicks
                        ? 'yes'
                        : 'no';
                    mgMessage['o:tracking-opens'] = message.tracking.opens ? 'yes' : 'no';
                }
                // Add tags
                if (message.tags) {
                    mgMessage['o:tag'] = message.tags;
                }
                // Add metadata (custom variables)
                if (message.metadata) {
                    for (const [key, value] of Object.entries(message.metadata)) {
                        mgMessage[`v:${key}`] = JSON.stringify(value);
                    }
                }
                // Add unsubscribe headers
                if (message.unsubscribe) {
                    const unsubValues = [];
                    if (message.unsubscribe.url) {
                        unsubValues.push(`<${message.unsubscribe.url}>`);
                    }
                    if (message.unsubscribe.email) {
                        unsubValues.push(`<mailto:${message.unsubscribe.email}>`);
                    }
                    if (unsubValues.length > 0) {
                        mgMessage['h:List-Unsubscribe'] = unsubValues.join(', ');
                    }
                }
                // Add scheduled delivery
                if (message.scheduledAt) {
                    const deliveryTime = message.scheduledAt instanceof Date
                        ? message.scheduledAt.toUTCString()
                        : new Date(message.scheduledAt).toUTCString();
                    mgMessage['o:deliverytime'] = deliveryTime;
                }
                // Test mode
                if (this.config.testMode) {
                    mgMessage['o:testmode'] = 'yes';
                }
                const response = await client.messages.create(this.config.domain, mgMessage);
                if (this.config.debug) {
                    console.log(`[Mailgun] Email sent: ${response.id}`);
                }
                return {
                    success: true,
                    messageId: response.id,
                    response,
                    timestamp: new Date(),
                };
            }
            catch (error) {
                if (this.config.debug) {
                    console.error('[Mailgun] Send error:', error);
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
     * Send bulk emails via Mailgun using recipient variables
     * Mailgun supports up to 1000 recipients per request
     */
    async sendBulk(message) {
        const client = await this.getClient();
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
                // Build recipient list and variables
                const recipientVariables = {};
                const toAddresses = batch.map((recipient) => {
                    const addr = normalizeAddress(recipient.to);
                    recipientVariables[addr.email] = {
                        ...recipient.variables,
                        ...recipient.metadata,
                    };
                    return formatAddress(recipient.to);
                });
                const mgMessage = {
                    from: formatAddress(from),
                    to: toAddresses,
                    subject: message.subject,
                    text: text || undefined,
                    html: html || undefined,
                    'recipient-variables': JSON.stringify(recipientVariables),
                };
                if (this.config.testMode) {
                    mgMessage['o:testmode'] = 'yes';
                }
                const response = await client.messages.create(this.config.domain, mgMessage);
                // Mark all in batch as successful
                batch.forEach(() => {
                    results.push({
                        success: true,
                        messageId: response.id,
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
     * Send using a Mailgun stored template
     */
    async sendTemplate(message) {
        try {
            const client = await this.getClient();
            const from = message.from ?? this.config.defaultFrom;
            if (!from) {
                throw new Error('From address is required');
            }
            const mgMessage = {
                from: formatAddress(from),
                to: this.formatRecipients(message.to),
                subject: message.subject,
                template: message.template,
            };
            // Add template variables
            if (message.variables) {
                for (const [key, value] of Object.entries(message.variables)) {
                    mgMessage[`v:${key}`] = JSON.stringify(value);
                }
            }
            // Add additional options
            if (message.options) {
                if (message.options.cc) {
                    mgMessage.cc = this.formatRecipients(message.options.cc);
                }
                if (message.options.bcc) {
                    mgMessage.bcc = this.formatRecipients(message.options.bcc);
                }
                if (message.options.replyTo) {
                    mgMessage['h:Reply-To'] = formatAddress(message.options.replyTo);
                }
                if (message.options.tags) {
                    mgMessage['o:tag'] = message.options.tags;
                }
            }
            if (this.config.testMode) {
                mgMessage['o:testmode'] = 'yes';
            }
            const response = await client.messages.create(this.config.domain, mgMessage);
            return {
                success: true,
                messageId: response.id,
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
     * Verify Mailgun domain
     */
    async verify() {
        try {
            const client = await this.getClient();
            await client.domains.get(this.config.domain);
            return true;
        }
        catch {
            return false;
        }
    }
    formatRecipients(recipients) {
        if (Array.isArray(recipients)) {
            return recipients.map((r) => formatAddress(r));
        }
        return formatAddress(recipients);
    }
}
/**
 * Create a Mailgun provider
 */
export function createMailgunProvider(config) {
    return new MailgunProvider(config);
}
//# sourceMappingURL=mailgun.js.map