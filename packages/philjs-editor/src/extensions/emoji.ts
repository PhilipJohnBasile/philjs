/**
 * Emoji Extension
 *
 * Emoji picker and shortcode support (:smile:, :heart:, etc.)
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Common emoji data
 */
export const commonEmojis: Record<string, string> = {
  // Smileys
  smile: '😊',
  grin: '😁',
  laugh: '😂',
  rofl: '🤣',
  joy: '😂',
  wink: '😉',
  blush: '😊',
  heart_eyes: '😍',
  kissing: '😗',
  thinking: '🤔',
  neutral: '😐',
  expressionless: '😑',
  unamused: '😒',
  sweat: '😓',
  pensive: '😔',
  confused: '😕',
  upside_down: '🙃',
  money_mouth: '🤑',
  astonished: '😲',
  flushed: '😳',
  disappointed: '😞',
  worried: '😟',
  angry: '😠',
  rage: '😡',
  cry: '😢',
  sob: '😭',
  scream: '😱',
  tired: '😫',
  sleepy: '😪',
  sleeping: '😴',
  drool: '🤤',
  sunglasses: '😎',
  nerd: '🤓',
  // Gestures
  thumbsup: '👍',
  thumbsdown: '👎',
  clap: '👏',
  wave: '👋',
  raised_hands: '🙌',
  pray: '🙏',
  muscle: '💪',
  point_up: '☝️',
  point_down: '👇',
  point_left: '👈',
  point_right: '👉',
  ok_hand: '👌',
  v: '✌️',
  crossed_fingers: '🤞',
  fist: '✊',
  punch: '👊',
  // Hearts
  heart: '❤️',
  orange_heart: '🧡',
  yellow_heart: '💛',
  green_heart: '💚',
  blue_heart: '💙',
  purple_heart: '💜',
  black_heart: '🖤',
  white_heart: '🤍',
  broken_heart: '💔',
  sparkling_heart: '💖',
  heartbeat: '💓',
  heartpulse: '💗',
  two_hearts: '💕',
  // Objects
  fire: '🔥',
  star: '⭐',
  sparkles: '✨',
  zap: '⚡',
  sun: '☀️',
  moon: '🌙',
  cloud: '☁️',
  rain: '🌧️',
  rainbow: '🌈',
  umbrella: '☂️',
  // Symbols
  check: '✅',
  x: '❌',
  warning: '⚠️',
  question: '❓',
  exclamation: '❗',
  plus: '➕',
  minus: '➖',
  hundred: '💯',
  // Celebrations
  tada: '🎉',
  confetti: '🎊',
  balloon: '🎈',
  gift: '🎁',
  trophy: '🏆',
  medal: '🏅',
  crown: '👑',
  // Food
  pizza: '🍕',
  hamburger: '🍔',
  coffee: '☕',
  beer: '🍺',
  wine: '🍷',
  cake: '🎂',
  cookie: '🍪',
  ice_cream: '🍦',
  // Animals
  dog: '🐕',
  cat: '🐈',
  unicorn: '🦄',
  butterfly: '🦋',
  // Tech
  rocket: '🚀',
  robot: '🤖',
  computer: '💻',
  phone: '📱',
  bulb: '💡',
  gear: '⚙️',
  wrench: '🔧',
  bug: '🐛',
};

/**
 * Emoji categories for picker
 */
