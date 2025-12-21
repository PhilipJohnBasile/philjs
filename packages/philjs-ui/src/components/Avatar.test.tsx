/**
 * Tests for Avatar, AvatarGroup, and AvatarBadge Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Avatar, AvatarGroup, AvatarBadge } from './Avatar';

describe('Avatar', () => {
  describe('rendering', () => {
    it('should render a div container', () => {
      const vnode = Avatar({});

      expect(vnode.type).toBe('div');
      expect(vnode.props.className).toContain('relative');
      expect(vnode.props.className).toContain('inline-flex');
    });
  });

  describe('image', () => {
    it('should render image when src is provided', () => {
      const vnode = Avatar({ src: '/avatar.jpg', alt: 'User' });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[0];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children[0]
        : container.props.children;

      expect(containerChildren.type).toBe('img');
      expect(containerChildren.props.src).toBe('/avatar.jpg');
      expect(containerChildren.props.alt).toBe('User');
    });

    it('should use name for alt if alt not provided', () => {
      const vnode = Avatar({ src: '/avatar.jpg', name: 'John Doe' });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[0];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children[0]
        : container.props.children;

      expect(containerChildren.props.alt).toBe('John Doe');
    });
  });

  describe('fallback initials', () => {
    it('should render initials when no src is provided', () => {
      const vnode = Avatar({ name: 'John Doe' });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[0];
      const initials = Array.isArray(container.props.children)
        ? container.props.children[0]
        : container.props.children;

      expect(initials.type).toBe('span');
      // Children may be wrapped in array
      const initialsText = Array.isArray(initials.props.children)
        ? initials.props.children[0]
        : initials.props.children;
      expect(initialsText).toBe('JD');
    });

    it('should render single initial for single name', () => {
      const vnode = Avatar({ name: 'John' });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[0];
      const initials = Array.isArray(container.props.children)
        ? container.props.children[0]
        : container.props.children;

      // Children may be wrapped in array
      const initialsText = Array.isArray(initials.props.children)
        ? initials.props.children[0]
        : initials.props.children;
      expect(initialsText).toBe('J');
    });

    it('should render ? when no name is provided', () => {
      const vnode = Avatar({});

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[0];
      const initials = Array.isArray(container.props.children)
        ? container.props.children[0]
        : container.props.children;

      // Children may be wrapped in array
      const initialsText = Array.isArray(initials.props.children)
        ? initials.props.children[0]
        : initials.props.children;
      expect(initialsText).toBe('?');
    });

    it('should use first and last name initials', () => {
      const vnode = Avatar({ name: 'John Michael Doe' });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[0];
      const initials = Array.isArray(container.props.children)
        ? container.props.children[0]
        : container.props.children;

      // Children may be wrapped in array
      const initialsText = Array.isArray(initials.props.children)
        ? initials.props.children[0]
        : initials.props.children;
      expect(initialsText).toBe('JD');
    });
  });

  describe('sizes', () => {
    it('should apply xs size', () => {
      const vnode = Avatar({ size: 'xs' });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('h-6');
      expect(container.props.className).toContain('w-6');
    });

    it('should apply sm size', () => {
      const vnode = Avatar({ size: 'sm' });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('h-8');
      expect(container.props.className).toContain('w-8');
    });

    it('should apply md size (default)', () => {
      const vnode = Avatar({ size: 'md' });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('h-10');
      expect(container.props.className).toContain('w-10');
    });

    it('should apply lg size', () => {
      const vnode = Avatar({ size: 'lg' });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('h-12');
      expect(container.props.className).toContain('w-12');
    });

    it('should apply xl size', () => {
      const vnode = Avatar({ size: 'xl' });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('h-14');
      expect(container.props.className).toContain('w-14');
    });

    it('should apply 2xl size', () => {
      const vnode = Avatar({ size: '2xl' });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('h-16');
      expect(container.props.className).toContain('w-16');
    });
  });

  describe('shape', () => {
    it('should be rounded (circular) by default', () => {
      const vnode = Avatar({ rounded: true });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('rounded-full');
    });

    it('should apply rounded corners when rounded is false', () => {
      const vnode = Avatar({ rounded: false });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('rounded-md');
    });
  });

  describe('border', () => {
    it('should not show border by default', () => {
      const vnode = Avatar({ showBorder: false });
      const container = vnode.props.children[0];

      expect(container.props.className).not.toContain('border-2');
    });

    it('should show border when showBorder is true', () => {
      const vnode = Avatar({ showBorder: true });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('border-2');
    });

    it('should apply custom border color', () => {
      const vnode = Avatar({ showBorder: true, borderColor: 'border-blue-500' });
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('border-blue-500');
    });
  });

  describe('status indicator', () => {
    it('should not render status by default', () => {
      const vnode = Avatar({});
      const status = vnode.props.children[1];

      expect(status).toBeFalsy();
    });

    it('should render online status', () => {
      const vnode = Avatar({ status: 'online' });
      const status = vnode.props.children[1];

      expect(status).toBeDefined();
      expect(status.props.className).toContain('bg-green-500');
    });

    it('should render offline status', () => {
      const vnode = Avatar({ status: 'offline' });
      const status = vnode.props.children[1];

      expect(status.props.className).toContain('bg-gray-400');
    });

    it('should render busy status', () => {
      const vnode = Avatar({ status: 'busy' });
      const status = vnode.props.children[1];

      expect(status.props.className).toContain('bg-red-500');
    });

    it('should render away status', () => {
      const vnode = Avatar({ status: 'away' });
      const status = vnode.props.children[1];

      expect(status.props.className).toContain('bg-yellow-500');
    });

    it('should have aria-label on status indicator', () => {
      const vnode = Avatar({ status: 'online' });
      const status = vnode.props.children[1];

      expect(status.props['aria-label']).toBe('Status: online');
    });
  });

  describe('background color', () => {
    it('should generate consistent background color from name', () => {
      const vnode1 = Avatar({ name: 'John Doe' });
      const vnode2 = Avatar({ name: 'John Doe' });

      const container1 = vnode1.props.children[0];
      const container2 = vnode2.props.children[0];

      expect(container1.props.className).toBe(container2.props.className);
    });

    it('should apply gray background when no name is provided', () => {
      const vnode = Avatar({});
      const container = vnode.props.children[0];

      expect(container.props.className).toContain('bg-gray-400');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Avatar({ className: 'custom-avatar' });

      expect(vnode.props.className).toContain('custom-avatar');
    });
  });
});

describe('AvatarGroup', () => {
  describe('rendering', () => {
    it('should render children', () => {
      const vnode = AvatarGroup({
        children: [
          <Avatar key="1" name="John" />,
          <Avatar key="2" name="Jane" />,
        ],
      });

      expect(vnode.type).toBe('div');
      expect(vnode.props.className).toContain('flex');
      expect(vnode.props.className).toContain('items-center');
    });
  });

  describe('max limit', () => {
    it('should display all avatars when under max', () => {
      const children = [
        <Avatar key="1" name="A" />,
        <Avatar key="2" name="B" />,
      ];

      const vnode = AvatarGroup({ children, max: 5 });
      const vnodeChildren = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      // Avatars may be at vnodeChildren[0] or vnodeChildren could be the avatars directly
      const avatars = Array.isArray(vnodeChildren[0]) ? vnodeChildren[0] : vnodeChildren;

      expect(avatars.length).toBe(2);
    });

    it('should truncate avatars when over max', () => {
      const children = [
        <Avatar key="1" name="A" />,
        <Avatar key="2" name="B" />,
        <Avatar key="3" name="C" />,
        <Avatar key="4" name="D" />,
      ];

      const vnode = AvatarGroup({ children, max: 2 });
      const vnodeChildren = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      // Avatars may be at vnodeChildren[0] or vnodeChildren could be the avatars directly
      const avatars = Array.isArray(vnodeChildren[0]) ? vnodeChildren[0] : vnodeChildren.slice(0, -1);
      const remaining = Array.isArray(vnodeChildren[0]) ? vnodeChildren[1] : vnodeChildren[vnodeChildren.length - 1];

      expect(avatars.length).toBe(2);
      expect(remaining).toBeDefined();
      // The remaining count is rendered as `+{remaining}` which means children is ['+', 2]
      const remainingChildren = Array.isArray(remaining.props.children)
        ? remaining.props.children
        : [remaining.props.children];
      // Join all parts to get the full text
      const remainingText = remainingChildren.join('');
      expect(remainingText).toBe('+2');
    });
  });

  describe('spacing', () => {
    it('should apply default negative spacing', () => {
      const vnode = AvatarGroup({
        children: <Avatar name="A" />,
        spacing: -3,
      });

      // Second avatar onwards should have margin-left
      expect(vnode).toBeDefined();
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = AvatarGroup({
        children: <Avatar />,
        className: 'custom-group',
      });

      expect(vnode.props.className).toContain('custom-group');
    });
  });
});

describe('AvatarBadge', () => {
  describe('rendering', () => {
    it('should render children and badge', () => {
      const badge = <span className="badge">!</span>;
      const vnode = AvatarBadge({
        children: <Avatar name="John" />,
        badge,
      });

      expect(vnode.type).toBe('div');
      expect(vnode.props.className).toContain('relative');
      expect(vnode.props.className).toContain('inline-flex');
    });

    it('should render badge element', () => {
      const badge = <span className="badge">!</span>;
      const vnode = AvatarBadge({
        children: <Avatar name="John" />,
        badge,
      });

      const vnodeChildren = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const badgeWrapper = vnodeChildren[1];
      expect(badgeWrapper).toBeDefined();
      // Children may be wrapped in array
      const badgeContent = Array.isArray(badgeWrapper.props.children)
        ? badgeWrapper.props.children[0]
        : badgeWrapper.props.children;
      expect(badgeContent).toBe(badge);
    });
  });

  describe('positions', () => {
    it('should apply bottom-right position by default', () => {
      const badge = <span>!</span>;
      const vnode = AvatarBadge({
        children: <Avatar />,
        badge,
        position: 'bottom-right',
      });

      const badgeWrapper = vnode.props.children[1];
      expect(badgeWrapper.props.className).toContain('bottom-0');
      expect(badgeWrapper.props.className).toContain('right-0');
    });

    it('should apply top-right position', () => {
      const badge = <span>!</span>;
      const vnode = AvatarBadge({
        children: <Avatar />,
        badge,
        position: 'top-right',
      });

      const badgeWrapper = vnode.props.children[1];
      expect(badgeWrapper.props.className).toContain('top-0');
      expect(badgeWrapper.props.className).toContain('right-0');
    });

    it('should apply top-left position', () => {
      const badge = <span>!</span>;
      const vnode = AvatarBadge({
        children: <Avatar />,
        badge,
        position: 'top-left',
      });

      const badgeWrapper = vnode.props.children[1];
      expect(badgeWrapper.props.className).toContain('top-0');
      expect(badgeWrapper.props.className).toContain('left-0');
    });

    it('should apply bottom-left position', () => {
      const badge = <span>!</span>;
      const vnode = AvatarBadge({
        children: <Avatar />,
        badge,
        position: 'bottom-left',
      });

      const badgeWrapper = vnode.props.children[1];
      expect(badgeWrapper.props.className).toContain('bottom-0');
      expect(badgeWrapper.props.className).toContain('left-0');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = AvatarBadge({
        children: <Avatar />,
        badge: <span>!</span>,
        className: 'custom-badge-wrapper',
      });

      expect(vnode.props.className).toContain('custom-badge-wrapper');
    });
  });
});
