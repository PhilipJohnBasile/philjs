/**
 * PhilJS Playground Editor
 */

import type { EditorConfig } from './types.js';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';

export function createEditor(container: HTMLElement, config: EditorConfig = {}) {
  const { initialCode = '', theme = 'dark', onChange, readOnly = false } = config;

  const extensions = [
    lineNumbers(),
    highlightActiveLine(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    javascript({ jsx: true, typescript: true }),
    syntaxHighlighting(defaultHighlightStyle),
    autocompletion(),
    EditorView.updateListener.of((update: any) => {
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
    setValue(code: string) {
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

export function Editor(props: EditorConfig & { className?: string }) {
  const container = document.createElement('div');
  container.className = props.className || '';
  setTimeout(() => createEditor(container, props), 0);
  return container;
}
