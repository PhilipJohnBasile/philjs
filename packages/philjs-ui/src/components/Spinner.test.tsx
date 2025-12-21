/**
 * Tests for Spinner, Progress, CircularProgress, and Skeleton Components
 */

import { describe, it, expect } from 'vitest';
import { Spinner, Progress, CircularProgress, Skeleton } from './Spinner';

describe('Spinner', () => {
  describe('rendering', () => {
    it('should render with role="status"', () => {
      const vnode = Spinner({});

      expect(vnode.type).toBe('div');
      expect(vnode.props.role).toBe('status');
    });

    it('should render an svg spinner', () => {
      const vnode = Spinner({});
      const svg = vnode.props.children[0];

      expect(svg.type).toBe('svg');
      expect(svg.props['aria-hidden']).toBe('true');
    });

    it('should render screen reader label', () => {
      const vnode = Spinner({ label: 'Loading' });
      const srLabel = vnode.props.children[1];

      expect(srLabel.type).toBe('span');
      expect(srLabel.props.className).toContain('sr-only');
      // Children may be wrapped in array
      const labelText = Array.isArray(srLabel.props.children)
        ? srLabel.props.children[0]
        : srLabel.props.children;
      expect(labelText).toBe('Loading');
    });
  });

  describe('sizes', () => {
    it('should apply xs size', () => {
      const vnode = Spinner({ size: 'xs' });
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('h-3');
      expect(svg.props.className).toContain('w-3');
    });

    it('should apply sm size', () => {
      const vnode = Spinner({ size: 'sm' });
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('h-4');
      expect(svg.props.className).toContain('w-4');
    });

    it('should apply md size (default)', () => {
      const vnode = Spinner({ size: 'md' });
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('h-6');
      expect(svg.props.className).toContain('w-6');
    });

    it('should apply lg size', () => {
      const vnode = Spinner({ size: 'lg' });
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('h-8');
      expect(svg.props.className).toContain('w-8');
    });

    it('should apply xl size', () => {
      const vnode = Spinner({ size: 'xl' });
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('h-12');
      expect(svg.props.className).toContain('w-12');
    });
  });

  describe('color', () => {
    it('should apply default color', () => {
      const vnode = Spinner({});
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('text-blue-600');
    });

    it('should apply custom color', () => {
      const vnode = Spinner({ color: 'text-red-500' });
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('text-red-500');
    });
  });

  describe('animation', () => {
    it('should have spin animation', () => {
      const vnode = Spinner({});
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('animate-spin');
    });

    it('should accept custom speed', () => {
      const vnode = Spinner({ speed: 'animate-pulse' });
      const svg = vnode.props.children[0];

      expect(svg.props.className).toContain('animate-pulse');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Spinner({ className: 'custom-spinner' });

      expect(vnode.props.className).toContain('custom-spinner');
    });
  });
});

