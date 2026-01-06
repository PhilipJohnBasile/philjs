/**
 * Converts Pydantic models to TypeScript interfaces.
 * Supports: str, int, float, bool, List, Dict, Optional, and basic class inheritance.
 */
export function pydanticToTs(pydanticModelCode: string): string {
    const lines = pydanticModelCode.split('\\n');
    const buffer: string[] = [];

    let currentInterface = '';
    let inDocstring = false;
    let currentDocstring: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Handle Docstrings (Triple quotes)
        if (line.startsWith('"""') || line.startsWith("'''")) {
            if (inDocstring) {
                inDocstring = false;
                // Append docstring to current interface or field (simplified: attach to next field/class)
            } else {
                inDocstring = true;
                currentDocstring = [];
                if (line.length > 3 && (line.endsWith('"""') || line.endsWith("'''"))) {
                    inDocstring = false; // One-liner
                }
            }
            continue;
        }

        // Match Class Definition
        // class User(BaseModel):
        const classMatch = line.match(/^class\\s+(\\w+)(?:\\((.*?)\\))?:/);
        if (classMatch) {
            if (currentInterface) buffer.push(currentInterface + '}\\n');
            const className = classMatch[1];
            const extendsClause = classMatch[2] && classMatch[2] !== 'BaseModel' ?\` extends \${classMatch[2]}\` : '';
            currentInterface = \`export interface \${className}\${extendsClause} {\\n\`;
            continue;
        }

        // Match Fields
        // name: str
        // users: List[User] = []
        // meta: Dict[str, Any]
        const fieldMatch = line.match(/^(\\w+):\\s+([\\w\\[\\],\\s]+)(?:\\s*=\\s*.+)?$/);
        if (fieldMatch && currentInterface) {
            const [_, name, type] = fieldMatch;
            const tsType = mapPythonType(type);
            const doc = currentDocstring.length ? \`  /** \${currentDocstring.join(' ')} */\\n\` : '';
            currentInterface += \`\${doc}  \${name}: \${tsType};\\n\`;
            currentDocstring = []; // Reset docs
        }
    }

    if (currentInterface) buffer.push(currentInterface + '}');

    return buffer.join('\\n');
}

function mapPythonType(pyType: string): string {
    pyType = pyType.trim();

    // Recursive types (List[str], Dict[str, int])
    const listMatch = pyType.match(/^List\\[(.+)\\]$/);
    if (listMatch) return \`\${mapPythonType(listMatch[1])}[]\`;

    const dictMatch = pyType.match(/^Dict\\[(.+),\\s*(.+)\\]$/);
    if (dictMatch) return \`Record<\${mapPythonType(dictMatch[1])}, \${mapPythonType(dictMatch[2])}>\`;

    const optionalMatch = pyType.match(/^Optional\\[(.+)\\]$/);
    if (optionalMatch) return \`\${mapPythonType(optionalMatch[1])} | null\`;

    const unionMatch = pyType.match(/^Union\\[(.+)\\]$/);
    if (unionMatch) return unionMatch[1].split(',').map(t => mapPythonType(t)).join(' | ');

    // Primitives
    const map: Record<string, string> = {
        'str': 'string',
        'int': 'number',
        'float': 'number',
        'bool': 'boolean',
        'Any': 'any',
        'None': 'null'
    };

    return map[pyType] || pyType;
}
