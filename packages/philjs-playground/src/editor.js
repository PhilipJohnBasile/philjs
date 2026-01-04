/**
 * PhilJS Playground Editor
 */
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
export function createEditor(container, config = {}) {
    const { initialCode = '', theme = 'dark', onChange, readOnly = false } = config;
    const extensions = [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        javascript({ jsx: true, typescript: true }),
        syntaxHighlighting(defaultHighlightStyle),
        autocompletion(),
        EditorView.updateListener.of((update) => {
            if (update.docChanged && onChange) {
                onChange(update.state.doc.toString());
            }
        }),
    ];
    if (theme === 'dark') {
        extensions.push(oneDark);
    }
    if (readOnly) {
        extensions.push(EditorState.readOnly.of(true));
    }
    const state = EditorState.create({
        doc: initialCode,
        extensions,
    });
    const view = new EditorView({
        state,
        parent: container,
    });
    return {
        getValue() {
            return view.state.doc.toString();
        },
        setValue(code) {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: code },
            });
        },
        focus() {
            view.focus();
        },
        destroy() {
            view.destroy();
        },
    };
}
export function Editor(props) {
    const container = document.createElement('div');
    container.className = props.className || '';
    setTimeout(() => createEditor(container, props), 0);
    return container;
}
//# sourceMappingURL=editor.js.map