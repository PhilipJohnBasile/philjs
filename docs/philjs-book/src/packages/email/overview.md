# @philjs/email

Comprehensive email sending library for PhilJS with multiple provider support, templates, tracking, queuing, and React email components.

## Installation

```bash
npm install @philjs/email
```

## Features

- **Multiple Providers** - SMTP, SendGrid, Mailgun, Resend, AWS SES
- **React Email Support** - Render React components as email HTML
- **Template System** - Pre-built and custom email templates
- **Email Queue** - Background processing with retries
- **Tracking Webhooks** - Track opens, clicks, bounces, complaints
- **Bulk Sending** - Send to thousands of recipients efficiently
- **Attachments** - File attachments with inline images
- **Scheduling** - Schedule emails for future delivery

## Quick Start

```typescript
import { createSendGridProvider } from '@philjs/email';

// Create a provider
const email = createSendGridProvider({
  apiKey: process.env.SENDGRID_API_KEY,
  defaultFrom: 'noreply@example.com',
});

// Send an email
const result = await email.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our app!</h1>',
});

if (result.success) {
  console.log('Email sent:', result.messageId);
}
```

## Providers

### SMTP

```typescript
import { createSmtpProvider, SmtpPresets } from '@philjs/email';

// Custom SMTP server
const smtp = createSmtpProvider({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'username',
    pass: 'password',
  },
  defaultFrom: 'noreply@example.com',
});

// Or use a preset
const gmail = createSmtpProvider({
  ...SmtpPresets.gmail,
  auth: {
    user: 'your@gmail.com',
    pass: 'app-password',
  },
});
```

### SendGrid

```typescript
import { createSendGridProvider } from '@philjs/email';

const sendgrid = createSendGridProvider({
  apiKey: 'SG.xxxxx',
  defaultFrom: { email: 'noreply@example.com', name: 'My App' },
  sandbox: false, // Set true for testing
  debug: true,
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
  },
});
```

### Mailgun

```typescript
import { createMailgunProvider } from '@philjs/email';

const mailgun = createMailgunProvider({
  apiKey: 'key-xxxxx',
  domain: 'mail.example.com',
  eu: false, // Set true for EU region
  testMode: false,
  defaultFrom: 'noreply@example.com',
});
```

### Resend

```typescript
import { createResendProvider } from '@philjs/email';

const resend = createResendProvider({
  apiKey: 're_xxxxx',
  defaultFrom: 'noreply@example.com',
});
```

### AWS SES

```typescript
import { createSesProvider } from '@philjs/email';

const ses = createSesProvider({
  region: 'us-east-1',
  accessKeyId: 'AKIAXXXXX', // Optional - uses default credential chain
  secretAccessKey: 'xxxxx',
  configurationSetName: 'my-tracking-config',
  defaultFrom: 'noreply@example.com',
});
```

## Sending Emails

### Basic Email

```typescript
const result = await provider.send({
  from: 'sender@example.com', // Optional if defaultFrom is set
  to: 'recipient@example.com',
  subject: 'Hello!',
  text: 'Plain text content',
  html: '<h1>HTML content</h1>',
});
```

### Multiple Recipients

```typescript
await provider.send({
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'cc@example.com',
  bcc: ['bcc1@example.com', 'bcc2@example.com'],
  subject: 'Team Update',
  html: '<p>Important announcement...</p>',
});
```

### With Name

```typescript
await provider.send({
  from: { email: 'support@example.com', name: 'Support Team' },
  to: { email: 'john@example.com', name: 'John Doe' },
  replyTo: { email: 'reply@example.com', name: 'Reply Handler' },
  subject: 'Support Request #123',
  html: '...',
});
```

### Attachments

```typescript
await provider.send({
  to: 'user@example.com',
  subject: 'Your Invoice',
  html: '<p>Please find your invoice attached.</p>',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
    {
      filename: 'logo.png',
      content: logoBuffer,
      contentType: 'image/png',
      disposition: 'inline',
      cid: 'logo', // Reference as <img src="cid:logo">
    },
  ],
});
```

### Priority & Tags