describe('Progress', () => {
  describe('rendering', () => {
    it('should render a progress bar with role="progressbar"', () => {
      const vnode = Progress({ value: 50 });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props.role).toBe('progressbar');
    });

    it('should set aria-valuenow', () => {
      const vnode = Progress({ value: 50 });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props['aria-valuenow']).toBe(50);
    });

    it('should set aria-valuemin and aria-valuemax', () => {
      const vnode = Progress({ value: 50, max: 100 });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props['aria-valuemin']).toBe(0);
      expect(progressBar.props['aria-valuemax']).toBe(100);
    });
  });

  describe('value', () => {
    it('should calculate percentage correctly', () => {
      const vnode = Progress({ value: 50, max: 100 });
      const fill = findProgressFill(vnode);

      expect(fill.props.style.width).toBe('50%');
    });

    it('should clamp value to 0-100%', () => {
      const overVnode = Progress({ value: 150 });
      const overFill = findProgressFill(overVnode);
      expect(overFill.props.style.width).toBe('100%');

      const underVnode = Progress({ value: -50 });
      const underFill = findProgressFill(underVnode);
      expect(underFill.props.style.width).toBe('0%');
    });

    it('should handle custom max value', () => {
      const vnode = Progress({ value: 25, max: 50 });
      const fill = findProgressFill(vnode);

      expect(fill.props.style.width).toBe('50%');
    });
  });

  describe('sizes', () => {
    it('should apply xs size', () => {
      const vnode = Progress({ value: 50, size: 'xs' });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props.className).toContain('h-1');
    });

    it('should apply sm size', () => {
      const vnode = Progress({ value: 50, size: 'sm' });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props.className).toContain('h-2');
    });

    it('should apply md size (default)', () => {
      const vnode = Progress({ value: 50, size: 'md' });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props.className).toContain('h-3');
    });

    it('should apply lg size', () => {
      const vnode = Progress({ value: 50, size: 'lg' });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props.className).toContain('h-4');
    });
  });

  describe('colors', () => {
    it('should apply blue color (default)', () => {
      const vnode = Progress({ value: 50, color: 'blue' });
      const fill = findProgressFill(vnode);

      expect(fill.props.className).toContain('bg-blue-600');
    });

    it('should apply green color', () => {
      const vnode = Progress({ value: 50, color: 'green' });
      const fill = findProgressFill(vnode);

      expect(fill.props.className).toContain('bg-green-600');
    });

    it('should apply red color', () => {
      const vnode = Progress({ value: 50, color: 'red' });
      const fill = findProgressFill(vnode);

      expect(fill.props.className).toContain('bg-red-600');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const vnode = Progress({ value: 50, label: 'Progress' });

      const labelContainer = vnode.props.children[0];
      expect(labelContainer).toBeDefined();
    });

    it('should set aria-label on progress bar', () => {
      const vnode = Progress({ value: 50, label: 'Upload progress' });
      const progressBar = findProgressBar(vnode);

      expect(progressBar.props['aria-label']).toBe('Upload progress');
    });
  });

  describe('showValue', () => {
    it('should show value when showValue is true', () => {
      const vnode = Progress({ value: 50, showValue: true });

      const labelContainer = vnode.props.children[0];
      expect(labelContainer).toBeDefined();
    });
  });

  describe('striped', () => {
    it('should apply striped styles when striped is true', () => {
      const vnode = Progress({ value: 50, striped: true });
      const fill = findProgressFill(vnode);

      expect(fill.props.className).toContain('bg-gradient-to-r');
    });
  });

  describe('animated', () => {
    it('should apply animation when animated is true', () => {
      const vnode = Progress({ value: 50, animated: true });
      const fill = findProgressFill(vnode);

      expect(fill.props.className).toContain('animate-');
    });
  });
});

describe('CircularProgress', () => {
  describe('rendering', () => {
    it('should render with role="progressbar"', () => {
      const vnode = CircularProgress({ value: 50 });

      expect(vnode.props.role).toBe('progressbar');
    });

    it('should render an svg element', () => {
      const vnode = CircularProgress({ value: 50 });
      const svg = vnode.props.children[0];

      expect(svg.type).toBe('svg');
    });

    it('should set aria attributes', () => {
      const vnode = CircularProgress({ value: 50, max: 100 });

      expect(vnode.props['aria-valuenow']).toBe(50);
      expect(vnode.props['aria-valuemin']).toBe(0);
      expect(vnode.props['aria-valuemax']).toBe(100);
    });
  });

  describe('size', () => {
    it('should apply default size', () => {
      const vnode = CircularProgress({ value: 50 });
      const svg = vnode.props.children[0];

      expect(svg.props.width).toBe(48);
      expect(svg.props.height).toBe(48);
    });

    it('should apply custom size', () => {
      const vnode = CircularProgress({ value: 50, size: 100 });
      const svg = vnode.props.children[0];

      expect(svg.props.width).toBe(100);
      expect(svg.props.height).toBe(100);
    });
  });

  describe('thickness', () => {
    it('should apply default thickness', () => {
      const vnode = CircularProgress({ value: 50, thickness: 4 });

      // Thickness affects strokeWidth of circles
      expect(vnode).toBeDefined();
    });
  });

  describe('showValue', () => {
    it('should show percentage when showValue is true', () => {
      const vnode = CircularProgress({ value: 50, showValue: true });

      const valueSpan = vnode.props.children[1];
      expect(valueSpan).toBeDefined();
      // Children may be split as [50, '%'] or '50%'
      const content = valueSpan.props.children;
      const text = Array.isArray(content) ? content.join('') : content;
      expect(text).toBe('50%');
    });

    it('should not show percentage when showValue is false', () => {
      const vnode = CircularProgress({ value: 50, showValue: false });

      const valueSpan = vnode.props.children[1];
      expect(valueSpan).toBeFalsy();
    });
  });
});

