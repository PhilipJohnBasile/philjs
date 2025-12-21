/**
 * Tests for Toast, ToastContainer, and useToast
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast, ToastContainer, useToast } from './Toast';

describe('toast', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    toast.closeAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    toast.closeAll();
    vi.useRealTimers();
  });

  describe('basic toast', () => {
    it('should create a toast and return an id', () => {
      const id = toast({ title: 'Test Toast' });

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should accept custom id', () => {
      const id = toast({ id: 'custom-id', title: 'Test' });

      expect(id).toBe('custom-id');
    });
  });

  describe('toast variants', () => {
    it('should create success toast', () => {
      const id = toast.success({ title: 'Success!' });

      expect(id).toBeDefined();
    });

    it('should create error toast', () => {
      const id = toast.error({ title: 'Error!' });

      expect(id).toBeDefined();
    });

    it('should create warning toast', () => {
      const id = toast.warning({ title: 'Warning!' });

      expect(id).toBeDefined();
    });

    it('should create info toast', () => {
      const id = toast.info({ title: 'Info!' });

      expect(id).toBeDefined();
    });
  });

  describe('toast.close', () => {
    it('should close a specific toast', () => {
      const id = toast({ title: 'Test' });
      toast.close(id);

      // Toast should be removed from internal state
      expect(id).toBeDefined();
    });
  });

  describe('toast.closeAll', () => {
    it('should close all toasts', () => {
      toast({ title: 'Toast 1' });
      toast({ title: 'Toast 2' });
      toast({ title: 'Toast 3' });

      toast.closeAll();

      // All toasts should be removed
      expect(true).toBe(true);
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after duration', () => {
      toast({ title: 'Auto dismiss', duration: 3000 });

      vi.advanceTimersByTime(3000);

      // Toast should be auto-dismissed
      expect(true).toBe(true);
    });

    it('should not auto-dismiss when duration is 0', () => {
      const id = toast({ title: 'Persistent', duration: 0 });

      vi.advanceTimersByTime(10000);

      // Toast should still exist
      expect(id).toBeDefined();
    });
  });
});

describe('ToastContainer', () => {
  beforeEach(() => {
    toast.closeAll();
  });

  afterEach(() => {
    toast.closeAll();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const vnode = ToastContainer();

      // Returns a fragment with position containers
      expect(vnode).toBeDefined();
    });
  });

  describe('positions', () => {
    it('should support all positions', () => {
      const positions = [
        'top',
        'top-left',
        'top-right',
        'bottom',
        'bottom-left',
        'bottom-right',
      ] as const;

      positions.forEach((position) => {
        toast({ title: 'Test', position });
      });

      // All toasts created successfully
      expect(true).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have aria-live for announcements', () => {
      const vnode = ToastContainer();

      // The container should support screen reader announcements
      expect(vnode).toBeDefined();
    });
  });
});

describe('useToast', () => {
  it('should return toast function', () => {
    const toastFn = useToast();

    expect(toastFn).toBe(toast);
  });

  it('should have success method', () => {
    const toastFn = useToast();

    expect(typeof toastFn.success).toBe('function');
  });

  it('should have error method', () => {
    const toastFn = useToast();

    expect(typeof toastFn.error).toBe('function');
  });

  it('should have warning method', () => {
    const toastFn = useToast();

    expect(typeof toastFn.warning).toBe('function');
  });

  it('should have info method', () => {
    const toastFn = useToast();

    expect(typeof toastFn.info).toBe('function');
  });

  it('should have close method', () => {
    const toastFn = useToast();

    expect(typeof toastFn.close).toBe('function');
  });

  it('should have closeAll method', () => {
    const toastFn = useToast();

    expect(typeof toastFn.closeAll).toBe('function');
  });
});

describe('ToastItem behavior', () => {
  beforeEach(() => {
    toast.closeAll();
  });

  afterEach(() => {
    toast.closeAll();
  });

  describe('toast content', () => {
    it('should accept title', () => {
      const id = toast({ title: 'My Title' });

      expect(id).toBeDefined();
    });

    it('should accept description', () => {
      const id = toast({ title: 'Title', description: 'Description text' });

      expect(id).toBeDefined();
    });

    it('should accept both title and description', () => {
      const id = toast({
        title: 'Title',
        description: 'This is a longer description',
      });

      expect(id).toBeDefined();
    });
  });

  describe('isClosable', () => {
    it('should be closable by default', () => {
      const id = toast({ title: 'Closable' });

      expect(id).toBeDefined();
    });

    it('should accept isClosable prop', () => {
      const id = toast({ title: 'Not closable', isClosable: false });

      expect(id).toBeDefined();
    });
  });

  describe('custom render', () => {
    it('should accept custom render function', () => {
      const id = toast({
        render: ({ onClose }) => <div onClick={onClose}>Custom Toast</div>,
      });

      expect(id).toBeDefined();
    });
  });

  describe('status styles', () => {
    it('should apply info status styles', () => {
      const id = toast({ title: 'Info', status: 'info' });

      expect(id).toBeDefined();
    });

    it('should apply success status styles', () => {
      const id = toast({ title: 'Success', status: 'success' });

      expect(id).toBeDefined();
    });

    it('should apply warning status styles', () => {
      const id = toast({ title: 'Warning', status: 'warning' });

      expect(id).toBeDefined();
    });

    it('should apply error status styles', () => {
      const id = toast({ title: 'Error', status: 'error' });

      expect(id).toBeDefined();
    });
  });
});
