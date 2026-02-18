/**
 * @philjs/tui - Terminal User Interface
 *
 * TypeScript bindings for building terminal UIs with Rust.
 * Provides reactive components, layouts, and styling for CLI applications.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Terminal size
 */
export interface TerminalSize {
  width: number;
  height: number;
}

/**
 * Position in terminal
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Rectangular area
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Color type
 */
export type Color =
  | 'reset'
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'brightBlack'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightMagenta'
  | 'brightCyan'
  | 'brightWhite'
  | { rgb: [number, number, number] }
  | { indexed: number };

/**
 * Text modifier
 */
export type Modifier =
  | 'bold'
  | 'dim'
  | 'italic'
  | 'underlined'
  | 'slowBlink'
  | 'rapidBlink'
  | 'reversed'
  | 'hidden'
  | 'crossedOut';

// ============================================================================
// Style Types
// ============================================================================

/**
 * Style configuration
 */
export interface Style {
  fg?: Color;
  bg?: Color;
  modifiers?: Modifier[];
}

/**
 * Border style
 */
export type BorderType =
  | 'plain'
  | 'rounded'
  | 'double'
  | 'thick'
  | 'quadrantInside'
  | 'quadrantOutside';

/**
 * Border configuration
 */
export interface Borders {
  type?: BorderType;
  style?: Style;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

/**
 * Alignment
 */
export type Alignment = 'left' | 'center' | 'right';

/**
 * Vertical alignment
 */
export type VerticalAlignment = 'top' | 'center' | 'bottom';

// ============================================================================
// Layout Types
// ============================================================================

/**
 * Layout direction
 */
export type Direction = 'horizontal' | 'vertical';

/**
 * Constraint for layout
 */
export type Constraint =
  | { percentage: number }
  | { ratio: [number, number] }
  | { length: number }
  | { max: number }
  | { min: number };

/**
 * Layout configuration
 */
export interface Layout {
  direction: Direction;
  margin?: number;
  horizontalMargin?: number;
  verticalMargin?: number;
  constraints: Constraint[];
}

/**
 * Split area into chunks
 */
export function split(area: Rect, layout: Layout): Rect[] {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Widget Types
// ============================================================================

/**
 * Base widget interface
 */
export interface Widget {
  /** Render the widget */
  render(area: Rect, buf: Buffer): void;
}

/**
 * Text span
 */
export interface Span {
  content: string;
  style?: Style;
}

/**
 * Text line (multiple spans)
 */
export interface Line {
  spans: Span[];
  alignment?: Alignment;
}

/**
 * Text widget (multiple lines)
 */
export interface Text {
  lines: Line[];
}

/**
 * Paragraph widget
 */
export interface Paragraph extends Widget {
  text: Text;
  style?: Style;
  block?: Block;
  alignment?: Alignment;
  wrap?: { trim: boolean };
  scroll?: [number, number];
}

/**
 * Block widget (container with borders/title)
 */
export interface Block extends Widget {
  title?: string | Line;
  titleAlignment?: Alignment;
  titlePosition?: 'top' | 'bottom';
  borders?: Borders;
  borderStyle?: Style;
  style?: Style;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

/**
 * List item
 */
export interface ListItem {
  content: Text | Line | string;
  style?: Style;
}

/**
 * List widget
 */
export interface List extends Widget {
  items: ListItem[];
  block?: Block;
  style?: Style;
  highlightStyle?: Style;
  highlightSymbol?: string;
  repeatHighlightSymbol?: boolean;
  direction?: Direction;
}

/**
 * List state
 */
export interface ListState {
  offset: number;
  selected?: number;
}

/**
 * Table header
 */
export interface TableHeader {
  cells: (string | Cell)[];
  style?: Style;
  height?: number;
}

/**
 * Table row
 */
export interface TableRow {
  cells: (string | Cell)[];
  style?: Style;
  height?: number;
}

/**
 * Table cell
 */
export interface Cell {
  content: Text | string;
  style?: Style;
}

/**
 * Table widget
 */
export interface Table extends Widget {
  rows: TableRow[];
  header?: TableHeader;
  block?: Block;
  widths: Constraint[];
  columnSpacing?: number;
  style?: Style;
  highlightStyle?: Style;
  highlightSymbol?: string;
}

/**
 * Table state
 */
export interface TableState {
  offset: number;
  selected?: number;
}

/**
 * Gauge widget
 */
export interface Gauge extends Widget {
  block?: Block;
  ratio: number;
  label?: string | Span;
  style?: Style;
  gaugeStyle?: Style;
}

/**
 * Sparkline widget
 */
export interface Sparkline extends Widget {
  block?: Block;
  data: number[];
  max?: number;
  style?: Style;
  barSet?: BarSet;
}

/**
 * Bar set for sparklines/bar charts
 */
export type BarSet = 'full' | 'half' | 'threeQuarters' | 'sevenEighths';

/**
 * Bar chart bar
 */
export interface Bar {
  value: number;
  label?: string;
  style?: Style;
  valueStyle?: Style;
  textValue?: string;
}

/**
 * Bar chart group
 */
export interface BarGroup {
  bars: Bar[];
  label?: string | Line;
}

/**
 * Bar chart widget
 */
export interface BarChart extends Widget {
  block?: Block;
  data: BarGroup[];
  barWidth?: number;
  barGap?: number;
  groupGap?: number;
  style?: Style;
  valueStyle?: Style;
  labelStyle?: Style;
  direction?: Direction;
}

/**
 * Tabs widget
 */
export interface Tabs extends Widget {
  titles: (string | Line)[];
  block?: Block;
  style?: Style;
  highlightStyle?: Style;
  selected: number;
  divider?: string | Span;
}

/**
 * Canvas widget (for drawing)
 */
export interface Canvas extends Widget {
  block?: Block;
  xBounds: [number, number];
  yBounds: [number, number];
  painter: (ctx: CanvasContext) => void;
  marker?: Marker;
}

/**
 * Canvas context
 */
export interface CanvasContext {
  /** Draw a line */
  line(x1: number, y1: number, x2: number, y2: number, color: Color): void;
  /** Draw a rectangle */
  rectangle(x: number, y: number, width: number, height: number, color: Color): void;
  /** Draw a circle */
  circle(x: number, y: number, radius: number, color: Color): void;
  /** Print text */
  print(x: number, y: number, text: string, style?: Style): void;
  /** Draw points */
  points(coords: [number, number][], color: Color): void;
}

/**
 * Canvas marker type
 */
export type Marker = 'dot' | 'block' | 'bar' | 'braille' | 'halfBlock';

// ============================================================================
// Input Types
// ============================================================================

/**
 * Key code
 */
export type KeyCode =
  | 'backspace'
  | 'enter'
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'home'
  | 'end'
  | 'pageUp'
  | 'pageDown'
  | 'tab'
  | 'backTab'
  | 'delete'
  | 'insert'
  | 'escape'
  | { char: string }
  | { f: number };

/**
 * Key modifiers
 */
export interface KeyModifiers {
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  super?: boolean;
}

/**
 * Key event
 */
export interface KeyEvent {
  code: KeyCode;
  modifiers: KeyModifiers;
}

/**
 * Mouse button
 */
export type MouseButton = 'left' | 'right' | 'middle';

/**
 * Mouse event kind
 */
export type MouseEventKind =
  | { down: MouseButton }
  | { up: MouseButton }
  | 'drag'
  | 'moved'
  | { scrollUp: number }
  | { scrollDown: number };

/**
 * Mouse event
 */
export interface MouseEvent {
  kind: MouseEventKind;
  column: number;
  row: number;
  modifiers: KeyModifiers;
}

/**
 * Terminal event
 */
export type Event =
  | { type: 'key'; event: KeyEvent }
  | { type: 'mouse'; event: MouseEvent }
  | { type: 'resize'; width: number; height: number }
  | { type: 'focusGained' }
  | { type: 'focusLost' }
  | { type: 'paste'; content: string };

// ============================================================================
// Buffer Types
// ============================================================================

/**
 * Buffer cell
 */
export interface BufferCell {
  symbol: string;
  fg: Color;
  bg: Color;
  modifiers: Modifier[];
}

/**
 * Terminal buffer
 */
export interface Buffer {
  /** Get cell at position */
  get(x: number, y: number): BufferCell;
  /** Set cell at position */
  set(x: number, y: number, cell: Partial<BufferCell>): void;
  /** Set string at position */
  setString(x: number, y: number, text: string, style?: Style): void;
  /** Set span at position */
  setSpan(x: number, y: number, span: Span, width: number): void;
  /** Fill area with style */
  setStyle(area: Rect, style: Style): void;
  /** Get area */
  area(): Rect;
}

// ============================================================================
// Application Types
// ============================================================================

/**
 * Terminal backend
 */
export interface Terminal {
  /** Draw frame */
  draw(fn: (frame: Frame) => void): void;
  /** Clear terminal */
  clear(): void;
  /** Get size */
  size(): TerminalSize;
  /** Hide cursor */
  hideCursor(): void;
  /** Show cursor */
  showCursor(): void;
  /** Set cursor position */
  setCursorPosition(pos: Position): void;
  /** Flush output */
  flush(): void;
}

/**
 * Frame for rendering
 */
export interface Frame {
  /** Get frame area */
  area(): Rect;
  /** Render widget */
  render<W extends Widget>(widget: W, area: Rect): void;
  /** Render stateful widget */
  renderStateful<W extends Widget, S>(widget: W, area: Rect, state: S): void;
  /** Set cursor position */
  setCursor(x: number, y: number): void;
}

/**
 * App state
 */
export interface AppState {
  running: boolean;
}

/**
 * App configuration
 */
export interface AppConfig {
  /** Tick rate in milliseconds */
  tickRate?: number;
  /** Enable mouse support */
  mouse?: boolean;
  /** Enable paste support */
  paste?: boolean;
  /** Raw mode */
  rawMode?: boolean;
  /** Alternate screen */
  alternateScreen?: boolean;
}

/**
 * App callbacks
 */
export interface AppCallbacks<S> {
  /** Initialize state */
  init: () => S;
  /** Handle events */
  update: (state: S, event: Event) => S;
  /** Render UI */
  view: (state: S, frame: Frame) => void;
}

// ============================================================================
// App Functions
// ============================================================================

/**
 * Create terminal
 */
export function createTerminal(): Terminal {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Run the TUI application
 */
export function run<S>(config: AppConfig, callbacks: AppCallbacks<S>): void {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Read next event
 */
export function readEvent(timeout?: number): Promise<Event | undefined> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Poll for event
 */
export function pollEvent(timeout?: number): Promise<boolean> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Widget Builders
// ============================================================================

/**
 * Create a span
 */
export function span(content: string, style?: Style): Span {
  return { content, style };
}

/**
 * Create a line
 */
export function line(spans: (string | Span)[], alignment?: Alignment): Line {
  return {
    spans: spans.map((s) => (typeof s === 'string' ? { content: s } : s)),
    alignment,
  };
}

/**
 * Create text
 */
export function text(lines: (string | Line)[]): Text {
  return {
    lines: lines.map((l) =>
      typeof l === 'string' ? { spans: [{ content: l }] } : l
    ),
  };
}

/**
 * Create a paragraph
 */
export function paragraph(config: Omit<Paragraph, 'render'>): Paragraph {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create a block
 */
export function block(config: Omit<Block, 'render'>): Block {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create a list
 */
export function list(config: Omit<List, 'render'>): List {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create a table
 */
export function table(config: Omit<Table, 'render'>): Table {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create a gauge
 */
export function gauge(config: Omit<Gauge, 'render'>): Gauge {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create a sparkline
 */
export function sparkline(config: Omit<Sparkline, 'render'>): Sparkline {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create a bar chart
 */
export function barChart(config: Omit<BarChart, 'render'>): BarChart {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create tabs
 */
export function tabs(config: Omit<Tabs, 'render'>): Tabs {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

/**
 * Create a canvas
 */
export function canvas(config: Omit<Canvas, 'render'>): Canvas {
  return {
    ...config,
    render(_area: Rect, _buf: Buffer) {
      throw new Error('This is a type stub. Use the Rust runtime.');
    },
  };
}

// ============================================================================
// State Helpers
// ============================================================================

/**
 * Create list state
 */
export function listState(selected?: number): ListState {
  return { offset: 0, selected };
}

/**
 * Create table state
 */
export function tableState(selected?: number): TableState {
  return { offset: 0, selected };
}

/**
 * Select next in list
 */
export function selectNext(state: ListState, len: number): ListState {
  const selected = state.selected === undefined ? 0 : Math.min(state.selected + 1, len - 1);
  return { ...state, selected };
}

/**
 * Select previous in list
 */
export function selectPrev(state: ListState): ListState {
  const selected = state.selected === undefined ? 0 : Math.max(state.selected - 1, 0);
  return { ...state, selected };
}

// ============================================================================
// Style Helpers
// ============================================================================

/**
 * Create style
 */
export function style(config: Style): Style {
  return config;
}

/**
 * RGB color
 */
export function rgb(r: number, g: number, b: number): Color {
  return { rgb: [r, g, b] };
}

/**
 * Indexed color (0-255)
 */
export function indexed(index: number): Color {
  return { indexed: index };
}

// All types are exported at their declaration points above
