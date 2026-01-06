/**
 * @philjs/social - Comprehensive Social Features for PhilJS
 *
 * A full-featured social integration package with ActivityPub support,
 * reactive state management, social sharing, and authentication.
 *
 * @example
 * ```tsx
 * import {
 *   createSocialStore,
 *   useSocialProfile,
 *   useFeed,
 *   ActivityPub,
 *   SocialShareButton,
 *   SocialLogin
 * } from '@philjs/social';
 *
 * // Initialize the social store
 * const social = createSocialStore({
 *   activityPub: { domain: 'example.com' },
 *   providers: ['twitter', 'mastodon', 'bluesky'],
 * });
 *
 * // Use in components
 * function Profile() {
 *   const profile = useSocialProfile();
 *   const feed = useFeed();
 *
 *   return (
 *     <div>
 *       <h1>{profile().displayName}</h1>
 *       <Feed items={feed()} />
 *     </div>
 *   );
 * }
 * ```
 */
import { signal, computed, effect, batch } from '@philjs/core';
// =============================================================================
// TYPES AND INTERFACES
// =============================================================================
/** ActivityPub context namespace */
export const ACTIVITYPUB_CONTEXT = 'https://www.w3.org/ns/activitystreams';
/** Public addressing for ActivityPub */
export const PUBLIC_ADDRESSING = 'https://www.w3.org/ns/activitystreams#Public';
// Global state signals
const storeState = signal({
    profile: null,
    feed: [],
    notifications: [],
    relationships: new Map(),
    drafts: new Map(),
    isAuthenticated: false,
    isLoading: false,
    error: null,
    tokens: {},
    unreadCount: 0,
    feedCursor: null,
    hasMoreFeed: true,
});
let storeConfig = null;
let pollingTimer = null;
let wsConnection = null;
/**
 * Creates and initializes the social store
 */
export function createSocialStore(config) {
    storeConfig = {
        pollingInterval: 30000,
        cacheTtl: 300,
        maxFeedItems: 500,
        realtime: false,
        ...config,
    };
    // Initialize real-time connection if enabled
    if (storeConfig.realtime && storeConfig.wsUrl) {
        initWebSocket(storeConfig.wsUrl);
    }
    // Start polling if configured
    if (storeConfig.pollingInterval && storeConfig.pollingInterval > 0) {
        startPolling();
    }
    return {
        getState: () => storeState(),
        getProfile: () => storeState().profile,
        getFeed: () => storeState().feed,
        getNotifications: () => storeState().notifications,
        isAuthenticated: () => storeState().isAuthenticated,
        isLoading: () => storeState().isLoading,
        getError: () => storeState().error,
        getUnreadCount: () => storeState().unreadCount,
        // Actions
        login,
        logout,
        refreshFeed,
        loadMoreFeed,
        post: createPost,
        like: likePost,
        unlike: unlikePost,
        repost: repostPost,
        unrepost: unrepostPost,
        follow: followUser,
        unfollow: unfollowUser,
        block: blockUser,
        unblock: unblockUser,
        mute: muteUser,
        unmute: unmuteUser,
        search,
        markNotificationsRead,
        saveDraft,
        deleteDraft,
        // Cleanup
        destroy: cleanup,
    };
}
// =============================================================================
// HOOKS
// =============================================================================
/**
 * Hook to access the current user's social profile
 */
export function useSocialProfile() {
    const profileSignal = signal(storeState().profile);
    effect(() => {
        profileSignal.set(storeState().profile);
    });
    return profileSignal;
}
/**
 * Hook to access the social feed
 */
export function useFeed() {
    const feedSignal = signal(storeState().feed);
    effect(() => {
        feedSignal.set(storeState().feed);
    });
    return feedSignal;
}
/**
 * Hook to access notifications
 */
export function useNotifications() {
    const notificationsSignal = signal(storeState().notifications);
    effect(() => {
        notificationsSignal.set(storeState().notifications);
    });
    return notificationsSignal;
}
/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
    const unreadSignal = signal(storeState().unreadCount);
    effect(() => {
        unreadSignal.set(storeState().unreadCount);
    });
    return unreadSignal;
}
/**
 * Hook to access relationship with a user
 */
export function useRelationship(userId) {
    const relationshipSignal = signal(storeState().relationships.get(userId));
    effect(() => {
        relationshipSignal.set(storeState().relationships.get(userId));
    });
    return relationshipSignal;
}
/**
 * Hook to access loading state
 */
export function useIsLoading() {
    const loadingSignal = signal(storeState().isLoading);
    effect(() => {
        loadingSignal.set(storeState().isLoading);
    });
    return loadingSignal;
}
/**
 * Hook to access authentication state
 */
export function useIsAuthenticated() {
    const authSignal = signal(storeState().isAuthenticated);
    effect(() => {
        authSignal.set(storeState().isAuthenticated);
    });
    return authSignal;
}
/**
 * Hook to access drafts
 */
