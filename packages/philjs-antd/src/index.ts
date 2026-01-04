import { signal, effect, computed } from '@philjs/core';

export const PhilJSAntdTheme = {
    token: {
        colorPrimary: '#1677ff', // Replace with PhilJS default
    }
}

export function createAntdSyncedTheme(themeSignal: any) {
    // Syncs a PhilJS theme signal to Ant Design ConfigProvider tokens
    return computed(() => {
        const theme = themeSignal.value;
        return {
            token: {
                colorPrimary: theme.colors.primary,
                colorSuccess: theme.colors.success,
                colorWarning: theme.colors.warning,
                colorError: theme.colors.error,
                colorBgBase: theme.colors.background,
                colorTextBase: theme.colors.text,
            },
            algorithm: theme.mode === 'dark' ? 'darkAlgorithm' : 'defaultAlgorithm' // simplified
        }
    });
}
