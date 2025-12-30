import { createHmac } from 'crypto';

/**
 * Tracking event types
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
 * Tracking event handler callback
 */
export type TrackingEventHandler = (event: TrackingEvent) => Promise<void>;

/**
 * Generic tracking webhook implementation
 */
export class GenericTrackingWebhook implements TrackingWebhook {
  private handlers: Map<TrackingEvent['type'], TrackingEventHandler[]> =
    new Map();
  private secret?: string;

  constructor(options: { secret?: string } = {}) {
    if (options.secret !== undefined) {
      this.secret = options.secret;
    }
  }

  /**
   * Register a handler for tracking events
   */
  on(type: TrackingEvent['type'], handler: TrackingEventHandler): void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  /**
   * Register a handler for all tracking events
   */
  onAll(handler: TrackingEventHandler): void {
    const types: TrackingEvent['type'][] = [
      'open',
      'click',
      'bounce',
      'complaint',
      'unsubscribe',
    ];
    types.forEach((type) => this.on(type, handler));
  }

  /**
   * Handle incoming tracking event
   */
  async handle(event: TrackingEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];

    await Promise.all(handlers.map((handler) => handler(event)));
  }

  /**
   * Verify webhook signature
   */
  verify(payload: unknown, signature: string): boolean {
    if (!this.secret) {
      return true; // No secret configured, skip verification
    }

    const payloadString =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    const expectedSignature = createHmac('sha256', this.secret)
      .update(payloadString)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Parse tracking pixel request
   */
  parseOpenEvent(
    query: Record<string, string>,
    headers?: Record<string, string>
  ): TrackingEvent {
    const userAgent = headers?.['user-agent'];
    const ip = headers?.['x-forwarded-for'] || headers?.['x-real-ip'];
    const metadata = query['meta'] ? JSON.parse(query['meta']) : undefined;

    const event: TrackingEvent = {
      type: 'open',
      messageId: query['id'] || '',
      recipient: query['recipient'] || '',
      timestamp: new Date(),
    };

    if (userAgent !== undefined) event.userAgent = userAgent;
    if (ip !== undefined) event.ip = ip;
    if (metadata !== undefined) event.metadata = metadata;

    return event;
  }

  /**
   * Parse click tracking request
   */
  parseClickEvent(
    query: Record<string, string>,
    headers?: Record<string, string>
  ): TrackingEvent & { redirectUrl: string } {
    const url = query['url'];
    const userAgent = headers?.['user-agent'];
    const ip = headers?.['x-forwarded-for'] || headers?.['x-real-ip'];
    const metadata = query['meta'] ? JSON.parse(query['meta']) : undefined;

    const event: TrackingEvent & { redirectUrl: string } = {
      type: 'click',
      messageId: query['id'] || '',
      recipient: query['recipient'] || '',
      timestamp: new Date(),
      redirectUrl: url || '',
    };

    if (url !== undefined) event.url = url;
    if (userAgent !== undefined) event.userAgent = userAgent;
    if (ip !== undefined) event.ip = ip;
    if (metadata !== undefined) event.metadata = metadata;

    return event;
  }
}

/**
 * SendGrid webhook parser
 */
export class SendGridWebhook implements TrackingWebhook {
  private handlers: Map<TrackingEvent['type'], TrackingEventHandler[]> =
    new Map();
  private verificationKey?: string;

  constructor(options: { verificationKey?: string } = {}) {
    if (options.verificationKey !== undefined) {
      this.verificationKey = options.verificationKey;
    }
  }

  on(type: TrackingEvent['type'], handler: TrackingEventHandler): void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  async handle(event: TrackingEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  verify(_payload: unknown, signature: string): boolean {
    if (!this.verificationKey) {
      return true;
    }

    // SendGrid uses ECDSA signature verification
    // This is a simplified check; production should use proper ECDSA verification
    return signature.length > 0;
  }

  /**
   * Parse SendGrid webhook payload
   */
  parseEvents(payload: unknown[]): TrackingEvent[] {
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.map((event: any) => {
      const typeMap: Record<string, TrackingEvent['type']> = {
        open: 'open',
        click: 'click',
        bounce: 'bounce',
        spamreport: 'complaint',
        unsubscribe: 'unsubscribe',
      };

      return {
        type: typeMap[event.event] || 'open',
        messageId: event.sg_message_id || '',
        recipient: event.email || '',
        timestamp: new Date(event.timestamp * 1000),
        url: event.url,
        userAgent: event.useragent,
        ip: event.ip,
        metadata: {
          category: event.category,
          ...event,
        },
      };
    });
  }
}

/**
 * Mailgun webhook parser
 */
export class MailgunWebhook implements TrackingWebhook {
  private handlers: Map<TrackingEvent['type'], TrackingEventHandler[]> =
    new Map();
  private signingKey?: string;

