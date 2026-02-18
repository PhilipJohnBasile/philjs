/**
 * @philjs/email - Test Suite
 * Tests for email utilities, templating, and sending functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Utils
  normalizeAddress,
  formatAddress,
  isValidEmail,
  parseEmails,
  htmlToText,
  generateId,
  chunk,
  createTrackingPixel,
  wrapLinksForTracking,
  sleep,
  defaultRetryConfig,
  // Templates
  textStyles,
  buttonStyles,
} from '../index.js';

describe('@philjs/email', () => {
  describe('Export Verification', () => {
    it('should export utility functions', () => {
      expect(normalizeAddress).toBeDefined();
      expect(formatAddress).toBeDefined();
      expect(isValidEmail).toBeDefined();
      expect(parseEmails).toBeDefined();
      expect(htmlToText).toBeDefined();
      expect(generateId).toBeDefined();
      expect(chunk).toBeDefined();
      expect(createTrackingPixel).toBeDefined();
      expect(wrapLinksForTracking).toBeDefined();
      expect(sleep).toBeDefined();
    });

    it('should export default retry config', () => {
      expect(defaultRetryConfig).toBeDefined();
      expect(defaultRetryConfig.maxAttempts).toBe(3);
      expect(defaultRetryConfig.initialDelay).toBe(1000);
      expect(defaultRetryConfig.maxDelay).toBe(30000);
      expect(defaultRetryConfig.backoffMultiplier).toBe(2);
      expect(defaultRetryConfig.retryOn).toContain(429);
      expect(defaultRetryConfig.retryOn).toContain(500);
    });

    it('should export template styles', () => {
      expect(textStyles).toBeDefined();
      expect(buttonStyles).toBeDefined();
    });
  });

  describe('Email Address Utilities', () => {
    describe('normalizeAddress', () => {
      it('should normalize simple email string', () => {
        const result = normalizeAddress('test@example.com');

        expect(result.email).toBe('test@example.com');
        expect(result.name).toBeUndefined();
      });

      it('should parse email with name in angle brackets', () => {
        const result = normalizeAddress('John Doe <john@example.com>');

        expect(result.email).toBe('john@example.com');
        expect(result.name).toBe('John Doe');
      });

      it('should parse email with quoted name', () => {
        const result = normalizeAddress('"John Doe" <john@example.com>');

        expect(result.email).toBe('john@example.com');
        expect(result.name).toBe('John Doe');
      });

      it('should trim whitespace', () => {
        const result = normalizeAddress('  test@example.com  ');

        expect(result.email).toBe('test@example.com');
      });

      it('should return EmailAddress object unchanged', () => {
        const input = { email: 'test@example.com', name: 'Test' };
        const result = normalizeAddress(input);

        expect(result).toBe(input);
      });

      it('should handle email without angle brackets', () => {
        const result = normalizeAddress('test@example.com');

        expect(result.email).toBe('test@example.com');
      });
    });

    describe('formatAddress', () => {
      it('should format simple email', () => {
        const result = formatAddress('test@example.com');

        expect(result).toBe('test@example.com');
      });

      it('should format email with name', () => {
        const result = formatAddress({ email: 'test@example.com', name: 'John Doe' });

        expect(result).toBe('"John Doe" <test@example.com>');
      });

      it('should escape quotes in name', () => {
        const result = formatAddress({ email: 'test@example.com', name: 'John "Jack" Doe' });

        expect(result).toBe('"John \\"Jack\\" Doe" <test@example.com>');
      });

      it('should format email without name', () => {
        const result = formatAddress({ email: 'test@example.com' });

        expect(result).toBe('test@example.com');
      });
    });

    describe('isValidEmail', () => {
      it('should validate correct email addresses', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.org')).toBe(true);
        expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('test@.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
      });

      it('should reject emails with spaces', () => {
        expect(isValidEmail('test @example.com')).toBe(false);
        expect(isValidEmail('test@ example.com')).toBe(false);
      });
    });

    describe('parseEmails', () => {
      it('should parse comma-separated emails', () => {
        const result = parseEmails('a@example.com, b@example.com, c@example.com');

        expect(result.length).toBe(3);
        expect(result[0].email).toBe('a@example.com');
        expect(result[1].email).toBe('b@example.com');
        expect(result[2].email).toBe('c@example.com');
      });

      it('should parse semicolon-separated emails', () => {
        const result = parseEmails('a@example.com; b@example.com');

        expect(result.length).toBe(2);
      });

      it('should filter out invalid emails', () => {
        const result = parseEmails('valid@example.com, invalid, another@test.com');

        expect(result.length).toBe(2);
        expect(result.map(e => e.email)).not.toContain('invalid');
      });

      it('should handle emails with names', () => {
        const result = parseEmails('John <john@example.com>, Jane <jane@example.com>');

        expect(result.length).toBe(2);
        expect(result[0].name).toBe('John');
        expect(result[0].email).toBe('john@example.com');
      });

      it('should handle empty string', () => {
        const result = parseEmails('');

        expect(result.length).toBe(0);
      });

      it('should trim whitespace around addresses', () => {
        const result = parseEmails('  a@example.com  ,  b@example.com  ');

        expect(result.length).toBe(2);
        expect(result[0].email).toBe('a@example.com');
      });
    });
  });

  describe('HTML to Text Conversion', () => {
    describe('htmlToText', () => {
      it('should remove HTML tags', () => {
        const html = '<p>Hello <strong>World</strong></p>';
        const text = htmlToText(html);

        expect(text).not.toContain('<');
        expect(text).not.toContain('>');
        expect(text).toContain('Hello');
        expect(text).toContain('World');
      });

      it('should convert block elements to newlines', () => {
        const html = '<p>First</p><p>Second</p>';
        const text = htmlToText(html);

        expect(text).toContain('First');
        expect(text).toContain('Second');
      });

      it('should remove style tags and content', () => {
        const html = '<style>.test { color: red; }</style><p>Content</p>';
        const text = htmlToText(html);

        expect(text).not.toContain('color');
        expect(text).toContain('Content');
      });

      it('should remove script tags and content', () => {
        const html = '<script>alert("test");</script><p>Content</p>';
        const text = htmlToText(html);

        expect(text).not.toContain('alert');
        expect(text).toContain('Content');
      });

      it('should convert links to text with URL', () => {
        const html = '<a href="https://example.com">Click here</a>';
        const text = htmlToText(html);

        expect(text).toContain('Click here');
        expect(text).toContain('https://example.com');
      });

      it('should decode HTML entities', () => {
        const html = '<p>&amp; &lt; &gt; &quot; &copy;</p>';
        const text = htmlToText(html);

        expect(text).toContain('&');
        expect(text).toContain('<');
        expect(text).toContain('>');
        expect(text).toContain('"');
      });

      it('should handle numeric HTML entities', () => {
        const html = '<p>&#65; &#x41;</p>';
        const text = htmlToText(html);

        expect(text).toContain('A');
      });

      it('should clean up excessive whitespace', () => {
        const html = '<p>Hello</p>\n\n\n<p>World</p>';
        const text = htmlToText(html);

        // Should not have more than two consecutive newlines
        expect(text).not.toMatch(/\n\n\n/);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('generateId', () => {
      it('should generate unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();

        expect(id1).not.toBe(id2);
      });

      it('should generate string IDs', () => {
        const id = generateId();

        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });

      it('should include timestamp component', () => {
        const id = generateId();
        // ID should contain a dash separator
        expect(id).toContain('-');
      });
    });

    describe('chunk', () => {
      it('should split array into chunks', () => {
        const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const chunks = chunk(array, 3);

        expect(chunks.length).toBe(4);
        expect(chunks[0]).toEqual([1, 2, 3]);
        expect(chunks[1]).toEqual([4, 5, 6]);
        expect(chunks[2]).toEqual([7, 8, 9]);
        expect(chunks[3]).toEqual([10]);
      });

      it('should handle empty array', () => {
        const chunks = chunk([], 5);

        expect(chunks.length).toBe(0);
      });

      it('should handle array smaller than chunk size', () => {
        const array = [1, 2];
        const chunks = chunk(array, 5);

        expect(chunks.length).toBe(1);
        expect(chunks[0]).toEqual([1, 2]);
      });

      it('should handle chunk size of 1', () => {
        const array = [1, 2, 3];
        const chunks = chunk(array, 1);

        expect(chunks.length).toBe(3);
        expect(chunks.every(c => c.length === 1)).toBe(true);
      });
    });

    describe('sleep', () => {
      it('should return a promise', () => {
        const result = sleep(0);

        expect(result).toBeInstanceOf(Promise);
      });

      it('should resolve after specified time', async () => {
        const start = Date.now();
        await sleep(50);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
      });
    });
  });

  describe('Tracking Utilities', () => {
    describe('createTrackingPixel', () => {
      it('should create tracking pixel URL with required params', () => {
        const url = createTrackingPixel(
          'https://track.example.com/pixel',
          'msg_123',
          'user@example.com'
        );

        expect(url).toContain('https://track.example.com/pixel');
        expect(url).toContain('id=msg_123');
        expect(url).toContain('recipient=user%40example.com');
      });

      it('should include metadata when provided', () => {
        const url = createTrackingPixel(
          'https://track.example.com/pixel',
          'msg_123',
          'user@example.com',
          { campaign: 'welcome' }
        );

        expect(url).toContain('meta=');
      });

      it('should create valid URL', () => {
        const url = createTrackingPixel(
          'https://track.example.com/pixel',
          'msg_123',
          'user@example.com'
        );

        expect(() => new URL(url)).not.toThrow();
      });
    });

    describe('wrapLinksForTracking', () => {
      it('should wrap links with tracking URLs', () => {
        const html = '<a href="https://example.com">Click here</a>';
        const wrapped = wrapLinksForTracking(
          html,
          'https://track.example.com/click',
          'msg_123',
          'user@example.com'
        );

        expect(wrapped).toContain('https://track.example.com/click');
        expect(wrapped).toContain('id=msg_123');
        expect(wrapped).toContain('Click here');
      });

      it('should not wrap mailto links', () => {
        const html = '<a href="mailto:support@example.com">Email us</a>';
        const wrapped = wrapLinksForTracking(
          html,
          'https://track.example.com/click',
          'msg_123',
          'user@example.com'
        );

        expect(wrapped).toContain('mailto:support@example.com');
        expect(wrapped).not.toContain('track.example.com');
      });

      it('should not wrap tel links', () => {
        const html = '<a href="tel:+1234567890">Call us</a>';
        const wrapped = wrapLinksForTracking(
          html,
          'https://track.example.com/click',
          'msg_123',
          'user@example.com'
        );

        expect(wrapped).toContain('tel:+1234567890');
        expect(wrapped).not.toContain('track.example.com');
      });

      it('should wrap multiple links', () => {
        const html = `
          <a href="https://example1.com">Link 1</a>
          <a href="https://example2.com">Link 2</a>
        `;
        const wrapped = wrapLinksForTracking(
          html,
          'https://track.example.com/click',
          'msg_123',
          'user@example.com'
        );

        // Count tracking URLs
        const matches = wrapped.match(/track\.example\.com/g);
        expect(matches?.length).toBe(2);
      });

      it('should preserve original URL in tracking parameters', () => {
        const html = '<a href="https://example.com/page">Link</a>';
        const wrapped = wrapLinksForTracking(
          html,
          'https://track.example.com/click',
          'msg_123',
          'user@example.com'
        );

        expect(wrapped).toContain(encodeURIComponent('https://example.com/page'));
      });
    });
  });

  describe('Template Styles', () => {
    describe('textStyles', () => {
      it('should have font family', () => {
        expect(textStyles.fontFamily).toBeDefined();
        expect(textStyles.fontFamily).toContain('Arial');
      });

      it('should have font size', () => {
        expect(textStyles.fontSize).toBe('16px');
      });

      it('should have line height', () => {
        expect(textStyles.lineHeight).toBe('1.5');
      });

      it('should have color', () => {
        expect(textStyles.color).toBe('#333333');
      });
    });

    describe('buttonStyles', () => {
      it('should have display inline-block', () => {
        expect(buttonStyles.display).toBe('inline-block');
      });

      it('should have padding', () => {
        expect(buttonStyles.padding).toBe('12px 24px');
      });

      it('should have background color', () => {
        expect(buttonStyles.backgroundColor).toBe('#007bff');
      });

      it('should have text color', () => {
        expect(buttonStyles.color).toBe('#ffffff');
      });

      it('should have no text decoration', () => {
        expect(buttonStyles.textDecoration).toBe('none');
      });

      it('should have border radius', () => {
        expect(buttonStyles.borderRadius).toBe('4px');
      });

      it('should have font weight', () => {
        expect(buttonStyles.fontWeight).toBe('bold');
      });
    });
  });

  describe('Default Retry Configuration', () => {
    it('should have sensible defaults', () => {
      expect(defaultRetryConfig.maxAttempts).toBe(3);
      expect(defaultRetryConfig.initialDelay).toBe(1000);
      expect(defaultRetryConfig.maxDelay).toBe(30000);
      expect(defaultRetryConfig.backoffMultiplier).toBe(2);
    });

    it('should retry on rate limiting', () => {
      expect(defaultRetryConfig.retryOn).toContain(429);
    });

    it('should retry on server errors', () => {
      expect(defaultRetryConfig.retryOn).toContain(500);
      expect(defaultRetryConfig.retryOn).toContain(502);
      expect(defaultRetryConfig.retryOn).toContain(503);
      expect(defaultRetryConfig.retryOn).toContain(504);
    });

    it('should not retry on client errors by default', () => {
      expect(defaultRetryConfig.retryOn).not.toContain(400);
      expect(defaultRetryConfig.retryOn).not.toContain(401);
      expect(defaultRetryConfig.retryOn).not.toContain(404);
    });
  });
});

describe('@philjs/email Queue', () => {
  let queue: InstanceType<typeof import('../queue.js').InMemoryQueue>;

  beforeEach(async () => {
    const { InMemoryQueue } = await import('../queue.js');
    queue = new InMemoryQueue({
      maxConcurrency: 2,
      pollInterval: 50,
      defaultMaxAttempts: 3,
    });
  });

  afterEach(() => {
    queue.stop();
  });

  describe('InMemoryQueue', () => {
    it('should enqueue an email job', async () => {
      const jobId = await queue.enqueue({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');

      const job = await queue.getJob(jobId);
      expect(job).not.toBeNull();
      expect(job?.status).toBe('pending');
      expect(job?.attempts).toBe(0);
    });

    it('should respect maxAttempts option', async () => {
      const jobId = await queue.enqueue(
        { to: 'test@example.com', subject: 'Test', text: 'Test' },
        { maxAttempts: 5 }
      );

      const job = await queue.getJob(jobId);
      expect(job?.maxAttempts).toBe(5);
    });

    it('should apply delay when specified', async () => {
      const before = Date.now();
      const jobId = await queue.enqueue(
        { to: 'test@example.com', subject: 'Test', text: 'Test' },
        { delay: 1000 }
      );

      const job = await queue.getJob(jobId);
      expect(job?.nextAttempt).toBeDefined();
      expect(job!.nextAttempt!.getTime()).toBeGreaterThanOrEqual(before + 1000);
    });

    it('should cancel a pending job', async () => {
      const jobId = await queue.enqueue({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      const cancelled = await queue.cancel(jobId);
      expect(cancelled).toBe(true);

      const job = await queue.getJob(jobId);
      expect(job).toBeNull();
    });

    it('should not cancel a non-existent job', async () => {
      const cancelled = await queue.cancel('non-existent-id');
      expect(cancelled).toBe(false);
    });

    it('should return queue statistics', async () => {
      await queue.enqueue({ to: 'a@example.com', subject: 'A', text: 'A' });
      await queue.enqueue({ to: 'b@example.com', subject: 'B', text: 'B' });

      const stats = await queue.stats();
      expect(stats.pending).toBe(2);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it('should process jobs and mark as completed', async () => {
      const jobId = await queue.enqueue({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      // Start processing
      const processPromise = queue.process(async () => ({
        success: true,
        messageId: 'msg_123',
        timestamp: new Date(),
      }));

      // Wait for processing
      await sleep(100);
      queue.stop();

      const job = await queue.getJob(jobId);
      expect(job?.status).toBe('completed');
      expect(job?.completedAt).toBeDefined();
    });

    it('should retry failed jobs', async () => {
      let attempts = 0;

      await queue.enqueue({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      queue.process(async () => {
        attempts++;
        if (attempts < 2) {
          return {
            success: false,
            error: new Error('Temporary failure'),
            timestamp: new Date(),
          };
        }
        return {
          success: true,
          messageId: 'msg_123',
          timestamp: new Date(),
        };
      });

      // Wait for retry - need longer time for exponential backoff (2^1 * 1000 = 2000ms)
      // but pollInterval is 50ms so initial processing happens quickly
      await sleep(2500);
      queue.stop();

      expect(attempts).toBeGreaterThanOrEqual(2);
    });

    it('should mark job as failed after max attempts', async () => {
      const jobId = await queue.enqueue(
        { to: 'test@example.com', subject: 'Test', text: 'Test' },
        { maxAttempts: 1 }
      );

      queue.process(async () => ({
        success: false,
        error: new Error('Permanent failure'),
        timestamp: new Date(),
      }));

      await sleep(100);
      queue.stop();

      const job = await queue.getJob(jobId);
      expect(job?.status).toBe('failed');
      expect(job?.error).toBe('Permanent failure');
    });

    it('should cleanup old completed and failed jobs', async () => {
      const jobId = await queue.enqueue({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      queue.process(async () => ({
        success: true,
        messageId: 'msg_123',
        timestamp: new Date(),
      }));

      await sleep(100);
      queue.stop();

      // Cleanup with 0 max age should remove all completed jobs
      const removed = queue.cleanup(0);
      expect(removed).toBe(1);

      const job = await queue.getJob(jobId);
      expect(job).toBeNull();
    });

    it('should get all jobs for debugging', () => {
      queue.enqueue({ to: 'a@example.com', subject: 'A', text: 'A' });
      queue.enqueue({ to: 'b@example.com', subject: 'B', text: 'B' });

      const allJobs = queue.getAllJobs();
      expect(allJobs.length).toBe(2);
    });
  });
});

describe('@philjs/email Tracking', () => {
  describe('GenericTrackingWebhook', () => {
    let webhook: InstanceType<typeof import('../tracking.js').GenericTrackingWebhook>;

    beforeEach(async () => {
      const { GenericTrackingWebhook } = await import('../tracking.js');
      webhook = new GenericTrackingWebhook({ secret: 'test-secret' });
    });

    it('should register and call event handlers', async () => {
      const openHandler = vi.fn();
      const clickHandler = vi.fn();

      webhook.on('open', openHandler);
      webhook.on('click', clickHandler);

      await webhook.handle({
        type: 'open',
        messageId: 'msg_123',
        recipient: 'test@example.com',
        timestamp: new Date(),
      });

      expect(openHandler).toHaveBeenCalledTimes(1);
      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('should call multiple handlers for same event type', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      webhook.on('click', handler1);
      webhook.on('click', handler2);

      await webhook.handle({
        type: 'click',
        messageId: 'msg_123',
        recipient: 'test@example.com',
        timestamp: new Date(),
        url: 'https://example.com',
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should verify valid signature', async () => {
      const { createHmac } = await import('crypto');
      const payload = JSON.stringify({ test: 'data' });
      const signature = createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');

      expect(webhook.verify(payload, signature)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      expect(webhook.verify(payload, 'invalid-signature')).toBe(false);
    });

    it('should skip verification when no secret configured', async () => {
      const { GenericTrackingWebhook } = await import('../tracking.js');
      const webhookNoSecret = new GenericTrackingWebhook();

      expect(webhookNoSecret.verify({}, 'any-signature')).toBe(true);
    });

    it('should parse open event from query params', () => {
      const event = webhook.parseOpenEvent(
        {
          id: 'msg_123',
          recipient: 'test@example.com',
          meta: JSON.stringify({ campaign: 'welcome' }),
        },
        { 'user-agent': 'Mozilla/5.0', 'x-forwarded-for': '1.2.3.4' }
      );

      expect(event.type).toBe('open');
      expect(event.messageId).toBe('msg_123');
      expect(event.recipient).toBe('test@example.com');
      expect(event.userAgent).toBe('Mozilla/5.0');
      expect(event.ip).toBe('1.2.3.4');
      expect(event.metadata).toEqual({ campaign: 'welcome' });
    });

    it('should parse click event with redirect URL', () => {
      const event = webhook.parseClickEvent(
        {
          id: 'msg_123',
          recipient: 'test@example.com',
          url: 'https://example.com/page',
        },
        { 'x-real-ip': '5.6.7.8' }
      );

      expect(event.type).toBe('click');
      expect(event.messageId).toBe('msg_123');
      expect(event.redirectUrl).toBe('https://example.com/page');
      expect(event.url).toBe('https://example.com/page');
      expect(event.ip).toBe('5.6.7.8');
    });
  });

  describe('SendGridWebhook', () => {
    it('should parse SendGrid webhook events', async () => {
      const { SendGridWebhook } = await import('../tracking.js');
      const webhook = new SendGridWebhook();

      const events = webhook.parseEvents([
        {
          event: 'open',
          sg_message_id: 'msg_123',
          email: 'test@example.com',
          timestamp: 1609459200,
          useragent: 'Mozilla/5.0',
          ip: '1.2.3.4',
          category: ['newsletter'],
        },
        {
          event: 'click',
          sg_message_id: 'msg_456',
          email: 'test2@example.com',
          timestamp: 1609459300,
          url: 'https://example.com',
        },
      ]);

      expect(events.length).toBe(2);
      expect(events[0].type).toBe('open');
      expect(events[0].messageId).toBe('msg_123');
      expect(events[0].recipient).toBe('test@example.com');
      expect(events[1].type).toBe('click');
      expect(events[1].url).toBe('https://example.com');
    });

    it('should return empty array for non-array payload', async () => {
      const { SendGridWebhook } = await import('../tracking.js');
      const webhook = new SendGridWebhook();

      const events = webhook.parseEvents('invalid' as any);
      expect(events).toEqual([]);
    });
  });

  describe('MailgunWebhook', () => {
    it('should parse Mailgun webhook event', async () => {
      const { MailgunWebhook } = await import('../tracking.js');
      const webhook = new MailgunWebhook();

      const event = webhook.parseEvent({
        'event-data': {
          event: 'clicked',
          message: { headers: { 'message-id': 'msg_123' } },
          recipient: 'test@example.com',
          timestamp: 1609459200,
          url: 'https://example.com',
          'client-info': { 'user-agent': 'Mozilla/5.0' },
          ip: '1.2.3.4',
        },
      });

      expect(event.type).toBe('click');
      expect(event.messageId).toBe('msg_123');
      expect(event.recipient).toBe('test@example.com');
      expect(event.url).toBe('https://example.com');
      expect(event.userAgent).toBe('Mozilla/5.0');
      expect(event.ip).toBe('1.2.3.4');
    });

    it('should verify Mailgun signature', async () => {
      const { MailgunWebhook } = await import('../tracking.js');
      const { createHmac } = await import('crypto');

      const signingKey = 'test-signing-key';
      const webhook = new MailgunWebhook({ signingKey });

      const timestamp = '1234567890';
      const token = 'random-token';
      const signature = createHmac('sha256', signingKey)
        .update(`${timestamp}${token}`)
        .digest('hex');

      const isValid = webhook.verify(
        { signature: { timestamp, token, signature } },
        ''
      );
      expect(isValid).toBe(true);
    });
  });

  describe('SesWebhook', () => {
    it('should parse SES open event', async () => {
      const { SesWebhook } = await import('../tracking.js');
      const webhook = new SesWebhook();

      const event = webhook.parseEvent({
        notificationType: 'Open',
        mail: {
          messageId: 'msg_123',
          destination: ['test@example.com'],
        },
        open: {
          timestamp: '2021-01-01T00:00:00.000Z',
          userAgent: 'Mozilla/5.0',
          ipAddress: '1.2.3.4',
        },
      });

      expect(event.type).toBe('open');
      expect(event.messageId).toBe('msg_123');
      expect(event.recipient).toBe('test@example.com');
      expect(event.userAgent).toBe('Mozilla/5.0');
      expect(event.ip).toBe('1.2.3.4');
    });

    it('should parse SES click event', async () => {
      const { SesWebhook } = await import('../tracking.js');
      const webhook = new SesWebhook();

      const event = webhook.parseEvent({
        notificationType: 'Click',
        mail: {
          messageId: 'msg_123',
          destination: ['test@example.com'],
        },
        click: {
          timestamp: '2021-01-01T00:00:00.000Z',
          link: 'https://example.com',
          userAgent: 'Mozilla/5.0',
          ipAddress: '1.2.3.4',
        },
      });

      expect(event.type).toBe('click');
      expect(event.url).toBe('https://example.com');
    });
  });

  describe('createTrackingWebhook', () => {
    it('should create generic webhook', async () => {
      const { createTrackingWebhook } = await import('../tracking.js');
      const webhook = createTrackingWebhook('generic', { secret: 'test' });

      expect(webhook).toBeDefined();
      expect(typeof webhook.on).toBe('function');
      expect(typeof webhook.handle).toBe('function');
      expect(typeof webhook.verify).toBe('function');
    });

    it('should create provider-specific webhooks', async () => {
      const { createTrackingWebhook } = await import('../tracking.js');

      const sgWebhook = createTrackingWebhook('sendgrid');
      const mgWebhook = createTrackingWebhook('mailgun');
      const sesWebhook = createTrackingWebhook('ses');

      expect(sgWebhook).toBeDefined();
      expect(mgWebhook).toBeDefined();
      expect(sesWebhook).toBeDefined();
    });
  });
});

describe('@philjs/email Templates', () => {
  describe('BaseEmail', () => {
    it('should export BaseEmail component', async () => {
      const { BaseEmail } = await import('../templates/base.js');
      expect(BaseEmail).toBeDefined();
    });
  });

  describe('WelcomeEmail', () => {
    it('should export WelcomeEmail component', async () => {
      const { WelcomeEmail, getWelcomeSubject } = await import('../templates/welcome.js');
      expect(WelcomeEmail).toBeDefined();
      expect(getWelcomeSubject).toBeDefined();
    });

    it('should generate personalized subject', async () => {
      const { getWelcomeSubject } = await import('../templates/welcome.js');
      const subject = getWelcomeSubject({ name: 'John' });

      expect(typeof subject).toBe('string');
      expect(subject.length).toBeGreaterThan(0);
    });
  });

  describe('PasswordResetEmail', () => {
    it('should export PasswordResetEmail component', async () => {
      const { PasswordResetEmail, getPasswordResetSubject } = await import('../templates/password-reset.js');
      expect(PasswordResetEmail).toBeDefined();
      expect(getPasswordResetSubject).toBeDefined();
    });
  });

  describe('NotificationEmail', () => {
    it('should export NotificationEmail component', async () => {
      const { NotificationEmail, getNotificationSubject } = await import('../templates/notification.js');
      expect(NotificationEmail).toBeDefined();
      expect(getNotificationSubject).toBeDefined();
    });
  });
});
