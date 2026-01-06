/**
 * PhilJS Email Types
 *
 * Type definitions for email sending with multiple providers
 */

// Define ReactElement inline to avoid requiring @types/react
type ReactElement = {
  type: string | Function;
  props: Record<string, unknown>;
  key: string | number | null;
};

/**
 * Email address - can be a simple string or an object with name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** Filename for the attachment */
  filename: string;
  /** Content of the attachment (string or Buffer) */
  content: string | Buffer;
  /** MIME type of the attachment */
  contentType?: string;
  /** Content disposition (attachment or inline) */
  disposition?: 'attachment' | 'inline';
  /** Content ID for inline attachments */
  cid?: string;
  /** Encoding for string content */
  encoding?: BufferEncoding;
}

/**
 * Email tracking options
 */
export interface EmailTracking {
  /** Track email opens */
  opens?: boolean;
  /** Track link clicks */
  clicks?: boolean;
  /** Custom metadata to include with tracking events */
  metadata?: Record<string, unknown>;
}

/**
 * Unsubscribe options for email headers
 */
export interface UnsubscribeOptions {
  /** URL for unsubscribe action */
  url?: string;
  /** Email address for unsubscribe */
  email?: string;
  /** Enable one-click unsubscribe */
  oneClick?: boolean;
}

/**
 * Email message to send
 */
export interface EmailMessage {
  /** Sender address */
  from?: string | EmailAddress;
  /** Recipient address(es) */
  to: string | EmailAddress | (string | EmailAddress)[];
  /** CC address(es) */
  cc?: string | EmailAddress | (string | EmailAddress)[];
  /** BCC address(es) */
  bcc?: string | EmailAddress | (string | EmailAddress)[];
  /** Reply-to address */
  replyTo?: string | EmailAddress;
  /** Email subject */
  subject: string;
  /** Plain text content */
  text?: string;
  /** HTML content */
  html?: string;
  /** React component for email content */
  react?: ReactElement;
  /** File attachments */
  attachments?: EmailAttachment[];
  /** Custom headers */
  headers?: Record<string, string>;
  /** Tracking options */
  tracking?: EmailTracking;
  /** Unsubscribe options */
  unsubscribe?: UnsubscribeOptions;
  /** Email priority */
  priority?: 'high' | 'normal' | 'low';
  /** Tags for categorization */
  tags?: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Scheduled send time */
  scheduledAt?: Date | string;
}

/**
 * Bulk email recipient
 */
export interface BulkRecipient {
  /** Recipient address */
  to: string | EmailAddress;
  /** Per-recipient variables for template substitution */
  variables?: Record<string, unknown>;
  /** Per-recipient metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Bulk email message
 */
export interface BulkEmailMessage extends Omit<EmailMessage, 'to'> {
  /** List of recipients with optional personalization */
  recipients: BulkRecipient[];
}

/**
 * Template email message
 */
export interface TemplateEmailMessage<T = Record<string, unknown>> {
  /** Sender address */
  from?: string | EmailAddress;
  /** Recipient address(es) */
  to: string | EmailAddress | (string | EmailAddress)[];
  /** Email subject (may be overridden by template) */
  subject: string;
  /** Template ID or name */
  template: string;
  /** Template variables */
  variables?: T;
  /** Additional options */
  options?: Partial<EmailMessage>;
}

/**
 * Result of sending an email
 */
export interface EmailResult {
  /** Whether the send was successful */
  success: boolean;
  /** Message ID from the provider */
  messageId?: string;
  /** Error if send failed */
  error?: Error;
  /** Raw response from the provider */
  response?: unknown;
  /** Timestamp of the result */
  timestamp: Date;
}

/**
 * Result of bulk email sending
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
  /** Send bulk emails */
  sendBulk?(message: BulkEmailMessage): Promise<BulkEmailResult>;
  /** Verify provider connection/credentials */
  verify?(): Promise<boolean>;
  /** Close/cleanup provider resources */
  close?(): Promise<void>;
}

/**
 * Base provider configuration
 */
export interface ProviderConfig {
  /** Default from address */
  defaultFrom?: string | EmailAddress;
  /** Enable debug logging */
  debug?: boolean;
  /** Retry configuration */
  retry?: RetryConfig;
}

/**
 * Retry configuration for failed sends
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** HTTP status codes to retry on */
  retryOn?: number[];
}

/**
 * SMTP provider configuration
 */
