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
import type { Signal } from '@philjs/core';
/** ActivityPub context namespace */
export declare const ACTIVITYPUB_CONTEXT = "https://www.w3.org/ns/activitystreams";
/** Public addressing for ActivityPub */
export declare const PUBLIC_ADDRESSING = "https://www.w3.org/ns/activitystreams#Public";
/** Base ActivityPub object interface */
export interface ActivityPubObject {
    '@context': string | string[];
    id?: string;
    type: string;
    name?: string;
    content?: string;
    summary?: string;
    published?: string;
    updated?: string;
    url?: string;
    attributedTo?: string | ActivityPubObject;
    to?: string[];
    cc?: string[];
    bto?: string[];
    bcc?: string[];
    mediaType?: string;
    attachment?: ActivityPubObject[];
    tag?: ActivityPubObject[];
    inReplyTo?: string | ActivityPubObject;
    [key: string]: any;
}
/** ActivityPub Actor types */
export type ActorType = 'Person' | 'Service' | 'Application' | 'Group' | 'Organization';
/** ActivityPub Actor interface */
export interface Actor extends ActivityPubObject {
    type: ActorType;
    inbox: string;
    outbox: string;
    following?: string;
    followers?: string;
    liked?: string;
    preferredUsername?: string;
    name?: string;
    summary?: string;
    icon?: ActivityPubObject;
    image?: ActivityPubObject;
    endpoints?: {
        sharedInbox?: string;
        proxyUrl?: string;
        oauthAuthorizationEndpoint?: string;
        oauthTokenEndpoint?: string;
    };
    publicKey?: {
        id: string;
        owner: string;
        publicKeyPem: string;
    };
    manuallyApprovesFollowers?: boolean;
    discoverable?: boolean;
}
/** Activity types for ActivityPub */
export type ActivityType = 'Create' | 'Update' | 'Delete' | 'Follow' | 'Accept' | 'Reject' | 'Add' | 'Remove' | 'Like' | 'Announce' | 'Undo' | 'Block' | 'Flag';
/** ActivityPub Activity interface */
export interface Activity extends ActivityPubObject {
    type: ActivityType;
    actor: string | Actor;
    object: string | ActivityPubObject;
    target?: string | ActivityPubObject;
    result?: string | ActivityPubObject;
    origin?: string | ActivityPubObject;
    instrument?: string | ActivityPubObject;
}
/** Note object for posts */
export interface Note extends ActivityPubObject {
    type: 'Note';
    content: string;
    attributedTo: string;
    to: string[];
    cc?: string[];
    sensitive?: boolean;
    spoilerText?: string;
    replies?: Collection;
    likes?: Collection;
    shares?: Collection;
}
/** Article object for long-form content */
export interface Article extends ActivityPubObject {
    type: 'Article';
    content: string;
    attributedTo: string;
    name: string;
}
/** Image attachment */
export interface Image extends ActivityPubObject {
    type: 'Image';
    url: string;
    mediaType?: string;
    width?: number;
    height?: number;
    blurhash?: string;
}
/** Video attachment */
export interface Video extends ActivityPubObject {
    type: 'Video';
    url: string;
    mediaType?: string;
    width?: number;
    height?: number;
    duration?: number;
}
/** Collection for paginated data */
export interface Collection extends ActivityPubObject {
    type: 'Collection' | 'OrderedCollection';
    totalItems: number;
    first?: string | CollectionPage;
    last?: string | CollectionPage;
    current?: string | CollectionPage;
    items?: ActivityPubObject[];
}
/** Collection page for pagination */
export interface CollectionPage extends ActivityPubObject {
    type: 'CollectionPage' | 'OrderedCollectionPage';
    partOf: string;
    next?: string;
    prev?: string;
    items?: ActivityPubObject[];
    orderedItems?: ActivityPubObject[];
}
/** WebFinger response */
export interface WebFingerResponse {
    subject: string;
    aliases?: string[];
    links: {
        rel: string;
        type?: string;
        href?: string;
        template?: string;
    }[];
}
/** Social profile for local use */
export interface SocialProfile {
    id: string;
    username: string;
    displayName: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    url?: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    createdAt: Date;
    isVerified?: boolean;
    pronouns?: string;
    fields?: {
        name: string;
        value: string;
    }[];
    badges?: string[];
}
/** Feed item */
export interface FeedItem {
    id: string;
    type: 'post' | 'repost' | 'reply' | 'like' | 'follow';
    author: SocialProfile;
    content?: string;
    contentHtml?: string;
    mediaAttachments?: MediaAttachment[];
    mentions?: Mention[];
    hashtags?: string[];
    replyTo?: string;
    repostOf?: FeedItem;
    likesCount: number;
    repostsCount: number;
    repliesCount: number;
    isLiked: boolean;
    isReposted: boolean;
    isBookmarked: boolean;
    visibility: 'public' | 'unlisted' | 'followers' | 'direct';
    sensitive: boolean;
    spoilerText?: string;
    language?: string;
    createdAt: Date;
    editedAt?: Date;
    poll?: Poll;
}
/** Media attachment */
export interface MediaAttachment {
    id: string;
    type: 'image' | 'video' | 'audio' | 'gifv';
    url: string;
    previewUrl?: string;
    remoteUrl?: string;
    description?: string;
    blurhash?: string;
    meta?: {
        width?: number;
        height?: number;
        duration?: number;
        fps?: number;
    };
}
/** Mention in a post */
export interface Mention {
    id: string;
    username: string;
    url: string;
    acct: string;
}
/** Poll */
export interface Poll {
    id: string;
    expiresAt?: Date;
    expired: boolean;
    multiple: boolean;
    votesCount: number;
    votersCount?: number;
    options: PollOption[];
    voted?: boolean;
    ownVotes?: number[];
}
/** Poll option */
export interface PollOption {
    title: string;
    votesCount?: number;
}
/** Notification types */
export type NotificationType = 'mention' | 'follow' | 'follow_request' | 'reblog' | 'favourite' | 'poll' | 'status' | 'update';
/** Notification */
export interface Notification {
    id: string;
    type: NotificationType;
    createdAt: Date;
    account: SocialProfile;
    status?: FeedItem;
    isRead: boolean;
}
/** Social provider types */
export type SocialProvider = 'twitter' | 'mastodon' | 'bluesky' | 'threads' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'activitypub';
/** OAuth tokens */
export interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresAt?: Date;
    scope?: string[];
}
/** Social store configuration */
export interface SocialStoreConfig {
    /** ActivityPub configuration */
    activityPub?: {
        domain: string;
        privateKeyPem?: string;
        publicKeyPem?: string;
        keyId?: string;
    };
    /** Enabled social providers */
    providers?: SocialProvider[];
    /** OAuth configuration per provider */
    oauth?: Partial<Record<SocialProvider, OAuthConfig>>;
    /** API endpoints */
    endpoints?: {
        profile?: string;
        feed?: string;
        notifications?: string;
        search?: string;
    };
    /** Polling interval for updates (ms) */
    pollingInterval?: number;
    /** Enable real-time updates via WebSocket */
    realtime?: boolean;
    /** WebSocket URL for real-time */
    wsUrl?: string;
    /** Cache TTL in seconds */
    cacheTtl?: number;
    /** Maximum items in feed cache */
    maxFeedItems?: number;
    /** Analytics callback */
    onAnalytics?: (event: SocialAnalyticsEvent) => void;
}
/** OAuth configuration */
export interface OAuthConfig {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scope: string[];
    authorizationEndpoint: string;
    tokenEndpoint: string;
}
/** Social analytics event */
export interface SocialAnalyticsEvent {
    type: 'post' | 'like' | 'repost' | 'follow' | 'share' | 'view';
    provider?: SocialProvider;
    itemId?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}
