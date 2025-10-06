import { bench, describe } from 'vitest';
import { jsx } from './jsx-runtime';
import { signal } from './signals';

describe('JSX Creation Performance', () => {
  bench('create simple element', () => {
    jsx('div', { className: 'test' }, 'Hello');
  });

  bench('create nested elements', () => {
    jsx('div', { className: 'container' },
      jsx('div', { className: 'header' }, 'Header'),
      jsx('div', { className: 'content' }, 'Content'),
      jsx('div', { className: 'footer' }, 'Footer')
    );
  });

  bench('create element with many props', () => {
    jsx('div', {
      className: 'test',
      id: 'test-id',
      'data-test': 'value',
      'aria-label': 'Test element',
      role: 'button',
      tabIndex: 0,
      onClick: () => {},
      onMouseEnter: () => {},
      onMouseLeave: () => {},
      style: { color: 'red', fontSize: '16px' }
    }, 'Test');
  });

  bench('create list of 100 items', () => {
    const items = Array.from({ length: 100 }, (_, i) =>
      jsx('li', { key: i }, `Item ${i}`)
    );
    jsx('ul', {}, ...items);
  });

  bench('create list of 1000 items', () => {
    const items = Array.from({ length: 1000 }, (_, i) =>
      jsx('li', { key: i }, `Item ${i}`)
    );
    jsx('ul', {}, ...items);
  });
});

describe('Component Rendering', () => {
  bench('create simple component', () => {
    const Component = () => jsx('div', {}, 'Hello');
    Component();
  });

  bench('create component with props', () => {
    const Component = ({ name }: { name: string }) =>
      jsx('div', {}, `Hello ${name}`);
    Component({ name: 'World' });
  });

  bench('create component with state', () => {
    const Component = () => {
      const count = signal(0);
      return jsx('div', {}, `Count: ${count()}`);
    };
    Component();
  });

  bench('create nested components (5 levels)', () => {
    const Level5 = () => jsx('div', {}, 'Level 5');
    const Level4 = () => jsx('div', {}, jsx(Level5, {}));
    const Level3 = () => jsx('div', {}, jsx(Level4, {}));
    const Level2 = () => jsx('div', {}, jsx(Level3, {}));
    const Level1 = () => jsx('div', {}, jsx(Level2, {}));
    Level1();
  });

  bench('create component tree (breadth)', () => {
    const Child = ({ id }: { id: number }) => jsx('div', {}, `Child ${id}`);
    const Parent = () => jsx('div', {},
      ...Array.from({ length: 10 }, (_, i) => jsx(Child, { key: i, id: i }))
    );
    Parent();
  });
});

describe('Reactive Rendering', () => {
  bench('component with reactive signal', () => {
    const count = signal(0);
    const Component = () => jsx('div', {}, count());

    Component();
    count.set(1);
    Component();
  });

  bench('component with multiple signals', () => {
    const name = signal('John');
    const age = signal(25);
    const email = signal('john@example.com');

    const Component = () => jsx('div', {},
      jsx('div', {}, name()),
      jsx('div', {}, age()),
      jsx('div', {}, email())
    );

    Component();
    name.set('Jane');
    Component();
  });

  bench('list rendering with reactive items', () => {
    const items = signal(Array.from({ length: 50 }, (_, i) => ({
      id: i,
      text: `Item ${i}`
    })));

    const Component = () => jsx('ul', {},
      ...items().map(item =>
        jsx('li', { key: item.id }, item.text)
      )
    );

    Component();
    items.set([...items(), { id: 50, text: 'Item 50' }]);
    Component();
  });

  bench('conditional rendering', () => {
    const show = signal(true);
    const Component = () => show()
      ? jsx('div', {}, 'Visible')
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
      onClick: () => {}
    };
    jsx('div', { ...props }, 'Content');
  });

  bench('children array', () => {
    const children = Array.from({ length: 20 }, (_, i) =>
      jsx('span', { key: i }, `Child ${i}`)
    );
    jsx('div', {}, ...children);
  });

  bench('mixed children types', () => {
    jsx('div', {},
      'Text node',
      jsx('span', {}, 'Nested element'),
      42,
      true,
      null,
      undefined,
      jsx('div', {}, 'Another element')
    );
  });

  bench('deep children nesting', () => {
    jsx('div', {},
      jsx('div', {},
        jsx('div', {},
          jsx('div', {},
            jsx('div', {},
              jsx('div', {},
                jsx('div', {},
                  jsx('div', {},
                    jsx('div', {},
                      jsx('div', {}, 'Deep content')
                    )
                  )
                )
              )
            )
          )
        )
      )
    );
  });
});

describe('Real-world Component Patterns', () => {
  bench('card component', () => {
    const Card = ({ title, content }: { title: string; content: string }) =>
      jsx('div', { className: 'card' },
        jsx('div', { className: 'card-header' }, title),
        jsx('div', { className: 'card-body' }, content),
        jsx('div', { className: 'card-footer' },
          jsx('button', {}, 'Action')
        )
      );

    Card({ title: 'Test Card', content: 'Some content here' });
  });

  bench('form component', () => {
    const name = signal('');
    const email = signal('');

    const Form = () => jsx('form', {},
      jsx('input', { type: 'text', value: name(), onChange: () => {} }),
      jsx('input', { type: 'email', value: email(), onChange: () => {} }),
      jsx('button', { type: 'submit' }, 'Submit')
    );

    Form();
  });

  bench('table with 50 rows', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Name ${i}`,
      email: `email${i}@example.com`,
      age: 20 + i
    }));

    const Table = () => jsx('table', {},
      jsx('thead', {},
        jsx('tr', {},
          jsx('th', {}, 'Name'),
          jsx('th', {}, 'Email'),
          jsx('th', {}, 'Age')
        )
      ),
      jsx('tbody', {},
        ...data.map(row =>
          jsx('tr', { key: row.id },
            jsx('td', {}, row.name),
            jsx('td', {}, row.email),
            jsx('td', {}, row.age.toString())
          )
        )
      )
    );

    Table();
  });

  bench('navigation menu', () => {
    const Menu = () => jsx('nav', {},
      jsx('ul', {},
        jsx('li', {}, jsx('a', { href: '/' }, 'Home')),
        jsx('li', {}, jsx('a', { href: '/about' }, 'About')),
        jsx('li', {}, jsx('a', { href: '/contact' }, 'Contact')),
        jsx('li', {},
          jsx('a', { href: '/products' }, 'Products'),
          jsx('ul', {},
            jsx('li', {}, jsx('a', { href: '/products/1' }, 'Product 1')),
            jsx('li', {}, jsx('a', { href: '/products/2' }, 'Product 2')),
            jsx('li', {}, jsx('a', { href: '/products/3' }, 'Product 3'))
          )
        )
      )
    );

    Menu();
  });

  bench('dashboard with widgets', () => {
    const Widget = ({ title, value }: { title: string; value: number }) =>
      jsx('div', { className: 'widget' },
        jsx('h3', {}, title),
        jsx('div', { className: 'value' }, value.toString())
      );

    const Dashboard = () => jsx('div', { className: 'dashboard' },
      jsx(Widget, { title: 'Users', value: 1234 }),
      jsx(Widget, { title: 'Revenue', value: 56789 }),
      jsx(Widget, { title: 'Orders', value: 432 }),
      jsx(Widget, { title: 'Products', value: 89 })
    );

    Dashboard();
  });
});
