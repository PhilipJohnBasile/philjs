import type { ReactElement } from 'react';

/**
 * Email address with optional display name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** Filename to display */
  filename: string;
  /** File content as Buffer, string, or path */
  content: Buffer | string;
  /** MIME type (e.g., 'application/pdf') */
  contentType?: string;
  /** Content disposition: 'attachment' or 'inline' */
  disposition?: 'attachment' | 'inline';
  /** Content ID for inline attachments (used in HTML) */
  cid?: string;
  /** Encoding if content is a string */
  encoding?: 'base64' | 'utf-8' | 'binary';
}

/**
 * Email tracking options
 */
export interface EmailTracking {
  /** Track when email is opened */
  opens?: boolean;
  /** Track when links are clicked */
  clicks?: boolean;
  /** Custom tracking domain */
  trackingDomain?: string;
  /** Metadata to include in tracking events */
  metadata?: Record<string, string>;
}

/**
 * Unsubscribe options
 */
export interface UnsubscribeOptions {
  /** URL for unsubscribe page */
  url: string;
  /** Email address for unsubscribe (List-Unsubscribe header) */
  email?: string;
  /** Whether to include one-click unsubscribe header */
  oneClick?: boolean;
}

/**
 * Email message options
 */
export interface EmailMessage {
  /** Sender email address */
  from: string | EmailAddress;
  /** Recipient(s) */
  to: string | EmailAddress | (string | EmailAddress)[];
  /** CC recipient(s) */
  cc?: string | EmailAddress | (string | EmailAddress)[];
  /** BCC recipient(s) */
  bcc?: string | EmailAddress | (string | EmailAddress)[];
  /** Reply-to address */
  replyTo?: string | EmailAddress;
  /** Email subject */
  subject: string;
  /** Plain text body */
  text?: string;
  /** HTML body */
  html?: string;
  /** React Email template */
  react?: ReactElement;
  /** Attachments */
  attachments?: EmailAttachment[];
  /** Custom headers */
  headers?: Record<string, string>;
  /** Email tracking options */
  tracking?: EmailTracking;
  /** Unsubscribe options */
  unsubscribe?: UnsubscribeOptions;
  /** Email priority: 'high', 'normal', 'low' */
  priority?: 'high' | 'normal' | 'low';
  /** Tags for categorization */
  tags?: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Schedule send time (ISO 8601 string or Date) */
  scheduledAt?: Date | string;
}

/**
 * Bulk email options
 */
export interface BulkEmailMessage extends Omit<EmailMessage, 'to'> {
  /** List of recipients with optional personalization */
  recipients: BulkRecipient[];
}

/**
 * Bulk email recipient with personalization
 */
export interface BulkRecipient {
  /** Recipient email */
  to: string | EmailAddress;
  /** Personalization variables for this recipient */
  variables?: Record<string, unknown>;
  /** Recipient-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Template email options
 */
export interface TemplateEmailMessage<TVariables = Record<string, unknown>> {
  /** Template ID or name */
  template: string;
  /** Template variables */
  variables: TVariables;
  /** Recipient(s) */
  to: string | EmailAddress | (string | EmailAddress)[];
  /** Sender (optional, may use template default) */
  from?: string | EmailAddress;
  /** Subject override */
  subject?: string;
  /** Additional options */
  options?: Partial<EmailMessage>;
}

/**
 * Email send result
 */
export interface EmailResult {
  /** Whether the send was successful */
  success: boolean;
  /** Message ID from the provider */
  messageId?: string;
  /** Provider-specific response */
  response?: unknown;
  /** Error if send failed */
  error?: Error;
  /** Timestamp of send attempt */
  timestamp: Date;
}

/**
 * Bulk email send result
 */
export interface BulkEmailResult {
  /** Total number of emails attempted */
  total: number;
  /** Number of successful sends */
  successful: number;
  /** Number of failed sends */
  failed: number;
  /** Individual results */
  results: EmailResult[];
}

/**
 * Email provider interface
 */
export interface EmailProvider {
  /** Provider name */
  readonly name: string;

  /** Send a single email */
  send(message: EmailMessage): Promise<EmailResult>;