/** Share options */
export interface ShareOptions {
    text?: string;
    url?: string;
    title?: string;
    hashtags?: string[];
    via?: string;
    media?: File[];
}
/** Share result */
export interface ShareResult {
    success: boolean;
    provider: SocialProvider;
    postId?: string;
    postUrl?: string;
    error?: string;
}
/** Search result */
export interface SearchResult {
    accounts: SocialProfile[];
    posts: FeedItem[];
    hashtags: {
        name: string;
        count: number;
    }[];
}
/** Relationship status */
export interface Relationship {
    id: string;
    following: boolean;
    followedBy: boolean;
    blocking: boolean;
    blockedBy: boolean;
    muting: boolean;
    mutingNotifications: boolean;
    requested: boolean;
    requestedBy: boolean;
    domainBlocking: boolean;
    endorsed: boolean;
    note?: string;
}
/** Social store state */
interface SocialStoreState {
    profile: SocialProfile | null;
    feed: FeedItem[];
    notifications: Notification[];
    relationships: Map<string, Relationship>;
    drafts: Map<string, DraftPost>;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: Error | null;
    tokens: Partial<Record<SocialProvider, OAuthTokens>>;
    unreadCount: number;
    feedCursor: string | null;
    hasMoreFeed: boolean;
}
/** Draft post */
export interface DraftPost {
    id: string;
    content: string;
    mediaAttachments: File[];
    visibility: 'public' | 'unlisted' | 'followers' | 'direct';
    sensitive: boolean;
    spoilerText?: string;
    replyToId?: string;
    poll?: {
        options: string[];
        expiresIn: number;
        multiple: boolean;
    };
    language?: string;
    scheduledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const storeState: any;
/**
 * Creates and initializes the social store
 */
export declare function createSocialStore(config: SocialStoreConfig): {
    getState: () => any;
    getProfile: () => any;
    getFeed: () => any;
    getNotifications: () => any;
    isAuthenticated: () => any;
    isLoading: () => any;
    getError: () => any;
    getUnreadCount: () => any;
    login: typeof login;
    logout: typeof logout;
    refreshFeed: typeof refreshFeed;
    loadMoreFeed: typeof loadMoreFeed;
    post: typeof createPost;
    like: typeof likePost;
    unlike: typeof unlikePost;
    repost: typeof repostPost;
    unrepost: typeof unrepostPost;
    follow: typeof followUser;
    unfollow: typeof unfollowUser;
    block: typeof blockUser;
    unblock: typeof unblockUser;
    mute: typeof muteUser;
    unmute: typeof unmuteUser;
    search: typeof search;
    markNotificationsRead: typeof markNotificationsRead;
    saveDraft: typeof saveDraft;
    deleteDraft: typeof deleteDraft;
    destroy: typeof cleanup;
};
/**
 * Hook to access the current user's social profile
 */
export declare function useSocialProfile(): Signal<SocialProfile | null>;
/**
 * Hook to access the social feed
 */
export declare function useFeed(): Signal<FeedItem[]>;
/**
 * Hook to access notifications
 */
export declare function useNotifications(): Signal<Notification[]>;
/**
 * Hook to get unread notification count
 */
export declare function useUnreadCount(): Signal<number>;
/**
 * Hook to access relationship with a user
 */
export declare function useRelationship(userId: string): Signal<Relationship | undefined>;
/**
 * Hook to access loading state
 */
export declare function useIsLoading(): Signal<boolean>;
/**
 * Hook to access authentication state
 */
export declare function useIsAuthenticated(): Signal<boolean>;
/**
 * Hook to access drafts
 */
export declare function useDrafts(): Signal<DraftPost[]>;
/**
 * Hook for social sharing
 */
export declare function useShare(): {
    share: (options: ShareOptions, providers?: SocialProvider[]) => Promise<ShareResult[]>;
    isSharing: any;
    shareError: any;
};
/**
 * ActivityPub protocol implementation
 */
export declare class ActivityPub {
    private domain;
    private privateKeyPem?;
    private publicKeyPem?;
    private keyId?;
    constructor(config: {
        domain: string;
        privateKeyPem?: string;
        publicKeyPem?: string;
        keyId?: string;
    });
    /**
     * Creates a Note object (post)
     */
    createNote(options: {
        content: string;
        attributedTo: string;
        to?: string[];
        cc?: string[];
        inReplyTo?: string;
        sensitive?: boolean;
        spoilerText?: string;
        attachments?: ActivityPubObject[];
        tags?: ActivityPubObject[];
    }): Note;
    /**
     * Creates an Article object (long-form content)
     */
    createArticle(options: {
        name: string;
        content: string;
        attributedTo: string;
        to?: string[];
        summary?: string;
    }): Article;
    /**
     * Creates an Activity wrapper
     */
    createActivity(type: ActivityType, object: string | ActivityPubObject, actor: string, options?: {
        to?: string[];
        cc?: string[];
        target?: string | ActivityPubObject;
    }): Activity;
    /**
     * Creates a Follow activity
     */
    createFollow(actor: string, target: string): Activity;
    /**
     * Creates a Like activity
     */
    createLike(actor: string, object: string): Activity;
    /**
     * Creates an Announce (boost/repost) activity
     */
    createAnnounce(actor: string, object: string): Activity;
    /**
     * Creates an Undo activity
     */
    createUndo(actor: string, originalActivity: Activity): Activity;
    /**
     * Creates an Accept activity (for follow requests)
     */
    createAccept(actor: string, followActivity: Activity): Activity;
    /**
     * Creates a Reject activity (for follow requests)
     */
    createReject(actor: string, followActivity: Activity): Activity;
    /**
     * Creates a Delete activity
     */
    createDelete(actor: string, object: string): Activity;
    /**
     * Creates an Update activity
     */
    createUpdate(actor: string, object: ActivityPubObject): Activity;
    /**
     * Creates a Block activity
     */
    createBlock(actor: string, target: string): Activity;
    /**
     * Creates a Flag (report) activity
     */
    createFlag(actor: string, objects: string[], content?: string): Activity;
    /**
     * Creates an Actor object
     */
    createActor(options: {
        username: string;
        displayName?: string;
        summary?: string;
        type?: ActorType;
        icon?: string;
        image?: string;
        manuallyApprovesFollowers?: boolean;
        discoverable?: boolean;
    }): Actor;
    /**
     * Creates an OrderedCollection for outbox/inbox
     */
    createOrderedCollection(id: string, items: ActivityPubObject[], totalItems?: number): Collection;
    /**
     * Creates a hashtag object
     */
    createHashtag(tag: string): ActivityPubObject;
    /**
     * Creates a mention object
     */
    createMention(username: string, actorUrl: string): ActivityPubObject;
    /**
     * Sends an activity to an inbox
     */
    send(activity: ActivityPubObject, inboxUrl: string): Promise<Response>;
    /**
     * Fetches an actor by URL
     */
    fetchActor(actorUrl: string): Promise<Actor>;
    /**
     * Fetches a collection (outbox, followers, etc.)
     */
    fetchCollection(collectionUrl: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<Collection | CollectionPage>;
    /**
     * Performs WebFinger lookup
     */
    webfinger(acct: string): Promise<WebFingerResponse>;
    /**
     * Resolves an acct to an Actor URL
     */
    resolveActorUrl(acct: string): Promise<string>;
    /**
     * Computes SHA-256 digest for HTTP Signature
     */
    private computeDigest;
    /**
     * Signs the request using HTTP Signatures
     */
    private sign;
}
/**
 * ActivityPub error class
 */
export declare class ActivityPubError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number);
}
/**
 * Logs in with a social provider
 */
