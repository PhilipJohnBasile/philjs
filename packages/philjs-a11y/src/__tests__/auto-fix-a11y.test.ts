import { describe, it, expect } from 'vitest';
import { AutoA11y } from '../auto-fix-a11y.js';

describe('PhilJS A11y: Auto-Fix', () => {
    it('should add alt text to images', () => {
        const code = `<img src="cat.jpg" />`;
        const fixed = AutoA11y.fix(code);
        expect(fixed).toContain('alt="Image of cat.jpg"'); // or similar heuristic
    });

    it('should ensure button has content', () => {
        const code = `<button class="icon-btn"></button>`;
        const fixed = AutoA11y.fix(code);
        expect(fixed).toContain('aria-label');
    });

    it('should check contrast ratios', () => {
        const issue = AutoA11y.checkContrast('#ffffff', '#ffffff'); // White on White
        expect(issue.pass).toBe(false);
    });
});
