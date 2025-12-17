/**
 * PhilJS API Routes
 *
 * Full-stack API routes for PhilJS applications.
 * Similar to Next.js API routes, Remix actions, and SvelteKit form actions.
 */
export { createAPIHandler, defineAPIRoute, json, text, html, redirect, notFound, badRequest, unauthorized, forbidden, serverError, } from './server';
export type { APIHandler, APIContext, APIRequest, APIResponse, RouteHandler, } from './server';
export { getCookie, setCookie, deleteCookie, parseCookies, serializeCookie, createSignedCookie, verifySignedCookie, } from './cookies';
export type { CookieOptions, CookieSerializeOptions } from './cookies';
export { createSessionStorage, getSession, commitSession, destroySession, createCookieSessionStorage, createMemorySessionStorage, } from './session';
export type { Session, SessionStorage, SessionData, SessionOptions, } from './session';
export { apiClient, createAPIClient, useFetch, useMutation, } from './client';
export type { APIClientOptions, FetchOptions } from './client';
export { getEnv, getPublicEnv, requireEnv } from './env';
export { validate, createValidator, ValidationError } from './validation';
export type { ValidationSchema, ValidationResult } from './validation';
//# sourceMappingURL=index.d.ts.map