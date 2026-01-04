/**
 * Browser Detection Module
 *
 * Detects browser type, version, and platform information.
 */

import type { BrowserInfo } from '../types.js';
import { isBrowser } from './feature-detect.js';

/**
 * Default browser info for non-browser environments
 */
const defaultBrowserInfo: BrowserInfo = {
  name: 'unknown',
  version: '0.0.0',
  majorVersion: 0,
  engine: 'unknown',
  engineVersion: '0.0.0',
  os: 'unknown',
  osVersion: '',
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  isBot: false,
  userAgent: '',
};

/**
 * Browser patterns for detection
 */
const browserPatterns: Array<{
  name: string;
  pattern: RegExp;
  versionPattern?: RegExp;
}> = [
  // Order matters - more specific patterns should come first
  { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+)/, versionPattern: /Edg(?:e|A|iOS)?\/(\d+[\d.]*)/ },
  { name: 'Opera', pattern: /OPR\/(\d+)/, versionPattern: /OPR\/(\d+[\d.]*)/ },
  { name: 'Opera', pattern: /Opera\/(\d+)/, versionPattern: /Opera\/(\d+[\d.]*)/ },
  { name: 'Samsung Internet', pattern: /SamsungBrowser\/(\d+)/, versionPattern: /SamsungBrowser\/(\d+[\d.]*)/ },
  { name: 'UC Browser', pattern: /UCBrowser\/(\d+)/, versionPattern: /UCBrowser\/(\d+[\d.]*)/ },
  { name: 'Firefox', pattern: /Firefox\/(\d+)/, versionPattern: /Firefox\/(\d+[\d.]*)/ },
  { name: 'Safari', pattern: /Safari\/(\d+)/, versionPattern: /Version\/(\d+[\d.]*)/ },
  { name: 'Chrome', pattern: /Chrome\/(\d+)/, versionPattern: /Chrome\/(\d+[\d.]*)/ },
  { name: 'IE', pattern: /MSIE (\d+)/, versionPattern: /MSIE (\d+[\d.]*)/ },
  { name: 'IE', pattern: /Trident.*rv:(\d+)/, versionPattern: /rv:(\d+[\d.]*)/ },
];

/**
 * Engine patterns for detection
 */
const enginePatterns: Array<{
  name: string;
  pattern: RegExp;
  versionPattern?: RegExp;
}> = [
  { name: 'Blink', pattern: /Chrome\/\d+/, versionPattern: /Chrome\/(\d+[\d.]*)/ },
  { name: 'Gecko', pattern: /Gecko\/\d+/, versionPattern: /Gecko\/(\d+[\d.]*)/ },
  { name: 'WebKit', pattern: /AppleWebKit\/\d+/, versionPattern: /AppleWebKit\/(\d+[\d.]*)/ },
  { name: 'Trident', pattern: /Trident\/\d+/, versionPattern: /Trident\/(\d+[\d.]*)/ },
  { name: 'EdgeHTML', pattern: /Edge\/\d+/, versionPattern: /Edge\/(\d+[\d.]*)/ },
];

/**
 * OS patterns for detection
 */
const osPatterns: Array<{
  name: string;
  pattern: RegExp;
  versionPattern?: RegExp;
}> = [
  { name: 'Windows', pattern: /Windows NT/, versionPattern: /Windows NT (\d+[\d.]*)/ },
  { name: 'macOS', pattern: /Mac OS X/, versionPattern: /Mac OS X (\d+[_\d.]*)/ },
  { name: 'iOS', pattern: /iPhone|iPad|iPod/, versionPattern: /OS (\d+[_\d.]*)/ },
  { name: 'Android', pattern: /Android/, versionPattern: /Android (\d+[\d.]*)/ },
  { name: 'Linux', pattern: /Linux/, versionPattern: undefined },
  { name: 'Chrome OS', pattern: /CrOS/, versionPattern: undefined },
];

/**
 * Bot patterns for detection
 */
const botPatterns = [
  /Googlebot/i,
  /Bingbot/i,
  /Slurp/i,
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /Embedly/i,
  /Quora Link Preview/i,
  /Slackbot/i,
  /Discordbot/i,
  /WhatsApp/i,
  /applebot/i,
  /crawl/i,
  /spider/i,
  /bot/i,
];

/**
 * Detect browser name and version from user agent
 */
