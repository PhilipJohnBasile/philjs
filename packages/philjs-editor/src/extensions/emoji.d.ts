/**
 * Emoji Extension
 *
 * Emoji picker and shortcode support (:smile:, :heart:, etc.)
 */
/**
 * Common emoji data
 */
export declare const commonEmojis: Record<string, string>;
/**
 * Emoji categories for picker
 */
export declare const emojiCategories: {
    smileys: string[];
    gestures: string[];
    hearts: string[];
    symbols: string[];
    objects: string[];
};
export interface EmojiOptions {
    /**
     * Custom emoji map (shortcode -> emoji)
     */
    emojis?: Record<string, string>;
    /**
     * Enable shortcode replacement (:smile: -> 😊)
     */
    enableShortcodes?: boolean;
    /**
     * Suggestion trigger character
     */
    trigger?: string;
}
/**
 * Emoji Extension
 */
export declare const Emoji: any;
/**
 * Get emoji by shortcode
 */
export declare function getEmoji(shortcode: string, customEmojis?: Record<string, string>): string | null;
/**
 * Search emojis by shortcode
 */
export declare function searchEmojis(query: string, customEmojis?: Record<string, string>, limit?: number): Array<{
    shortcode: string;
    emoji: string;
}>;
/**
 * Insert emoji at cursor
 */
export declare function insertEmoji(editor: any, emoji: string): void;
/**
 * Replace all shortcodes in text with emojis
 */
export declare function replaceShortcodes(text: string, customEmojis?: Record<string, string>): string;
/**
 * Convert emojis to shortcodes
 */
export declare function emojiToShortcode(text: string, customEmojis?: Record<string, string>): string;
/**
 * Default emoji picker styles
 */
export declare const emojiPickerStyles = "\n.philjs-emoji-picker {\n  background: white;\n  border: 1px solid #e2e8f0;\n  border-radius: 0.5rem;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n  max-height: 300px;\n  overflow-y: auto;\n  padding: 0.5rem;\n  width: 300px;\n}\n\n.philjs-emoji-category {\n  margin-bottom: 0.5rem;\n}\n\n.philjs-emoji-category-title {\n  color: #64748b;\n  font-size: 0.75rem;\n  font-weight: 600;\n  margin-bottom: 0.25rem;\n  text-transform: uppercase;\n}\n\n.philjs-emoji-grid {\n  display: grid;\n  gap: 0.25rem;\n  grid-template-columns: repeat(8, 1fr);\n}\n\n.philjs-emoji-button {\n  background: transparent;\n  border: none;\n  border-radius: 0.25rem;\n  cursor: pointer;\n  font-size: 1.25rem;\n  padding: 0.25rem;\n  transition: background-color 0.15s;\n}\n\n.philjs-emoji-button:hover {\n  background: #f1f5f9;\n}\n\n.philjs-emoji-search {\n  border: 1px solid #e2e8f0;\n  border-radius: 0.25rem;\n  margin-bottom: 0.5rem;\n  padding: 0.5rem;\n  width: 100%;\n}\n";
export default Emoji;
//# sourceMappingURL=emoji.d.ts.map