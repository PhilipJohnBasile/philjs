/**
 * @philjs/rich-text - Block Renderer
 * Renders individual blocks based on their type - vanilla JS
 */
export class BlockRenderer {
    render(block, editor, readOnly) {
        const element = this.createBlockElement(block, editor, readOnly);
        element.setAttribute('data-block-id', block.id);
        element.setAttribute('data-block-type', block.type);
        element.classList.add('philjs-block', `philjs-block-${block.type}`);
        if (!readOnly) {
            element.draggable = true;
            element.addEventListener('dragstart', (e) => {
                e.dataTransfer?.setData('text/plain', block.id);
                if (e.dataTransfer)
                    e.dataTransfer.effectAllowed = 'move';
            });
        }
        return element;
    }
    createBlockElement(block, editor, readOnly) {
        switch (block.type) {
            case 'paragraph':
                return this.createParagraph(block);
            case 'heading1':
                return this.createHeading(block, 1);
            case 'heading2':
                return this.createHeading(block, 2);
            case 'heading3':
                return this.createHeading(block, 3);
            case 'bulletList':
                return this.createList(block, 'ul', editor, readOnly);
            case 'numberedList':
                return this.createList(block, 'ol', editor, readOnly);
            case 'todoList':
                return this.createTodoList(block, editor, readOnly);
            case 'quote':
                return this.createQuote(block);
            case 'code':
                return this.createCodeBlock(block);
            case 'divider':
                return document.createElement('hr');
            case 'image':
                return this.createImage(block);
            case 'video':
                return this.createVideo(block);
            case 'embed':
                return this.createEmbed(block);
            case 'callout':
                return this.createCallout(block);
            case 'toggle':
                return this.createToggle(block, editor, readOnly);
            case 'columns':
                return this.createColumns(block, editor, readOnly);
            case 'table':
                return this.createTable(block);
            default:
                return this.createParagraph(block);
        }
    }
    renderContent(content) {
        const fragment = document.createDocumentFragment();
        if (!content)
            return fragment;
        for (const node of content) {
            if ('text' in node) {
                let element = document.createTextNode(node.text);
                if (node.marks) {
                    for (const mark of node.marks) {
                        const wrapper = this.createMarkElement(mark, element);
                        element = wrapper;
                    }
                }
                fragment.appendChild(element);
            }
        }
        return fragment;
    }
    createMarkElement(mark, child) {
        let el;
        switch (mark.type) {
            case 'bold':
                el = document.createElement('strong');
                break;
            case 'italic':
                el = document.createElement('em');
                break;
            case 'underline':
                el = document.createElement('u');
                break;
            case 'strike':
                el = document.createElement('s');
                break;
            case 'code':
                el = document.createElement('code');
                break;
            case 'link':
                el = document.createElement('a');
                el.href = mark.attrs?.['href'] || '#';
                el.target = '_blank';
                el.rel = 'noopener noreferrer';
                break;
            case 'highlight':
                el = document.createElement('mark');
                el.style.backgroundColor = mark.attrs?.['color'] || '#fef08a';
                break;
            case 'textColor':
                el = document.createElement('span');
                el.style.color = mark.attrs?.['color'] || 'inherit';
                break;
            default:
                el = document.createElement('span');
        }
        el.appendChild(child);
        return el;
    }
    createParagraph(block) {
        const p = document.createElement('p');
        p.appendChild(this.renderContent(block.content));
        return p;
    }
    createHeading(block, level) {
        const h = document.createElement(`h${level}`);
        h.appendChild(this.renderContent(block.content));
        return h;
    }
    createList(block, tag, editor, readOnly) {
        const list = document.createElement(tag);
        for (const child of block.children || []) {
            const li = document.createElement('li');
            li.appendChild(this.render(child, editor, readOnly));
            list.appendChild(li);
        }
        return list;
    }
    createTodoList(block, editor, readOnly) {
        const div = document.createElement('div');
        for (const child of block.children || []) {
            const item = document.createElement('div');
            item.className = 'philjs-todo-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '0.5rem';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = child.attrs?.['checked'] || false;
            checkbox.disabled = readOnly;
            item.appendChild(checkbox);
            item.appendChild(this.render(child, editor, readOnly));
            div.appendChild(item);
        }
        return div;
    }
    createQuote(block) {
        const quote = document.createElement('blockquote');
        quote.appendChild(this.renderContent(block.content));
        return quote;
    }
    createCodeBlock(block) {
        const pre = document.createElement('pre');
        pre.setAttribute('data-language', block.attrs?.['language'] || 'plaintext');
        const code = document.createElement('code');
        code.appendChild(this.renderContent(block.content));
        pre.appendChild(code);
        return pre;
    }
    createImage(block) {
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        img.src = block.attrs?.['src'] || '';
        img.alt = block.attrs?.['alt'] || '';
        img.style.maxWidth = '100%';
        if (block.attrs?.['width'])
            img.style.width = block.attrs['width'];
        figure.appendChild(img);
        if (block.attrs?.['caption']) {
            const caption = document.createElement('figcaption');
            caption.textContent = block.attrs['caption'];
            figure.appendChild(caption);
        }
        return figure;
    }
    createVideo(block) {
        const figure = document.createElement('figure');
        const video = document.createElement('video');
        video.src = block.attrs?.['src'] || '';
        video.controls = true;
        video.style.maxWidth = '100%';
        figure.appendChild(video);
        if (block.attrs?.['caption']) {
            const caption = document.createElement('figcaption');
            caption.textContent = block.attrs['caption'];
            figure.appendChild(caption);
        }
        return figure;
    }
    createEmbed(block) {
        const div = document.createElement('div');
        div.className = 'philjs-embed';
        const iframe = document.createElement('iframe');
        iframe.src = block.attrs?.['src'] || '';
        iframe.title = block.attrs?.['title'] || 'Embedded content';
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        div.appendChild(iframe);
        return div;
    }
    createCallout(block) {
        const div = document.createElement('div');
        div.style.backgroundColor = block.attrs?.['backgroundColor'] || '#f3f4f6';
        div.style.padding = '1rem';
        div.style.borderRadius = '0.375rem';
        div.style.display = 'flex';
        div.style.gap = '0.75rem';
        if (block.attrs?.['icon']) {
            const icon = document.createElement('span');
            icon.className = 'philjs-callout-icon';
            icon.textContent = block.attrs['icon'];
            div.appendChild(icon);
        }
        const content = document.createElement('div');
        content.appendChild(this.renderContent(block.content));
        div.appendChild(content);
        return div;
    }
    createToggle(block, editor, readOnly) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.appendChild(this.renderContent(block.content));
        details.appendChild(summary);
        for (const child of block.children || []) {
            details.appendChild(this.render(child, editor, readOnly));
        }
        return details;
    }
    createColumns(block, editor, readOnly) {
        const div = document.createElement('div');
        div.style.display = 'grid';
        div.style.gridTemplateColumns = `repeat(${block.attrs?.['columns'] || 2}, 1fr)`;
        div.style.gap = '1rem';
        for (const child of block.children || []) {
            const col = document.createElement('div');
            col.className = 'philjs-column';
            col.appendChild(this.render(child, editor, readOnly));
            div.appendChild(col);
        }
        return div;
    }
    createTable(block) {
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');
        for (const row of block.children || []) {
            const tr = document.createElement('tr');
            for (const cell of row.children || []) {
                const td = document.createElement('td');
                td.appendChild(this.renderContent(cell.content));
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        return table;
    }
}
export default BlockRenderer;
//# sourceMappingURL=BlockRenderer.js.map