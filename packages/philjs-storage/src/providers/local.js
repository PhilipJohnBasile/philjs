/**
 * Local Filesystem Storage Provider
 *
 * File-based storage for development, testing, and self-hosted deployments.
 * Supports all StorageClient operations with local files.
 *
 * Optimized for Node 24+ with:
 * - Native ReadableStream
 * - Efficient buffer operations
 * - Modern async patterns
 */
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { StorageClient, } from '../client.js';
import { detectMimeType } from '../utils/mime.js';
/**
 * Local filesystem storage client
 */
export class LocalStorageClient extends StorageClient {
    directory;
    publicUrl;
    localConfig;
    metadataDir;
    constructor(config) {
        super(config);
        this.localConfig = config;
        this.directory = path.resolve(config.directory);
        if (config.publicUrl !== undefined) {
            this.publicUrl = config.publicUrl;
        }
        this.metadataDir = path.join(this.directory, '.metadata');
        // Ensure directories exist
        fs.mkdirSync(this.directory, { recursive: true });
        fs.mkdirSync(this.metadataDir, { recursive: true });
    }
    getFilePath(key) {
        const fullKey = this.buildKey(key);
        return path.join(this.directory, fullKey);
    }
    getMetadataPath(key) {
        const fullKey = this.buildKey(key);
        const hash = crypto.createHash('md5').update(fullKey).digest('hex');
        return path.join(this.metadataDir, `${hash}.json`);
    }
    async saveMetadata(key, metadata) {
        const metadataPath = this.getMetadataPath(key);
        await fsp.writeFile(metadataPath, JSON.stringify(metadata));
    }
    async loadMetadata(key) {
        try {
            const metadataPath = this.getMetadataPath(key);
            const data = await fsp.readFile(metadataPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async deleteMetadata(key) {
        try {
            const metadataPath = this.getMetadataPath(key);
            await fsp.unlink(metadataPath);
        }
        catch {
            // Ignore if metadata doesn't exist
        }
    }
    async upload(key, data, options = {}) {
        const filePath = this.getFilePath(key);
        const contentType = options.contentType || detectMimeType(key);
        // Ensure directory exists
        await fsp.mkdir(path.dirname(filePath), { recursive: true });
        // Convert data to Buffer
        let buffer;
        if (typeof data === 'string') {
            buffer = Buffer.from(data, 'utf-8');
        }
        else if (data instanceof Blob) {
            buffer = Buffer.from(await data.arrayBuffer());
        }
        else if (Buffer.isBuffer(data)) {
            buffer = data;
        }
        else {
            // ReadableStream - collect to buffer
            const chunks = [];
            const reader = data.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                chunks.push(value);
            }
            buffer = Buffer.concat(chunks);
        }
        // Write file with progress
        if (options.onProgress) {
            const writeStream = fs.createWriteStream(filePath);
            const chunkSize = 64 * 1024;
            let offset = 0;
            return new Promise((resolve, reject) => {
                const writeChunk = () => {
                    const chunk = buffer.subarray(offset, offset + chunkSize);
                    if (chunk.length === 0) {
                        writeStream.end(async () => {
                            const metadataToSave = { contentType };
                            if (options.metadata !== undefined) {
                                metadataToSave.metadata = options.metadata;
                            }
                            await this.saveMetadata(key, metadataToSave);
                            const metadata = await this.getMetadata(key);
                            resolve(metadata);
                        });
                        return;
                    }
                    offset += chunk.length;
                    options.onProgress({
                        loaded: offset,
                        total: buffer.length,
                        percentage: Math.round((offset / buffer.length) * 100),
                    });
                    if (!writeStream.write(chunk)) {
                        writeStream.once('drain', writeChunk);
                    }
                    else {
                        setImmediate(writeChunk);
                    }
                };
                writeStream.on('error', reject);
                writeChunk();
            });
        }
        await fsp.writeFile(filePath, buffer);
        const metadataToSave = { contentType };
        if (options.metadata !== undefined) {
            metadataToSave.metadata = options.metadata;
        }
        await this.saveMetadata(key, metadataToSave);
        const metadata = await this.getMetadata(key);
        return metadata;
    }
    async download(key, options = {}) {
        const filePath = this.getFilePath(key);
        try {
            const buffer = await fsp.readFile(filePath);
            // Handle range requests
            if (options.rangeStart !== undefined || options.rangeEnd !== undefined) {
                const start = options.rangeStart || 0;
                const end = options.rangeEnd !== undefined ? options.rangeEnd + 1 : buffer.length;
                const sliced = buffer.slice(start, end);
                if (options.onProgress) {
                    options.onProgress({
                        loaded: sliced.length,
                        total: sliced.length,
                        percentage: 100,
                    });
                }
                return sliced;
            }
            if (options.onProgress) {
                options.onProgress({
                    loaded: buffer.length,
                    total: buffer.length,
                    percentage: 100,
                });
            }
            return buffer;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${key}`);
            }
            throw error;
        }
    }
    async downloadStream(key, options = {}) {
        const filePath = this.getFilePath(key);
        const streamOptions = {};
        if (options.rangeStart !== undefined) {
            streamOptions.start = options.rangeStart;
        }
        if (options.rangeEnd !== undefined) {
            streamOptions.end = options.rangeEnd;
        }
        const nodeStream = fs.createReadStream(filePath, streamOptions);
        // Node 24+: Use native Readable.toWeb() for efficient stream conversion
        return Readable.toWeb(nodeStream);
    }
    async delete(key) {
        const filePath = this.getFilePath(key);
        try {
            await fsp.unlink(filePath);
            await this.deleteMetadata(key);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async deleteMany(keys) {
        await Promise.all(keys.map((key) => this.delete(key)));
    }
    async list(options = {}) {
        const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath || '';
        const searchDir = path.join(this.directory, prefix);
        const files = [];
        const prefixes = new Set();
        try {
            const entries = await this.listRecursive(searchDir, options.delimiter);
            for (const entry of entries) {
                const relativePath = path.relative(this.directory, entry.path);
                const key = this.stripBasePath(relativePath.replace(/\\/g, '/'));
                if (options.delimiter) {
                    // Check if this is a "directory"
                    const afterPrefix = key.slice(options.prefix?.length || 0);
                    const delimiterIndex = afterPrefix.indexOf(options.delimiter);
                    if (delimiterIndex !== -1) {
                        // This is inside a subdirectory
                        const prefixKey = (options.prefix || '') + afterPrefix.slice(0, delimiterIndex + 1);
                        prefixes.add(prefixKey);
                        continue;
                    }
                }
                const savedMetadata = await this.loadMetadata(key);
                const file = {
                    key,
                    size: entry.stats.size,
                    contentType: savedMetadata?.contentType || detectMimeType(key),
                    lastModified: entry.stats.mtime,
                    etag: crypto.createHash('md5').update(`${entry.stats.ino}-${entry.stats.mtime.getTime()}`).digest('hex'),
                };
                if (savedMetadata?.metadata !== undefined) {
                    file.metadata = savedMetadata.metadata;
                }
                files.push(file);
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
        // Apply pagination (simple implementation)
        const maxResults = options.maxResults || 1000;
        const startIndex = options.continuationToken ? parseInt(options.continuationToken, 10) : 0;
        const paginatedFiles = files.slice(startIndex, startIndex + maxResults);
        const hasMore = startIndex + maxResults < files.length;
        const result = {
            files: paginatedFiles,
            prefixes: Array.from(prefixes),
            isTruncated: hasMore,
        };
        if (hasMore) {
            result.nextToken = String(startIndex + maxResults);
        }
        return result;
    }
    async listRecursive(dir, delimiter) {
        const results = [];
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                // Skip metadata directory
                if (entry.name === '.metadata')
                    continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!delimiter) {
                        // Recurse into subdirectories
                        const subResults = await this.listRecursive(fullPath, delimiter);
                        results.push(...subResults);
                    }
                }
                else if (entry.isFile()) {
                    const stats = await fsp.stat(fullPath);
                    results.push({ path: fullPath, stats });
                }
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
        return results;
    }
    async getMetadata(key) {
        const filePath = this.getFilePath(key);
        try {
            const stats = await fsp.stat(filePath);
            const savedMetadata = await this.loadMetadata(key);
            const file = {
                key,
                size: stats.size,
                contentType: savedMetadata?.contentType || detectMimeType(key),
                lastModified: stats.mtime,
                etag: crypto.createHash('md5').update(`${stats.ino}-${stats.mtime.getTime()}`).digest('hex'),
            };
            if (savedMetadata?.metadata !== undefined) {
                file.metadata = savedMetadata.metadata;
            }
            return file;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
    async exists(key) {
        const filePath = this.getFilePath(key);
        try {
            await fsp.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getSignedUrl(key, options = {}) {
        // For local storage, generate a simple signed URL with expiration
        const expiresIn = options.expiresIn || 3600;
        const expires = Date.now() + expiresIn * 1000;
        const fullKey = this.buildKey(key);
        // Create a simple signature
        const signature = crypto
            .createHmac('sha256', 'local-storage-secret')
            .update(`${fullKey}:${expires}:${options.method || 'GET'}`)
            .digest('hex');
        const baseUrl = this.publicUrl || `file://${this.directory}`;
        const params = new URLSearchParams({
            expires: String(expires),
            signature,
        });
        if (options.method === 'PUT') {
            params.set('method', 'PUT');
        }
        return `${baseUrl}/${fullKey}?${params.toString()}`;
    }
    async copy(sourceKey, destinationKey, options = {}) {
        const sourcePath = this.getFilePath(sourceKey);
        const destPath = options.destinationBucket
            ? path.join(options.destinationBucket, this.buildKey(destinationKey))
            : this.getFilePath(destinationKey);
        // Ensure destination directory exists
        await fsp.mkdir(path.dirname(destPath), { recursive: true });
        // Copy file
        await fsp.copyFile(sourcePath, destPath);
        // Copy or update metadata
        const sourceMetadata = await this.loadMetadata(sourceKey);
        const metadataToSave = {
            contentType: options.contentType || sourceMetadata?.contentType || detectMimeType(destinationKey),
        };
        const resolvedMetadata = options.metadata || sourceMetadata?.metadata;
        if (resolvedMetadata !== undefined) {
            metadataToSave.metadata = resolvedMetadata;
        }
        await this.saveMetadata(destinationKey, metadataToSave);
        const metadata = await this.getMetadata(destinationKey);
        return metadata;
    }
    getPublicUrl(key) {
        const fullKey = this.buildKey(key);
        if (this.publicUrl) {
            return `${this.publicUrl.replace(/\/$/, '')}/${fullKey}`;
        }
        return `file://${this.getFilePath(key)}`;
    }
}
//# sourceMappingURL=local.js.map