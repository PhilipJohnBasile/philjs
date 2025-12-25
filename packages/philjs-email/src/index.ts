/**
 * PhilJS Email
 *
 * Email sending with multiple providers, templates, tracking, and queuing
 */

// Types
export type {
  EmailAddress,
  EmailAttachment,
  EmailTracking,
  UnsubscribeOptions,
  EmailMessage,
  BulkEmailMessage,
  BulkRecipient,
  TemplateEmailMessage,
  EmailResult,
  BulkEmailResult,
  EmailProvider,
  ProviderConfig,
  RetryConfig,
  SmtpConfig,
  SendGridConfig,
  MailgunConfig,
  ResendConfig,
  SesConfig,
  EmailQueueJob,
  EmailQueue,
  QueueOptions,
  QueueStats,
  TrackingEvent,
  TrackingWebhook,
  EmailClientOptions,
  EmailTemplate,
  TemplateRegistry,
  TemplateProps,
} from './types.js';

// Providers
export {
  SmtpProvider,
  createSmtpProvider,
  SmtpPresets,
  SendGridProvider,
  createSendGridProvider,
  MailgunProvider,
  createMailgunProvider,
  ResendProvider,
  createResendProvider,
  SesProvider,
  createSesProvider,
} from './providers/index.js';

// Templates
export * from './templates/index.js';

// Queue
export { createQueue, InMemoryQueue } from './queue.js';

// Tracking
export {
  createTrackingWebhook,
  GenericTrackingWebhook,
  SendGridWebhook,
  MailgunWebhook,
  SesWebhook,
} from './tracking.js';
export type { TrackingEventHandler } from './tracking.js';

// Utils
export {
  normalizeAddress,
  formatAddress,
  renderReactEmail,
  htmlToText,
  withRetry,
  sleep,
  generateId,
  isValidEmail,
  parseEmails,
  chunk,
  createTrackingPixel,
  wrapLinksForTracking,
  defaultRetryConfig,
} from './utils.js';
