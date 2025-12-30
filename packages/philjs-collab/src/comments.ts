/**
 * Collaborative Comments System
 *
 * Real-time threaded comments for collaborative editing:
 * - Threaded discussions
 * - Inline annotations
 * - @mentions
 * - Reactions
 * - Resolution tracking
 */

import type { YDoc, YMap, YArray } from './crdt.js';

export interface Comment {
  id: string;
  threadId: string;
  author: CommentAuthor;
  content: string;
  createdAt: number;
  updatedAt?: number;
  parentId?: string;
  mentions?: string[];
  reactions?: CommentReaction[];
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface CommentThread {
  id: string;
  anchor: ThreadAnchor;
  comments: Comment[];
  createdAt: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: CommentAuthor;
}

export interface ThreadAnchor {
  type: 'position' | 'range' | 'element' | 'line';
  /** For position anchor */
  position?: { x: number; y: number };
  /** For range anchor */
  range?: { start: number; end: number };
  /** For element anchor */
  elementId?: string;
  /** For line anchor */
  lineNumber?: number;
  /** Additional context */
  context?: string;
}

export interface CommentReaction {
  emoji: string;
  userId: string;
  timestamp: number;
}

export interface CommentsConfig {
  /** Local user info */
  user: CommentAuthor;
  /** Maximum thread depth */
  maxDepth?: number;
  /** Enable reactions */
  reactions?: boolean;
  /** Enable @mentions */
  mentions?: boolean;
  /** Callback when user is mentioned */
  onMention?: (userId: string, comment: Comment) => void;
  /** Callback when thread is resolved */
  onResolve?: (thread: CommentThread) => void;
}

export interface CommentEventHandlers {
  onCommentAdded?: (comment: Comment, thread: CommentThread) => void;
  onCommentUpdated?: (comment: Comment, thread: CommentThread) => void;
  onCommentDeleted?: (commentId: string, thread: CommentThread) => void;
  onThreadCreated?: (thread: CommentThread) => void;
  onThreadResolved?: (thread: CommentThread) => void;
  onThreadDeleted?: (threadId: string) => void;
  onReactionAdded?: (comment: Comment, reaction: CommentReaction) => void;
}

/**
 * Collaborative Comments Manager
 */
export class CommentsManager {
  private config: Required<CommentsConfig>;
  private threads: Map<string, CommentThread> = new Map();
  private handlers: CommentEventHandlers = {};
  private yThreads?: YMap<any>;
  private doc?: YDoc;

  constructor(config: CommentsConfig) {
    this.config = {
      maxDepth: config.maxDepth ?? 5,
      reactions: config.reactions ?? true,
      mentions: config.mentions ?? true,
      onMention: config.onMention ?? (() => {}),
      onResolve: config.onResolve ?? (() => {}),
      user: config.user,
    };
  }

  /**
   * Initialize with CRDT document for sync
   */
  initWithDoc(doc: YDoc): void {
    this.doc = doc;
    this.yThreads = doc.getMap('comments') as any;

    // Load existing threads
    this.loadFromYDoc();

    // Subscribe to changes
    if (this.yThreads) {
      (this.yThreads as any).observe?.((event: any) => {
        this.handleYMapChange(event);
      });
    }
  }

  /**
   * Create a new comment thread
   */
  createThread(anchor: ThreadAnchor, content: string): CommentThread {
    const threadId = this.generateId();
    const commentId = this.generateId();
    const now = Date.now();

    const comment: Comment = {
      id: commentId,
      threadId,
      author: this.config.user,
      content,
      createdAt: now,
      mentions: this.extractMentions(content),
      reactions: [],
    };

    const thread: CommentThread = {
      id: threadId,
      anchor,
      comments: [comment],
      createdAt: now,
      resolved: false,
    };

    this.threads.set(threadId, thread);
    this.syncThread(thread);

    // Notify mentions
    this.notifyMentions(comment);

    // Emit events
    this.handlers.onThreadCreated?.(thread);
    this.handlers.onCommentAdded?.(comment, thread);

    return thread;
  }

