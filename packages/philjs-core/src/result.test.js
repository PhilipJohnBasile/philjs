import { describe, it, expect } from 'vitest';
import { Ok, Err, isResult, isOk, isErr, map, mapErr, andThen, unwrap, unwrapOr, matchResult } from './result.js';
describe('Result', () => {
    it('creates Ok and Err variants', () => {
        const ok = Ok(42);
        const err = Err('fail');
        expect(ok.ok).toBe(true);
        expect(ok.value).toBe(42);
        expect(err.ok).toBe(false);
        expect(err.error).toBe('fail');
    });
    it('detects result instances', () => {
        expect(isResult(Ok(1))).toBe(true);
        expect(isResult(Err('x'))).toBe(true);
        expect(isResult({})).toBe(false);
    });
    it('maps values and errors', () => {
        expect(map(Ok(2), (n) => n * 2)).toEqual(Ok(4));
        expect(mapErr(Err('oops'), (e) => `err:${e}`)).toEqual(Err('err:oops'));
    });
    it('chains with andThen', () => {
        const result = andThen(Ok(2), (n) => Ok(n * 3));
        expect(result).toEqual(Ok(6));
    });
    it('unwraps values and errors', () => {
        expect(unwrap(Ok('ok'))).toBe('ok');
        expect(() => unwrap(Err('bad'))).toThrow();
        expect(unwrapOr(Err('bad'), 'fallback')).toBe('fallback');
    });
    it('matches results', () => {
        const ok = matchResult(Ok(1), {
            ok: (v) => v + 1,
            err: () => 0,
        });
        const err = matchResult(Err('x'), {
            ok: () => 1,
            err: (e) => e.length,
        });
        expect(ok).toBe(2);
        expect(err).toBe(1);
    });
    it('identifies ok/err variants', () => {
        const ok = Ok(1);
        const err = Err('boom');
        expect(isOk(ok)).toBe(true);
        expect(isErr(ok)).toBe(false);
        expect(isOk(err)).toBe(false);
        expect(isErr(err)).toBe(true);
    });
});
//# sourceMappingURL=result.test.js.map