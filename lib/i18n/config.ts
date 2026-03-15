export const locales = ['de', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export const nonLocalizedPrefixes = ['/admin', '/api', '/_next', '/images', '/js', '/css', '/fonts', '/videos', '/documents', '/data', '/public'];
