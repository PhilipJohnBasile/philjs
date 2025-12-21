/**
 * Tests for Modal, ModalHeader, ModalBody, ModalFooter, and ConfirmDialog Components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmDialog } from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      const vnode = Modal({
        isOpen: false,
        onClose: vi.fn(),
        children: 'Content',
      });

      expect(vnode).toBeNull();
    });

    it('should render when isOpen is true', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('div');
    });

    it('should render overlay', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      const overlay = vnode.props.children[0];
      expect(overlay.props.className).toContain('bg-black/50');
      expect(overlay.props['aria-hidden']).toBe('true');
    });

    it('should render dialog with role="dialog"', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props.role).toBe('dialog');
      expect(dialog.props['aria-modal']).toBe('true');
    });
  });

  describe('title', () => {
    it('should render title when provided', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        title: 'Modal Title',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      const header = dialog.props.children[0];
      const title = header.props.children[0];

      expect(title.type).toBe('h2');
      // Children may be wrapped in array
      const titleText = Array.isArray(title.props.children)
        ? title.props.children[0]
        : title.props.children;
      expect(titleText).toBe('Modal Title');
    });

    it('should link title id for accessibility', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        title: 'Modal Title',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props['aria-labelledby']).toBeDefined();
    });
  });

  describe('sizes', () => {
    it('should apply sm size styles', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        size: 'sm',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props.className).toContain('max-w-sm');
    });

    it('should apply md size styles (default)', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        size: 'md',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props.className).toContain('max-w-md');
    });

    it('should apply lg size styles', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        size: 'lg',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props.className).toContain('max-w-lg');
    });

    it('should apply xl size styles', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        size: 'xl',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props.className).toContain('max-w-xl');
    });

    it('should apply full size styles', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        size: 'full',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props.className).toContain('max-w-full');
    });
  });

  describe('close button', () => {
    it('should show close button by default', () => {
      const onClose = vi.fn();
      const vnode = Modal({
        isOpen: true,
        onClose,
        title: 'Title',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      const header = dialog.props.children[0];
      const closeButton = header.props.children[1];

      expect(closeButton.type).toBe('button');
      expect(closeButton.props['aria-label']).toBe('Close modal');
    });

    it('should hide close button when showCloseButton is false', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        showCloseButton: false,
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const dialog = children[1];
      const dialogChildren = Array.isArray(dialog.props.children)
        ? dialog.props.children
        : [dialog.props.children];
      // When no title and no close button, header is false or doesn't render
      // The Modal component uses `{(title || showCloseButton) && ...}` so when both are falsy,
      // the result is false (not null or undefined)
      const header = dialogChildren[0];
      // Header should be falsy (false, null, undefined, 0, '') or not contain a close button
      const isFalsy = !header || header === false;
      // If header exists (due to implementation detail), check if close button is not rendered
      const hasNoCloseButton = isFalsy || (
        header.props && !findCloseButton(header)
      );
      expect(hasNoCloseButton).toBe(true);
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const vnode = Modal({
        isOpen: true,
        onClose,
        title: 'Title',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      const header = dialog.props.children[0];
      const closeButton = header.props.children[1];

      expect(closeButton.props.onClick).toBe(onClose);
    });
  });

  describe('overlay click', () => {
    it('should close on overlay click by default', () => {
      const onClose = vi.fn();
      const vnode = Modal({
        isOpen: true,
        onClose,
        children: 'Content',
      });

      const overlay = vnode.props.children[0];

      // Simulate clicking on the overlay
      const mockEvent = {
        target: 'overlay',
        currentTarget: 'overlay',
      };
      overlay.props.onClick(mockEvent);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close on overlay click when closeOnOverlay is false', () => {
      const onClose = vi.fn();
      const vnode = Modal({
        isOpen: true,
        onClose,
        closeOnOverlay: false,
        children: 'Content',
      });

      const overlay = vnode.props.children[0];

      // Simulate clicking on the overlay
      const mockEvent = {
        target: 'overlay',
        currentTarget: 'overlay',
      };
      overlay.props.onClick(mockEvent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        className: 'custom-modal',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props.className).toContain('custom-modal');
    });

    it('should accept overlay className', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        overlayClassName: 'custom-overlay',
        children: 'Content',
      });

      expect(vnode.props.className).toContain('custom-overlay');
    });
  });

  describe('accessibility', () => {
    it('should have aria-modal="true"', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props['aria-modal']).toBe('true');
    });

    it('should accept aria-label', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        'aria-label': 'Confirmation dialog',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props['aria-labelledby']).toBe('Confirmation dialog');
    });

    it('should accept aria-describedby', () => {
      const vnode = Modal({
        isOpen: true,
        onClose: vi.fn(),
        'aria-describedby': 'modal-description',
        children: 'Content',
      });

      const dialog = vnode.props.children[1];
      expect(dialog.props['aria-describedby']).toBe('modal-description');
    });
  });
});

describe('ModalHeader', () => {
  it('should render children', () => {
    const vnode = ModalHeader({ children: 'Header Content' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Header Content');
  });

  it('should apply padding styles', () => {
    const vnode = ModalHeader({ children: 'Header' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('pt-4');
    expect(vnode.props.className).toContain('pb-2');
  });

  it('should accept custom className', () => {
    const vnode = ModalHeader({ children: 'Header', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('ModalBody', () => {
  it('should render children', () => {
    const vnode = ModalBody({ children: 'Body Content' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Body Content');
  });

  it('should apply padding styles', () => {
    const vnode = ModalBody({ children: 'Body' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('py-2');
  });

  it('should accept custom className', () => {
    const vnode = ModalBody({ children: 'Body', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('ModalFooter', () => {
  it('should render children', () => {
    const vnode = ModalFooter({ children: 'Footer Content' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Footer Content');
  });

  it('should apply flex and justify-end styles', () => {
    const vnode = ModalFooter({ children: 'Footer' });

    expect(vnode.props.className).toContain('flex');
    expect(vnode.props.className).toContain('justify-end');
    expect(vnode.props.className).toContain('gap-2');
  });

  it('should apply padding styles', () => {
    const vnode = ModalFooter({ children: 'Footer' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('pt-2');
    expect(vnode.props.className).toContain('pb-4');
  });

  it('should accept custom className', () => {
    const vnode = ModalFooter({ children: 'Footer', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('ConfirmDialog', () => {
  it('should render with title and message', () => {
    const vnode = ConfirmDialog({
      isOpen: true,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
      title: 'Confirm Delete',
      message: 'Are you sure?',
    });

    // ConfirmDialog returns a Modal component
    expect(vnode.type).toBe(Modal);
    expect(vnode.props.title).toBe('Confirm Delete');
    expect(vnode.props.isOpen).toBe(true);
    expect(vnode.props.size).toBe('sm');
  });

  it('should render default button text', () => {
    const vnode = ConfirmDialog({
      isOpen: true,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
      title: 'Confirm',
      message: 'Are you sure?',
    });

    // ConfirmDialog returns a Modal, its children is a div with content
    const modalChildren = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const content = modalChildren[0];
    const contentChildren = Array.isArray(content.props.children)
      ? content.props.children
      : [content.props.children];
    const buttonContainer = contentChildren[1];
    const buttons = Array.isArray(buttonContainer.props.children)
      ? buttonContainer.props.children
      : [buttonContainer.props.children];

    // Children may be wrapped in array
    const cancelText = Array.isArray(buttons[0].props.children)
      ? buttons[0].props.children[0]
      : buttons[0].props.children;
    const confirmText = Array.isArray(buttons[1].props.children)
      ? buttons[1].props.children[0]
      : buttons[1].props.children;
    expect(cancelText).toBe('Cancel');
    expect(confirmText).toBe('Confirm');
  });

  it('should render custom button text', () => {
    const vnode = ConfirmDialog({
      isOpen: true,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
      title: 'Confirm',
      message: 'Are you sure?',
      confirmText: 'Yes, delete',
      cancelText: 'No, keep',
    });

    const modalChildren = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const content = modalChildren[0];
    const contentChildren = Array.isArray(content.props.children)
      ? content.props.children
      : [content.props.children];
    const buttonContainer = contentChildren[1];
    const buttons = Array.isArray(buttonContainer.props.children)
      ? buttonContainer.props.children
      : [buttonContainer.props.children];

    // Children may be wrapped in array
    const cancelText = Array.isArray(buttons[0].props.children)
      ? buttons[0].props.children[0]
      : buttons[0].props.children;
    const confirmButtonText = Array.isArray(buttons[1].props.children)
      ? buttons[1].props.children[0]
      : buttons[1].props.children;
    expect(cancelText).toBe('No, keep');
    expect(confirmButtonText).toBe('Yes, delete');
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    const vnode = ConfirmDialog({
      isOpen: true,
      onClose,
      onConfirm: vi.fn(),
      title: 'Confirm',
      message: 'Are you sure?',
    });

    const modalChildren = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const content = modalChildren[0];
    const contentChildren = Array.isArray(content.props.children)
      ? content.props.children
      : [content.props.children];
    const buttonContainer = contentChildren[1];
    const buttons = Array.isArray(buttonContainer.props.children)
      ? buttonContainer.props.children
      : [buttonContainer.props.children];
    const cancelButton = buttons[0];

    cancelButton.props.onClick();
    expect(onClose).toHaveBeenCalled();
  });

  it('should apply danger variant styles', () => {
    const vnode = ConfirmDialog({
      isOpen: true,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
      title: 'Delete',
      message: 'This cannot be undone',
      variant: 'danger',
    });

    const modalChildren = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const content = modalChildren[0];
    const contentChildren = Array.isArray(content.props.children)
      ? content.props.children
      : [content.props.children];
    const buttonContainer = contentChildren[1];
    const buttons = Array.isArray(buttonContainer.props.children)
      ? buttonContainer.props.children
      : [buttonContainer.props.children];
    const confirmButton = buttons[1];

    expect(confirmButton.props.className).toContain('bg-red-600');
  });

  it('should apply warning variant styles', () => {
    const vnode = ConfirmDialog({
      isOpen: true,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
      title: 'Warning',
      message: 'Proceed with caution',
      variant: 'warning',
    });

    const modalChildren = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const content = modalChildren[0];
    const contentChildren = Array.isArray(content.props.children)
      ? content.props.children
      : [content.props.children];
    const buttonContainer = contentChildren[1];
    const buttons = Array.isArray(buttonContainer.props.children)
      ? buttonContainer.props.children
      : [buttonContainer.props.children];
    const confirmButton = buttons[1];

    expect(confirmButton.props.className).toContain('bg-yellow-500');
  });
});

// Helper function to find close button in vnode tree
function findCloseButton(vnode: any): any {
  if (vnode?.props?.['aria-label'] === 'Close modal') return vnode;
  if (vnode?.type === 'button' && vnode?.props?.['aria-label'] === 'Close modal') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findCloseButton(child);
      if (found) return found;
    }
  }
  return null;
}