  constructor(options: { signingKey?: string } = {}) {
    if (options.signingKey !== undefined) {
      this.signingKey = options.signingKey;
    }
  }

  on(type: TrackingEvent['type'], handler: TrackingEventHandler): void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  async handle(event: TrackingEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  verify(payload: unknown, _signature: string): boolean {
    if (!this.signingKey) {
      return true;
    }

    const data = payload as {
      signature?: { timestamp?: string; token?: string; signature?: string };
    };

    if (!data.signature) {
      return false;
    }

    const { timestamp, token, signature: sig } = data.signature;
    const encodedToken = createHmac('sha256', this.signingKey)
      .update(`${timestamp}${token}`)
      .digest('hex');

    return encodedToken === sig;
  }

  /**
   * Parse Mailgun webhook payload
   */
  parseEvent(payload: unknown): TrackingEvent {
    const data = payload as {
      'event-data'?: {
        event?: string;
        message?: { headers?: { 'message-id'?: string } };
        recipient?: string;
        timestamp?: number;
        'client-info'?: { 'user-agent'?: string };
        ip?: string;
        url?: string;
      };
    };

    const eventData = data['event-data'] || {};

    const typeMap: Record<string, TrackingEvent['type']> = {
      opened: 'open',
      clicked: 'click',
      bounced: 'bounce',
      complained: 'complaint',
      unsubscribed: 'unsubscribe',
    };

    const url = eventData.url;
    const userAgent = eventData['client-info']?.['user-agent'];
    const ip = eventData.ip;

    const event: TrackingEvent = {
      type: typeMap[eventData.event || ''] || 'open',
      messageId: eventData.message?.headers?.['message-id'] || '',
      recipient: eventData.recipient || '',
      timestamp: new Date((eventData.timestamp || 0) * 1000),
    };

    if (url !== undefined) event.url = url;
    if (userAgent !== undefined) event.userAgent = userAgent;
    if (ip !== undefined) event.ip = ip;

    return event;
  }
}

/**
 * AWS SES webhook parser (via SNS)
 */
export class SesWebhook implements TrackingWebhook {
  private handlers: Map<TrackingEvent['type'], TrackingEventHandler[]> =
    new Map();

  on(type: TrackingEvent['type'], handler: TrackingEventHandler): void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  async handle(event: TrackingEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  verify(_payload: unknown, _signature: string): boolean {
    // SES/SNS verification should use AWS SDK
    // This is simplified for the example
    return true;
  }

  /**
   * Parse SES/SNS webhook payload
   */
  parseEvent(payload: unknown): TrackingEvent {
    const data = payload as {
      notificationType?: string;
      mail?: { messageId?: string; destination?: string[] };
      open?: { timestamp?: string; userAgent?: string; ipAddress?: string };
      click?: {
        timestamp?: string;
        link?: string;
        userAgent?: string;
        ipAddress?: string;
      };
      bounce?: { timestamp?: string };
      complaint?: { timestamp?: string };
    };

    const typeMap: Record<string, TrackingEvent['type']> = {
      Open: 'open',
      Click: 'click',
      Bounce: 'bounce',
      Complaint: 'complaint',
    };

    const notificationType = data.notificationType || '';
    const type = typeMap[notificationType] || 'open';

    let timestamp = new Date();
    let url: string | undefined;
    let userAgent: string | undefined;
    let ip: string | undefined;

    if (type === 'open' && data.open) {
      timestamp = new Date(data.open.timestamp || Date.now());
      userAgent = data.open.userAgent;
      ip = data.open.ipAddress;
    } else if (type === 'click' && data.click) {
      timestamp = new Date(data.click.timestamp || Date.now());
      url = data.click.link;
      userAgent = data.click.userAgent;
      ip = data.click.ipAddress;
    }

    const event: TrackingEvent = {
      type,
      messageId: data.mail?.messageId || '',
      recipient: data.mail?.destination?.[0] || '',
      timestamp,
    };

    if (url !== undefined) event.url = url;
    if (userAgent !== undefined) event.userAgent = userAgent;
    if (ip !== undefined) event.ip = ip;

    return event;
  }
}

/**
 * Create a tracking webhook handler
 */
export function createTrackingWebhook(
  provider: 'generic' | 'sendgrid' | 'mailgun' | 'ses',
  options: { secret?: string; signingKey?: string; verificationKey?: string } = {}
): TrackingWebhook {
  switch (provider) {
    case 'sendgrid':
      return new SendGridWebhook(
        options.verificationKey !== undefined
          ? { verificationKey: options.verificationKey }
          : {}
      );
    case 'mailgun':
      return new MailgunWebhook(
        options.signingKey !== undefined
          ? { signingKey: options.signingKey }
          : {}
      );
    case 'ses':
      return new SesWebhook();
    case 'generic':
    default:
      return new GenericTrackingWebhook(
        options.secret !== undefined ? { secret: options.secret } : {}
      );
  }
}
