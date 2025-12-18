/**
 * Tests for snapshot testing utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  takeSnapshot,
  createSnapshotMatcher,
  snapshotSignalState,
  compareSignalSnapshots,
} from '../src/snapshot';

describe('takeSnapshot', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('takes snapshot of element', () => {
    const div = document.createElement('div');
    div.innerHTML = '<p>Hello World</p>';
    document.body.appendChild(div);

    const result = takeSnapshot(div);

    expect(result.snapshot).toContain('Hello World');
    expect(result.snapshot).toContain('<p>');
  });

  it('defaults to document.body', () => {
    document.body.innerHTML = '<div>Test</div>';

    const result = takeSnapshot(null);

    expect(result.snapshot).toContain('Test');
  });

  it('includes signal data when requested', () => {
    const div = document.createElement('div');
    const signalEl = document.createElement('span');
    signalEl.setAttribute('data-signal', 'count');
    signalEl.textContent = '42';
    div.appendChild(signalEl);
    document.body.appendChild(div);

    const result = takeSnapshot(div, { includeSignals: true });

    expect(result.snapshot).toContain('<!-- Signal State -->');
    expect(result.snapshot).toContain('count: 42');
  });

  it('excludes signal data when requested', () => {
    const div = document.createElement('div');
    const signalEl = document.createElement('span');
    signalEl.setAttribute('data-signal', 'count');
    signalEl.textContent = '42';
    div.appendChild(signalEl);
    document.body.appendChild(div);

    const result = takeSnapshot(div, { includeSignals: false });

    expect(result.snapshot).not.toContain('<!-- Signal State -->');
  });

  it('uses custom serializer', () => {
    const div = document.createElement('div');
    div.innerHTML = '<p>Test</p>';

    const result = takeSnapshot(div, {
      serializer: (el) => `Custom: ${el.textContent}`,
    });

    expect(result.snapshot).toBe('Custom: Test');
  });

  it('respects maxLength option', () => {
    const div = document.createElement('div');
    div.innerHTML = 'A'.repeat(1000);

    const result = takeSnapshot(div, { maxLength: 100 });

    expect(result.snapshot.length).toBeLessThanOrEqual(200);
  });
});

describe('SnapshotResult', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('toMatch', () => {
    it('returns true for identical snapshots', () => {
      document.body.innerHTML = '<div>Test</div>';

      const result1 = takeSnapshot(document.body);
      const result2 = takeSnapshot(document.body);

      expect(result1.toMatch(result2.snapshot)).toBe(true);
    });

    it('returns false for different snapshots', () => {
      document.body.innerHTML = '<div>Test1</div>';
      const result1 = takeSnapshot(document.body);

      document.body.innerHTML = '<div>Test2</div>';
      const result2 = takeSnapshot(document.body);

      expect(result1.toMatch(result2.snapshot)).toBe(false);
    });

    it('normalizes whitespace', () => {
      const snapshot1 = '  <div>Test</div>  \n';
      const snapshot2 = '<div>Test</div>';

      document.body.innerHTML = '<div>Test</div>';
      const result = takeSnapshot(document.body);

      expect(result.toMatch(snapshot2)).toBe(true);
    });
  });

  describe('diff', () => {
    it('shows differences between snapshots', () => {
      document.body.innerHTML = '<div>Test1</div>';
      const result1 = takeSnapshot(document.body);

      document.body.innerHTML = '<div>Test2</div>';
      const result2 = takeSnapshot(document.body);

      const diff = result1.diff(result2.snapshot);

      expect(diff).toContain('Test1');
      expect(diff).toContain('Test2');
    });

    it('returns empty string for identical snapshots', () => {
      document.body.innerHTML = '<div>Test</div>';
      const result1 = takeSnapshot(document.body);
      const result2 = takeSnapshot(document.body);

      const diff = result1.diff(result2.snapshot);

      expect(diff).toBe('');
    });

    it('shows line numbers in diff', () => {
      document.body.innerHTML = '<div>\n<p>Test</p>\n</div>';
      const result1 = takeSnapshot(document.body);

      document.body.innerHTML = '<div>\n<p>Changed</p>\n</div>';
      const result2 = takeSnapshot(document.body);

      const diff = result1.diff(result2.snapshot);

      expect(diff).toMatch(/Line \d+:/);
    });
  });
});

describe('SnapshotMatcher', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('saves first snapshot', () => {
    const matcher = createSnapshotMatcher();
    document.body.innerHTML = '<div>Test</div>';

    expect(() => {
      matcher.matchSnapshot('test1', document.body);
    }).not.toThrow();
  });

  it('passes when snapshots match', () => {
    const matcher = createSnapshotMatcher();
    document.body.innerHTML = '<div>Test</div>';

    matcher.matchSnapshot('test1', document.body);

    expect(() => {
      matcher.matchSnapshot('test1', document.body);
    }).not.toThrow();
  });

  it('throws when snapshots differ', () => {
    const matcher = createSnapshotMatcher();
    document.body.innerHTML = '<div>Test</div>';

    matcher.matchSnapshot('test1', document.body);

    document.body.innerHTML = '<div>Different</div>';

    expect(() => {
      matcher.matchSnapshot('test1', document.body);
    }).toThrow(/Snapshot mismatch/);
  });

  it('updates snapshots in update mode', () => {
    const matcher = createSnapshotMatcher({ updateMode: true });

    document.body.innerHTML = '<div>First</div>';
    matcher.matchSnapshot('test1', document.body);

    document.body.innerHTML = '<div>Second</div>';
    matcher.matchSnapshot('test1', document.body);

    const snapshots = matcher.getSnapshots();
    expect(snapshots.test1).toContain('Second');
  });

  it('manages multiple snapshots', () => {
    const matcher = createSnapshotMatcher();

    document.body.innerHTML = '<div>Test1</div>';
    matcher.matchSnapshot('snap1', document.body);

    document.body.innerHTML = '<div>Test2</div>';
    matcher.matchSnapshot('snap2', document.body);

    const snapshots = matcher.getSnapshots();
    expect(snapshots.snap1).toContain('Test1');
    expect(snapshots.snap2).toContain('Test2');
  });

  it('loads snapshots from data', () => {
    const matcher = createSnapshotMatcher();

    matcher.loadSnapshots({
      test1: '<div>Loaded</div>',
    });

    document.body.innerHTML = '<div>Loaded</div>';

    expect(() => {
      matcher.matchSnapshot('test1', document.body);
    }).not.toThrow();
  });

  it('clears all snapshots', () => {
    const matcher = createSnapshotMatcher();

    document.body.innerHTML = '<div>Test</div>';
    matcher.matchSnapshot('test1', document.body);

    matcher.clear();

    const snapshots = matcher.getSnapshots();
    expect(Object.keys(snapshots)).toHaveLength(0);
  });
});

describe('snapshotSignalState', () => {
  it('captures signal state', () => {
    const signals = {
      count: { get: () => 5 },
      name: { get: () => 'test' },
      active: { get: () => true },
    };

    const snapshot = snapshotSignalState(signals);
    const parsed = JSON.parse(snapshot);

    expect(parsed).toEqual({
      count: 5,
      name: 'test',
      active: true,
    });
  });

  it('formats as JSON', () => {
    const signals = {
      value: { get: () => 42 },
    };

    const snapshot = snapshotSignalState(signals);

    expect(snapshot).toContain('"value"');
    expect(snapshot).toContain('42');
  });

  it('handles empty signals', () => {
    const snapshot = snapshotSignalState({});
    expect(JSON.parse(snapshot)).toEqual({});
  });

  it('handles complex values', () => {
    const signals = {
      data: { get: () => ({ nested: { value: [1, 2, 3] } }) },
    };

    const snapshot = snapshotSignalState(signals);
    const parsed = JSON.parse(snapshot);

    expect(parsed.data.nested.value).toEqual([1, 2, 3]);
  });
});

describe('compareSignalSnapshots', () => {
  it('matches identical states', () => {
    const actual = {
      count: { get: () => 5 },
      name: { get: () => 'test' },
    };

    const expected = {
      count: 5,
      name: 'test',
    };

    const result = compareSignalSnapshots(actual, expected);

    expect(result.match).toBe(true);
    expect(result.diff).toBe('');
  });

  it('detects value differences', () => {
    const actual = {
      count: { get: () => 5 },
    };

    const expected = {
      count: 10,
    };

    const result = compareSignalSnapshots(actual, expected);

    expect(result.match).toBe(false);
    expect(result.diff).toContain('count');
    expect(result.diff).toContain('5');
    expect(result.diff).toContain('10');
  });

  it('detects missing signals', () => {
    const actual = {
      count: { get: () => 5 },
    };

    const expected = {
      count: 5,
      name: 'test',
    };

    const result = compareSignalSnapshots(actual, expected);

    expect(result.match).toBe(false);
    expect(result.diff).toContain('Missing signal: name');
  });

  it('detects extra signals', () => {
    const actual = {
      count: { get: () => 5 },
      extra: { get: () => 'value' },
    };

    const expected = {
      count: 5,
    };

    const result = compareSignalSnapshots(actual, expected);

    expect(result.match).toBe(false);
    expect(result.diff).toContain('Extra signal: extra');
  });

  it('provides detailed diff', () => {
    const actual = {
      a: { get: () => 1 },
      b: { get: () => 2 },
      c: { get: () => 3 },
    };

    const expected = {
      a: 1,
      b: 999,
      d: 4,
    };

    const result = compareSignalSnapshots(actual, expected);

    expect(result.match).toBe(false);
    expect(result.diff).toContain('Signal "b" mismatch');
    expect(result.diff).toContain('Missing signal: d');
    expect(result.diff).toContain('Extra signal: c');
  });
});
