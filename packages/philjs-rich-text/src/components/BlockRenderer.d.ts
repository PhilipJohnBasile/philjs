/**
 * @philjs/rich-text - Block Renderer
 * Renders individual blocks based on their type - vanilla JS
 */
import type { Block, EditorInstance } from '../types.js';
export declare class BlockRenderer {
    render(block: Block, editor: EditorInstance | null, readOnly: boolean): HTMLElement;
    private createBlockElement;
    private renderContent;
    private createMarkElement;
    private createParagraph;
    private createHeading;
    private createList;
    private createTodoList;
    private createQuote;
    private createCodeBlock;
    private createImage;
    private createVideo;
    private createEmbed;
    private createCallout;
    private createToggle;
    private createColumns;
    private createTable;
}
export default BlockRenderer;
//# sourceMappingURL=BlockRenderer.d.ts.map