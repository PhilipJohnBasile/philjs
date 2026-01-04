
import { Elysia } from 'elysia';

export const philjs = (app: Elysia) => {
    return app.get('/*', () => 'PhilJS on Elysia');
};
