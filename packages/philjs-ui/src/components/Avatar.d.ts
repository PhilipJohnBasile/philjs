/**
 * PhilJS UI - Avatar Component
 */
import { JSX } from 'philjs-core';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: AvatarSize;
    rounded?: boolean;
    showBorder?: boolean;
    borderColor?: string;
    status?: 'online' | 'offline' | 'busy' | 'away';
    className?: string;
}
export declare function Avatar(props: AvatarProps): import("philjs-core").JSXElement;
/**
 * Avatar Group
 */
export interface AvatarGroupProps {
    children: JSX.Element[];
    max?: number;
    size?: AvatarSize;
    spacing?: number;
    className?: string;
}
export declare function AvatarGroup(props: AvatarGroupProps): import("philjs-core").JSXElement;
/**
 * Avatar Badge - Overlay badge on avatar
 */
export interface AvatarBadgeProps {
    children: JSX.Element;
    badge: JSX.Element;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    className?: string;
}
export declare function AvatarBadge(props: AvatarBadgeProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Avatar.d.ts.map