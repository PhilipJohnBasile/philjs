/**
 * Shared storage types and base client.
 */
// ============================================================================
// Abstract Storage Client
// ============================================================================
/**
 * Abstract storage client - base class for all storage providers
 */
export class StorageClient {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Get the bucket name
     */
    get bucket() {
        return this.config.bucket;
    }
    /**
     * Build full key with base path
     */
    buildKey(key) {
        if (this.config.basePath) {
            return `${this.config.basePath.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
        }
        return key.replace(/^\//, '');
    }
    /**
     * Strip base path from key
     */
    stripBasePath(key) {
        if (this.config.basePath) {
            const prefix = this.config.basePath.replace(/\/$/, '') + '/';
            if (key.startsWith(prefix)) {
                return key.slice(prefix.length);
            }
        }
        return key;
    }
    /**
     * Move a file to a new location
     *
     * @param sourceKey - Source file key/path
     * @param destinationKey - Destination file key/path
     * @param options - Move options
     * @returns Moved file metadata
     */
    async move(sourceKey, destinationKey, options) {
        const copied = await this.copy(sourceKey, destinationKey, options);
        await this.delete(sourceKey);
        return copied;
    }
}
//# sourceMappingURL=client.js.map