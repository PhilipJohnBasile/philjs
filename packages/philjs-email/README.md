# @philjs/email

Multi-provider email sending library for PhilJS applications. Send emails through SMTP, SendGrid, Resend, AWS SES, or Mailgun with a unified API.

## Installation

```bash
npm install @philjs/email
# or
pnpm add @philjs/email
```

### Optional Provider Dependencies

Depending on which provider you use, install the appropriate dependencies:

```bash
# For SendGrid
pnpm add @sendgrid/mail

# For Resend
pnpm add resend

# For AWS SES
pnpm add @aws-sdk/client-ses

# For Mailgun
pnpm add mailgun.js form-data

# For React email templates
pnpm add @react-email/components
```

## Quick Start

```typescript
import { createSmtpProvider } from '@philjs/email';

// Create a provider
const smtp = createSmtpProvider({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'user@example.com',
    pass: 'password',
  },
});

// Send an email
const result = await smtp.send({
  to: 'recipient@example.com',
  subject: 'Hello from PhilJS',
  text: 'This is a test email.',
  html: '<h1>Hello!</h1><p>This is a test email.</p>',
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Failed:', result.error);
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
  auth: { user: 'user', pass: 'pass' },
  defaultFrom: 'noreply@example.com',
});

// Or use a preset
const gmail = createSmtpProvider({
  ...SmtpPresets.gmail,
  auth: { user: 'you@gmail.com', pass: 'app-password' },
});
```

### SendGrid

```typescript
import { createSendGridProvider } from '@philjs/email';

const sendgrid = createSendGridProvider({
  apiKey: process.env.SENDGRID_API_KEY!,
  defaultFrom: 'noreply@example.com',
  sandbox: false, // Enable for testing
});
```

### Resend

```typescript
import { createResendProvider } from '@philjs/email';

const resend = createResendProvider({
  apiKey: process.env.RESEND_API_KEY!,
  defaultFrom: 'noreply@example.com',
});
```

### AWS SES

```typescript
import { createSesProvider } from '@philjs/email';

const ses = createSesProvider({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  defaultFrom: 'noreply@example.com',
  configurationSetName: 'my-config-set', // Optional, for tracking
});
```

### Mailgun

```typescript
import { createMailgunProvider } from '@philjs/email';

const mailgun = createMailgunProvider({
  apiKey: process.env.MAILGUN_API_KEY!,
  domain: 'mg.example.com',
  eu: false, // Set true for EU region
  defaultFrom: 'noreply@example.com',
});
```

## Features

### Attachments

```typescript
await provider.send({
  to: 'recipient@example.com',
  subject: 'Report attached',
  text: 'Please find the report attached.',
  attachments: [
    {
      filename: 'report.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
    {
      filename: 'logo.png',
      content: logoBuffer,
      contentType: 'image/png',
      disposition: 'inline',
      cid: 'logo', // Reference in HTML as <img src="cid:logo">
    },
  ],
});
```

### React Email Templates

```typescript
import { renderReactEmail } from '@philjs/email';
import { WelcomeEmail } from './templates/welcome';

// Render a React component
const { html, text } = await renderReactEmail(
  <WelcomeEmail name="John" />
);

await provider.send({
  to: 'john@example.com',
  subject: 'Welcome!',
  html,
  text,
});

// Or pass directly (if provider supports it)
await provider.send({
  to: 'john@example.com',
  subject: 'Welcome!',
  react: <WelcomeEmail name="John" />,
});
```

### Bulk Sending

```typescript
const result = await provider.sendBulk({
  subject: 'Monthly Newsletter',
  html: '<h1>Newsletter</h1>...',
  recipients: [
    { to: 'user1@example.com', variables: { name: 'User 1' } },
    { to: 'user2@example.com', variables: { name: 'User 2' } },
    // Up to 1000 recipients per batch (provider-dependent)
  ],
});

console.log(`Sent: ${result.successful}/${result.total}`);
```

### Scheduled Sending

```typescript
await provider.send({
  to: 'recipient@example.com',
  subject: 'Future Email',
  text: 'This will arrive tomorrow!',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});
```

### Click/Open Tracking

```typescript
await provider.send({
  to: 'recipient@example.com',
  subject: 'Tracked Email',
  html: '<a href="https://example.com">Click here</a>',
  tracking: {
    opens: true,
    clicks: true,
    metadata: { campaign: 'welcome-flow' },
  },
});
```

