/**
 * PhilJS Editor Extensions
 *
 * TipTap extensions for rich text editing
 */

// Code block with syntax highlighting
export {
  CodeBlock,
  createCodeBlockExtension,
  getSupportedLanguages,
  registerLanguage,
  codeBlockShortcuts,
  lowlight,
} from './code-block';
export type { CodeBlockOptions } from './code-block';

// Image upload and embed
export {
  Image,
  ImageUpload,
  createImageExtension,
  insertImageByUrl,
  pickAndUploadImage,
} from './image';
export type { ImageUploadOptions, ImageExtensionOptions } from './image';

// Video embed (YouTube, Vimeo, custom)
export {
  Youtube,
  Vimeo,
  CustomVideo,
  createVideoExtensions,
  detectVideoPlatform,
  insertVideo,
} from './video';
export type { VideoOptions } from './video';

// Table support
export {
  Table,
  TableRow,
  TableCell,
  TableHeader,
  createTableExtensions,
  tableShortcuts,
  tableCommands,
  isInTable,
  getTableInfo,
} from './table';
export type { TableOptions } from './table';

// @mentions
export {
  Mention,
  MentionList,
  createMentionExtension,
  mentionStyles,
} from './mention.jsx';
export type { MentionItem, MentionOptions } from './mention.jsx';

// Emoji picker and shortcodes
export {
  Emoji,
  commonEmojis,
  emojiCategories,
  getEmoji,
  searchEmojis,
  insertEmoji,
  replaceShortcodes,
  emojiToShortcode,
  emojiPickerStyles,
} from './emoji';
export type { EmojiOptions } from './emoji';

// Smart links
export {
  Link,
  createLinkExtension,
  createLinkPreviewPlugin,
  isValidUrl,
  normalizeUrl,
  isExternalUrl,
  getDomain,
  linkCommands,
  getLinkAtSelection,
  linkShortcuts,
  linkStyles,
} from './link';
export type { LinkOptions, LinkPreviewData } from './link';

// Task/todo lists
export {
  TaskList,
  TaskItem,
  createTaskListExtensions,
  taskListCommands,
  taskListShortcuts,
  getTaskStats,
  getAllTasks,
  toggleTaskAtPosition,
  checkAllTasks,
  uncheckAllTasks,
  bulletListToTaskList,
  taskListToBulletList,
  taskListStyles,
} from './task-list';
export type { TaskListOptions } from './task-list';

// LaTeX math equations
export {
  InlineMath,
  BlockMath,
  createMathExtensions,
  renderLatex,
  validateLatex,
  mathSymbols,
  mathTemplates,
  mathShortcuts,
  mathStyles,
} from './math';
export type { MathOptions } from './math';