export function useDrafts() {
    const draftsSignal = signal([]);
    effect(() => {
        draftsSignal.set(Array.from(storeState().drafts.values()));
    });
    return draftsSignal;
}
/**
 * Hook for social sharing
 */
export function useShare() {
    const isSharing = signal(false);
    const shareError = signal(null);
    const share = async (options, providers) => {
        isSharing.set(true);
        shareError.set(null);
        try {
            const results = await shareToProviders(options, providers);
            return results;
        }
        catch (error) {
            shareError.set(error.message);
            throw error;
        }
        finally {
            isSharing.set(false);
        }
    };
    return {
        share,
        isSharing,
        shareError,
    };
}
// =============================================================================
// ACTIVITYPUB CLASS
// =============================================================================
/**
 * ActivityPub protocol implementation
 */
export class ActivityPub {
    domain;
    privateKeyPem;
    publicKeyPem;
    keyId;
    constructor(config) {
        this.domain = config.domain;
        this.privateKeyPem = config.privateKeyPem;
        this.publicKeyPem = config.publicKeyPem;
        this.keyId = config.keyId;
    }
    /**
     * Creates a Note object (post)
     */
    createNote(options) {
        const id = `https://${this.domain}/notes/${generateId()}`;
        return {
            '@context': ACTIVITYPUB_CONTEXT,
            id,
            type: 'Note',
            content: options.content,
            attributedTo: options.attributedTo,
            to: options.to || [PUBLIC_ADDRESSING],
            cc: options.cc,
            published: new Date().toISOString(),
            inReplyTo: options.inReplyTo,
            sensitive: options.sensitive,
            summary: options.spoilerText,
            attachment: options.attachments,
            tag: options.tags,
        };
    }
    /**
     * Creates an Article object (long-form content)
     */
    createArticle(options) {
        const id = `https://${this.domain}/articles/${generateId()}`;
        return {
            '@context': ACTIVITYPUB_CONTEXT,
            id,
            type: 'Article',
            name: options.name,
            content: options.content,
            attributedTo: options.attributedTo,
            to: options.to || [PUBLIC_ADDRESSING],
            summary: options.summary,
            published: new Date().toISOString(),
        };
    }
    /**
     * Creates an Activity wrapper
     */
    createActivity(type, object, actor, options) {
        const id = `https://${this.domain}/activities/${generateId()}`;
        return {
            '@context': ACTIVITYPUB_CONTEXT,
            id,
            type,
            actor,
            object,
            to: options?.to || [PUBLIC_ADDRESSING],
            cc: options?.cc,
            target: options?.target,
            published: new Date().toISOString(),
        };
    }
    /**
     * Creates a Follow activity
     */
    createFollow(actor, target) {
        return this.createActivity('Follow', target, actor, {
            to: [target],
        });
    }
    /**
     * Creates a Like activity
     */
    createLike(actor, object) {
        return this.createActivity('Like', object, actor);
    }
    /**
     * Creates an Announce (boost/repost) activity
     */
    createAnnounce(actor, object) {
        return this.createActivity('Announce', object, actor);
    }
    /**
     * Creates an Undo activity
     */
    createUndo(actor, originalActivity) {
        return this.createActivity('Undo', originalActivity, actor);
    }
    /**
     * Creates an Accept activity (for follow requests)
     */
    createAccept(actor, followActivity) {
        return this.createActivity('Accept', followActivity, actor, {
            to: [followActivity.actor],
        });
    }
    /**
     * Creates a Reject activity (for follow requests)
     */
    createReject(actor, followActivity) {
        return this.createActivity('Reject', followActivity, actor, {
            to: [followActivity.actor],
        });
    }
    /**
     * Creates a Delete activity
     */
    createDelete(actor, object) {
        return this.createActivity('Delete', {
            '@context': ACTIVITYPUB_CONTEXT,
            id: object,
            type: 'Tombstone',
        }, actor);
    }
    /**
     * Creates an Update activity
     */
    createUpdate(actor, object) {
        return this.createActivity('Update', object, actor);
    }
    /**
     * Creates a Block activity
     */
    createBlock(actor, target) {
        return this.createActivity('Block', target, actor);
    }
    /**
     * Creates a Flag (report) activity
     */
    createFlag(actor, objects, content) {
        return this.createActivity('Flag', {
            '@context': ACTIVITYPUB_CONTEXT,
            type: 'Collection',
            totalItems: objects.length,
            items: objects.map(id => ({ id })),
        }, actor);
    }
    /**
     * Creates an Actor object
     */
    createActor(options) {
        const id = `https://${this.domain}/users/${options.username}`;
        return {
            '@context': [
                ACTIVITYPUB_CONTEXT,
                'https://w3id.org/security/v1',
            ],
            id,
            type: options.type || 'Person',
            preferredUsername: options.username,
            name: options.displayName || options.username,
            summary: options.summary,
            inbox: `${id}/inbox`,
            outbox: `${id}/outbox`,
            following: `${id}/following`,
            followers: `${id}/followers`,
            liked: `${id}/liked`,
            icon: options.icon ? {
                '@context': ACTIVITYPUB_CONTEXT,
                type: 'Image',
                mediaType: 'image/png',
                url: options.icon,
            } : undefined,
            image: options.image ? {
                '@context': ACTIVITYPUB_CONTEXT,
                type: 'Image',
                mediaType: 'image/png',
                url: options.image,
            } : undefined,
            publicKey: this.publicKeyPem ? {
                id: `${id}#main-key`,
                owner: id,
                publicKeyPem: this.publicKeyPem,
            } : undefined,
            manuallyApprovesFollowers: options.manuallyApprovesFollowers,
            discoverable: options.discoverable ?? true,
            endpoints: {
                sharedInbox: `https://${this.domain}/inbox`,
            },
        };
    }
    /**
     * Creates an OrderedCollection for outbox/inbox
     */
    createOrderedCollection(id, items, totalItems) {
        return {
            '@context': ACTIVITYPUB_CONTEXT,
            id,
            type: 'OrderedCollection',
            totalItems: totalItems ?? items.length,
            first: `${id}?page=1`,
            items,
        };
    }
    /**
     * Creates a hashtag object
     */
    createHashtag(tag) {
        const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;
        return {
            '@context': ACTIVITYPUB_CONTEXT,
            type: 'Hashtag',
            href: `https://${this.domain}/tags/${normalizedTag}`,
            name: `#${normalizedTag}`,
        };
    }
    /**
     * Creates a mention object
     */
    createMention(username, actorUrl) {
        return {
            '@context': ACTIVITYPUB_CONTEXT,
            type: 'Mention',
            href: actorUrl,
            name: `@${username}`,
        };
    }
    /**
     * Sends an activity to an inbox
     */
    async send(activity, inboxUrl) {
        const body = JSON.stringify(activity);
        const date = new Date().toUTCString();
        const digest = await this.computeDigest(body);
        const headers = {
            'Date': date,
            'Content-Type': 'application/activity+json',
            'Accept': 'application/activity+json',
            'Digest': `SHA-256=${digest}`,
        };
        // Add HTTP Signature if we have a private key
        if (this.privateKeyPem && this.keyId) {
            const signature = await this.sign(inboxUrl, date, digest);
            headers['Signature'] = signature;
        }
        const response = await fetch(inboxUrl, {
            method: 'POST',
            headers,
            body,
        });
        if (!response.ok) {
            throw new ActivityPubError(`Failed to send activity: ${response.status} ${response.statusText}`, response.status);
        }
        return response;
    }
    /**
     * Fetches an actor by URL
     */
    async fetchActor(actorUrl) {
        const response = await fetch(actorUrl, {
            headers: {
                'Accept': 'application/activity+json, application/ld+json',
            },
        });
        if (!response.ok) {
            throw new ActivityPubError(`Failed to fetch actor: ${response.status}`, response.status);
        }
        return response.json();
    }
    /**
     * Fetches a collection (outbox, followers, etc.)
     */
    async fetchCollection(collectionUrl, options) {
        let url = collectionUrl;
        if (options?.page) {
            url += `?page=${options.page}`;
        }
        if (options?.limit) {
            url += `${options?.page ? '&' : '?'}limit=${options.limit}`;
        }
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/activity+json, application/ld+json',
            },
        });
        if (!response.ok) {
            throw new ActivityPubError(`Failed to fetch collection: ${response.status}`, response.status);
        }
        return response.json();
    }
    /**
     * Performs WebFinger lookup
     */
    async webfinger(acct) {
        // Parse acct (could be @user@domain or user@domain)
        const normalizedAcct = acct.startsWith('@') ? acct.slice(1) : acct;
        const [username, domain] = normalizedAcct.split('@');
        if (!domain) {
            throw new Error('Invalid acct format. Expected user@domain');
        }
        const url = `https://${domain}/.well-known/webfinger?resource=acct:${normalizedAcct}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/jrd+json, application/json',
            },
        });
        if (!response.ok) {
            throw new ActivityPubError(`WebFinger lookup failed: ${response.status}`, response.status);
        }
        return response.json();
    }
    /**
     * Resolves an acct to an Actor URL
     */
    async resolveActorUrl(acct) {
        const webfinger = await this.webfinger(acct);
        const selfLink = webfinger.links.find(link => link.rel === 'self' && link.type === 'application/activity+json');
        if (!selfLink?.href) {
            throw new Error('Could not resolve actor URL from WebFinger');
        }
        return selfLink.href;
    }
    /**
     * Computes SHA-256 digest for HTTP Signature
     */
    async computeDigest(body) {
        const encoder = new TextEncoder();
        const data = encoder.encode(body);
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return btoa(String.fromCharCode(...hashArray));
        }
        // Fallback for non-browser environments
        return '';
    }
    /**
     * Signs the request using HTTP Signatures
     */
    async sign(inboxUrl, date, digest) {
        const url = new URL(inboxUrl);
        const host = url.host;
        const path = url.pathname;
        const signString = [
            `(request-target): post ${path}`,
            `host: ${host}`,
            `date: ${date}`,
            `digest: SHA-256=${digest}`,
        ].join('\n');
        // In a real implementation, this would use the private key to sign
        // For now, we return a placeholder
        const signature = btoa(signString);
        return `keyId="${this.keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`;
    }
}
/**
 * ActivityPub error class
 */
