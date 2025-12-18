import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark'

export type ThemePreference = 'system' | 'light' | 'dark'

type ThemeContextValue = {
    /** The effective theme currently applied (resolved from `themePreference`). */
    theme: Theme
    /** The persisted preference ("system" respects OS theme). */
    themePreference: ThemePreference
    setThemePreference: (preference: ThemePreference) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const prefersDark = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
}

const resolveTheme = (preference: ThemePreference): Theme => {
    if (preference === 'system') return prefersDark() ? 'dark' : 'light'
    return preference
}

const getPreferredThemePreference = (): ThemePreference => {
    if (typeof window === 'undefined') return 'system'

    try {
        const stored = localStorage.getItem('theme-preference')
        if (stored === 'system' || stored === 'light' || stored === 'dark') return stored
    } catch {
        // ignore
    }

    return 'system'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
        getPreferredThemePreference()
    )
    const [theme, setTheme] = useState<Theme>(() => resolveTheme(themePreference))

    useEffect(() => {
        setTheme(resolveTheme(themePreference))
        try {
            localStorage.setItem('theme-preference', themePreference)
        } catch {
            // ignore storage failures
        }
    }, [themePreference])

    useEffect(() => {
        const root = document.documentElement
        if (theme === 'dark') root.classList.add('dark')
        else root.classList.remove('dark')
    }, [theme])

    useEffect(() => {
        if (themePreference !== 'system') return

        const media = window.matchMedia?.('(prefers-color-scheme: dark)')
        if (!media) return

        const onChange = () => setTheme(resolveTheme('system'))
        media.addEventListener?.('change', onChange)
        return () => media.removeEventListener?.('change', onChange)
    }, [themePreference])

    const value = useMemo(() => ({
        theme,
        themePreference,
        setThemePreference,
        toggleTheme: () =>
            setThemePreference((prev) => {
                if (prev === 'dark') return 'light'
                if (prev === 'light') return 'dark'
                return resolveTheme('system') === 'dark' ? 'light' : 'dark'
            }),
    }), [theme, themePreference]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};