declare function login(provider: SocialProvider, tokens?: OAuthTokens): Promise<void>;
/**
 * Logs out and clears state
 */
declare function logout(): void;
/**
 * Refreshes the feed
 */
declare function refreshFeed(): Promise<void>;
/**
 * Loads more feed items
 */
declare function loadMoreFeed(): Promise<void>;
/**
 * Creates a new post
 */
declare function createPost(options: {
    content: string;
    visibility?: 'public' | 'unlisted' | 'followers' | 'direct';
    sensitive?: boolean;
    spoilerText?: string;
    replyToId?: string;
    mediaIds?: string[];
    poll?: {
        options: string[];
        expiresIn: number;
        multiple: boolean;
    };
}): Promise<FeedItem>;
/**
 * Likes a post
 */
declare function likePost(postId: string): Promise<void>;
/**
 * Unlikes a post
 */
declare function unlikePost(postId: string): Promise<void>;
/**
 * Reposts a post
 */
declare function repostPost(postId: string): Promise<void>;
/**
 * Unreposts a post
 */
declare function unrepostPost(postId: string): Promise<void>;
/**
 * Follows a user
 */
declare function followUser(userId: string): Promise<void>;
/**
 * Unfollows a user
 */
declare function unfollowUser(userId: string): Promise<void>;
/**
 * Blocks a user
 */