export class ActivityPubError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ActivityPubError';
    }
}
// =============================================================================
// STORE ACTIONS
// =============================================================================
/**
 * Logs in with a social provider
 */
async function login(provider, tokens) {
    if (!storeConfig) {
        throw new Error('Social store not initialized');
    }
    const state = storeState();
    storeState.set({
        ...state,
        isLoading: true,
        error: null,
    });
    try {
        if (tokens) {
            // Use provided tokens
            const newTokens = { ...state.tokens, [provider]: tokens };
            storeState.set({
                ...storeState(),
                tokens: newTokens,
                isAuthenticated: true,
            });
        }
        else {
            // Initiate OAuth flow
            const oauthConfig = storeConfig.oauth?.[provider];
            if (!oauthConfig) {
                throw new Error(`OAuth not configured for provider: ${provider}`);
            }
            const authUrl = buildOAuthUrl(provider, oauthConfig);
            window.location.href = authUrl;
            return;
        }
        // Fetch user profile
        await fetchProfile();
        // Fetch initial feed
        await refreshFeed();
    }
    catch (error) {
        storeState.set({
            ...storeState(),
            error: error,
        });
        throw error;
    }
    finally {
        storeState.set({
            ...storeState(),
            isLoading: false,
        });
    }
}
/**
 * Logs out and clears state
 */
