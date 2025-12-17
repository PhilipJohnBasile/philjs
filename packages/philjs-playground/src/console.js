/**
 * PhilJS Playground Console
 */
export function createConsole(container) {
    const messages = [];
    container.innerHTML = '<div class="philjs-playground__console-messages"></div>';
    const messagesEl = container.querySelector('.philjs-playground__console-messages');
    return {
        log(type, message) {
            const msg = {
                type,
                message,
                timestamp: Date.now(),
            };
            messages.push(msg);
            const el = document.createElement('div');
            el.className = `philjs-playground__console-message philjs-playground__console-message--${type}`;
            el.textContent = `[${type.toUpperCase()}] ${message}`;
            messagesEl.appendChild(el);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        },
        clear() {
            messages.length = 0;
            messagesEl.innerHTML = '';
        },
        getMessages() {
            return [...messages];
        },
    };
}
export function Console(props) {
    const container = document.createElement('div');
    container.className = props.className || '';
    return container;
}
//# sourceMappingURL=console.js.map