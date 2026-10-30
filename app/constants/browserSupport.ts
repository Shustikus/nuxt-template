/**
 * Минимальные браузеры, для которых собирается клиентское Nuxt-приложение.
 * Более старые версии перенаправляются на SSR-страницу /errors/old_browser.
 */
export const BROWSER_BUILD_TARGETS = ["chrome90", "edge90", "firefox90", "safari14"] as const;

export const MINIMUM_BROWSER_VERSIONS = { chromium: 90, firefox: 90, safari: 14 } as const;
