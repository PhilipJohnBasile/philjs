/**
 * API Integration PhilJS Plugin Template
 * Template for creating plugins that integrate with external APIs
 */

import type { Plugin, PluginContext } from "@philjs/core/plugin-system";

/**
 * API configuration
 */
export interface {{PLUGIN_NAME}}Config {
  /** Enable the plugin */
  enabled?: boolean;
  /** API base URL */
  baseUrl: string;
  /** API key or token */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable request caching */
  cache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Enable request retries */
  retry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * API request options
 */
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * API response
 */
interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * Cache entry
 */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache
 */
const cache = new Map<string, CacheEntry>();

/**
 * API client class
 */
class ApiClient {
  private config: Required<{{PLUGIN_NAME}}Config>;

  constructor(config: {{PLUGIN_NAME}}Config) {
    this.config = {
      enabled: true,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || "",
      timeout: config.timeout || 30000,
      cache: config.cache || false,
      cacheTTL: config.cacheTTL || 300,
      retry: config.retry || true,
      maxRetries: config.maxRetries || 3,
      headers: config.headers || {},
    };
  }

  /**
   * Make an API request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers = {}, body, timeout } = options;
    const url = `${this.config.baseUrl}${endpoint}`;
    const cacheKey = `${method}:${url}:${JSON.stringify(body || {})}`;

    // Check cache for GET requests
    if (method === "GET" && this.config.cache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...headers,
    };

    if (this.config.apiKey) {
      requestHeaders["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout || this.config.timeout
    );

    try {
      const response = await this.fetchWithRetry(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const result: ApiResponse<T> = {
        data,
        status: response.status,
        headers: responseHeaders,
      };

      // Cache successful GET responses
      if (method === "GET" && this.config.cache && response.ok) {
        this.setInCache(cacheKey, data);
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      // Retry on 5xx errors
      if (response.status >= 500 && this.config.retry && attempt < this.config.maxRetries) {
        await this.delay(Math.pow(2, attempt) * 1000);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      if (this.config.retry && attempt < this.config.maxRetries) {
        await this.delay(Math.pow(2, attempt) * 1000);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      cache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      status: 200,
      headers: { "x-cache": "HIT" },
    };
  }

  /**
   * Set in cache
   */
  private setInCache<T>(key: string, data: T): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    cache.clear();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Convenience methods
  get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Global client instance
let client: ApiClient | null = null;

/**
 * Get the API client instance
 */
export function getApiClient(): ApiClient {
  if (!client) {
    throw new Error("API client not initialized. Call the plugin setup first.");
  }
  return client;
}

/**
 * Create {{PLUGIN_NAME}} plugin
 */
export function create{{PLUGIN_NAME}}Plugin(
  pluginConfig: {{PLUGIN_NAME}}Config
): Plugin {
  return {
    meta: {
      name: "{{PACKAGE_NAME}}",
      version: "0.1.0",
      description: "{{DESCRIPTION}}",
      author: "{{AUTHOR}}",
      license: "{{LICENSE}}",
      philjs: "^0.1.0",
    },

    configSchema: {
      type: "object",
      required: ["baseUrl"],
      properties: {
        baseUrl: {
          type: "string",
          description: "API base URL",
        },
        apiKey: {
          type: "string",
          description: "API key or token",
        },
        timeout: {
          type: "number",
          description: "Request timeout in milliseconds",
          default: 30000,
        },
        cache: {
          type: "boolean",
          description: "Enable request caching",
          default: false,
        },
        retry: {
          type: "boolean",
          description: "Enable request retries",
          default: true,
        },
      },
    },

    async setup(config: {{PLUGIN_NAME}}Config, ctx: PluginContext) {
      ctx.logger.info("Setting up {{PLUGIN_NAME}}...");

      if (!config.enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      // Initialize API client
      client = new ApiClient(config);

      // Generate API client file
      const clientCode = `
/**
 * API Client
 * Auto-generated by {{PACKAGE_NAME}}
 */

import { getApiClient } from '{{PACKAGE_NAME}}';

export const api = getApiClient();

// Usage:
// const response = await api.get('/users');
// const user = await api.post('/users', { name: 'John' });
`;

      try {
        await ctx.fs.mkdir("src/lib", { recursive: true });
        await ctx.fs.writeFile("src/lib/api.ts", clientCode);
        ctx.logger.success("Created API client file");
      } catch (error) {
        ctx.logger.warn("Could not create API client file");
      }

      ctx.logger.success("{{PLUGIN_NAME}} setup complete!");
      ctx.logger.info(`API base URL: ${config.baseUrl}`);
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("{{PLUGIN_NAME}} initialized");
      },

      async buildStart(ctx, buildConfig) {
        ctx.logger.debug("Build starting...");
      },

      async buildEnd(ctx, result) {
        if (result.success) {
          ctx.logger.success("Build completed successfully");
        }
      },
    },
  };
}

export default create{{PLUGIN_NAME}}Plugin;