function logout() {
    batch(() => {
        storeState.set({
            profile: null,
            feed: [],
            notifications: [],
            relationships: new Map(),
            drafts: storeState().drafts, // Preserve drafts
            isAuthenticated: false,
            isLoading: false,
            error: null,
            tokens: {},
            unreadCount: 0,
            feedCursor: null,
            hasMoreFeed: true,
        });
    });
    // Close WebSocket if open
    if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
    }
    // Stop polling
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
}
/**
 * Fetches the user's profile
 */
async function fetchProfile() {
    if (!storeConfig?.endpoints?.profile)
        return;
    const response = await authenticatedFetch(storeConfig.endpoints.profile);
    const profile = await response.json();
    storeState.set({
        ...storeState(),
        profile: mapToSocialProfile(profile),
    });
}
/**
 * Refreshes the feed
 */
async function refreshFeed() {
    if (!storeConfig?.endpoints?.feed)
        return;
    const state = storeState();
    storeState.set({ ...state, isLoading: true });
    try {
        const response = await authenticatedFetch(storeConfig.endpoints.feed);
        const data = await response.json();
        batch(() => {
            storeState.set({
                ...storeState(),
                feed: data.items.map(mapToFeedItem),
                feedCursor: data.cursor || null,
                hasMoreFeed: data.hasMore ?? true,
                isLoading: false,
            });
        });
        trackAnalytics({ type: 'view', timestamp: new Date() });
    }
    catch (error) {
        storeState.set({
            ...storeState(),
            error: error,
            isLoading: false,
        });
    }
}
/**
 * Loads more feed items
 */
async function loadMoreFeed() {
    const state = storeState();
    if (!storeConfig?.endpoints?.feed || !state.hasMoreFeed || state.isLoading)
        return;
    storeState.set({ ...state, isLoading: true });
    try {
        const url = state.feedCursor
            ? `${storeConfig.endpoints.feed}?cursor=${state.feedCursor}`
            : storeConfig.endpoints.feed;
        const response = await authenticatedFetch(url);
        const data = await response.json();
        batch(() => {
            const currentFeed = storeState().feed;
            const newItems = data.items.map(mapToFeedItem);
            // Deduplicate and limit
            const allItems = [...currentFeed, ...newItems];
            const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
            const limitedItems = uniqueItems.slice(0, storeConfig?.maxFeedItems || 500);
            storeState.set({
                ...storeState(),
                feed: limitedItems,
                feedCursor: data.cursor || null,
                hasMoreFeed: data.hasMore ?? false,
                isLoading: false,
            });
        });
    }
    catch (error) {
        storeState.set({
            ...storeState(),
            error: error,
            isLoading: false,
        });
    }
}
/**
 * Creates a new post
 */
