/**
 * PhilJS API Routes
 *
 * Full-stack API routes for PhilJS applications.
 * Similar to Next.js API routes, Remix actions, and SvelteKit form actions.
 */
// Core API utilities
export { createAPIHandler, defineAPIRoute, json, text, html, redirect, notFound, badRequest, unauthorized, forbidden, serverError, } from './server';
// Cookie utilities
export { getCookie, setCookie, deleteCookie, parseCookies, serializeCookie, createSignedCookie, verifySignedCookie, } from './cookies';
// Session management
export { createSessionStorage, getSession, commitSession, destroySession, createCookieSessionStorage, createMemorySessionStorage, } from './session';
// Client utilities
export { apiClient, createAPIClient, useFetch, useMutation, } from './client';
// Environment variables
export { getEnv, getPublicEnv, requireEnv } from './env';
// Validation
export { validate, createValidator, ValidationError } from './validation';
//# sourceMappingURL=index.js.map