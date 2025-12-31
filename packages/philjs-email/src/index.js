/**
 * PhilJS Email
 *
 * Email sending with multiple providers, templates, tracking, and queuing
 */
// Providers
export { SmtpProvider, createSmtpProvider, SmtpPresets, SendGridProvider, createSendGridProvider, MailgunProvider, createMailgunProvider, ResendProvider, createResendProvider, SesProvider, createSesProvider, } from './providers/index.js';
// Templates
export * from './templates/index.js';
// Queue
export { createQueue, InMemoryQueue } from './queue.js';
// Tracking
export { createTrackingWebhook, GenericTrackingWebhook, SendGridWebhook, MailgunWebhook, SesWebhook, } from './tracking.js';
// Utils
export { normalizeAddress, formatAddress, renderReactEmail, htmlToText, withRetry, sleep, generateId, isValidEmail, parseEmails, chunk, createTrackingPixel, wrapLinksForTracking, defaultRetryConfig, } from './utils.js';
//# sourceMappingURL=index.js.map