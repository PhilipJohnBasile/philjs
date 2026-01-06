import { describe, it, expect } from 'vitest';
import { AutoSAST } from '../auto-sast.js';

describe('PhilJS Security: Auto-SAST', () => {
    it('should detect hardcoded secrets', () => {
        const vulnerableCode = `const apiKey = "sk_live_123456789";`;
        const issues = AutoSAST.scan(vulnerableCode);

        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0].type).toBe('secret');
    });

    it('should detect SQL injection patterns', () => {
        const vulnerableCode = `db.query("SELECT * FROM users WHERE id = " + input)`;
        const issues = AutoSAST.scan(vulnerableCode);

        expect(issues.length).toBeGreaterThan(0);
        expect(issues.some(i => i.type === 'sql-injection')).toBe(true);
    });

    it('should propose fixes', () => {
        const code = `eval(userInput)`;
        const fix = AutoSAST.proposeFix(code, 'eval-detected');

        expect(fix).not.toContain('eval(');
        // Might suggest JSON.parse or similar depending on impl
    });
});
