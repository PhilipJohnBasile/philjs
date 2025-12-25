/**
 * Tests for philjs-observability package
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Tracer,
  Metrics,
  Logger,
  ErrorTracker,
  ConsoleTransport,
  type Span,
  type LogEntry,
  type MetricValue,
} from './index';

describe('Tracer', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = new Tracer({
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      environment: 'test',
    });
  });

  describe('startSpan', () => {
    it('should create a span with correct properties', () => {
      const span = tracer.startSpan('test-operation');

      expect(span.name).toBe('test-operation');
      expect(span.traceId).toBeDefined();
      expect(span.spanId).toBeDefined();
      expect(span.startTime).toBeGreaterThan(0);
      expect(span.status).toBe('unset');
      expect(span.events).toEqual([]);
    });

    it('should include service attributes', () => {
      const span = tracer.startSpan('test-operation');

      expect(span.attributes['service.name']).toBe('test-service');
      expect(span.attributes['service.version']).toBe('1.0.0');
      expect(span.attributes['deployment.environment']).toBe('test');
    });

    it('should add custom attributes', () => {
      const span = tracer.startSpan('test-operation', {
        'custom.attr': 'value',
        'http.method': 'GET',
      });

      expect(span.attributes['custom.attr']).toBe('value');
      expect(span.attributes['http.method']).toBe('GET');
    });

    it('should link child span to parent', () => {
      const parentSpan = tracer.startSpan('parent');
      const childSpan = tracer.startSpan('child');

      expect(childSpan.parentSpanId).toBe(parentSpan.spanId);
      expect(childSpan.traceId).toBe(parentSpan.traceId);
    });
  });

  describe('endSpan', () => {
    it('should set end time and status', () => {
      const span = tracer.startSpan('test-operation');
      tracer.endSpan(span, 'ok');

      expect(span.endTime).toBeGreaterThanOrEqual(span.startTime);
      expect(span.status).toBe('ok');
    });

    it('should default status to ok', () => {
      const span = tracer.startSpan('test-operation');
      tracer.endSpan(span);

      expect(span.status).toBe('ok');
    });
  });

  describe('addEvent', () => {
    it('should add event to span', () => {
      const span = tracer.startSpan('test-operation');
      tracer.addEvent(span, 'event-name', { key: 'value' });

      expect(span.events).toHaveLength(1);
      expect(span.events[0].name).toBe('event-name');
      expect(span.events[0].attributes).toEqual({ key: 'value' });
      expect(span.events[0].timestamp).toBeGreaterThan(0);
    });
  });

  describe('setAttribute', () => {
    it('should add attribute to span', () => {
      const span = tracer.startSpan('test-operation');
      tracer.setAttribute(span, 'new.attr', 'new-value');

      expect(span.attributes['new.attr']).toBe('new-value');
    });
  });

  describe('recordException', () => {
    it('should record exception details', () => {
      const span = tracer.startSpan('test-operation');
      const error = new Error('Test error');
      tracer.recordException(span, error);

      expect(span.status).toBe('error');
      expect(span.attributes['exception.type']).toBe('Error');
      expect(span.attributes['exception.message']).toBe('Test error');
      expect(span.attributes['exception.stacktrace']).toBeDefined();
      expect(span.events[0].name).toBe('exception');
    });
  });

  describe('trace', () => {
    it('should wrap async function with span', async () => {
      const result = await tracer.trace('async-operation', async (span) => {
        expect(span.name).toBe('async-operation');
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should record exception on error', async () => {
      await expect(
        tracer.trace('failing-operation', async () => {
          throw new Error('Async error');
        })
      ).rejects.toThrow('Async error');
    });
  });

  describe('sampling', () => {
    it('should respect sample rate', () => {
      const sampledTracer = new Tracer({
        serviceName: 'test',
        sampleRate: 0, // Never sample
      });

      const span = sampledTracer.startSpan('test');
      expect(span.traceId).toBe(''); // No-op span
    });
  });
});

describe('Metrics', () => {
  let metrics: Metrics;

  beforeEach(() => {
    metrics = new Metrics({
      prefix: 'test',
      defaultLabels: { env: 'test' },
    });
  });

  afterEach(() => {
    metrics.destroy();
  });

  describe('counter', () => {
    it('should record counter metric', async () => {
      metrics.counter('requests', 1, { method: 'GET' });

      // Access internal buffer for testing
      const buffer = (metrics as any).buffer as MetricValue[];
      expect(buffer).toHaveLength(1);
      expect(buffer[0].name).toBe('test_requests');
      expect(buffer[0].value).toBe(1);
      expect(buffer[0].type).toBe('counter');
      expect(buffer[0].labels.method).toBe('GET');
      expect(buffer[0].labels.env).toBe('test');
    });

    it('should default value to 1', async () => {
      metrics.counter('requests');

      const buffer = (metrics as any).buffer as MetricValue[];
      expect(buffer[0].value).toBe(1);
    });
  });

  describe('gauge', () => {
    it('should record gauge metric', async () => {
      metrics.gauge('temperature', 25.5, { sensor: 'room' });

      const buffer = (metrics as any).buffer as MetricValue[];
      expect(buffer[0].name).toBe('test_temperature');
      expect(buffer[0].value).toBe(25.5);
      expect(buffer[0].type).toBe('gauge');
    });
  });

  describe('histogram', () => {
    it('should record histogram metric', async () => {
      metrics.histogram('response_time', 150, { endpoint: '/api' });

      const buffer = (metrics as any).buffer as MetricValue[];
      expect(buffer[0].name).toBe('test_response_time');
      expect(buffer[0].value).toBe(150);
      expect(buffer[0].type).toBe('histogram');
    });
  });

  describe('timer', () => {
    it('should measure duration', async () => {
      const end = metrics.timer('operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      end();

      const buffer = (metrics as any).buffer as MetricValue[];
      expect(buffer[0].name).toBe('test_operation_duration_ms');
      expect(buffer[0].value).toBeGreaterThan(0);
      expect(buffer[0].type).toBe('histogram');
    });
  });

  describe('flush', () => {
    it('should export metrics to exporters', async () => {
      const mockExporter = {
        export: vi.fn().mockResolvedValue(undefined),
      };

      const metricsWithExporter = new Metrics({
        exporters: [mockExporter],
        flushInterval: 0, // Disable auto-flush
      });

      metricsWithExporter.counter('test', 1);
      await metricsWithExporter.flush();

      expect(mockExporter.export).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'test', value: 1 })
        ])
      );

      metricsWithExporter.destroy();
    });

    it('should clear buffer after flush', async () => {
      metrics.counter('test', 1);
      await metrics.flush();

      const buffer = (metrics as any).buffer as MetricValue[];
      expect(buffer).toHaveLength(0);
    });
  });
});

describe('Logger', () => {
  let logger: Logger;
  let mockTransport: { log: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockTransport = { log: vi.fn() };
    logger = new Logger({
      level: 'debug',
      transports: [mockTransport],
    });
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
          message: 'Debug message',
          context: { key: 'value' },
        })
      );
    });

    it('should log info messages', () => {
      logger.info('Info message');

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'Info message',
        })
      );
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message: 'Warning message',
        })
      );
    });

    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: 'Error occurred',
          context: expect.objectContaining({
            error: 'Test error',
          }),
        })
      );
    });

    it('should log fatal messages', () => {
      logger.fatal('Fatal error');

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'fatal',
          message: 'Fatal error',
        })
      );
    });
  });

  describe('level filtering', () => {
    it('should filter logs below configured level', () => {
      const warnLogger = new Logger({
        level: 'warn',
        transports: [mockTransport],
      });

      warnLogger.debug('Debug');
      warnLogger.info('Info');
      warnLogger.warn('Warning');

      expect(mockTransport.log).toHaveBeenCalledTimes(1);
      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'warn' })
      );
    });
  });

  describe('child logger', () => {
    it('should create child with merged context', () => {
      const parentLogger = new Logger({
        context: { service: 'api' },
        transports: [mockTransport],
      });

      const childLogger = parentLogger.child({ requestId: '123' });
      childLogger.info('Request processed');

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { service: 'api', requestId: '123' },
        })
      );
    });
  });

  describe('timestamp', () => {
    it('should include timestamp in log entry', () => {
      logger.info('Test');

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });
  });
});

describe('ConsoleTransport', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('json format', () => {
    it('should output JSON', () => {
      const transport = new ConsoleTransport('json');
      const entry: LogEntry = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date(),
      };

      transport.log(entry);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"info"')
      );
    });
  });

  describe('pretty format', () => {
    it('should output formatted log', () => {
      const transport = new ConsoleTransport('pretty');
      const entry: LogEntry = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date(),
      };

      transport.log(entry);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });
  });
});

describe('ErrorTracker', () => {
  let tracker: ErrorTracker;
  let onError: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onError = vi.fn();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tracker = new ErrorTracker({
      environment: 'test',
      onError,
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('captureException', () => {
    it('should capture exception', () => {
      const error = new Error('Test error');
      tracker.captureException(error, { userId: '123' });

      expect(onError).toHaveBeenCalledWith(error, { userId: '123' });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('captureMessage', () => {
    it('should capture message', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      tracker.captureMessage('Something happened', 'warn', { data: 'test' });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorTracker:warn]'),
        'Something happened',
        { data: 'test' }
      );

      logSpy.mockRestore();
    });
  });

  describe('sampling', () => {
    it('should respect sample rate', () => {
      const sampledTracker = new ErrorTracker({
        sampleRate: 0, // Never sample
        onError,
      });

      const error = new Error('Test');
      sampledTracker.captureException(error);

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('user context', () => {
    it('should set user', () => {
      // Should not throw
      expect(() => {
        tracker.setUser({ id: 'user-123', email: 'test@example.com' });
      }).not.toThrow();
    });
  });

  describe('tags', () => {
    it('should set tags', () => {
      // Should not throw
      expect(() => {
        tracker.setTags({ version: '1.0.0', region: 'us-east' });
      }).not.toThrow();
    });
  });
});