export interface SmtpConfig extends ProviderConfig {
  /** SMTP host */
  host: string;
  /** SMTP port */
  port: number;
  /** Use secure connection (TLS) */
  secure?: boolean;
  /** Authentication credentials */
  auth?: {
    user: string;
    pass: string;
  };
  /** TLS options */
  tls?: {
    rejectUnauthorized?: boolean;
    minVersion?: string;
  };
  /** Use connection pooling */
  pool?: boolean;
  /** Maximum concurrent connections */
  maxConnections?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
}

/**
 * SendGrid provider configuration
 */
export interface SendGridConfig extends ProviderConfig {
  /** SendGrid API key */
  apiKey: string;
  /** Enable sandbox mode for testing */
  sandbox?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Mailgun provider configuration
 */
export interface MailgunConfig extends ProviderConfig {
  /** Mailgun API key */
  apiKey: string;
  /** Mailgun domain */
  domain: string;
  /** Use EU region */
  eu?: boolean;
  /** Enable test mode */
  testMode?: boolean;
}

/**
 * Resend provider configuration
 */
export interface ResendConfig extends ProviderConfig {
  /** Resend API key */
  apiKey: string;
}

/**
 * AWS SES provider configuration
 */
export interface SesConfig extends ProviderConfig {
  /** AWS region */
  region: string;
  /** AWS access key ID (optional, can use default credential chain) */
  accessKeyId?: string;
  /** AWS secret access key (optional, can use default credential chain) */
  secretAccessKey?: string;
  /** SES configuration set name for tracking */
  configurationSetName?: string;
}

/**
 * Email queue job
 */
export interface EmailQueueJob {
  /** Job ID */
  id: string;
  /** Email message to send */
  message: EmailMessage;
  /** Number of attempts made */
  attempts: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Current job status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Job creation time */
  createdAt: Date;
  /** Time of last attempt */
  lastAttempt?: Date;
  /** Time of next retry attempt */
  nextAttempt?: Date;
  /** Completion time */
  completedAt?: Date;
  /** Error message if failed */
  error?: string;
}

/**
 * Email queue interface
 */
export interface EmailQueue {
  /** Add an email to the queue */
  enqueue(message: EmailMessage, options?: QueueOptions): Promise<string>;
  /** Start processing the queue */
  process(handler: (job: EmailQueueJob) => Promise<EmailResult>): Promise<void>;
  /** Stop processing */
  stop(): void;
  /** Get a job by ID */
  getJob(id: string): Promise<EmailQueueJob | null>;
  /** Cancel a pending job */
  cancel(id: string): Promise<boolean>;
  /** Get queue statistics */
  stats(): Promise<QueueStats>;
}

/**
 * Queue options for enqueuing emails
 */
export interface QueueOptions {
  /** Delay in milliseconds before processing */
  delay?: number;
  /** Maximum retry attempts */
  maxAttempts?: number;
  /** Priority (lower = higher priority) */
  priority?: number;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  /** Number of pending jobs */
  pending: number;
  /** Number of jobs currently processing */
  processing: number;
  /** Number of completed jobs */
  completed: number;
  /** Number of failed jobs */
  failed: number;
}

/**
 * Tracking event (re-exported from tracking.ts for convenience)
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
  on(
    type: TrackingEvent['type'],
    handler: (event: TrackingEvent) => Promise<void>
  ): void;
  handle(event: TrackingEvent): Promise<void>;
  verify(payload: unknown, signature: string): boolean;
}

/**
 * Email client options
 */
export interface EmailClientOptions {
  /** Default provider to use */
  provider: EmailProvider;
  /** Fallback providers in order of preference */
  fallbackProviders?: EmailProvider[];
  /** Default from address */
  defaultFrom?: string | EmailAddress;
  /** Default retry configuration */
  retry?: RetryConfig;
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Email template interface
 */
export interface EmailTemplate<T = Record<string, unknown>> {
  /** Template ID or name */
  id: string;
  /** Template name for display */
  name: string;
  /** Render the template with given props */
  render(props: T): ReactElement | string;
  /** Get the subject line */
  getSubject?(props: T): string;
}

/**
 * Template registry for managing email templates
 */
export interface TemplateRegistry {
  /** Register a template */
  register<T>(template: EmailTemplate<T>): void;
  /** Get a template by ID */
  get<T>(id: string): EmailTemplate<T> | undefined;
  /** Check if a template exists */
  has(id: string): boolean;
  /** List all registered template IDs */
  list(): string[];
}

/**
 * Template props base type
 */
export type TemplateProps<T extends EmailTemplate> = T extends EmailTemplate<infer P> ? P : never;
