export const CompletionItemKind = {
  Method: 1,
  Function: 2,
  Class: 6,
  Module: 8,
} as const;

export class SnippetString {
  constructor(public value = '') {}
}

export class MarkdownString {
  value = '';
  isTrusted = false;

  appendMarkdown(value: string): this {
    this.value += value;
    return this;
  }

  appendCodeblock(value: string, language = ''): this {
    this.value += `\n\n\`\`\`${language}\n${value}\n\`\`\``;
    return this;
  }
}

export class CompletionItem {
  detail?: string;
  insertText?: SnippetString;
  documentation?: MarkdownString;

  constructor(
    public label: string,
    public kind?: number,
  ) {}
}

export class Hover {
  constructor(
    public contents: MarkdownString | MarkdownString[],
    public range?: unknown,
  ) {}
}
