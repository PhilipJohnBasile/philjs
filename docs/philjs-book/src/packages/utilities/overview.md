# Utility Packages

PhilJS includes a comprehensive set of utility packages for common development tasks.

## Available Packages

| Package | Description |
|---------|-------------|
| `@philjs/email` | Multi-provider email sending |
| `@philjs/git` | Git repository operations |
| `@philjs/perf` | Performance utilities |
| `@philjs/crypto` | Cryptographic operations |
| `@philjs/a11y` | Accessibility helpers |

## @philjs/email

Multi-provider email sending library with queuing, tracking, and template support.

### Installation

```bash
pnpm add @philjs/email
```

### Provider Setup

```tsx
import {
  createSmtpProvider,
  createSendGridProvider,
  createResendProvider,
  createSesProvider,
  createMailgunProvider,
} from '@philjs/email';

// SMTP
const smtp = createSmtpProvider({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'user', pass: 'pass' },
  defaultFrom: 'noreply@example.com',
});

// SendGrid
const sendgrid = createSendGridProvider({
  apiKey: process.env.SENDGRID_API_KEY!,
  defaultFrom: 'noreply@example.com',
});

// Resend
const resend = createResendProvider({
  apiKey: process.env.RESEND_API_KEY!,
  defaultFrom: 'noreply@example.com',
});

// AWS SES
const ses = createSesProvider({
  region: 'us-east-1',
  defaultFrom: 'noreply@example.com',
});

// Mailgun
const mailgun = createMailgunProvider({
  apiKey: process.env.MAILGUN_API_KEY!,
  domain: 'mg.example.com',
  defaultFrom: 'noreply@example.com',
});
```

### Sending Emails

```tsx
// Simple send
const result = await provider.send({
  to: 'user@example.com',
  subject: 'Hello!',
  text: 'Plain text content',
  html: '<h1>HTML content</h1>',
});

if (result.success) {
  console.log('Sent:', result.messageId);
}

// With attachments
await provider.send({
  to: 'user@example.com',
  subject: 'Report attached',
  text: 'See attached.',
  attachments: [
    {
      filename: 'report.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});

// Bulk sending
const result = await provider.sendBulk({
  subject: 'Newsletter',
  html: '<h1>Monthly Update</h1>...',
  recipients: [
    { to: 'user1@example.com', variables: { name: 'User 1' } },
    { to: 'user2@example.com', variables: { name: 'User 2' } },
  ],
});
console.log(`Sent: ${result.successful}/${result.total}`);
```

### React Email Templates

```tsx
import { renderReactEmail, WelcomeEmail } from '@philjs/email';

// Render React component to HTML
const { html, text } = await renderReactEmail(
  <WelcomeEmail name="John" />
);

await provider.send({
  to: 'john@example.com',
  subject: 'Welcome!',
  html,
  text,
});
```

### Email Queue

```tsx
import { createQueue } from '@philjs/email';

const queue = createQueue({
  maxConcurrency: 5,
  pollInterval: 1000,
  defaultMaxAttempts: 3,
});

// Enqueue emails
const jobId = await queue.enqueue({
  to: 'user@example.com',
  subject: 'Queued Email',
  text: 'This will be sent from the queue.',
});

// Process queue
await queue.process(async (job) => {
  return provider.send(job.message);
});

// Check status
const stats = await queue.stats();
// { pending: 0, processing: 1, completed: 10, failed: 0 }
```

### Tracking Webhooks

```tsx
import { createTrackingWebhook } from '@philjs/email';

const webhook = createTrackingWebhook('generic', {
  secret: 'webhook-secret',
});

webhook.on('open', async (event) => {
  console.log(`Opened: ${event.messageId}`);
});

webhook.on('click', async (event) => {
  console.log(`Clicked: ${event.url}`);
});

// In HTTP handler
app.post('/webhooks/email', async (req, res) => {
  if (!webhook.verify(req.body, req.headers['x-signature'])) {
    return res.status(401).send();
  }
  await webhook.handle(req.body);
  res.status(200).send();
});
```

### Utilities

```tsx
import {
  isValidEmail,
  parseEmails,
  htmlToText,
  normalizeAddress,
  formatAddress,
} from '@philjs/email';

isValidEmail('test@example.com'); // true

parseEmails('a@example.com, b@example.com');
// [{ email: 'a@example.com' }, { email: 'b@example.com' }]

htmlToText('<h1>Hello</h1><p>World</p>');
// 'Hello\n\nWorld'

normalizeAddress('John <john@example.com>');
// { email: 'john@example.com', name: 'John' }

formatAddress({ email: 'john@example.com', name: 'John' });
// '"John" <john@example.com>'
```

## @philjs/git

Type-safe Git utilities for repository operations, perfect for build tools and CI/CD.

