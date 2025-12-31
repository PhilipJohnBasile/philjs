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
import type { YDoc } from './crdt.js';
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
    position?: {
        x: number;
        y: number;
    };
    /** For range anchor */
    range?: {
        start: number;
        end: number;
    };
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
export declare class CommentsManager {
    private config;
    private threads;
    private handlers;
    private yThreads?;
    private doc?;
    constructor(config: CommentsConfig);
    /**
     * Initialize with CRDT document for sync
     */
    initWithDoc(doc: YDoc): void;
    /**
     * Create a new comment thread
     */
    createThread(anchor: ThreadAnchor, content: string): CommentThread;
    /**
     * Add comment to existing thread
     */
    addComment(threadId: string, content: string, parentId?: string): Comment | null;
    /**
     * Update comment content
     */
    updateComment(threadId: string, commentId: string, content: string): Comment | null;
    /**
     * Delete a comment
     */
    deleteComment(threadId: string, commentId: string): boolean;
    /**
     * Delete entire thread
     */
    deleteThread(threadId: string): boolean;
    /**
     * Resolve a thread
     */
    resolveThread(threadId: string): boolean;
    /**
     * Unresolve a thread
     */
    unresolveThread(threadId: string): boolean;
    /**
     * Add reaction to comment
     */
    addReaction(threadId: string, commentId: string, emoji: string): boolean;
    /**
     * Remove reaction from comment
     */
    removeReaction(threadId: string, commentId: string, emoji: string): boolean;
    /**
     * Get all threads
     */
    getAllThreads(): CommentThread[];
    /**
     * Get threads by resolved status
     */
    getThreadsByStatus(resolved: boolean): CommentThread[];
    /**
     * Get threads at anchor
     */
    getThreadsAtAnchor(anchor: Partial<ThreadAnchor>): CommentThread[];
    /**
     * Get thread by ID
     */
    getThread(threadId: string): CommentThread | undefined;
    /**
     * Subscribe to events
     */
    on<K extends keyof CommentEventHandlers>(event: K, handler: CommentEventHandlers[K]): () => void;
    /**
     * Get comments mentioning user
     */
    getMentions(userId: string): Comment[];
    /**
     * Search comments
     */
    searchComments(query: string): Array<{
        thread: CommentThread;
        comment: Comment;
    }>;
    private generateId;
    private extractMentions;
    private notifyMentions;
    private getCommentDepth;
    private collectReplies;
    private syncThread;
    private serializeThread;
    private loadFromYDoc;
    private deserializeThread;
    private handleYMapChange;
}
/**
 * Create comments manager
 */
export declare function createCommentsManager(config: CommentsConfig): CommentsManager;
/**
 * Common reaction emojis
 */
export declare const COMMENT_REACTIONS: string[];
//# sourceMappingURL=comments.d.ts.map