```typescript
await provider.send({
  to: 'urgent@example.com',
  subject: 'Urgent: Action Required',
  html: '...',
  priority: 'high', // 'high' | 'normal' | 'low'
  tags: ['urgent', 'billing'],
  metadata: {
    userId: '12345',
    orderId: 'ORD-789',
  },
});
```

### Scheduled Sending

```typescript
await provider.send({
  to: 'user@example.com',
  subject: 'Scheduled Newsletter',
  html: '...',
  scheduledAt: new Date('2024-12-25T09:00:00Z'),
});
```

### Tracking

```typescript
await provider.send({
  to: 'user@example.com',
  subject: 'Tracked Email',
  html: '<p>Click <a href="https://example.com">here</a></p>',
  tracking: {
    opens: true,
    clicks: true,
    metadata: { campaign: 'winter-sale' },
  },
});
```

### Unsubscribe Headers

```typescript
await provider.send({
  to: 'user@example.com',
  subject: 'Newsletter',
  html: '...',
  unsubscribe: {
    url: 'https://example.com/unsubscribe?token=xxx',
    email: 'unsubscribe@example.com',
    oneClick: true,
  },
});
```

## React Email Components

```typescript
import { renderReactEmail } from '@philjs/email';

// Define a React email component
function WelcomeEmail({ name, activationUrl }) {
  return (
    <html>
      <body>
        <h1>Welcome, {name}!</h1>
        <p>Thanks for signing up.</p>
        <a href={activationUrl}>Activate your account</a>
      </body>
    </html>
  );
}

// Send with React component
await provider.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  react: <WelcomeEmail name="John" activationUrl="https://..." />,
});
```

## Bulk Sending

```typescript
const result = await provider.sendBulk({
  from: 'newsletter@example.com',
  subject: 'Monthly Newsletter',
  html: '<p>Hello {{name}},</p><p>Here are your updates...</p>',
  recipients: [
    {
      to: 'user1@example.com',
      variables: { name: 'Alice' },
      metadata: { userId: '1' },
    },
    {
      to: 'user2@example.com',
      variables: { name: 'Bob' },
      metadata: { userId: '2' },
    },
    // ... thousands more
  ],
});

console.log({
  total: result.total,
  successful: result.successful,
  failed: result.failed,
});
```

## Email Queue

### Creating a Queue

```typescript
import { createQueue, InMemoryQueue } from '@philjs/email';

const queue = createQueue({
  maxConcurrency: 5,     // Process 5 emails at once
  pollInterval: 1000,    // Check for new jobs every second
  defaultMaxAttempts: 3, // Retry failed emails 3 times
});
```

### Enqueuing Emails

```typescript
// Add email to queue
const jobId = await queue.enqueue({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome!</h1>',
}, {
  delay: 5000,      // Wait 5 seconds before sending
  maxAttempts: 5,   // Override default retry count
  priority: 1,      // Lower = higher priority
});

console.log('Queued job:', jobId);
```

### Processing the Queue

```typescript
// Start processing
await queue.process(async (job) => {
  console.log(`Processing job ${job.id}, attempt ${job.attempts}`);
  return provider.send(job.message);
});

// Stop processing
queue.stop();
```

### Queue Management

```typescript
// Get job status
const job = await queue.getJob(jobId);
console.log(job.status); // 'pending' | 'processing' | 'completed' | 'failed'

// Cancel a pending job
const cancelled = await queue.cancel(jobId);

// Get queue statistics
const stats = await queue.stats();
console.log(stats);
// { pending: 10, processing: 2, completed: 100, failed: 3 }

// Cleanup old jobs
queue.cleanup(24 * 60 * 60 * 1000); // Remove jobs older than 24 hours
```

## Tracking Webhooks

### Setting Up Webhooks

```typescript
import { createTrackingWebhook } from '@philjs/email';

// Generic webhook
const webhook = createTrackingWebhook('generic', {
  secret: 'webhook-secret',
});

// Provider-specific webhooks
const sendgridWebhook = createTrackingWebhook('sendgrid', {
  verificationKey: 'your-verification-key',
});

const mailgunWebhook = createTrackingWebhook('mailgun', {
  signingKey: 'your-signing-key',
});

const sesWebhook = createTrackingWebhook('ses');
```

