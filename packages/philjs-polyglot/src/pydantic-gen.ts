
// Basic Stub for Pydantic to TS Generator
// Converts simple Pydantic models to TypeScript interfaces
export function pydanticToTs(pydanticModelCode: string): string {
    console.log('Polyglot: Converting Pydantic model...');

    const lines = pydanticModelCode.split('\n');
    const buffer: string[] = [];

    let currentInterface = '';

    for (const line of lines) {
        // Match class definition
        // class User(BaseModel):
        const classMatch = line.match(/^class\s+(\w+)\(.*?\):/);
        if (classMatch) {
            if (currentInterface) buffer.push(currentInterface + '}\n');
            currentInterface = `export interface ${classMatch[1]} {\n`;
            continue;
        }

        // Match fields
        // name: str
        // age: int = 0
        const fieldMatch = line.match(/^\s+(\w+):\s+(\w+)(?:\s*=\s*.+)?/);
        if (fieldMatch && currentInterface) {
            const [_, name, type] = fieldMatch;
            const tsType = mapPythonType(type);
            currentInterface += `  ${name}: ${tsType};\n`;
        }
    }

    if (currentInterface) buffer.push(currentInterface + '}');

    return buffer.join('\n');
}

function mapPythonType(pyType: string): string {
    const map: Record<string, string> = {
        'str': 'string',
        'int': 'number',
        'float': 'number',
        'bool': 'boolean',
        'list': 'any[]',
        'dict': 'Record<string, any>'
    };
    return map[pyType] || 'any';
}