describe('Skeleton', () => {
  describe('rendering', () => {
    it('should render a div element', () => {
      const vnode = Skeleton({});

      expect(vnode.type).toBe('div');
    });

    it('should be hidden from accessibility', () => {
      const vnode = Skeleton({});

      expect(vnode.props['aria-hidden']).toBe('true');
    });
  });

  describe('variants', () => {
    it('should apply text variant (default)', () => {
      const vnode = Skeleton({ variant: 'text' });

      expect(vnode.props.className).toContain('h-4');
      expect(vnode.props.className).toContain('rounded');
    });

    it('should apply circular variant', () => {
      const vnode = Skeleton({ variant: 'circular' });

      expect(vnode.props.className).toContain('rounded-full');
    });

    it('should apply rectangular variant', () => {
      const vnode = Skeleton({ variant: 'rectangular' });

      expect(vnode.props.className).toContain('rounded');
    });
  });

  describe('dimensions', () => {
    it('should accept width as number', () => {
      const vnode = Skeleton({ width: 100 });

      expect(vnode.props.style.width).toBe('100px');
    });

    it('should accept width as string', () => {
      const vnode = Skeleton({ width: '50%' });

      expect(vnode.props.style.width).toBe('50%');
    });

    it('should accept height as number', () => {
      const vnode = Skeleton({ height: 50 });

      expect(vnode.props.style.height).toBe('50px');
    });

    it('should accept height as string', () => {
      const vnode = Skeleton({ height: '100%' });

      expect(vnode.props.style.height).toBe('100%');
    });

    it('should set equal width and height for circular variant', () => {
      const vnode = Skeleton({ variant: 'circular', width: 40 });

      expect(vnode.props.style.width).toBe('40px');
      expect(vnode.props.style.height).toBe('40px');
    });
  });

  describe('animation', () => {
    it('should have pulse animation', () => {
      const vnode = Skeleton({});

      expect(vnode.props.className).toContain('animate-pulse');
    });
  });

  describe('styling', () => {
    it('should have gray background', () => {
      const vnode = Skeleton({});

      expect(vnode.props.className).toContain('bg-gray-200');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Skeleton({ className: 'custom-skeleton' });

      expect(vnode.props.className).toContain('custom-skeleton');
    });
  });
});

// Helper functions
function findProgressBar(vnode: any): any {
  if (vnode?.props?.role === 'progressbar') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findProgressBar(child);
      if (found) return found;
    }
  }
  return null;
}

function findProgressFill(vnode: any): any {
  const progressBar = findProgressBar(vnode);
  if (progressBar?.props?.children) {
    // The fill is inside the progress bar, look for div with style.width
    const children = Array.isArray(progressBar.props.children)
      ? progressBar.props.children
      : [progressBar.props.children];
    for (const child of children) {
      if (child?.props?.style?.width) return child;
    }
    return children[0]; // Fallback to first child
  }
  return null;
}