### Handling Events

```typescript
// Register event handlers
webhook.on('open', async (event) => {
  console.log(`Email ${event.messageId} opened by ${event.recipient}`);
  await analytics.trackOpen(event);
});

webhook.on('click', async (event) => {
  console.log(`Link clicked: ${event.url}`);
  await analytics.trackClick(event);
});

webhook.on('bounce', async (event) => {
  console.log(`Email bounced: ${event.recipient}`);
  await markEmailInvalid(event.recipient);
});

webhook.on('complaint', async (event) => {
  console.log(`Spam complaint: ${event.recipient}`);
  await unsubscribeUser(event.recipient);
});

webhook.on('unsubscribe', async (event) => {
  console.log(`Unsubscribed: ${event.recipient}`);
  await handleUnsubscribe(event.recipient);
});
```

### Express Integration

```typescript
import express from 'express';
import { SendGridWebhook } from '@philjs/email';

const app = express();
const webhook = new SendGridWebhook({ verificationKey: '...' });

// Register handlers
webhook.on('open', handleOpen);
webhook.on('click', handleClick);

app.post('/webhooks/sendgrid', express.json(), async (req, res) => {
  // Verify signature
  const signature = req.headers['x-twilio-email-event-webhook-signature'];
  if (!webhook.verify(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  // Parse and handle events
  const events = webhook.parseEvents(req.body);
  for (const event of events) {
    await webhook.handle(event);
  }

  res.status(200).send('OK');
});
```

## Tracking Event Types

```typescript
interface TrackingEvent {
  type: 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe';
  messageId: string;
  recipient: string;
  timestamp: Date;
  url?: string;        // For click events
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}
```

## Utility Functions

### Email Validation

```typescript
import { isValidEmail, parseEmails } from '@philjs/email';

isValidEmail('user@example.com'); // true
isValidEmail('invalid-email');    // false

// Parse comma-separated list
const emails = parseEmails('user1@example.com, user2@example.com');
// ['user1@example.com', 'user2@example.com']
```

### Address Formatting

```typescript
import { normalizeAddress, formatAddress } from '@philjs/email';

// Normalize to object
normalizeAddress('user@example.com');
// { email: 'user@example.com' }

normalizeAddress({ email: 'user@example.com', name: 'John' });
// { email: 'user@example.com', name: 'John' }

// Format for headers
formatAddress({ email: 'user@example.com', name: 'John Doe' });
// '"John Doe" <user@example.com>'
```

### HTML to Text

```typescript
import { htmlToText } from '@philjs/email';

const text = htmlToText('<h1>Hello</h1><p>World</p>');
// 'Hello\n\nWorld'
```

### Tracking Helpers

```typescript
import { createTrackingPixel, wrapLinksForTracking } from '@philjs/email';

// Create tracking pixel image tag
const pixel = createTrackingPixel({
  baseUrl: 'https://track.example.com/open',
  messageId: 'msg-123',
  recipient: 'user@example.com',
});
// <img src="https://track.example.com/open?id=msg-123&recipient=..." />

// Wrap links for click tracking
const html = wrapLinksForTracking(originalHtml, {
  baseUrl: 'https://track.example.com/click',
  messageId: 'msg-123',
});
```

## Types Reference

```typescript
// Email message
interface EmailMessage {
  from?: string | EmailAddress;
  to: string | EmailAddress | (string | EmailAddress)[];
  cc?: string | EmailAddress | (string | EmailAddress)[];
  bcc?: string | EmailAddress | (string | EmailAddress)[];
  replyTo?: string | EmailAddress;
  subject: string;
  text?: string;
  html?: string;
  react?: ReactElement;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tracking?: EmailTracking;
  unsubscribe?: UnsubscribeOptions;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  metadata?: Record<string, unknown>;
  scheduledAt?: Date | string;
}

// Email address
interface EmailAddress {
  email: string;
  name?: string;
}

// Attachment
interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  disposition?: 'attachment' | 'inline';
  cid?: string;
  encoding?: BufferEncoding;
}

// Send result
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  response?: unknown;
  timestamp: Date;
}

// Bulk result
interface BulkEmailResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailResult[];
}

// Queue job
interface EmailQueueJob {
  id: string;
  message: EmailMessage;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  lastAttempt?: Date;
  nextAttempt?: Date;
  completedAt?: Date;
  error?: string;
}
```