async function createPost(options) {
    if (!storeConfig?.endpoints?.feed) {
        throw new Error('Feed endpoint not configured');
    }
    const response = await authenticatedFetch(storeConfig.endpoints.feed, {
        method: 'POST',
        body: JSON.stringify({
            status: options.content,
            visibility: options.visibility || 'public',
            sensitive: options.sensitive || false,
            spoiler_text: options.spoilerText,
            in_reply_to_id: options.replyToId,
            media_ids: options.mediaIds,
            poll: options.poll,
        }),
    });
    const post = await response.json();
    const feedItem = mapToFeedItem(post);
    // Add to feed
    storeState.set({
        ...storeState(),
        feed: [feedItem, ...storeState().feed],
    });
    trackAnalytics({ type: 'post', itemId: feedItem.id, timestamp: new Date() });
    return feedItem;
}
/**
 * Likes a post
 */
async function likePost(postId) {
    const response = await authenticatedFetch(`/api/posts/${postId}/like`, {
        method: 'POST',
    });
    if (response.ok) {
        updateFeedItem(postId, {
            isLiked: true,
            likesCount: (item) => item.likesCount + 1,
        });
        trackAnalytics({ type: 'like', itemId: postId, timestamp: new Date() });
    }
}
/**
 * Unlikes a post
 */
async function unlikePost(postId) {
    const response = await authenticatedFetch(`/api/posts/${postId}/like`, {
        method: 'DELETE',
    });
    if (response.ok) {
        updateFeedItem(postId, {
            isLiked: false,
            likesCount: (item) => Math.max(0, item.likesCount - 1),
        });
    }
}
/**
 * Reposts a post
 */
async function repostPost(postId) {
    const response = await authenticatedFetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
    });
    if (response.ok) {
        updateFeedItem(postId, {
            isReposted: true,
            repostsCount: (item) => item.repostsCount + 1,
        });
        trackAnalytics({ type: 'repost', itemId: postId, timestamp: new Date() });
    }
}
/**
 * Unreposts a post
 */
async function unrepostPost(postId) {
    const response = await authenticatedFetch(`/api/posts/${postId}/repost`, {
        method: 'DELETE',
    });
    if (response.ok) {
        updateFeedItem(postId, {
            isReposted: false,
            repostsCount: (item) => Math.max(0, item.repostsCount - 1),
        });
    }
}
/**
 * Follows a user
 */
async function followUser(userId) {
    const response = await authenticatedFetch(`/api/users/${userId}/follow`, {
        method: 'POST',
    });
    if (response.ok) {
        const relationship = await response.json();
        updateRelationship(userId, mapToRelationship(relationship));
        trackAnalytics({ type: 'follow', itemId: userId, timestamp: new Date() });
    }
}
/**
 * Unfollows a user
 */
async function unfollowUser(userId) {
    const response = await authenticatedFetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
    });
    if (response.ok) {
        const relationship = await response.json();
        updateRelationship(userId, mapToRelationship(relationship));
    }
}
/**
 * Blocks a user
 */
async function blockUser(userId) {
    const response = await authenticatedFetch(`/api/users/${userId}/block`, {
        method: 'POST',
    });
    if (response.ok) {
        const relationship = await response.json();
        updateRelationship(userId, mapToRelationship(relationship));
    }
}
/**
 * Unblocks a user
 */
async function unblockUser(userId) {
    const response = await authenticatedFetch(`/api/users/${userId}/block`, {
        method: 'DELETE',
    });
    if (response.ok) {
        const relationship = await response.json();
        updateRelationship(userId, mapToRelationship(relationship));
    }
}
/**
 * Mutes a user
 */
async function muteUser(userId, options) {
    const response = await authenticatedFetch(`/api/users/${userId}/mute`, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    if (response.ok) {
        const relationship = await response.json();
        updateRelationship(userId, mapToRelationship(relationship));
    }
}
/**
 * Unmutes a user
 */
async function unmuteUser(userId) {
    const response = await authenticatedFetch(`/api/users/${userId}/mute`, {
        method: 'DELETE',
    });
    if (response.ok) {
        const relationship = await response.json();
        updateRelationship(userId, mapToRelationship(relationship));
    }
}
/**
 * Searches for accounts, posts, and hashtags
 */
async function search(query, options) {
    if (!storeConfig?.endpoints?.search) {
        throw new Error('Search endpoint not configured');
    }
    const params = new URLSearchParams({
        q: query,
        ...(options?.type && { type: options.type }),
        ...(options?.limit && { limit: String(options.limit) }),
        ...(options?.offset && { offset: String(options.offset) }),
    });
    const response = await authenticatedFetch(`${storeConfig.endpoints.search}?${params}`);
    const data = await response.json();
    return {
        accounts: (data.accounts || []).map(mapToSocialProfile),
        posts: (data.statuses || []).map(mapToFeedItem),
        hashtags: data.hashtags || [],
    };
}
/**
 * Marks notifications as read
 */
async function markNotificationsRead(notificationIds) {
    if (!storeConfig?.endpoints?.notifications)
        return;
    const response = await authenticatedFetch(`${storeConfig.endpoints.notifications}/read`, {
        method: 'POST',
        body: JSON.stringify({ ids: notificationIds }),
    });
    if (response.ok) {
        batch(() => {
            const state = storeState();
            const updatedNotifications = state.notifications.map(n => {
                if (!notificationIds || notificationIds.includes(n.id)) {
                    return { ...n, isRead: true };
                }
                return n;
            });
            const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
            storeState.set({
                ...state,
                notifications: updatedNotifications,
                unreadCount,
            });
        });
    }
}
/**
 * Saves a draft post
 */
function saveDraft(draft) {
    const now = new Date();
    const id = generateId();
    const fullDraft = {
        ...draft,
        id,
        createdAt: now,
        updatedAt: now,
    };
    const state = storeState();
    const drafts = new Map(state.drafts);
    drafts.set(id, fullDraft);
    storeState.set({
        ...state,
        drafts,
    });
    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
        const draftsArray = Array.from(drafts.values());
        localStorage.setItem('philjs_social_drafts', JSON.stringify(draftsArray));
    }
    return fullDraft;
}
/**
 * Deletes a draft post
 */
