/**
 * Utilities for parsing AI responses
 */
/**
 * Extract code blocks from markdown
 */
export function extractCodeBlocks(text) {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        blocks.push({
            language: match[1] || 'text',
            code: match[2].trim(),
        });
    }
    return blocks;
}
/**
 * Extract JSON from text (handles both markdown and plain JSON)
 */
export function extractJSON(text) {
    try {
        // Try to parse as plain JSON first
        return JSON.parse(text);
    }
    catch {
        // Try to extract from code blocks
        const blocks = extractCodeBlocks(text);
        const jsonBlock = blocks.find(b => b.language === 'json');
        if (jsonBlock) {
            try {
                return JSON.parse(jsonBlock.code);
            }
            catch {
                return null;
            }
        }
        // Try to find JSON in text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
/**
 * Extract first TypeScript/JavaScript code block
 */
export function extractCode(text) {
    const blocks = extractCodeBlocks(text);
    const codeBlock = blocks.find(b => b.language === 'typescript' ||
        b.language === 'ts' ||
        b.language === 'javascript' ||
        b.language === 'js' ||
        b.language === 'tsx' ||
        b.language === 'jsx');
    return codeBlock?.code || null;
}
/**
 * Clean up code: remove markdown artifacts, normalize whitespace
 */
export function cleanCode(code) {
    return code
        .replace(/^```[\w]*\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();
}
/**
 * Extract imports from code
 */
export function extractImports(code) {
    const imports = [];
    const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        imports.push(match[1]);
    }
    return imports;
}
/**
 * Extract component name from code
 */
export function extractComponentName(code) {
    // Try function declarations
    const functionMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/);
    if (functionMatch) {
        return functionMatch[1] ?? null;
    }
    // Try arrow functions
    const arrowMatch = code.match(/export\s+(?:default\s+)?const\s+(\w+)\s*=\s*\(/);
    if (arrowMatch) {
        return arrowMatch[1] ?? null;
    }
    return null;
}
/**
 * Parse generated component response
 */
export function parseGeneratedComponent(response) {
    const code = extractCode(response) || cleanCode(response);
    const componentName = extractComponentName(code);
    const imports = extractImports(code);
    return {
        code: cleanCode(code),
        componentName,
        imports,
    };
}
/**
 * Parse multiple sections from response
 */
export function parseSections(text) {
    const sections = {};
    const sectionRegex = /^#+\s+(.+?)$\n([\s\S]*?)(?=^#+\s|$)/gm;
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
        const title = match[1].trim().toLowerCase();
        const content = match[2].trim();
        sections[title] = content;
    }
    return sections;
}
/**
 * Extract metadata from response (explanations, warnings, etc.)
 */
export function extractMetadata(text) {
    const sections = parseSections(text);
    const metadata = {};
    const explanation = sections['explanation'] ?? sections['description'];
    if (explanation) {
        metadata.explanation = explanation;
    }
    if (sections['warnings'] || sections['warning']) {
        const warningText = sections['warnings'] ?? sections['warning'];
        if (warningText) {
            metadata.warnings = warningText.split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-*]\s*/, ''));
        }
    }
    if (sections['notes'] || sections['note']) {
        const noteText = sections['notes'] ?? sections['note'];
        if (noteText) {
            metadata.notes = noteText.split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-*]\s*/, ''));
        }
    }
    return metadata;
}
/**
 * Validate that code is syntactically correct (basic check)
 */
export function validateCode(code) {
    const errors = [];
    // Check for balanced braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
    }
    // Check for balanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`);
    }
    // Check for balanced brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
        errors.push(`Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=parser.js.map