  /**
   * Add comment to existing thread
   */
  addComment(threadId: string, content: string, parentId?: string): Comment | null {
    const thread = this.threads.get(threadId);
    if (!thread) return null;

    // Check depth limit
    if (parentId) {
      const depth = this.getCommentDepth(thread, parentId);
      if (depth >= this.config.maxDepth) {
        console.warn('Maximum thread depth reached');
        return null;
      }
    }

    const comment: Comment = {
      id: this.generateId(),
      threadId,
      author: this.config.user,
      content,
      createdAt: Date.now(),
      mentions: this.extractMentions(content),
      reactions: [],
    };
    if (parentId !== undefined) {
      comment.parentId = parentId;
    }

    thread.comments.push(comment);
    this.syncThread(thread);

    // Notify mentions
    this.notifyMentions(comment);

    this.handlers.onCommentAdded?.(comment, thread);
    return comment;
  }

  /**
   * Update comment content
   */
  updateComment(threadId: string, commentId: string, content: string): Comment | null {
    const thread = this.threads.get(threadId);
    if (!thread) return null;

    const comment = thread.comments.find(c => c.id === commentId);
    if (!comment) return null;

    // Only author can edit
    if (comment.author.id !== this.config.user.id) {
      console.warn('Only the author can edit a comment');
      return null;
    }

    comment.content = content;
    comment.updatedAt = Date.now();
    comment.mentions = this.extractMentions(content);

    this.syncThread(thread);
    this.handlers.onCommentUpdated?.(comment, thread);

    return comment;
  }

  /**
   * Delete a comment
   */
  deleteComment(threadId: string, commentId: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    const commentIndex = thread.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return false;

    const comment = thread.comments[commentIndex]!;

    // Only author can delete
    if (comment.author.id !== this.config.user.id) {
      console.warn('Only the author can delete a comment');
      return false;
    }

    // Remove comment and its replies
    const idsToRemove = new Set([commentId]);
    this.collectReplies(thread, commentId, idsToRemove);

    thread.comments = thread.comments.filter(c => !idsToRemove.has(c.id));

    // If no comments left, delete thread
    if (thread.comments.length === 0) {
      this.deleteThread(threadId);
      return true;
    }

    this.syncThread(thread);
    this.handlers.onCommentDeleted?.(commentId, thread);

    return true;
  }

  /**
   * Delete entire thread
   */
  deleteThread(threadId: string): boolean {
    if (!this.threads.has(threadId)) return false;

    this.threads.delete(threadId);

    if (this.yThreads) {
      this.yThreads.delete(threadId);
    }

    this.handlers.onThreadDeleted?.(threadId);
    return true;
  }

  /**
   * Resolve a thread
   */
  resolveThread(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.resolved = true;
    thread.resolvedAt = Date.now();
    thread.resolvedBy = this.config.user;

    this.syncThread(thread);
    this.config.onResolve(thread);
    this.handlers.onThreadResolved?.(thread);

    return true;
  }

  /**
   * Unresolve a thread
   */
  unresolveThread(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.resolved = false;
    delete thread.resolvedAt;
    delete thread.resolvedBy;

    this.syncThread(thread);
    return true;
  }

  /**
   * Add reaction to comment
   */
  addReaction(threadId: string, commentId: string, emoji: string): boolean {
    if (!this.config.reactions) return false;

    const thread = this.threads.get(threadId);
    if (!thread) return false;

    const comment = thread.comments.find(c => c.id === commentId);
    if (!comment) return false;

    // Check if user already reacted with this emoji
    const existing = comment.reactions?.find(
      r => r.userId === this.config.user.id && r.emoji === emoji
    );
    if (existing) return false;

    const reaction: CommentReaction = {
      emoji,
      userId: this.config.user.id,
      timestamp: Date.now(),
    };

    comment.reactions = comment.reactions || [];
    comment.reactions.push(reaction);

    this.syncThread(thread);
    this.handlers.onReactionAdded?.(comment, reaction);

    return true;
  }

  /**
   * Remove reaction from comment
   */
  removeReaction(threadId: string, commentId: string, emoji: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    const comment = thread.comments.find(c => c.id === commentId);
    if (!comment || !comment.reactions) return false;

    const index = comment.reactions.findIndex(
      r => r.userId === this.config.user.id && r.emoji === emoji
    );
    if (index === -1) return false;

    comment.reactions.splice(index, 1);
    this.syncThread(thread);

    return true;
  }

  /**
   * Get all threads
   */
  getAllThreads(): CommentThread[] {
    return Array.from(this.threads.values());
  }

  /**
   * Get threads by resolved status
   */
  getThreadsByStatus(resolved: boolean): CommentThread[] {
    return Array.from(this.threads.values()).filter(t => t.resolved === resolved);
  }

