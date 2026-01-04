/**
 * @philjs/rich-text - Slash Command Menu
 * Notion-style command palette - vanilla JS
 */
import type { SlashCommand } from '../types.js';
export interface SlashCommandMenuOptions {
    commands: SlashCommand[];
    onSelect: (command: SlashCommand) => void;
}
export declare class SlashCommandMenu {
    private commands;
    private onSelect;
    private element;
    private query;
    private selectedIndex;
    private _isOpen;
    constructor(options: SlashCommandMenuOptions);
    isOpen(): boolean;
    open(position: {
        x: number;
        y: number;
    }): void;
    close(): void;
    destroy(): void;
    private getFilteredCommands;
    private handleKeyDown;
    private handleClickOutside;
    private render;
    private updateItems;
    private updateSelection;
}
export default SlashCommandMenu;
//# sourceMappingURL=SlashCommandMenu.d.ts.map