export const emojiCategories = {
  smileys: ['smile', 'grin', 'laugh', 'wink', 'blush', 'heart_eyes', 'thinking', 'sunglasses', 'cry', 'angry'],
  gestures: ['thumbsup', 'thumbsdown', 'clap', 'wave', 'pray', 'muscle', 'ok_hand', 'v', 'fist'],
  hearts: ['heart', 'orange_heart', 'yellow_heart', 'green_heart', 'blue_heart', 'purple_heart', 'broken_heart', 'sparkling_heart'],
  symbols: ['fire', 'star', 'sparkles', 'zap', 'check', 'x', 'warning', 'hundred', 'tada'],
  objects: ['rocket', 'robot', 'computer', 'bulb', 'gear', 'bug', 'coffee', 'pizza', 'gift'],
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

const emojiPluginKey = new PluginKey('emoji');

/**
 * Create emoji replacement plugin
 */
function createEmojiPlugin(emojis: Record<string, string>) {
  const emojiRegex = /:([a-z_]+):/g;

  return new Plugin({
    key: emojiPluginKey,
    props: {
      handleTextInput(view, from, to, text) {
        // Check if we just typed a closing colon
        if (text !== ':') {
          return false;
        }

        const { state } = view;
        const $from = state.doc.resolve(from);
        const textBefore = $from.parent.textBetween(
          Math.max(0, $from.parentOffset - 20),
          $from.parentOffset,
          undefined,
          '\ufffc'
        );

        // Look for :shortcode pattern
        const match = textBefore.match(/:([a-z_]+)$/);
        if (!match) {
          return false;
        }

        const shortcode = match[1];
        const emoji = emojis[shortcode];

        if (!emoji) {
          return false;
        }

        // Replace :shortcode: with emoji
        const start = from - match[0].length;
        const tr = state.tr.replaceWith(start, from + 1, state.schema.text(emoji));
        view.dispatch(tr);

        return true;
      },
    },
  });
}

/**
 * Emoji Extension
 */
export const Emoji = Extension.create<EmojiOptions>({
  name: 'emoji',

  addOptions() {
    return {
      emojis: commonEmojis,
      enableShortcodes: true,
      trigger: ':',
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enableShortcodes) {
      return [];
    }

    return [createEmojiPlugin(this.options.emojis || commonEmojis)];
  },
});

/**
 * Get emoji by shortcode
 */
export function getEmoji(shortcode: string, customEmojis?: Record<string, string>): string | null {
  const emojis = { ...commonEmojis, ...customEmojis };
  return emojis[shortcode] || null;
}

/**
 * Search emojis by shortcode
 */
export function searchEmojis(
  query: string,
  customEmojis?: Record<string, string>,
  limit = 20
): Array<{ shortcode: string; emoji: string }> {
  const emojis = { ...commonEmojis, ...customEmojis };
  const results: Array<{ shortcode: string; emoji: string }> = [];

  for (const [shortcode, emoji] of Object.entries(emojis)) {
    if (shortcode.includes(query.toLowerCase())) {
      results.push({ shortcode, emoji });
      if (results.length >= limit) {
        break;
      }
    }
  }

  return results;
}

/**
 * Insert emoji at cursor
 */
export function insertEmoji(editor: any, emoji: string) {
  editor.chain().focus().insertContent(emoji).run();
}

/**
 * Replace all shortcodes in text with emojis
 */
export function replaceShortcodes(
  text: string,
  customEmojis?: Record<string, string>
): string {
  const emojis = { ...commonEmojis, ...customEmojis };

  return text.replace(/:([a-z_]+):/g, (match, shortcode) => {
    return emojis[shortcode] || match;
  });
}

/**
 * Convert emojis to shortcodes
 */
export function emojiToShortcode(
  text: string,
  customEmojis?: Record<string, string>
): string {
  const emojis = { ...commonEmojis, ...customEmojis };
  const reverseMap = new Map<string, string>();

  for (const [shortcode, emoji] of Object.entries(emojis)) {
    reverseMap.set(emoji, shortcode);
  }

  let result = text;
  for (const [emoji, shortcode] of reverseMap) {
    result = result.split(emoji).join(`:${shortcode}:`);
  }

  return result;
}

/**
 * Default emoji picker styles
 */
export const emojiPickerStyles = `
.philjs-emoji-picker {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  width: 300px;
}

.philjs-emoji-category {
  margin-bottom: 0.5rem;
}

.philjs-emoji-category-title {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.philjs-emoji-grid {
  display: grid;
  gap: 0.25rem;
  grid-template-columns: repeat(8, 1fr);
}

.philjs-emoji-button {
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  transition: background-color 0.15s;
}

.philjs-emoji-button:hover {
  background: #f1f5f9;
}

.philjs-emoji-search {
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  width: 100%;
}
`;

export default Emoji;