function deleteDraft(draftId) {
    const state = storeState();
    const drafts = new Map(state.drafts);
    drafts.delete(draftId);
    storeState.set({
        ...state,
        drafts,
    });
    // Update localStorage
    if (typeof localStorage !== 'undefined') {
        const draftsArray = Array.from(drafts.values());
        localStorage.setItem('philjs_social_drafts', JSON.stringify(draftsArray));
    }
}
// =============================================================================
// SOCIAL SHARING
// =============================================================================
/**
 * Shares content to multiple providers
 */
async function shareToProviders(options, providers) {
    const targetProviders = providers || storeConfig?.providers || [];
    const results = [];
    for (const provider of targetProviders) {
        try {
            const result = await shareToProvider(options, provider);
            results.push(result);
        }
        catch (error) {
            results.push({
                success: false,
                provider,
                error: error.message,
            });
        }
    }
    return results;
}
/**
 * Shares content to a specific provider
 */
async function shareToProvider(options, provider) {
    const shareUrl = buildShareUrl(options, provider);
    // Use Web Share API if available and on mobile
    if (navigator.share && isMobileDevice()) {
        try {
            await navigator.share({
                title: options.title,
                text: options.text,
                url: options.url,
            });
            trackAnalytics({
                type: 'share',
                provider,
                timestamp: new Date(),
                metadata: { method: 'web-share-api' },
            });
            return {
                success: true,
                provider,
            };
        }
        catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        }
    }
    // Fall back to opening share URL
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        trackAnalytics({
            type: 'share',
            provider,
            timestamp: new Date(),
            metadata: { method: 'share-url' },
        });
        return {
            success: true,
            provider,
        };
    }
    throw new Error(`Sharing to ${provider} is not supported`);
}
/**
 * Builds a share URL for a provider
 */
function buildShareUrl(options, provider) {
    const text = encodeURIComponent(options.text || '');
    const url = encodeURIComponent(options.url || '');
    const title = encodeURIComponent(options.title || '');
    const hashtags = options.hashtags?.join(',') || '';
    const via = options.via || '';
    switch (provider) {
        case 'twitter':
            return `https://twitter.com/intent/tweet?text=${text}&url=${url}${hashtags ? `&hashtags=${hashtags}` : ''}${via ? `&via=${via}` : ''}`;
        case 'mastodon':
            return `https://mastodon.social/share?text=${text}%20${url}`;
        case 'bluesky':
            return `https://bsky.app/intent/compose?text=${text}%20${url}`;
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        case 'threads':
            return `https://threads.net/intent/post?text=${text}%20${url}`;
        default:
            return null;
    }
}
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
/**
 * Generates a unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
/**
 * Checks if the current device is mobile
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
/**
 * Makes an authenticated fetch request
 */
async function authenticatedFetch(url, options) {
    const state = storeState();
    const tokens = Object.values(state.tokens)[0]; // Get first available token
    const headers = {
        'Content-Type': 'application/json',
        ...options?.headers,
    };
    if (tokens?.accessToken) {
        headers['Authorization'] = `${tokens.tokenType} ${tokens.accessToken}`;
    }
    const response = await fetch(url, {
        ...options,
        headers,
    });
    if (response.status === 401) {
        // Token expired, try to refresh
        // In a real implementation, this would handle token refresh
        logout();
        throw new Error('Session expired. Please log in again.');
    }
    return response;
}
/**
 * Builds OAuth authorization URL
 */
function buildOAuthUrl(provider, config) {
    const state = generateId();
    // Store state for verification
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('philjs_oauth_state', state);
        sessionStorage.setItem('philjs_oauth_provider', provider);
    }
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scope.join(' '),
        state,
    });
    return `${config.authorizationEndpoint}?${params}`;
}
/**
 * Updates a feed item in the store
 */