function detectBrowser(userAgent: string): { name: string; version: string; majorVersion: number } {
  for (const { name, pattern, versionPattern } of browserPatterns) {
    if (pattern.test(userAgent)) {
      let version = '0.0.0';
      const vp = versionPattern ?? pattern;
      const match = userAgent.match(vp);
      if (match?.[1]) {
        version = match[1];
      }

      const majorVersion = parseInt(version.split('.')[0] ?? '0', 10);

      return { name, version, majorVersion };
    }
  }

  return { name: 'unknown', version: '0.0.0', majorVersion: 0 };
}

/**
 * Detect rendering engine from user agent
 */
function detectEngine(userAgent: string): { engine: string; engineVersion: string } {
  for (const { name, pattern, versionPattern } of enginePatterns) {
    if (pattern.test(userAgent)) {
      let version = '0.0.0';
      if (versionPattern) {
        const match = userAgent.match(versionPattern);
        if (match?.[1]) {
          version = match[1];
        }
      }

      return { engine: name, engineVersion: version };
    }
  }

  return { engine: 'unknown', engineVersion: '0.0.0' };
}

/**
 * Detect operating system from user agent
 */
function detectOS(userAgent: string): { os: string; osVersion: string } {
  for (const { name, pattern, versionPattern } of osPatterns) {
    if (pattern.test(userAgent)) {
      let version = '';
      if (versionPattern) {
        const match = userAgent.match(versionPattern);
        if (match?.[1]) {
          // Replace underscores with dots (iOS uses underscores)
          version = match[1].replace(/_/g, '.');
        }
      }

      return { os: name, osVersion: version };
    }
  }

  return { os: 'unknown', osVersion: '' };
}

/**
 * Detect if user agent is a bot/crawler
 */
function detectBot(userAgent: string): boolean {
  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): { isMobile: boolean; isTablet: boolean; isDesktop: boolean } {
  const isMobile = /Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  return { isMobile, isTablet, isDesktop };
}

/**
 * Get browser information
 *
 * @param userAgent Optional user agent string (defaults to navigator.userAgent)
 */
export function getBrowserInfo(userAgent?: string): BrowserInfo {
  if (!isBrowser() && !userAgent) {
    return defaultBrowserInfo;
  }

  const ua = userAgent ?? (isBrowser() ? navigator.userAgent : '');

  if (!ua) {
    return defaultBrowserInfo;
  }

  const browserInfo = detectBrowser(ua);
  const engineInfo = detectEngine(ua);
  const osInfo = detectOS(ua);
  const deviceInfo = detectDeviceType(ua);
  const isBot = detectBot(ua);

  return {
    ...browserInfo,
    ...engineInfo,
    ...osInfo,
    ...deviceInfo,
    isBot,
    userAgent: ua,
  };
}

/**
 * Check if browser is Chrome
 */
export function isChrome(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.name === 'Chrome';
}

/**
 * Check if browser is Firefox
 */
export function isFirefox(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.name === 'Firefox';
}

/**
 * Check if browser is Safari
 */
export function isSafari(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.name === 'Safari';
}

/**
 * Check if browser is Edge
 */
export function isEdge(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.name === 'Edge';
}

/**
 * Check if browser is Internet Explorer
 */
export function isIE(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.name === 'IE';
}

/**
 * Check if browser is Opera
 */
export function isOpera(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.name === 'Opera';
}

/**
 * Check if browser version is at least a specific version
 */
export function isVersionAtLeast(minVersion: number, info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.majorVersion >= minVersion;
}

/**
 * Check if browser uses Blink engine
 */
export function isBlink(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.engine === 'Blink';
}

/**
 * Check if browser uses Gecko engine
 */
export function isGecko(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.engine === 'Gecko';
}

/**
 * Check if browser uses WebKit engine
 */
export function isWebKit(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.engine === 'WebKit';
}

/**
 * Check if running on Windows
 */
export function isWindows(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.os === 'Windows';
}

/**
 * Check if running on macOS
 */
export function isMacOS(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.os === 'macOS';
}

/**
 * Check if running on iOS
 */
export function isIOS(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.os === 'iOS';
}

/**
 * Check if running on Android
 */
export function isAndroid(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.os === 'Android';
}

/**
 * Check if running on Linux
 */
export function isLinux(info?: BrowserInfo): boolean {
  const browser = info ?? getBrowserInfo();
  return browser.os === 'Linux';
}

/**
 * Get a human-readable browser description
 */
export function getBrowserDescription(info?: BrowserInfo): string {
  const browser = info ?? getBrowserInfo();
  return `${browser.name} ${browser.version} on ${browser.os}${browser.osVersion ? ' ' + browser.osVersion : ''}`;
}