## API Reference

### Providers

| Provider | Description |
|----------|-------------|
| `SmtpProvider` | Send via any SMTP server |
| `SendGridProvider` | SendGrid API integration |
| `MailgunProvider` | Mailgun API integration |
| `ResendProvider` | Resend API integration |
| `SesProvider` | AWS SES integration |

### Factory Functions

| Function | Description |
|----------|-------------|
| `createSmtpProvider(config)` | Create SMTP provider |
| `createSendGridProvider(config)` | Create SendGrid provider |
| `createMailgunProvider(config)` | Create Mailgun provider |
| `createResendProvider(config)` | Create Resend provider |
| `createSesProvider(config)` | Create SES provider |
| `createQueue(options?)` | Create email queue |
| `createTrackingWebhook(provider, options?)` | Create tracking webhook |

### Utility Functions

| Function | Description |
|----------|-------------|
| `isValidEmail(email)` | Validate email format |
| `parseEmails(str)` | Parse comma-separated emails |
| `normalizeAddress(addr)` | Normalize to EmailAddress |
| `formatAddress(addr)` | Format for email headers |
| `htmlToText(html)` | Convert HTML to plain text |
| `renderReactEmail(element)` | Render React to HTML |
| `createTrackingPixel(opts)` | Create open tracking pixel |
| `wrapLinksForTracking(html, opts)` | Add click tracking to links |

## Examples

### Transactional Email Service

```typescript
import {
  createSendGridProvider,
  createQueue,
  createTrackingWebhook,
} from '@philjs/email';

class EmailService {
  private provider;
  private queue;
  private webhook;

  constructor() {
    this.provider = createSendGridProvider({
      apiKey: process.env.SENDGRID_API_KEY,
      defaultFrom: 'noreply@example.com',
    });

    this.queue = createQueue({
      maxConcurrency: 10,
      defaultMaxAttempts: 3,
    });

    this.webhook = createTrackingWebhook('sendgrid');
    this.setupTracking();
    this.startProcessing();
  }

  private setupTracking() {
    this.webhook.on('bounce', async (event) => {
      await db.users.update({
        where: { email: event.recipient },
        data: { emailValid: false },
      });
    });
  }

  private startProcessing() {
    this.queue.process((job) => this.provider.send(job.message));
  }

  async sendWelcome(user: { email: string; name: string }) {
    return this.queue.enqueue({
      to: { email: user.email, name: user.name },
      subject: 'Welcome to Our App!',
      html: welcomeTemplate({ name: user.name }),
      tracking: { opens: true, clicks: true },
    });
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    // Send immediately, don't queue
    return this.provider.send({
      to: email,
      subject: 'Reset Your Password',
      html: passwordResetTemplate({ resetUrl }),
      priority: 'high',
    });
  }
}
```

### Newsletter System

```typescript
import { createSendGridProvider } from '@philjs/email';

async function sendNewsletter(subscribers: Subscriber[], content: string) {
  const provider = createSendGridProvider({
    apiKey: process.env.SENDGRID_API_KEY,
  });

  const result = await provider.sendBulk({
    from: { email: 'newsletter@example.com', name: 'Weekly Digest' },
    subject: 'Your Weekly Update',
    html: `
      <p>Hello {{name}},</p>
      ${content}
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
    `,
    recipients: subscribers.map(sub => ({
      to: { email: sub.email, name: sub.name },
      variables: {
        name: sub.name,
        unsubscribeUrl: `https://example.com/unsubscribe?token=${sub.token}`,
      },
    })),
    tracking: { opens: true, clicks: true },
    unsubscribe: { oneClick: true },
  });

  console.log(`Sent ${result.successful}/${result.total} emails`);
  return result;
}
```
