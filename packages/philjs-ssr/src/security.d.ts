export type CSPDirectives = Record<string, Array<string> | string>;
export type BuildCSPOptions = {
    nonce?: string;
    directives?: CSPDirectives;
    reportOnly?: boolean;
    reportUri?: string;
};
export declare function buildCSP(options?: BuildCSPOptions): {
    value: string;
    header: string;
};
export declare function createNonce(size?: number): string;
export type CookieSameSite = "Strict" | "Lax" | "None";
export type CookieOptions<T = unknown> = {
    path?: string;
    domain?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: CookieSameSite;
    maxAge?: number;
    expires?: Date;
    secrets?: string[];
    encode?: (value: T) => string;
    decode?: (value: string) => T;
};
export type ParsedCookie<T> = {
    value: T;
    signed: boolean;
};
export declare function createCookie<T = unknown>(name: string, options?: CookieOptions<T>): {
    name: string;
    serialize: (value: T, overrides?: Partial<CookieOptions<T>>) => string;
    parse: (cookieHeader?: string | null) => ParsedCookie<T> | null;
    destroy: (overrides?: Partial<CookieOptions<T>>) => string;
};
//# sourceMappingURL=security.d.ts.map