### Installation

```bash
pnpm add @philjs/git
```

### Status Operations

```tsx
import {
  getGitStatus,
  isClean,
  isGitRepository,
  getBranch,
} from '@philjs/git';

// Check if in a git repo
const isRepo = await isGitRepository();

// Get current branch
const branch = await getBranch(); // "main"

// Check if working directory is clean
const clean = await isClean(); // true/false

// Get detailed status
const status = await getGitStatus();
// [{ status: 'M', file: 'src/index.ts' }, ...]
```

### Branch Operations

```tsx
import {
  getBranches,
  createBranch,
  checkout,
  deleteBranch,
} from '@philjs/git';

// List all branches
const branches = await getBranches();
// [{ name: 'main', current: true }, { name: 'feature/new', current: false }]

// Create a new branch
await createBranch('feature/awesome');

// Create and checkout
await createBranch('feature/awesome', true);

// Switch branches
await checkout('main');

// Delete branch
await deleteBranch('feature/old');
await deleteBranch('feature/old', true); // Force delete
```

### Commit Operations

```tsx
import {
  getCommits,
  commit,
  amendCommit,
  getCurrentHash,
} from '@philjs/git';

// Get recent commits
const commits = await getCommits(10);
// [{
//   hash: 'abc123...',
//   shortHash: 'abc123',
//   author: 'John Doe',
//   email: 'john@example.com',
//   date: Date,
//   message: 'Initial commit'
// }, ...]

// Create a commit
await commit('Add new feature');

// Amend last commit
await amendCommit('Updated message');
await amendCommit(); // Keep message, add staged files

// Get current hash
const hash = await getCurrentHash();      // Full hash
const short = await getCurrentHash(true); // Short hash
```

### Staging Operations

```tsx
import { add, reset, discardChanges } from '@philjs/git';

// Stage files
await add('src/index.ts');
await add(['file1.ts', 'file2.ts']);
await add(); // Stage all (git add .)

// Unstage files
await reset('src/index.ts');
await reset(['file1.ts', 'file2.ts']);

// Discard changes
await discardChanges('src/index.ts');
```

### Remote Operations

```tsx
import {
  getRemotes,
  fetch,
  pull,
  push,
} from '@philjs/git';

// List remotes
const remotes = await getRemotes();
// [{ name: 'origin', url: 'https://...', type: 'fetch' }, ...]

// Fetch updates
await fetch();
await fetch('origin', true); // With prune

// Pull
await pull();
await pull('origin', 'main');

// Push
await push();
await push('origin', 'feature/new', { setUpstream: true });
```

### Diff Operations

```tsx
import { getDiff, getDiffStats } from '@philjs/git';

// Get diff stats
const stats = await getDiffStats();
// [{ file: 'index.ts', additions: 10, deletions: 5, binary: false }, ...]

// Get raw diff
const diff = await getDiff('HEAD~1');
```

### Stash Operations

```tsx
import { stash, stashPop, stashList } from '@philjs/git';

// Stash current changes
await stash();
await stash('WIP: Feature in progress');

// List stashes
const stashes = await stashList();
// [{ index: 0, message: 'WIP: Feature in progress' }, ...]

// Pop stash
await stashPop(); // Pop latest
await stashPop(1); // Pop specific stash
```

### Tag Operations

```tsx
import { getTags, createTag, deleteTag } from '@philjs/git';

// List tags
const tags = await getTags(); // ['v1.0.0', 'v1.1.0', ...]

// Create tag
await createTag('v2.0.0');
await createTag('v2.0.0', 'Release version 2.0.0'); // Annotated

// Delete tag
await deleteTag('v2.0.0');
```

### Utility Functions

```tsx
import {
  getRepoRoot,
  commitExists,
} from '@philjs/git';

// Get repository root
const root = await getRepoRoot(); // '/path/to/repo'

// Check if commit exists
const exists = await commitExists('abc123'); // true/false
```

## @philjs/perf

High-performance utilities for caching, memoization, and batching.

### LRU Cache

```tsx
import { LRUCache, createLRU, withLRU } from '@philjs/perf';

// Create cache
const cache = createLRU<string, User>(100);

cache.set('user:1', user);
const user = cache.get('user:1');
cache.delete('user:1');

// Wrap function with LRU cache
const getUser = withLRU(async (id) => fetchUser(id), 50);
```

### Memoization

```tsx
import { memo, memoAsync, memoWeak } from '@philjs/perf';

// Memoize sync function
const expensive = memo((x: number) => computeExpensive(x), {
  maxSize: 1000,
  ttl: 60000, // 1 minute
});

// Memoize async function with deduplication
const fetchData = memoAsync(async (id) => fetch(`/api/${id}`), {
  maxSize: 100,
  ttl: 30000,
});

// WeakMap memoization (no memory leaks)
const getData = memoWeak((obj) => processObject(obj));
```