### Unsubscribe Headers

```typescript
await provider.send({
  to: 'recipient@example.com',
  subject: 'Newsletter',
  html: '...',
  unsubscribe: {
    url: 'https://example.com/unsubscribe?token=abc123',
    email: 'unsubscribe@example.com',
    oneClick: true,
  },
});
```

## Email Queue

For high-volume sending with retry logic:

```typescript
import { createQueue, createSmtpProvider } from '@philjs/email';

const provider = createSmtpProvider({ /* ... */ });
const queue = createQueue({
  maxConcurrency: 5,
  pollInterval: 1000,
  defaultMaxAttempts: 3,
});

// Add emails to queue
const jobId = await queue.enqueue({
  to: 'recipient@example.com',
  subject: 'Queued Email',
  text: 'This will be sent from the queue.',
});

// Start processing
await queue.process(async (job) => {
  return provider.send(job.message);
});

// Check job status
const job = await queue.getJob(jobId);
console.log(job?.status); // 'pending' | 'processing' | 'completed' | 'failed'

// Get queue stats
const stats = await queue.stats();
console.log(stats); // { pending: 0, processing: 1, completed: 10, failed: 0 }

// Stop processing
queue.stop();
```

## Tracking Webhooks

Handle tracking events from your email provider:

```typescript
import { createTrackingWebhook, SendGridWebhook } from '@philjs/email';

// Generic webhook
const webhook = createTrackingWebhook('generic', {
  secret: 'your-webhook-secret',
});

webhook.on('open', async (event) => {
  console.log(`Email ${event.messageId} opened by ${event.recipient}`);
});

webhook.on('click', async (event) => {
  console.log(`Link clicked: ${event.url}`);
});

webhook.on('bounce', async (event) => {
  console.log(`Bounced: ${event.recipient}`);
});

// In your HTTP handler
app.post('/webhooks/email', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];

  if (!webhook.verify(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  await webhook.handle(req.body);
  res.status(200).send('OK');
});
```

### Provider-Specific Webhooks

```typescript
// SendGrid
const sgWebhook = new SendGridWebhook({ verificationKey: 'key' });
const events = sgWebhook.parseEvents(req.body);

// Mailgun
const mgWebhook = new MailgunWebhook({ signingKey: 'key' });
const event = mgWebhook.parseEvent(req.body);

// AWS SES (via SNS)
const sesWebhook = new SesWebhook();
const event = sesWebhook.parseEvent(req.body);
```

## Utilities

```typescript
import {
  normalizeAddress,
  formatAddress,
  isValidEmail,
  parseEmails,
  htmlToText,
  withRetry,
} from '@philjs/email';

// Normalize email address
normalizeAddress('John <john@example.com>');
// { email: 'john@example.com', name: 'John' }

// Format for headers
formatAddress({ email: 'john@example.com', name: 'John' });
// '"John" <john@example.com>'

// Validate email
isValidEmail('test@example.com'); // true
isValidEmail('invalid'); // false

// Parse comma-separated emails
parseEmails('a@example.com, b@example.com');
// [{ email: 'a@example.com' }, { email: 'b@example.com' }]

// Convert HTML to plain text
htmlToText('<h1>Hello</h1><p>World</p>');
// 'Hello\n\nWorld'

// Retry with exponential backoff
const result = await withRetry(
  () => provider.send(message),
  { maxAttempts: 3, initialDelay: 1000 }
);
```

## Pre-built Templates

```typescript
import {
  WelcomeEmail,
  PasswordResetEmail,
  NotificationEmail,
  getWelcomeSubject,
} from '@philjs/email';

// Use pre-built templates
await provider.send({
  to: 'user@example.com',
  subject: getWelcomeSubject({ name: 'John' }),
  react: <WelcomeEmail name="John" ctaUrl="https://example.com/start" />,
});
```

## Error Handling

```typescript
const result = await provider.send({ /* ... */ });

if (result.success) {
  console.log('Sent:', result.messageId);
  console.log('Timestamp:', result.timestamp);
} else {
  console.error('Error:', result.error?.message);
  // Handle specific errors
  if (result.error?.message.includes('rate limit')) {
    // Retry later
  }
}
```

## TypeScript

Full type definitions are included:

```typescript
import type {
  EmailMessage,
  EmailResult,
  EmailProvider,
  EmailAddress,
  BulkEmailMessage,
  BulkEmailResult,
} from '@philjs/email';
```

## License

MIT