function updateFeedItem(postId, updates) {
    const state = storeState();
    const feed = state.feed.map(item => {
        if (item.id === postId) {
            const newItem = { ...item };
            for (const [key, value] of Object.entries(updates)) {
                newItem[key] = typeof value === 'function' ? value(item) : value;
            }
            return newItem;
        }
        return item;
    });
    storeState.set({ ...state, feed });
}
/**
 * Updates a relationship in the store
 */
function updateRelationship(userId, relationship) {
    const state = storeState();
    const relationships = new Map(state.relationships);
    relationships.set(userId, relationship);
    storeState.set({ ...state, relationships });
}
/**
 * Maps API response to SocialProfile
 */
function mapToSocialProfile(data) {
    return {
        id: data.id,
        username: data.username || data.acct,
        displayName: data.display_name || data.name || data.username,
        bio: data.note || data.bio || data.summary,
        avatar: data.avatar || data.avatar_static,
        banner: data.header || data.banner,
        url: data.url,
        followersCount: data.followers_count || 0,
        followingCount: data.following_count || 0,
        postsCount: data.statuses_count || data.posts_count || 0,
        createdAt: new Date(data.created_at),
        isVerified: data.verified || false,
        pronouns: data.pronouns,
        fields: data.fields,
        badges: data.badges,
    };
}
/**
 * Maps API response to FeedItem
 */
function mapToFeedItem(data) {
    return {
        id: data.id,
        type: data.reblog ? 'repost' : data.in_reply_to_id ? 'reply' : 'post',
        author: mapToSocialProfile(data.account || data.author),
        content: data.content || data.text,
        contentHtml: data.content,
        mediaAttachments: (data.media_attachments || []).map(mapToMediaAttachment),
        mentions: (data.mentions || []).map(mapToMention),
        hashtags: (data.tags || []).map((t) => t.name),
        replyTo: data.in_reply_to_id,
        repostOf: data.reblog ? mapToFeedItem(data.reblog) : undefined,
        likesCount: data.favourites_count || data.likes_count || 0,
        repostsCount: data.reblogs_count || data.reposts_count || 0,
        repliesCount: data.replies_count || 0,
        isLiked: data.favourited || data.liked || false,
        isReposted: data.reblogged || data.reposted || false,
        isBookmarked: data.bookmarked || false,
        visibility: data.visibility || 'public',
        sensitive: data.sensitive || false,
        spoilerText: data.spoiler_text,
        language: data.language,
        createdAt: new Date(data.created_at),
        editedAt: data.edited_at ? new Date(data.edited_at) : undefined,
        poll: data.poll ? mapToPoll(data.poll) : undefined,
    };
}
/**
 * Maps API response to MediaAttachment
 */
function mapToMediaAttachment(data) {
    return {
        id: data.id,
        type: data.type,
        url: data.url,
        previewUrl: data.preview_url,
        remoteUrl: data.remote_url,
        description: data.description,
        blurhash: data.blurhash,
        meta: data.meta,
    };
}
/**
 * Maps API response to Mention
 */
function mapToMention(data) {
    return {
        id: data.id,
        username: data.username,
        url: data.url,
        acct: data.acct,
    };
}
/**
 * Maps API response to Poll
 */
function mapToPoll(data) {
    return {
        id: data.id,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        expired: data.expired || false,
        multiple: data.multiple || false,
        votesCount: data.votes_count || 0,
        votersCount: data.voters_count,
        options: data.options.map((o) => ({
            title: o.title,
            votesCount: o.votes_count,
        })),
        voted: data.voted,
        ownVotes: data.own_votes,
    };
}
/**
 * Maps API response to Relationship
 */
function mapToRelationship(data) {
    return {
        id: data.id,
        following: data.following || false,
        followedBy: data.followed_by || false,
        blocking: data.blocking || false,
        blockedBy: data.blocked_by || false,
        muting: data.muting || false,
        mutingNotifications: data.muting_notifications || false,
        requested: data.requested || false,
        requestedBy: data.requested_by || false,
        domainBlocking: data.domain_blocking || false,
        endorsed: data.endorsed || false,
        note: data.note,
    };
}
/**
 * Tracks an analytics event
 */
function trackAnalytics(event) {
    if (storeConfig?.onAnalytics) {
        storeConfig.onAnalytics(event);
    }
}
/**
 * Initializes WebSocket connection for real-time updates
 */
function initWebSocket(url) {
    if (wsConnection) {
        wsConnection.close();
    }
    wsConnection = new WebSocket(url);
    wsConnection.onopen = () => {
        console.log('[PhilJS Social] WebSocket connected');
    };
    wsConnection.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleRealtimeEvent(data);
        }
        catch (error) {
            console.error('[PhilJS Social] Failed to parse WebSocket message', error);
        }
    };
    wsConnection.onerror = (error) => {
        console.error('[PhilJS Social] WebSocket error', error);
    };
    wsConnection.onclose = () => {
        console.log('[PhilJS Social] WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
            if (storeConfig?.realtime && storeConfig.wsUrl) {
                initWebSocket(storeConfig.wsUrl);
            }
        }, 5000);
    };
}
/**
 * Handles real-time events from WebSocket
 */