declare function blockUser(userId: string): Promise<void>;
/**
 * Unblocks a user
 */
declare function unblockUser(userId: string): Promise<void>;
/**
 * Mutes a user
 */
declare function muteUser(userId: string, options?: {
    notifications?: boolean;
    duration?: number;
}): Promise<void>;
/**
 * Unmutes a user
 */
declare function unmuteUser(userId: string): Promise<void>;
/**
 * Searches for accounts, posts, and hashtags
 */
declare function search(query: string, options?: {
    type?: 'accounts' | 'posts' | 'hashtags';
    limit?: number;
    offset?: number;
}): Promise<SearchResult>;
/**
 * Marks notifications as read
 */
declare function markNotificationsRead(notificationIds?: string[]): Promise<void>;
/**
 * Saves a draft post
 */
declare function saveDraft(draft: Omit<DraftPost, 'id' | 'createdAt' | 'updatedAt'>): DraftPost;
/**
 * Deletes a draft post
 */
declare function deleteDraft(draftId: string): void;
/**
 * Cleanup function
 */
declare function cleanup(): void;
/**
 * Generates ActivityPub configuration
 */
export declare function generateActivityPubConfig(options: {
    domain: string;
    username: string;
    displayName?: string;
    summary?: string;
}): {
    actor: Actor;
    webfinger: WebFingerResponse;
};
/**
 * Generates OAuth configuration for common providers
 */
export declare function generateOAuthConfig(provider: SocialProvider, options: {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
}): OAuthConfig;
export { storeState as socialStoreState, cleanup as cleanupSocialStore, };
export type { SocialStoreState, };
//# sourceMappingURL=index.d.ts.map