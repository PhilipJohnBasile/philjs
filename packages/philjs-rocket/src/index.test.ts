/**
 * Tests for philjs-rocket package
 */

import { describe, it, expect } from 'vitest';
import {
  createRocketApp,
  parseFormData,
  generateCsrfToken,
} from './index';

describe('RocketAppBuilder', () => {
  describe('createRocketApp', () => {
    it('should create an app builder with defaults', () => {
      const app = createRocketApp();
      const config = app.build();

      expect(config.ssr?.enabled).toBe(true);
      expect(config.ssr?.streaming).toBe(false);
      expect(config.ssr?.hydration).toBe(true);
      expect(config.liveview?.enabled).toBe(false);
      expect(config.cors?.enabled).toBe(false);
      expect(config.security?.enabled).toBe(true);
    });

    it('should apply initial config', () => {
      const app = createRocketApp({
        ssr: { streaming: true },
      });
      const config = app.build();

      expect(config.ssr?.streaming).toBe(true);
    });
  });

  describe('withSSR', () => {
    it('should enable SSR with options', () => {
      const config = createRocketApp()
        .withSSR({ streaming: true, hydration: false })
        .build();

      expect(config.ssr?.enabled).toBe(true);
      expect(config.ssr?.streaming).toBe(true);
      expect(config.ssr?.hydration).toBe(false);
    });
  });

  describe('withLiveView', () => {
    it('should enable LiveView', () => {
      const config = createRocketApp()
        .withLiveView({ debounceMs: 100 })
        .build();

      expect(config.liveview?.enabled).toBe(true);
      expect(config.liveview?.debounceMs).toBe(100);
    });
  });

  describe('withCORS', () => {
    it('should enable CORS', () => {
      const config = createRocketApp()
        .withCORS({ allowOrigins: ['http://localhost:3000'] })
        .build();

      expect(config.cors?.enabled).toBe(true);
      expect(config.cors?.allowOrigins).toEqual(['http://localhost:3000']);
    });
  });

  describe('withSecurity', () => {
    it('should configure security', () => {
      const config = createRocketApp()
        .withSecurity({ contentSecurityPolicy: "default-src 'self'" })
        .build();

      expect(config.security?.enabled).toBe(true);
      expect(config.security?.contentSecurityPolicy).toBe("default-src 'self'");
    });
  });

  describe('toRustConfig', () => {
    it('should generate Rust configuration', () => {
      const app = createRocketApp()
        .withSSR({ streaming: true })
        .withLiveView();

      const rustCode = app.toRustConfig();

      expect(rustCode).toContain('use philjs_rocket::prelude::*');
      expect(rustCode).toContain('streaming: true');
      expect(rustCode).toContain('liveview');
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const config = createRocketApp()
        .withSSR({ streaming: true })
        .withLiveView()
        .withCORS({ allowOrigins: ['*'] })
        .withSecurity()
        .build();

      expect(config.ssr?.streaming).toBe(true);
      expect(config.liveview?.enabled).toBe(true);
      expect(config.cors?.enabled).toBe(true);
      expect(config.security?.enabled).toBe(true);
    });
  });
});

describe('Forms', () => {
  describe('parseFormData', () => {
    it('should parse form data string', () => {
      const formData = parseFormData('name=John&email=john@example.com');

      expect(formData.name).toBe('John');
      expect(formData.email).toBe('john@example.com');
    });

    it('should decode URL-encoded values', () => {
      const formData = parseFormData('message=Hello%20World');

      expect(formData.message).toBe('Hello World');
    });

    it('should handle empty values', () => {
      const formData = parseFormData('field=');

      expect(formData.field).toBe('');
    });

    it('should handle multiple values', () => {
      const formData = parseFormData('tags=a&tags=b&tags=c');

      expect(formData.tags).toEqual(['a', 'b', 'c']);
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).toBeDefined();
      expect(token1.length).toBeGreaterThan(20);
      expect(token1).not.toBe(token2);
    });
  });
});

describe('Module Exports', () => {
  it('should export RocketAppBuilder class', async () => {
    const module = await import('./index');
    expect(module.RocketAppBuilder).toBeDefined();
  });

  it('should export fairing utilities', async () => {
    const module = await import('./index');
    expect(module.PhilJsFairing).toBeDefined();
    expect(module.SSRFairing).toBeDefined();
    expect(module.LiveViewFairing).toBeDefined();
  });

  it('should export guard utilities', async () => {
    const module = await import('./index');
    expect(module.RequestGuard).toBeDefined();
    expect(module.AuthGuard).toBeDefined();
    expect(module.CSRFGuard).toBeDefined();
  });

  it('should export responder utilities', async () => {
    const module = await import('./index');
    expect(module.HtmlResponder).toBeDefined();
    expect(module.JsonResponder).toBeDefined();
    expect(module.StreamResponder).toBeDefined();
  });

  it('should export template utilities', async () => {
    const module = await import('./index');
    expect(module.TemplateEngine).toBeDefined();
    expect(module.LayoutBuilder).toBeDefined();
  });

  it('should export websocket utilities', async () => {
    const module = await import('./index');
    expect(module.WebSocketConfig).toBeDefined();
    expect(module.LiveViewSocketBuilder).toBeDefined();
  });

  it('should export state utilities', async () => {
    const module = await import('./index');
    expect(module.createManagedState).toBeDefined();
    expect(module.createStateManager).toBeDefined();
    expect(module.GlobalState).toBeDefined();
  });

  it('should export middleware', async () => {
    const module = await import('./index');
    expect(module.SSRMiddleware).toBeDefined();
    expect(module.CORSMiddleware).toBeDefined();
    expect(module.SecurityMiddleware).toBeDefined();
  });

  it('should export SSR utilities', async () => {
    const module = await import('./index');
    expect(module.SSRRenderer).toBeDefined();
    expect(module.createSSRRenderer).toBeDefined();
    expect(module.generateSEOMeta).toBeDefined();
  });

  it('should export handler utilities', async () => {
    const module = await import('./index');
    expect(module.ResponseBuilder).toBeDefined();
    expect(module.html).toBeDefined();
    expect(module.json).toBeDefined();
    expect(module.redirect).toBeDefined();
  });

  it('should export server utilities', async () => {
    const module = await import('./index');
    expect(module.RocketServer).toBeDefined();
    expect(module.createRocketServer).toBeDefined();
    expect(module.createDevServer).toBeDefined();
    expect(module.createProdServer).toBeDefined();
  });
});

describe('Type Exports', () => {
  it('should have proper TypeScript types', () => {
    // This test just verifies the module can be imported without type errors
    const importTest = async () => {
      const {
        createRocketApp,
        parseFormData,
        generateCsrfToken,
      } = await import('./index');

      // Verify functions exist and are callable
      expect(typeof createRocketApp).toBe('function');
      expect(typeof parseFormData).toBe('function');
      expect(typeof generateCsrfToken).toBe('function');
    };

    return expect(importTest()).resolves.toBeUndefined();
  });
});
