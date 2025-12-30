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
} from './code-block.js';
export type { CodeBlockOptions } from './code-block.js';

// Image upload and embed
export {
  Image,
  ImageUpload,
  createImageExtension,
  insertImageByUrl,
  pickAndUploadImage,
} from './image.js';
export type { ImageUploadOptions, ImageExtensionOptions } from './image.js';

// Video embed (YouTube, Vimeo, custom)
export {
  Youtube,
  Vimeo,
  CustomVideo,
  createVideoExtensions,
  detectVideoPlatform,
  insertVideo,
} from './video.js';
export type { VideoOptions } from './video.js';

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
} from './table.js';
export type { TableOptions } from './table.js';

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
} from './emoji.js';
export type { EmojiOptions } from './emoji.js';

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
} from './link.js';
export type { LinkOptions, LinkPreviewData } from './link.js';

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
} from './task-list.js';
export type { TaskListOptions } from './task-list.js';

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
} from './math.js';
export type { MathOptions } from './math.js';
