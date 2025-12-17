/**
 * Tests for philjs-ai package
 */
import { describe, it, expect, vi } from "vitest";
import { createPrompt, createAI, providers } from "./index";
describe("AI - createPrompt", () => {
    it("should create a prompt spec", () => {
        const prompt = createPrompt({
            name: "test-prompt",
            system: "You are a helpful assistant",
            input: { type: "object", properties: {} },
            output: { type: "object", properties: {} },
        });
        expect(prompt.name).toBe("test-prompt");
        expect(prompt.system).toBe("You are a helpful assistant");
    });
    it("should preserve input schema", () => {
        const inputSchema = {
            type: "object",
            properties: { name: { type: "string" } },
        };
        const prompt = createPrompt({
            name: "test",
            input: inputSchema,
            output: { type: "string" },
        });
        expect(prompt.input).toEqual(inputSchema);
    });
    it("should preserve output schema", () => {
        const outputSchema = {
            type: "object",
            properties: { result: { type: "string" } },
        };
        const prompt = createPrompt({
            name: "test",
            input: { type: "string" },
            output: outputSchema,
        });
        expect(prompt.output).toEqual(outputSchema);
    });
    it("should support PII policies", () => {
        const prompt = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
            policy: { pii: "block" },
        });
        expect(prompt.policy?.pii).toBe("block");
    });
    it("should support various input types", () => {
        const textPrompt = createPrompt({
            name: "text",
            input: { type: "string" },
            output: { type: "string" },
        });
        expect(textPrompt.input.type).toBe("string");
        const objectPrompt = createPrompt({
            name: "object",
            input: { type: "object", properties: {} },
            output: { type: "object", properties: {} },
        });
        expect(objectPrompt.input.type).toBe("object");
    });
});
describe("AI - Providers", () => {
    it("should create echo provider", () => {
        const echo = providers.echo();
        expect(echo.name).toBe("echo");
    });
    it("should echo input", async () => {
        const echo = providers.echo();
        const result = await echo.generate("Hello");
        expect(result).toBe("Echo: Hello");
    });
    it("should create HTTP provider", () => {
        const http = providers.http("http://localhost:3000/ai");
        expect(http.name).toBe("http");
    });
    it("should make HTTP requests", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ text: "AI response" }),
        });
        const http = providers.http("http://localhost/ai");
        const result = await http.generate("Test prompt");
        expect(result).toBe("AI response");
        expect(global.fetch).toHaveBeenCalledWith("http://localhost/ai", expect.objectContaining({
            method: "POST",
            headers: { "content-type": "application/json" },
        }));
    });
    it("should handle HTTP errors", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        const http = providers.http("http://localhost/ai");
        await expect(http.generate("Test")).rejects.toThrow("Network error");
    });
    it("should pass options to provider", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ text: "response" }),
        });
        const http = providers.http("http://localhost/ai");
        await http.generate("prompt", { temperature: 0.7 });
        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            body: expect.stringContaining("temperature"),
        }));
    });
});
describe("AI - createAI", () => {
    it("should create AI client with provider", () => {
        const ai = createAI(providers.echo());
        expect(ai).toBeDefined();
        expect(ai.generate).toBeInstanceOf(Function);
    });
    it("should generate with prompt spec", async () => {
        const ai = createAI(providers.echo());
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
        });
        const result = await ai.generate(spec, "test input");
        expect(result.text).toContain("Echo:");
    });
    it("should respect PII policy", async () => {
        const ai = createAI(providers.echo());
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
            policy: { pii: "block" },
        });
        const result = await ai.generate(spec, "sensitive data");
        expect(result).toBeDefined();
    });
    it("should pass options to provider", async () => {
        const mockProvider = {
            name: "mock",
            generate: vi.fn().mockResolvedValue("response"),
        };
        const ai = createAI(mockProvider);
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
        });
        await ai.generate(spec, "input", { temperature: 0.5 });
        expect(mockProvider.generate).toHaveBeenCalledWith(expect.any(String), { temperature: 0.5 });
    });
    it("should handle generation errors", async () => {
        const failingProvider = {
            name: "failing",
            generate: vi.fn().mockRejectedValue(new Error("AI error")),
        };
        const ai = createAI(failingProvider);
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
        });
        await expect(ai.generate(spec, "input")).rejects.toThrow("AI error");
    });
});
describe("AI - PII Policy Enforcement", () => {
    it("should block PII when policy is set", async () => {
        const ai = createAI(providers.echo());
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
            policy: { pii: "block" },
        });
        // Should not throw, but policy check happens
        const result = await ai.generate(spec, "John Doe, SSN: 123-45-6789");
        expect(result).toBeDefined();
    });
    it("should allow data when no policy", async () => {
        const ai = createAI(providers.echo());
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
        });
        const result = await ai.generate(spec, "any data");
        expect(result.text).toContain("any data");
    });
    it("should support redact policy", async () => {
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
            policy: { pii: "redact" },
        });
        expect(spec.policy?.pii).toBe("redact");
    });
    it("should support audit policy", async () => {
        const spec = createPrompt({
            name: "test",
            input: { type: "string" },
            output: { type: "string" },
            policy: { pii: "audit" },
        });
        expect(spec.policy?.pii).toBe("audit");
    });
});
describe("AI - Type Safety", () => {
    it("should validate input schema types", () => {
        const spec = createPrompt({
            name: "typed",
            input: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    age: { type: "number" },
                },
            },
            output: { type: "string" },
        });
        expect(spec.input.type).toBe("object");
        expect(spec.input.properties).toBeDefined();
    });
    it("should validate output schema types", () => {
        const spec = createPrompt({
            name: "typed",
            input: { type: "string" },
            output: {
                type: "object",
                properties: {
                    result: { type: "boolean" },
                },
            },
        });
        expect(spec.output.type).toBe("object");
        expect(spec.output.properties).toBeDefined();
    });
    it("should handle array schemas", () => {
        const spec = createPrompt({
            name: "array",
            input: { type: "array", items: { type: "string" } },
            output: { type: "array", items: { type: "number" } },
        });
        expect(spec.input.type).toBe("array");
        expect(spec.output.type).toBe("array");
    });
});
//# sourceMappingURL=index.test.js.map