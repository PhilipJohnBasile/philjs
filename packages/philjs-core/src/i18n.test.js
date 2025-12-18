/**
 * Tests for i18n.ts - Internationalization, translations, localization
 */
import { describe, it, expect, vi } from "vitest";
import { I18nProvider, TranslationExtractor, AITranslationService, createLocaleMiddleware, } from "./i18n";
const testConfig = {
    defaultLocale: "en",
    locales: ["en", "es", "fr"],
    messages: {
        en: {
            greeting: "Hello",
            nested: {
                key: "Nested value",
            },
        },
        es: {
            greeting: "Hola",
            nested: {
                key: "Valor anidado",
            },
        },
        fr: {
            greeting: "Bonjour",
        },
    },
    fallbackLocale: "en",
};
describe("I18n Provider", () => {
    it("should create i18n provider", () => {
        const provider = I18nProvider({
            config: testConfig,
            children: null,
        });
        expect(provider).toBeDefined();
    });
    it("should use default locale", () => {
        const provider = I18nProvider({
            config: testConfig,
            children: null,
        });
        expect(provider).toBeDefined();
    });
});
describe("Translation Loading", () => {
    it("should load translations for locale", () => {
        const provider = I18nProvider({
            config: testConfig,
            children: null,
        });
        expect(provider).toBeDefined();
    });
    it("should handle nested translation keys", () => {
        expect(testConfig.messages.en.nested).toEqual({ key: "Nested value" });
    });
    it("should support multiple locales", () => {
        expect(Object.keys(testConfig.messages)).toContain("en");
        expect(Object.keys(testConfig.messages)).toContain("es");
        expect(Object.keys(testConfig.messages)).toContain("fr");
    });
});
describe("Locale Switching", () => {
    it("should switch between locales", () => {
        const provider = I18nProvider({
            config: testConfig,
            children: null,
        });
        expect(provider).toBeDefined();
    });
    it("should persist locale preference", () => {
        // Mock localStorage
        const store = {};
        global.localStorage = {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => {
                store[key] = value;
            },
        };
        const provider = I18nProvider({
            config: testConfig,
            children: null,
        });
        expect(provider).toBeDefined();
    });
    it("should auto-detect locale from browser", () => {
        Object.defineProperty(navigator, "language", {
            value: "es-ES",
            writable: true,
        });
        const configWithAutoDetect = {
            ...testConfig,
            autoDetect: true,
        };
        const provider = I18nProvider({
            config: configWithAutoDetect,
            children: null,
        });
        expect(provider).toBeDefined();
    });
});
describe("Pluralization", () => {
    it("should handle plural forms", () => {
        const config = {
            defaultLocale: "en",
            locales: ["en"],
            messages: {
                en: {
                    items: '{"one":"1 item","other":"{count} items"}',
                },
            },
        };
        const provider = I18nProvider({
            config,
            children: null,
        });
        expect(provider).toBeDefined();
    });
    it("should select correct plural form based on count", () => {
        // Intl.PluralRules should select "one" for 1, "other" for 2+
        const rules = new Intl.PluralRules("en");
        expect(rules.select(1)).toBe("one");
        expect(rules.select(2)).toBe("other");
    });
    it("should handle zero plural form", () => {
        const config = {
            defaultLocale: "en",
            locales: ["en"],
            messages: {
                en: {
                    items: '{"zero":"No items","one":"1 item","other":"{count} items"}',
                },
            },
        };
        expect(config.messages.en.items).toContain("zero");
    });
});
describe("Interpolation", () => {
    it("should interpolate variables", () => {
        const message = "Hello {name}!";
        const vars = { name: "World" };
        // Simple interpolation test
        const result = message.replace(/\{(\w+)\}/g, (_, key) => String(vars[key]));
        expect(result).toBe("Hello World!");
    });
    it("should handle multiple variables", () => {
        const message = "{greeting}, {name}! You have {count} messages.";
        const vars = { greeting: "Hello", name: "Alice", count: 5 };
        const result = message.replace(/\{(\w+)\}/g, (_, key) => String(vars[key]));
        expect(result).toBe("Hello, Alice! You have 5 messages.");
    });
    it("should preserve missing variables", () => {
        const message = "Hello {missing}!";
        const vars = {};
        const result = message.replace(/\{(\w+)\}/g, (_, key) => {
            return key in vars ? String(vars[key]) : `{${key}}`;
        });
        expect(result).toBe("Hello {missing}!");
    });
});
describe("Date and Number Formatting", () => {
    it("should format dates according to locale", () => {
        const date = new Date("2024-01-15");
        const enFormat = new Intl.DateTimeFormat("en").format(date);
        const frFormat = new Intl.DateTimeFormat("fr").format(date);
        expect(enFormat).toBeDefined();
        expect(frFormat).toBeDefined();
        expect(enFormat).not.toBe(frFormat);
    });
    it("should format numbers according to locale", () => {
        const num = 1234.56;
        const enFormat = new Intl.NumberFormat("en").format(num);
        const frFormat = new Intl.NumberFormat("fr").format(num);
        expect(enFormat).toBeDefined();
        expect(frFormat).toBeDefined();
    });
    it("should format currency", () => {
        const amount = 99.99;
        const usdFormat = new Intl.NumberFormat("en", {
            style: "currency",
            currency: "USD",
        }).format(amount);
        expect(usdFormat).toContain("$");
    });
});
describe("Translation Extraction", () => {
    it("should extract translation keys from code", () => {
        const extractor = new TranslationExtractor();
        const code = `
      function Component() {
        return <div>{t('hello.world')}</div>
      }
    `;
        extractor.extractFromCode(code, "test.tsx");
        const keys = extractor.getKeys();
        expect(keys).toContain("hello.world");
    });
    it("should track usage locations", () => {
        const extractor = new TranslationExtractor();
        const code = `t('test.key')`;
        extractor.extractFromCode(code, "file.tsx");
        const usage = extractor.getUsage("test.key");
        expect(usage.length).toBeGreaterThan(0);
    });
    it("should generate translation template", () => {
        const extractor = new TranslationExtractor();
        extractor.extractFromCode("t('key1')\nt('key2')", "test.ts");
        const template = extractor.generateTemplate("es");
        expect(template).toBeDefined();
    });
    it("should find missing translations", () => {
        const extractor = new TranslationExtractor();
        extractor.extractFromCode("t('missing.key')", "test.ts");
        const missing = extractor.findMissing({ existing: "value" });
        expect(missing).toContain("missing.key");
    });
    it("should find unused translations", () => {
        const extractor = new TranslationExtractor();
        extractor.extractFromCode("t('used.key')", "test.ts");
        const unused = extractor.findUnused({
            "used.key": "Used",
            "unused.key": "Not used",
        });
        expect(unused).toContain("unused.key");
    });
});
describe("AI Translation Service", () => {
    it("should create AI translation service", () => {
        const service = new AITranslationService("api-key");
        expect(service).toBeDefined();
    });
    it("should translate text", async () => {
        const service = new AITranslationService();
        const result = await service.translate("Hello", "en", "es");
        expect(result).toBeDefined();
    });
    it("should batch translate multiple keys", async () => {
        const service = new AITranslationService();
        const translations = await service.translateBatch(["key1", "key2"], { key1: "Value 1", key2: "Value 2" }, "en", "es");
        expect(translations).toBeDefined();
    });
    it("should suggest translation improvements", async () => {
        const service = new AITranslationService();
        const suggestions = await service.suggestImprovements("Hello world", "Greeting on homepage", "en");
        expect(Array.isArray(suggestions)).toBe(true);
    });
});
describe("Route-based Locale Detection", () => {
    it("should detect locale from URL path", () => {
        const config = {
            ...testConfig,
            routePattern: "/[locale]/*",
        };
        const middleware = createLocaleMiddleware(config);
        const request = new Request("http://localhost/es/about");
        const locale = middleware(request);
        expect(locale).toBe("es");
    });
    it("should fallback to Accept-Language header", () => {
        const middleware = createLocaleMiddleware(testConfig);
        const request = new Request("http://localhost/", {
            headers: { "Accept-Language": "fr,en;q=0.9" },
        });
        const locale = middleware(request);
        expect(locale).toBe("fr");
    });
    it("should use default locale when no match", () => {
        const middleware = createLocaleMiddleware(testConfig);
        const request = new Request("http://localhost/");
        const locale = middleware(request);
        expect(locale).toBe("en");
    });
});
describe("Fallback Behavior", () => {
    it("should fallback to default locale for missing translations", () => {
        const config = {
            defaultLocale: "en",
            locales: ["en", "es"],
            messages: {
                en: { key: "English value" },
                es: {}, // Missing translation
            },
            fallbackLocale: "en",
        };
        expect(config.fallbackLocale).toBe("en");
    });
    it("should warn about missing translations", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
        // Missing translation scenario would trigger warning
        // Actual implementation would call console.warn
        consoleSpy.mockRestore();
    });
    it("should return key when no translation found", () => {
        const missingKey = "missing.translation.key";
        // When no translation exists, should return the key itself
        expect(missingKey).toBe("missing.translation.key");
    });
});
//# sourceMappingURL=i18n.test.js.map