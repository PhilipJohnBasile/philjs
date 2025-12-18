// Collaborative Editor Types

export interface User {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface Cursor {
  userId: string;
  position: number;
  selection?: { start: number; end: number };
}

export interface TextOperation {
  type: 'insert' | 'delete' | 'format';
  position: number;
  content?: string;
  length?: number;
  format?: TextFormat;
  timestamp: number;
  userId: string;
}

export interface TextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
}

export interface DocumentState {
  content: string;
  operations: TextOperation[];
  version: number;
}

export interface Presence {
  userId: string;
  cursor: Cursor;
  lastActivity: number;
}
