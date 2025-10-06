import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export type CSPDirectives = Record<string, Array<string> | string>;

export type BuildCSPOptions = {
  nonce?: string;
  directives?: CSPDirectives;
  reportOnly?: boolean;
  reportUri?: string;
};

const DEFAULT_DIRECTIVES: CSPDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "connect-src": ["'self'"],
  "font-src": ["'self'", "data:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "upgrade-insecure-requests": []
};

export function buildCSP(options: BuildCSPOptions = {}) {
  const { nonce, directives = {}, reportOnly, reportUri } = options;
  const allDirectives: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(DEFAULT_DIRECTIVES)) {
    allDirectives[key] = normalizeDirective(value);
  }

  for (const [key, value] of Object.entries(directives)) {
    allDirectives[key] = normalizeDirective(value);
  }

  if (nonce) {
    const scriptSources = new Set(allDirectives["script-src"] ?? []);
    scriptSources.add(`'nonce-${nonce}'`);
    allDirectives["script-src"] = [...scriptSources];
  }

  if (reportUri) {
    allDirectives["report-uri"] = [reportUri];
  }

  const serialized = Object.entries(allDirectives)
    .map(([directive, values]) => {
      if (!values.length) return directive;
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");

  return {
    value: serialized,
    header: reportOnly ? "content-security-policy-report-only" : "content-security-policy"
  };
}

function normalizeDirective(value: string | string[]) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean);
  return [] as string[];
}

export function createNonce(size = 16) {
  return randomBytes(size).toString("base64url");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

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

export function createCookie<T = unknown>(name: string, options: CookieOptions<T> = {}) {
  if (!name || /[=;\s]/.test(name)) {
    throw new Error("createCookie: cookie name must be a non-empty string without separators");
  }

  const {
    path = "/",
    domain,
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    maxAge,
    expires,
    secrets = [],
    encode = defaultEncode,
    decode = defaultDecode
  } = options;

  const cleanedSecrets = secrets.filter(Boolean);

  function serialize(value: T, overrides: Partial<CookieOptions<T>> = {}) {
    const payload = encode(value);
    const signedValue = signValue(payload, cleanedSecrets);
    let cookie = `${name}=${signedValue}`;

    const finalPath = overrides.path ?? path;
    if (finalPath) cookie += `; Path=${finalPath}`;

    const finalDomain = overrides.domain ?? domain;
    if (finalDomain) cookie += `; Domain=${finalDomain}`;

    const finalMaxAge = overrides.maxAge ?? maxAge;
    if (typeof finalMaxAge === "number") cookie += `; Max-Age=${Math.floor(finalMaxAge)}`;

    const finalExpires = overrides.expires ?? expires;
    if (finalExpires instanceof Date) cookie += `; Expires=${finalExpires.toUTCString()}`;

    const finalSameSite = overrides.sameSite ?? sameSite;
    if (finalSameSite) cookie += `; SameSite=${finalSameSite}`;

    const finalSecure = overrides.secure ?? secure;
    if (finalSecure) cookie += "; Secure";

    const finalHttpOnly = overrides.httpOnly ?? httpOnly;
    if (finalHttpOnly) cookie += "; HttpOnly";

    return cookie;
  }

  function parse(cookieHeader?: string | null): ParsedCookie<T> | null {
    if (!cookieHeader) return null;
    const record = parseCookieHeader(cookieHeader);
    const raw = record[name];
    if (!raw) return null;

    const { payload, signature } = splitSignature(raw);
    if (signature && !cleanedSecrets.length) {
      return null;
    }

    if (signature && cleanedSecrets.length) {
      const match = cleanedSecrets.some((secret) => safeEqual(sign(payload, secret), signature));
      if (!match) return null;
      return { value: decode(payload), signed: true };
    }

    if (!signature) {
      return { value: decode(payload), signed: false };
    }

    return null;
  }

  function destroy(overrides: Partial<CookieOptions<T>> = {}) {
    return serialize(("" as unknown) as T, {
      ...overrides,
      maxAge: 0,
      expires: new Date(0)
    });
  }

  return {
    name,
    serialize,
    parse,
    destroy
  };
}

function signValue(payload: string, secrets: string[]) {
  if (!secrets.length) return payload;
  const signature = sign(payload, secrets[0]);
  return `${payload}.${signature}`;
}

function splitSignature(value: string) {
  const index = value.lastIndexOf(".");
  if (index === -1) {
    return { payload: value, signature: "" };
  }
  return {
    payload: value.slice(0, index),
    signature: value.slice(index + 1)
  };
}

function defaultEncode(value: unknown) {
  const json = JSON.stringify(value ?? null);
  return Buffer.from(json).toString("base64url");
}

function defaultDecode<T>(value: string): T {
  const json = Buffer.from(value, "base64url").toString();
  return JSON.parse(json) as T;
}

function parseCookieHeader(header: string) {
  const result: Record<string, string> = {};
  header.split(/;\s*/).forEach((part) => {
    if (!part) return;
    const index = part.indexOf("=");
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = value;
  });
  return result;
}