### Batching

```tsx
import { batch, batchAsync, createBatcher } from '@philjs/perf';

// Batch multiple calls
const batchedUpdate = batch(update, { wait: 16 });

// Batch async operations
const batchFetch = batchAsync(
  async (ids: string[]) => fetchMany(ids),
  { wait: 10, maxSize: 50 }
);

// Use batched version
await batchFetch('id1'); // These get batched
await batchFetch('id2'); // into single call
```

### Lazy Evaluation

```tsx
import { lazy, lazyAsync, LazyValue } from '@philjs/perf';

// Lazy value (computed on first access)
const config = lazy(() => parseConfig());
config.get(); // Computes and caches
config.get(); // Returns cached

// Lazy async
const data = lazyAsync(async () => fetchData());
await data(); // Fetches once, caches result
```

## @philjs/crypto

Web Crypto API wrappers for secure cryptographic operations.

### Hashing

```tsx
import { hash, hashHex, hashBase64 } from '@philjs/crypto';

const digest = await hash('Hello World');           // ArrayBuffer
const hex = await hashHex('Hello World');           // "b94d27..."
const base64 = await hashBase64('Hello World');     // "uU0nuZ..."

// Different algorithms
await hashHex('data', 'SHA-512');
```

### Symmetric Encryption (AES)

```tsx
import {
  generateAesKey,
  aesEncrypt,
  aesDecryptString,
} from '@philjs/crypto';

// Generate key
const key = await generateAesKey(256, 'AES-GCM');

// Encrypt
const encrypted = await aesEncrypt(key, 'Secret message');

// Decrypt
const decrypted = await aesDecryptString(key, encrypted);
```

### Asymmetric Encryption (RSA)

```tsx
import {
  generateRsaKeyPair,
  rsaEncrypt,
  rsaDecrypt,
} from '@philjs/crypto';

const { publicKey, privateKey } = await generateRsaKeyPair();

const encrypted = await rsaEncrypt(publicKey, 'Secret');
const decrypted = await rsaDecrypt(privateKey, encrypted);
```

### Digital Signatures (ECDSA)

```tsx
import {
  generateEcdsaKeyPair,
  ecdsaSign,
  ecdsaVerify,
} from '@philjs/crypto';

const { publicKey, privateKey } = await generateEcdsaKeyPair();

const signature = await ecdsaSign(privateKey, 'Message');
const valid = await ecdsaVerify(publicKey, signature, 'Message');
```

### Password Derivation

```tsx
import {
  deriveKeyFromPassword,
  generateSalt,
} from '@philjs/crypto';

const salt = generateSalt();
const key = await deriveKeyFromPassword(
  'password123',
  salt,
  100000 // iterations
);
```

## @philjs/a11y

Accessibility utilities for WCAG 2.1 compliance.

### Focus Management

```tsx
import {
  trapFocus,
  getFocusableElements,
  announceFocusChange,
} from '@philjs/a11y';

// Trap focus in modal
const release = trapFocus(modalElement);
// ... modal is open
release(); // Release trap

// Get focusable elements
const focusable = getFocusableElements(container);

// Announce to screen readers
announceFocusChange('Dialog opened', 'polite');
```

### Keyboard Navigation

```tsx
import {
  useArrowKeyNavigation,
  useRovingTabindex,
} from '@philjs/a11y';

// Arrow key navigation for lists
const cleanup = useArrowKeyNavigation(listElement, {
  orientation: 'vertical',
  wrap: true,
  onSelect: (el, index) => console.log('Selected', index),
});

// Roving tabindex pattern
const cleanup = useRovingTabindex(container, '[role="tab"]');
```

### Color Contrast

```tsx
import {
  getContrastRatio,
  meetsContrastRequirement,
  hexToRgb,
} from '@philjs/a11y';

const fg = hexToRgb('#000000');
const bg = hexToRgb('#ffffff');
const ratio = getContrastRatio(fg, bg); // 21

meetsContrastRequirement(ratio, 'AA');      // true
meetsContrastRequirement(ratio, 'AAA');     // true
meetsContrastRequirement(4.5, 'AA', true);  // true (large text)
```

### Live Regions

```tsx
import { createLiveRegion } from '@philjs/a11y';

const region = createLiveRegion({ politeness: 'polite' });
region.announce('Item added to cart');
region.clear();
```

### Reduced Motion

```tsx
import {
  prefersReducedMotion,
  watchReducedMotion,
} from '@philjs/a11y';

if (prefersReducedMotion()) {
  // Disable animations
}

watchReducedMotion((prefersReduced) => {
  // React to preference changes
});
```
