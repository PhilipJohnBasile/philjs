/**
 * Hollow Card Component
 * A flexible card container with header, body, and footer sections
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Card variants
 */
export type CardVariant = 'default' | 'outline' | 'elevated' | 'ghost';
/**
 * Card padding sizes
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
/**
 * Hollow Card Web Component
 *
 * @example
 * ```html
 * <hollow-card variant="elevated" padding="md">
 *   <div slot="header">Card Title</div>
 *   <p>Card content goes here</p>
 *   <div slot="footer">
 *     <hollow-button>Action</hollow-button>
 *   </div>
 * </hollow-card>
 * ```
 */
export declare class HollowCard extends HollowElement {
    static observedAttributes: string[];
    variant: CardVariant;
    padding: CardPadding;
    interactive: boolean;
    selected: boolean;
    protected template(): string;
    protected styles(): string;
    /**
     * Handle click on interactive card
     */
    private handleClick;
    /**
     * Handle keyboard navigation for interactive cards
     */
    protected onConnect(): void;
    private handleKeyDown;
}
export default HollowCard;
//# sourceMappingURL=card.d.ts.map