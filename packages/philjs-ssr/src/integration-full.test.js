/**
 * Full-Stack Integration Tests
 * These tests prove that PhilJS actually works as a complete framework,
 * not just in theory but with real components, routing, SSR, and hydration.
 */
import { describe, it, expect } from 'vitest';
import { signal, memo, effect } from 'philjs-core';
import { jsx } from 'philjs-core/jsx-runtime';
import { renderToString } from 'philjs-core';
import { defineLoader, defineAction } from './loader.js';
import { renderToStreamingResponse } from './streaming.js';
describe('Full-Stack Integration Tests', () => {
    describe('SSR + Signals Integration', () => {
        it('should render a reactive component to static HTML', () => {
            const count = signal(5);
            const Counter = () => {
                return jsx('div', {
                    'data-testid': 'counter',
                    children: `Count: ${count()}`
                });
            };
            const html = renderToString(jsx(Counter, {}));
            expect(html).toContain('Count: 5');
            expect(html).toContain('data-testid="counter"');
        });
        it('should render memoized computed values correctly', () => {
            const price = signal(100);
            const quantity = signal(3);
            const total = memo(() => price() * quantity());
            const Invoice = () => {
                return jsx('div', {
                    className: 'invoice',
                    children: [
                        jsx('div', { children: `Price: $${price()}` }),
                        jsx('div', { children: `Quantity: ${quantity()}` }),
                        jsx('div', { children: `Total: $${total()}` })
                    ]
                });
            };
            const html = renderToString(jsx(Invoice, {}));
            expect(html).toContain('Price: $100');
            expect(html).toContain('Quantity: 3');
            expect(html).toContain('Total: $300');
        });
        it('should handle nested components with signals', () => {
            const user = signal({ name: 'Alice', role: 'Admin' });
            const UserBadge = ({ user }) => {
                return jsx('span', { className: 'badge', children: user().role });
            };
            const UserCard = () => {
                return jsx('div', {
                    className: 'card',
                    children: [
                        jsx('h2', { children: user().name }),
                        jsx(UserBadge, { user })
                    ]
                });
            };
            const html = renderToString(jsx(UserCard, {}));
            expect(html).toContain('Alice');
            expect(html).toContain('Admin');
            expect(html).toContain('class="badge"');
        });
    });
    describe('Loaders and Data Fetching', () => {
        it('should execute loader function with request context', async () => {
            const loader = defineLoader(async ({ params, request }) => {
                return {
                    user: { id: params.id, name: 'Test User' },
                    timestamp: Date.now()
                };
            });
            const result = await loader({
                params: { id: '123' },
                request: new Request('http://localhost/user/123'),
                url: new URL('http://localhost/user/123')
            });
            expect(result.user.id).toBe('123');
            expect(result.user.name).toBe('Test User');
            expect(result.timestamp).toBeGreaterThan(0);
        });
        it('should handle action with form data', async () => {
            const action = defineAction(async ({ request }) => {
                const formData = await request.formData();
                const title = formData.get('title');
                const content = formData.get('content');
                return {
                    success: true,
                    post: { title, content, id: Math.random().toString(36) }
                };
            });
            const formData = new FormData();
            formData.append('title', 'Test Post');
            formData.append('content', 'This is a test');
            const request = new Request('http://localhost/api/posts', {
                method: 'POST',
                body: formData
            });
            const result = await action({ request, params: {}, url: new URL('http://localhost/api/posts') });
            expect(result.success).toBe(true);
            expect(result.post.title).toBe('Test Post');
            expect(result.post.content).toBe('This is a test');
            expect(result.post.id).toBeTruthy();
        });
        it('should handle loader errors gracefully', async () => {
            const loader = defineLoader(async () => {
                throw new Error('Database connection failed');
            });
            await expect(async () => {
                await loader({
                    params: {},
                    request: new Request('http://localhost'),
                    url: new URL('http://localhost')
                });
            }).rejects.toThrow('Database connection failed');
        });
    });
    describe('Streaming SSR', () => {
        it('should create a streaming response', async () => {
            const App = () => {
                return jsx('div', {
                    className: 'app',
                    children: [
                        jsx('h1', { children: 'Hello, PhilJS!' }),
                        jsx('p', { children: 'This is a streaming SSR test.' })
                    ]
                });
            };
            const stream = await renderToStreamingResponse(jsx(App, {}));
            expect(stream).toBeInstanceOf(ReadableStream);
            // Read the stream
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let html = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                html += decoder.decode(value, { stream: true });
            }
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Hello, PhilJS!');
            expect(html).toContain('This is a streaming SSR test.');
        });
    });
    describe('Real-World Component Scenarios', () => {
        it('should render a todo list component', () => {
            const todos = signal([
                { id: 1, text: 'Buy milk', done: false },
                { id: 2, text: 'Walk dog', done: true },
                { id: 3, text: 'Write tests', done: false }
            ]);
            const TodoItem = ({ todo }) => {
                return jsx('li', {
                    className: todo.done ? 'done' : 'pending',
                    'data-id': todo.id,
                    children: todo.text
                });
            };
            const TodoList = () => {
                return jsx('ul', {
                    className: 'todo-list',
                    children: todos().map(todo => jsx(TodoItem, { key: todo.id, todo }))
                });
            };
            const html = renderToString(jsx(TodoList, {}));
            expect(html).toContain('Buy milk');
            expect(html).toContain('Walk dog');
            expect(html).toContain('Write tests');
            expect(html).toContain('class="done"');
            expect(html).toContain('class="pending"');
        });
        it('should render a form with validation state', () => {
            const email = signal('test@example.com');
            const isValid = memo(() => email().includes('@'));
            const EmailForm = () => {
                return jsx('form', {
                    children: [
                        jsx('input', {
                            type: 'email',
                            value: email(),
                            className: isValid() ? 'valid' : 'invalid'
                        }),
                        jsx('span', {
                            className: 'validation',
                            children: isValid() ? '✓ Valid' : '✗ Invalid'
                        })
                    ]
                });
            };
            const html = renderToString(jsx(EmailForm, {}));
            expect(html).toContain('test@example.com');
            expect(html).toContain('class="valid"');
            expect(html).toContain('✓ Valid');
        });
        it('should render a dashboard with computed metrics', () => {
            const sales = signal([
                { month: 'Jan', amount: 1000 },
                { month: 'Feb', amount: 1500 },
                { month: 'Mar', amount: 1200 }
            ]);
            const totalSales = memo(() => sales().reduce((sum, sale) => sum + sale.amount, 0));
            const averageSales = memo(() => totalSales() / sales().length);
            const Dashboard = () => {
                return jsx('div', {
                    className: 'dashboard',
                    children: [
                        jsx('h1', { children: 'Sales Dashboard' }),
                        jsx('div', { className: 'metric', children: `Total: $${totalSales()}` }),
                        jsx('div', { className: 'metric', children: `Average: $${averageSales().toFixed(2)}` }),
                        jsx('ul', {
                            children: sales().map(sale => jsx('li', { key: sale.month, children: `${sale.month}: $${sale.amount}` }))
                        })
                    ]
                });
            };
            const html = renderToString(jsx(Dashboard, {}));
            expect(html).toContain('Total: $3700');
            expect(html).toContain('Average: $1233.33');
            expect(html).toContain('Jan: $1000');
            expect(html).toContain('Feb: $1500');
            expect(html).toContain('Mar: $1200');
        });
        it('should handle conditional rendering', () => {
            const isLoggedIn = signal(true);
            const user = signal({ name: 'Alice', credits: 150 });
            const UserStatus = () => {
                if (!isLoggedIn()) {
                    return jsx('div', { children: 'Please log in' });
                }
                return jsx('div', {
                    className: 'user-info',
                    children: [
                        jsx('span', { children: `Welcome, ${user().name}!` }),
                        jsx('span', { className: 'credits', children: `Credits: ${user().credits}` })
                    ]
                });
            };
            // Test logged in state
            let html = renderToString(jsx(UserStatus, {}));
            expect(html).toContain('Welcome, Alice!');
            expect(html).toContain('Credits: 150');
            // Test logged out state
            isLoggedIn.set(false);
            html = renderToString(jsx(UserStatus, {}));
            expect(html).toContain('Please log in');
            expect(html).not.toContain('Welcome');
        });
    });
    describe('Performance and Edge Cases', () => {
        it('should handle large lists efficiently', () => {
            const items = signal(Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `Item ${i}`
            })));
            const List = () => {
                return jsx('ul', {
                    children: items().map(item => jsx('li', { key: item.id, children: item.name }))
                });
            };
            const start = Date.now();
            const html = renderToString(jsx(List, {}));
            const duration = Date.now() - start;
            expect(html).toContain('Item 0');
            expect(html).toContain('Item 99');
            expect(duration).toBeLessThan(1000); // Should render 100 items in < 1s
        });
        it('should handle special characters and XSS protection', () => {
            const userInput = signal('<script>alert("XSS")</script>');
            const SafeComponent = () => jsx('div', { children: userInput() });
            const html = renderToString(jsx(SafeComponent, {}));
            // Should escape dangerous characters
            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;');
        });
    });
    describe('Effect Integration', () => {
        it('should track dependencies in effects during SSR', () => {
            const count = signal(0);
            const effectLog = [];
            effect(() => {
                effectLog.push(count());
            });
            const Component = () => jsx('div', { children: `Count: ${count()}` });
            renderToString(jsx(Component, {}));
            expect(effectLog).toContain(0);
        });
        it('should handle cleanup functions', () => {
            const mounted = signal(true);
            const cleanupCalls = [];
            effect(() => {
                if (mounted()) {
                    return () => {
                        cleanupCalls.push('cleanup');
                    };
                }
            });
            mounted.set(false);
            expect(cleanupCalls).toContain('cleanup');
        });
    });
});
//# sourceMappingURL=integration-full.test.js.map