function handleRealtimeEvent(event) {
    const state = storeState();
    switch (event.type) {
        case 'update':
            // New post in feed
            const newPost = mapToFeedItem(event.payload);
            storeState.set({
                ...state,
                feed: [newPost, ...state.feed].slice(0, storeConfig?.maxFeedItems || 500),
            });
            break;
        case 'notification':
            // New notification
            const notification = {
                id: event.payload.id,
                type: event.payload.type,
                createdAt: new Date(event.payload.created_at),
                account: mapToSocialProfile(event.payload.account),
                status: event.payload.status ? mapToFeedItem(event.payload.status) : undefined,
                isRead: false,
            };
            storeState.set({
                ...state,
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
            });
            break;
        case 'delete':
            // Post deleted
            storeState.set({
                ...state,
                feed: state.feed.filter(item => item.id !== event.payload),
            });
            break;
        case 'status.update':
            // Post edited
            updateFeedItem(event.payload.id, mapToFeedItem(event.payload));
            break;
    }
}
/**
 * Starts polling for updates
 */
function startPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
    }
    pollingTimer = setInterval(async () => {
        if (storeState().isAuthenticated) {
            try {
                await refreshFeed();
                await fetchNotifications();
            }
            catch (error) {
                console.error('[PhilJS Social] Polling error', error);
            }
        }
    }, storeConfig?.pollingInterval || 30000);
}
/**
 * Fetches notifications
 */
async function fetchNotifications() {
    if (!storeConfig?.endpoints?.notifications)
        return;
    try {
        const response = await authenticatedFetch(storeConfig.endpoints.notifications);
        const data = await response.json();
        const notifications = data.map((n) => ({
            id: n.id,
            type: n.type,
            createdAt: new Date(n.created_at),
            account: mapToSocialProfile(n.account),
            status: n.status ? mapToFeedItem(n.status) : undefined,
            isRead: n.read || false,
        }));
        const unreadCount = notifications.filter(n => !n.isRead).length;
        storeState.set({
            ...storeState(),
            notifications,
            unreadCount,
        });
    }
    catch (error) {
        console.error('[PhilJS Social] Failed to fetch notifications', error);
    }
}
/**
 * Cleanup function
 */
function cleanup() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
    if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
    }
    storeConfig = null;
}
// =============================================================================
// CONFIGURATION GENERATORS
// =============================================================================
/**
 * Generates ActivityPub configuration
 */
export function generateActivityPubConfig(options) {
    const activityPub = new ActivityPub({ domain: options.domain });
    const actor = activityPub.createActor({
        username: options.username,
        displayName: options.displayName,
        summary: options.summary,
        discoverable: true,
    });
    const webfinger = {
        subject: `acct:${options.username}@${options.domain}`,
        aliases: [
            `https://${options.domain}/@${options.username}`,
            `https://${options.domain}/users/${options.username}`,
        ],
        links: [
            {
                rel: 'http://webfinger.net/rel/profile-page',
                type: 'text/html',
                href: `https://${options.domain}/@${options.username}`,
            },
            {
                rel: 'self',
                type: 'application/activity+json',
                href: `https://${options.domain}/users/${options.username}`,
            },
            {
                rel: 'http://ostatus.org/schema/1.0/subscribe',
                template: `https://${options.domain}/authorize_interaction?uri={uri}`,
            },
        ],
    };
    return { actor, webfinger };
}
/**
 * Generates OAuth configuration for common providers
 */
export function generateOAuthConfig(provider, options) {
    const configs = {
        twitter: {
            scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
            authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
            tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
        },
        mastodon: {
            scope: ['read', 'write', 'follow', 'push'],
            authorizationEndpoint: '/oauth/authorize',
            tokenEndpoint: '/oauth/token',
        },
        bluesky: {
            scope: ['atproto', 'transition:generic'],
            authorizationEndpoint: 'https://bsky.social/oauth/authorize',
            tokenEndpoint: 'https://bsky.social/oauth/token',
        },
        linkedin: {
            scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
            authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
            tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
        },
        facebook: {
            scope: ['public_profile', 'email', 'pages_manage_posts'],
            authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
            tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
        },
    };
    const baseConfig = configs[provider];
    if (!baseConfig) {
        throw new Error(`OAuth configuration not available for provider: ${provider}`);
    }
    return {
        ...baseConfig,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        redirectUri: options.redirectUri,
    };
}
// =============================================================================
// EXPORTS
// =============================================================================
export { storeState as socialStoreState, cleanup as cleanupSocialStore, };
//# sourceMappingURL=index.js.map