  /** Send bulk emails (if supported by provider) */
  sendBulk?(message: BulkEmailMessage): Promise<BulkEmailResult>;

  /** Send using a provider template */
  sendTemplate?<T>(message: TemplateEmailMessage<T>): Promise<EmailResult>;

  /** Verify provider connection */
  verify?(): Promise<boolean>;

  /** Close/cleanup provider resources */
  close?(): Promise<void>;
}

/**
 * Provider configuration base
 */
export interface ProviderConfig {
  /** Default from address */
  defaultFrom?: string | EmailAddress;
  /** Enable debug logging */
  debug?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Errors to retry on */
  retryOn?: string[];
}

/**
 * SMTP provider configuration
 */
export interface SmtpConfig extends ProviderConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
    minVersion?: string;
  };
  pool?: boolean;
  maxConnections?: number;
}

/**
 * SendGrid provider configuration
 */
export interface SendGridConfig extends ProviderConfig {
  apiKey: string;
  /** Sandbox mode for testing */
  sandbox?: boolean;
}

/**
 * Mailgun provider configuration
 */
export interface MailgunConfig extends ProviderConfig {
  apiKey: string;
  domain: string;
  /** Use EU region */
  eu?: boolean;
  /** Test mode */
  testMode?: boolean;
}

/**
 * Resend provider configuration
 */
export interface ResendConfig extends ProviderConfig {
  apiKey: string;
}

/**
 * AWS SES provider configuration
 */
export interface SesConfig extends ProviderConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Use configuration set for tracking */
  configurationSetName?: string;
}

/**
 * Queue job for background email sending
 */
export interface EmailQueueJob {
  id: string;
  message: EmailMessage;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  nextAttempt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Queue interface for email sending
 */
export interface EmailQueue {
  /** Add an email to the queue */
  enqueue(message: EmailMessage, options?: QueueOptions): Promise<string>;

  /** Process the next job in the queue */
  process(handler: (job: EmailQueueJob) => Promise<EmailResult>): Promise<void>;

  /** Get job status */
  getJob(id: string): Promise<EmailQueueJob | null>;

  /** Cancel a pending job */
  cancel(id: string): Promise<boolean>;

  /** Get queue statistics */
  stats(): Promise<QueueStats>;
}

/**
 * Queue options
 */
export interface QueueOptions {
  /** Delay before processing (milliseconds) */
  delay?: number;
  /** Priority (higher = processed first) */
  priority?: number;
  /** Maximum attempts */
  maxAttempts?: number;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

/**
 * Email tracking event
 */
export interface TrackingEvent {
  type: 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe';
  messageId: string;
  recipient: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  /** For click events */
  url?: string;
  /** User agent */
  userAgent?: string;
  /** IP address */
  ip?: string;
}

/**
 * Tracking webhook handler
 */
export interface TrackingWebhook {
  /** Handle incoming tracking event */
  handle(event: TrackingEvent): Promise<void>;

  /** Verify webhook signature */
  verify(payload: unknown, signature: string): boolean;
}

/**
 * Email client options
 */
export interface EmailClientOptions {
  /** Email provider */
  provider: EmailProvider;
  /** Default from address */
  defaultFrom?: string | EmailAddress;
  /** Template directory or template map */
  templates?: string | Map<string, ReactElement>;
  /** Queue for background sending */
  queue?: EmailQueue;
  /** Tracking webhook handler */
  tracking?: TrackingWebhook;
  /** Global retry configuration */
  retry?: RetryConfig;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Type-safe template definition
 */
export interface EmailTemplate<TProps = Record<string, unknown>> {
  /** Template component */
  component: React.ComponentType<TProps>;
  /** Default subject */
  subject?: string | ((props: TProps) => string);
  /** Default from address */
  from?: string | EmailAddress;
  /** Preview text */
  preview?: string | ((props: TProps) => string);
}

/**
 * Template registry for type-safe templates
 */
export type TemplateRegistry = {
  [key: string]: EmailTemplate<any>;
};

/**
 * Helper type to extract template props
 */
export type TemplateProps<T extends EmailTemplate<any>> = T extends EmailTemplate<infer P> ? P : never;
