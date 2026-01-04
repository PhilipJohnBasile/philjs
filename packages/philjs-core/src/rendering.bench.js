import { bench, describe } from 'vitest';
import { jsx } from './jsx-runtime.js';
import { signal } from './signals.js';
describe('JSX Creation Performance', () => {
    bench('create simple element', () => {
        jsx('div', { className: 'test', children: 'Hello' });
    });
    bench('create nested elements', () => {
        jsx('div', { className: 'container', children: [
                jsx('div', { className: 'header', children: 'Header' }),
                jsx('div', { className: 'content', children: 'Content' }),
                jsx('div', { className: 'footer', children: 'Footer' })
            ] });
    });
    bench('create element with many props', () => {
        jsx('div', {
            className: 'test',
            id: 'test-id',
            'data-test': 'value',
            'aria-label': 'Test element',
            role: 'button',
            tabIndex: 0,
            onClick: () => { },
            onMouseEnter: () => { },
            onMouseLeave: () => { },
            style: { color: 'red', fontSize: '16px' },
            children: 'Test'
        });
    });
    bench('create list of 100 items', () => {
        const items = Array.from({ length: 100 }, (_, i) => jsx('li', { key: i, children: `Item ${i}` }));
        jsx('ul', { children: items });
    });
    bench('create list of 1000 items', () => {
        const items = Array.from({ length: 1000 }, (_, i) => jsx('li', { key: i, children: `Item ${i}` }));
        jsx('ul', { children: items });
    });
});
describe('Component Rendering', () => {
    bench('create simple component', () => {
        const Component = () => jsx('div', { children: 'Hello' });
        Component();
    });
    bench('create component with props', () => {
        const Component = ({ name }) => jsx('div', { children: `Hello ${name}` });
        Component({ name: 'World' });
    });
    bench('create component with state', () => {
        const Component = () => {
            const count = signal(0);
            return jsx('div', { children: `Count: ${count()}` });
        };
        Component();
    });
    bench('create nested components (5 levels)', () => {
        const Level5 = () => jsx('div', { children: 'Level 5' });
        const Level4 = () => jsx('div', { children: jsx(Level5, {}) });
        const Level3 = () => jsx('div', { children: jsx(Level4, {}) });
        const Level2 = () => jsx('div', { children: jsx(Level3, {}) });
        const Level1 = () => jsx('div', { children: jsx(Level2, {}) });
        Level1();
    });
    bench('create component tree (breadth)', () => {
        const Child = ({ id }) => jsx('div', { children: `Child ${id}` });
        const Parent = () => jsx('div', {
            children: Array.from({ length: 10 }, (_, i) => jsx(Child, { key: i, id: i }))
        });
        Parent();
    });
});
describe('Reactive Rendering', () => {
    bench('component with reactive signal', () => {
        const count = signal(0);
        const Component = () => jsx('div', { children: count() });
        Component();
        count.set(1);
        Component();
    });
    bench('component with multiple signals', () => {
        const name = signal('John');
        const age = signal(25);
        const email = signal('john@example.com');
        const Component = () => jsx('div', { children: [
                jsx('div', { children: name() }),
                jsx('div', { children: age() }),
                jsx('div', { children: email() })
            ] });
        Component();
        name.set('Jane');
        Component();
    });
    bench('list rendering with reactive items', () => {
        const items = signal(Array.from({ length: 50 }, (_, i) => ({
            id: i,
            text: `Item ${i}`
        })));
        const Component = () => jsx('ul', {
            children: items().map(item => jsx('li', { key: item.id, children: item.text }))
        });
        Component();
        items.set([...items(), { id: 50, text: 'Item 50' }]);
        Component();
    });
    bench('conditional rendering', () => {
        const show = signal(true);
        const Component = () => show()
            ? jsx('div', { children: 'Visible' })
            : null;
        Component();
        show.set(false);
        Component();
        show.set(true);
        Component();
    });
});
describe('Props and Children', () => {
    bench('spread props', () => {
        const props = {
            className: 'test',
            id: 'test-id',
            'data-value': '123',
            onClick: () => { }
        };
        jsx('div', { ...props, children: 'Content' });
    });
    bench('children array', () => {
        const children = Array.from({ length: 20 }, (_, i) => jsx('span', { key: i, children: `Child ${i}` }));
        jsx('div', { children });
    });
    bench('mixed children types', () => {
        jsx('div', { children: [
                'Text node',
                jsx('span', { children: 'Nested element' }),
                42,
                true,
                null,
                undefined,
                jsx('div', { children: 'Another element' })
            ] });
    });
    bench('deep children nesting', () => {
        jsx('div', { children: jsx('div', { children: jsx('div', { children: jsx('div', { children: jsx('div', { children: jsx('div', { children: jsx('div', { children: jsx('div', { children: jsx('div', { children: jsx('div', { children: 'Deep content' })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        });
    });
});
describe('Real-world Component Patterns', () => {
    bench('card component', () => {
        const Card = ({ title, content }) => jsx('div', { className: 'card', children: [
                jsx('div', { className: 'card-header', children: title }),
                jsx('div', { className: 'card-body', children: content }),
                jsx('div', { className: 'card-footer', children: jsx('button', { children: 'Action' })
                })
            ] });
        Card({ title: 'Test Card', content: 'Some content here' });
    });
    bench('form component', () => {
        const name = signal('');
        const email = signal('');
        const Form = () => jsx('form', { children: [
                jsx('input', { type: 'text', value: name(), onChange: () => { } }),
                jsx('input', { type: 'email', value: email(), onChange: () => { } }),
                jsx('button', { type: 'submit', children: 'Submit' })
            ] });
        Form();
    });
    bench('table with 50 rows', () => {
        const data = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            name: `Name ${i}`,
            email: `email${i}@example.com`,
            age: 20 + i
        }));
        const Table = () => jsx('table', { children: [
                jsx('thead', { children: jsx('tr', { children: [
                            jsx('th', { children: 'Name' }),
                            jsx('th', { children: 'Email' }),
                            jsx('th', { children: 'Age' })
                        ] })
                }),
                jsx('tbody', { children: data.map(row => jsx('tr', { key: row.id, children: [
                            jsx('td', { children: row.name }),
                            jsx('td', { children: row.email }),
                            jsx('td', { children: row.age.toString() })
                        ] }))
                })
            ] });
        Table();
    });
    bench('navigation menu', () => {
        const Menu = () => jsx('nav', { children: jsx('ul', { children: [
                    jsx('li', { children: jsx('a', { href: '/', children: 'Home' }) }),
                    jsx('li', { children: jsx('a', { href: '/about', children: 'About' }) }),
                    jsx('li', { children: jsx('a', { href: '/contact', children: 'Contact' }) }),
                    jsx('li', { children: [
                            jsx('a', { href: '/products', children: 'Products' }),
                            jsx('ul', { children: [
                                    jsx('li', { children: jsx('a', { href: '/products/1', children: 'Product 1' }) }),
                                    jsx('li', { children: jsx('a', { href: '/products/2', children: 'Product 2' }) }),
                                    jsx('li', { children: jsx('a', { href: '/products/3', children: 'Product 3' }) })
                                ] })
                        ] })
                ] })
        });
        Menu();
    });
    bench('dashboard with widgets', () => {
        const Widget = ({ title, value }) => jsx('div', { className: 'widget', children: [
                jsx('h3', { children: title }),
                jsx('div', { className: 'value', children: value.toString() })
            ] });
        const Dashboard = () => jsx('div', { className: 'dashboard', children: [
                jsx(Widget, { title: 'Users', value: 1234 }),
                jsx(Widget, { title: 'Revenue', value: 56789 }),
                jsx(Widget, { title: 'Orders', value: 432 }),
                jsx(Widget, { title: 'Products', value: 89 })
            ] });
        Dashboard();
    });
});
//# sourceMappingURL=rendering.bench.js.map