  /**
   * Get threads at anchor
   */
  getThreadsAtAnchor(anchor: Partial<ThreadAnchor>): CommentThread[] {
    return Array.from(this.threads.values()).filter(thread => {
      if (anchor.type && thread.anchor.type !== anchor.type) return false;
      if (anchor.elementId && thread.anchor.elementId !== anchor.elementId) return false;
      if (anchor.lineNumber !== undefined && thread.anchor.lineNumber !== anchor.lineNumber) return false;
      return true;
    });
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string): CommentThread | undefined {
    return this.threads.get(threadId);
  }

  /**
   * Subscribe to events
   */
  on<K extends keyof CommentEventHandlers>(
    event: K,
    handler: CommentEventHandlers[K]
  ): () => void {
    this.handlers[event] = handler as any;
    return () => {
      delete this.handlers[event];
    };
  }

  /**
   * Get comments mentioning user
   */
  getMentions(userId: string): Comment[] {
    const mentions: Comment[] = [];
    for (const thread of this.threads.values()) {
      for (const comment of thread.comments) {
        if (comment.mentions?.includes(userId)) {
          mentions.push(comment);
        }
      }
    }
    return mentions;
  }

  /**
   * Search comments
   */
  searchComments(query: string): Array<{ thread: CommentThread; comment: Comment }> {
    const results: Array<{ thread: CommentThread; comment: Comment }> = [];
    const lowerQuery = query.toLowerCase();

    for (const thread of this.threads.values()) {
      for (const comment of thread.comments) {
        if (comment.content.toLowerCase().includes(lowerQuery)) {
          results.push({ thread, comment });
        }
      }
    }

    return results;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private generateId(): string {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private extractMentions(content: string): string[] {
    if (!this.config.mentions) return [];

    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]!);
    }

    return mentions;
  }

  private notifyMentions(comment: Comment): void {
    if (!comment.mentions?.length) return;

    for (const userId of comment.mentions) {
      this.config.onMention(userId, comment);
    }
  }

  private getCommentDepth(thread: CommentThread, commentId: string): number {
    let depth = 0;
    let current = thread.comments.find(c => c.id === commentId);

    while (current?.parentId) {
      depth++;
      current = thread.comments.find(c => c.id === current!.parentId);
    }

    return depth;
  }

  private collectReplies(thread: CommentThread, parentId: string, ids: Set<string>): void {
    for (const comment of thread.comments) {
      if (comment.parentId === parentId) {
        ids.add(comment.id);
        this.collectReplies(thread, comment.id, ids);
      }
    }
  }

  private syncThread(thread: CommentThread): void {
    if (this.yThreads) {
      this.yThreads.set(thread.id, this.serializeThread(thread));
    }
  }

  private serializeThread(thread: CommentThread): any {
    return {
      ...thread,
      comments: thread.comments.map(c => ({
        ...c,
        author: { ...c.author },
        reactions: c.reactions ? [...c.reactions] : [],
      })),
    };
  }

  private loadFromYDoc(): void {
    if (!this.yThreads) return;

    (this.yThreads as any).forEach((value: any, key: string) => {
      const thread = this.deserializeThread(value);
      if (thread) {
        this.threads.set(key, thread);
      }
    });
  }

  private deserializeThread(data: any): CommentThread | null {
    if (!data || !data.id) return null;

    return {
      id: data.id,
      anchor: data.anchor,
      comments: data.comments || [],
      createdAt: data.createdAt,
      resolved: data.resolved || false,
      resolvedAt: data.resolvedAt,
      resolvedBy: data.resolvedBy,
    };
  }

  private handleYMapChange(event: any): void {
    // Handle remote changes
    for (const [key, change] of event.changes.keys) {
      if (change.action === 'add' || change.action === 'update') {
        const value = this.yThreads?.get(key);
        if (value) {
          const thread = this.deserializeThread(value);
          if (thread) {
            this.threads.set(key, thread);
            this.handlers.onThreadCreated?.(thread);
          }
        }
      } else if (change.action === 'delete') {
        this.threads.delete(key);
        this.handlers.onThreadDeleted?.(key);
      }
    }
  }
}

/**
 * Create comments manager
 */
export function createCommentsManager(config: CommentsConfig): CommentsManager {
  return new CommentsManager(config);
}

/**
 * Common reaction emojis
 */
export const COMMENT_REACTIONS = ['👍', '👎', '😀', '🎉', '😕', '❤️', '🚀', '👀'];
