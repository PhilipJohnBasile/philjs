/**
 * PhilJS Figma Plugin
 * 
 * Export Figma designs to PhilJS components.
 */

// Plugin code runs in Figma's sandbox
figma.showUI(__html__, { width: 400, height: 600 });

interface ExportOptions {
    componentName: string;
    outputFormat: 'tsx' | 'jsx';
    includeStyles: boolean;
    styleFormat: 'inline' | 'css' | 'tailwind';
}

figma.ui.onmessage = async (msg: { type: string; options?: ExportOptions }) => {
    if (msg.type === 'export-selection') {
        const selection = figma.currentPage.selection;

        if (selection.length === 0) {
            figma.ui.postMessage({ type: 'error', message: 'Please select a frame to export' });
            return;
        }

        const node = selection[0];
        const code = await generateComponent(node, msg.options!);

        figma.ui.postMessage({ type: 'export-result', code });
    }

    if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};

async function generateComponent(node: SceneNode, options: ExportOptions): Promise<string> {
    const { componentName, outputFormat, includeStyles, styleFormat } = options;

    let code = '';

    // Generate imports
    code += `import { signal } from '@philjs/core';\n`;
    if (styleFormat === 'tailwind') {
        code += `import { cn } from '@philjs/shadcn';\n`;
    }
    code += '\n';

    // Generate component
    const ext = outputFormat === 'tsx' ? ': Props' : '';
    code += `interface ${componentName}Props {\n`;
    code += `  class?: string;\n`;
    code += `}\n\n`;

    code += `export function ${componentName}(props${ext}) {\n`;
    code += `  return (\n`;
    code += await generateJSX(node, 2, styleFormat);
    code += `  );\n`;
    code += `}\n`;

    return code;
}

async function generateJSX(node: SceneNode, indent: number, styleFormat: string): Promise<string> {
    const spaces = '  '.repeat(indent);

    if (node.type === 'TEXT') {
        const textNode = node as TextNode;
        return `${spaces}<span>${textNode.characters}</span>\n`;
    }

    if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT') {
        const containerNode = node as FrameNode;
        let code = '';

        const styles = extractStyles(containerNode, styleFormat);

        if (styleFormat === 'tailwind') {
            code += `${spaces}<div class="${styles}">\n`;
        } else if (styleFormat === 'inline') {
            code += `${spaces}<div style={${JSON.stringify(styles)}}>\n`;
        } else {
            code += `${spaces}<div class="${node.name.toLowerCase().replace(/\s+/g, '-')}">\n`;
        }

        if ('children' in containerNode) {
            for (const child of containerNode.children) {
                code += await generateJSX(child, indent + 1, styleFormat);
            }
        }

        code += `${spaces}</div>\n`;
        return code;
    }

    if (node.type === 'RECTANGLE') {
        const rectNode = node as RectangleNode;
        const styles = extractStyles(rectNode, styleFormat);

        if (styleFormat === 'tailwind') {
            return `${spaces}<div class="${styles}" />\n`;
        }
        return `${spaces}<div style={${JSON.stringify(styles)}} />\n`;
    }

    return `${spaces}{/* Unsupported node type: ${node.type} */}\n`;
}

function extractStyles(node: SceneNode, format: string): any {
    if (format === 'tailwind') {
        const classes: string[] = [];

        if ('width' in node && 'height' in node) {
            classes.push(`w-[${Math.round(node.width)}px]`);
            classes.push(`h-[${Math.round(node.height)}px]`);
        }

        if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
            const fill = node.fills[0];
            if (fill.type === 'SOLID') {
                const { r, g, b } = fill.color;
                const hex = rgbToHex(r, g, b);
                classes.push(`bg-[${hex}]`);
            }
        }

        if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
            if (node.cornerRadius > 0) {
                classes.push(`rounded-[${node.cornerRadius}px]`);
            }
        }

        return classes.join(' ');
    }

    // Inline styles
    const styles: Record<string, string> = {};

    if ('width' in node && 'height' in node) {
        styles.width = `${Math.round(node.width)}px`;
        styles.height = `${Math.round(node.height)}px`;
    }

    return styles;
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
