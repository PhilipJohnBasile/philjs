import { describe, it, expect } from 'vitest';
describe('philjs-migrate', () => {
    it('should be importable', async () => {
        const mod = await import('./index');
        expect(mod).toBeDefined();
    });
});
//# sourceMappingURL=index.test.js.map