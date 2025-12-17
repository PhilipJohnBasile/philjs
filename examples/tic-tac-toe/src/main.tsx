import { render } from 'philjs-core';
import { App } from './App';

const root = document.getElementById('root');
if (root) {
  render(<App />, root);
}
