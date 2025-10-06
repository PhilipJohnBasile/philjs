import { signal } from 'philjs-core';

interface Locale {
  code: string;
  label: string;
  flag: string;
  available: boolean;
  rtl?: boolean;
}

const locales: Locale[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', available: true },
  { code: 'es', label: 'Español', flag: '🇪🇸', available: false },
  { code: 'fr', label: 'Français', flag: '🇫🇷', available: false },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', available: false },
  { code: 'zh', label: '中文', flag: '🇨🇳', available: false },
  { code: 'ja', label: '日本語', flag: '🇯🇵', available: false },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', available: false, rtl: true },
  { code: 'he', label: 'עברית', flag: '🇮🇱', available: false, rtl: true },
];

export function LocaleSwitcher() {
  const isOpen = signal(false);
  const currentLocale = locales.find(l => l.code === 'en')!;

  const handleLocaleChange = (locale: Locale) => {
    if (locale.available) {
      // Set document direction for RTL languages
      document.documentElement.setAttribute('dir', locale.rtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale.code);

      // In the future, this would navigate to /[locale]/docs/...
      window.location.href = `/${locale.code}/docs`;
    }
    isOpen.set(false);
  };

  return (
    <div style="position: relative;">
      <button
        onClick={() => isOpen.set(!isOpen())}
        style="
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-text);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        "
        aria-label="Select language"
        aria-expanded={isOpen()}
        aria-haspopup="listbox"
      >
        <span>{currentLocale.flag}</span>
        <span>{currentLocale.code.toUpperCase()}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={`transform: rotate(${isOpen() ? '180deg' : '0deg'}); transition: transform var(--transition-fast);`}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      {isOpen() && (
        <div
          style="
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            min-width: 200px;
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            padding: 0.5rem;
            z-index: 1000;
          "
          role="listbox"
        >
          {locales.map((locale) => (
            <button
              key={locale.code}
              onClick={() => handleLocaleChange(locale)}
              disabled={!locale.available}
              style={`
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                border: none;
                background: ${locale.code === currentLocale.code ? 'var(--color-bg-alt)' : 'transparent'};
                color: ${locale.available ? 'var(--color-text)' : 'var(--color-text-tertiary)'};
                text-align: left;
                border-radius: 6px;
                cursor: ${locale.available ? 'pointer' : 'not-allowed'};
                transition: background var(--transition-fast);
                font-size: 0.875rem;
                opacity: ${locale.available ? '1' : '0.5'};
              `}
              role="option"
              aria-selected={locale.code === currentLocale.code}
            >
              <span style="display: flex; align-items: center; gap: 0.75rem;">
                <span>{locale.flag}</span>
                <span>{locale.label}</span>
              </span>
              {!locale.available && (
                <span style="
                  padding: 0.125rem 0.5rem;
                  background: var(--color-text-tertiary);
                  color: white;
                  border-radius: 4px;
                  font-size: 0.75rem;
                  font-weight: 600;
                ">
                  SOON
                </span>
              )}
            </button>
          ))}

          <div style="
            border-top: 1px solid var(--color-border);
            margin-top: 0.5rem;
            padding-top: 0.5rem;
          ">
            <a
              href="https://github.com/philjs/philjs/blob/main/CONTRIBUTING.md#translating-docs"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display: block;
                padding: 0.75rem;
                color: var(--color-brand);
                font-size: 0.875rem;
                text-decoration: none;
                border-radius: 6px;
                transition: background var(--transition-fast);
              "
            >
              Help translate →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
