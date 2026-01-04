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
/**
 * Collaborative Comments Manager
 */
export class CommentsManager {
    config;
    threads = new Map();
    handlers = {};
    yThreads;
    doc;
    constructor(config) {
        this.config = {
            maxDepth: config.maxDepth ?? 5,
            reactions: config.reactions ?? true,
            mentions: config.mentions ?? true,
            onMention: config.onMention ?? (() => { }),
            onResolve: config.onResolve ?? (() => { }),
            user: config.user,
        };
    }
    /**
     * Initialize with CRDT document for sync
     */
    initWithDoc(doc) {
        this.doc = doc;
        this.yThreads = doc.getMap('comments');
        // Load existing threads
        this.loadFromYDoc();
        // Subscribe to changes
        if (this.yThreads) {
            this.yThreads.observe?.((event) => {
                this.handleYMapChange(event);
            });
        }
    }
    /**
     * Create a new comment thread
     */
    createThread(anchor, content) {
        const threadId = this.generateId();
        const commentId = this.generateId();
        const now = Date.now();
        const comment = {
            id: commentId,
            threadId,
            author: this.config.user,
            content,
            createdAt: now,
            mentions: this.extractMentions(content),
            reactions: [],
        };
        const thread = {
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
    addComment(threadId, content, parentId) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return null;
        // Check depth limit
        if (parentId) {
            const depth = this.getCommentDepth(thread, parentId);
            if (depth >= this.config.maxDepth) {
                console.warn('Maximum thread depth reached');
                return null;
            }
        }
        const comment = {
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
    updateComment(threadId, commentId, content) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return null;
        const comment = thread.comments.find(c => c.id === commentId);
        if (!comment)
            return null;
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
    deleteComment(threadId, commentId) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
        const commentIndex = thread.comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1)
            return false;
        const comment = thread.comments[commentIndex];
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
    deleteThread(threadId) {
        if (!this.threads.has(threadId))
            return false;
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
    resolveThread(threadId) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
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
    unresolveThread(threadId) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
        thread.resolved = false;
        delete thread.resolvedAt;
        delete thread.resolvedBy;
        this.syncThread(thread);
        return true;
    }
    /**
     * Add reaction to comment
     */
    addReaction(threadId, commentId, emoji) {
        if (!this.config.reactions)
            return false;
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
        const comment = thread.comments.find(c => c.id === commentId);
        if (!comment)
            return false;
        // Check if user already reacted with this emoji
        const existing = comment.reactions?.find(r => r.userId === this.config.user.id && r.emoji === emoji);
        if (existing)
            return false;
        const reaction = {
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
    removeReaction(threadId, commentId, emoji) {
        const thread = this.threads.get(threadId);
        if (!thread)
            return false;
        const comment = thread.comments.find(c => c.id === commentId);
        if (!comment || !comment.reactions)
            return false;
        const index = comment.reactions.findIndex(r => r.userId === this.config.user.id && r.emoji === emoji);
        if (index === -1)
            return false;
        comment.reactions.splice(index, 1);
        this.syncThread(thread);
        return true;
    }
    /**
     * Get all threads
     */
    getAllThreads() {
        return Array.from(this.threads.values());
    }
    /**
     * Get threads by resolved status
     */
    getThreadsByStatus(resolved) {
        return Array.from(this.threads.values()).filter(t => t.resolved === resolved);
    }
    /**
     * Get threads at anchor
     */
    getThreadsAtAnchor(anchor) {
        return Array.from(this.threads.values()).filter(thread => {
            if (anchor.type && thread.anchor.type !== anchor.type)
                return false;
            if (anchor.elementId && thread.anchor.elementId !== anchor.elementId)
                return false;
            if (anchor.lineNumber !== undefined && thread.anchor.lineNumber !== anchor.lineNumber)
                return false;
            return true;
        });
    }
    /**
     * Get thread by ID
     */
    getThread(threadId) {
        return this.threads.get(threadId);
    }
    /**
     * Subscribe to events
     */
    on(event, handler) {
        this.handlers[event] = handler;
        return () => {
            delete this.handlers[event];
        };
    }
    /**
     * Get comments mentioning user
     */
    getMentions(userId) {
        const mentions = [];
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
    searchComments(query) {
        const results = [];
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
    generateId() {
        return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
    }
    extractMentions(content) {
        if (!this.config.mentions)
            return [];
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }
        return mentions;
    }
    notifyMentions(comment) {
        if (!comment.mentions?.length)
            return;
        for (const userId of comment.mentions) {
            this.config.onMention(userId, comment);
        }
    }
    getCommentDepth(thread, commentId) {
        let depth = 0;
        let current = thread.comments.find(c => c.id === commentId);
        while (current?.parentId) {
            depth++;
            current = thread.comments.find(c => c.id === current.parentId);
        }
        return depth;
    }
    collectReplies(thread, parentId, ids) {
        for (const comment of thread.comments) {
            if (comment.parentId === parentId) {
                ids.add(comment.id);
                this.collectReplies(thread, comment.id, ids);
            }
        }
    }
    syncThread(thread) {
        if (this.yThreads) {
            this.yThreads.set(thread.id, this.serializeThread(thread));
        }
    }
    serializeThread(thread) {
        return {
            ...thread,
            comments: thread.comments.map(c => ({
                ...c,
                author: { ...c.author },
                reactions: c.reactions ? [...c.reactions] : [],
            })),
        };
    }
    loadFromYDoc() {
        if (!this.yThreads)
            return;
        this.yThreads.forEach((value, key) => {
            const thread = this.deserializeThread(value);
            if (thread) {
                this.threads.set(key, thread);
            }
        });
    }
    deserializeThread(data) {
        if (!data || !data.id)
            return null;
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
    handleYMapChange(event) {
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
            }
            else if (change.action === 'delete') {
                this.threads.delete(key);
                this.handlers.onThreadDeleted?.(key);
            }
        }
    }
}
/**
 * Create comments manager
 */
export function createCommentsManager(config) {
    return new CommentsManager(config);
}
/**
 * Common reaction emojis
 */
export const COMMENT_REACTIONS = ['👍', '👎', '😀', '🎉', '😕', '❤️', '🚀', '👀'];
//# sourceMappingURL=comments.js.map