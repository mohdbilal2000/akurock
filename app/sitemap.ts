import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.akurock.com';
const locales = ['de', 'en', 'es'] as const;

// Canonical German slugs for all content pages
const CONTENT_PAGES = [
  'akurock-muster',
  'akustik',
  'allgemeine-geschaeftsbedingungen',
  'blog-news',
  'cookie-und-datschenschutzerklaerung',
  'faq',
  'galerie',
  'impressum',
  'installation-and-guide',
  'kontaktier-uns',
  'stein-selektion',
  'stoneskin',
  'uber-uns',
  'verantwortung',
  'visualizer',
  'zahlung-und-versand',
  'zubehoer',
];

// Localized slug aliases (matches [...slug]/page.tsx CANONICAL_TO_LOCALIZED)
const CANONICAL_TO_LOCALIZED: Record<string, Record<string, string>> = {
  'akurock-muster': { en: 'sample-box', es: 'caja-de-muestras' },
  'akustik': { en: 'acoustics', es: 'acustica' },
  'allgemeine-geschaeftsbedingungen': { en: 'terms-and-conditions', es: 'terminos-y-condiciones' },
  'cookie-und-datschenschutzerklaerung': { en: 'privacy-policy', es: 'politica-de-privacidad' },
  'galerie': { en: 'gallery', es: 'galeria' },
  'impressum': { en: 'legal-notice', es: 'aviso-legal' },
  'kontaktier-uns': { en: 'contact-us', es: 'contactenos' },
  'stein-selektion': { en: 'our-stones', es: 'nuestras-piedras' },
  'uber-uns': { en: 'about-us', es: 'sobre-nosotros' },
  'verantwortung': { en: 'responsibility', es: 'responsabilidad' },
  'zahlung-und-versand': { en: 'payment-and-shipping', es: 'pago-y-envio' },
  'zubehoer': { en: 'accessories', es: 'accesorios' },
  'visualizer': { en: 'visualizer', es: 'visualizador' },
  'installation-and-guide': { en: 'installation-and-guide', es: 'guia-de-instalacion' },
  'blog-news': { en: 'blog-news', es: 'blog-noticias' },
  'faq': { en: 'faq', es: 'preguntas-frecuentes' },
  'stoneskin': { en: 'stoneskin', es: 'stoneskin' },
};

// Main product slugs (6 acoustic panels)
const PRODUCT_SLUGS = ['brush', 'whisper', 'ligia', 'gaia', 'yami', 'yuki'];

function getLocalizedSlug(canonicalSlug: string, locale: string): string {
  if (locale === 'de') return canonicalSlug;
  return CANONICAL_TO_LOCALIZED[canonicalSlug]?.[locale] || canonicalSlug;
}

function buildAlternates(pathBuilder: (locale: string) => string) {
  return {
    languages: Object.fromEntries(
      locales.map(l => [l, `${BASE_URL}${pathBuilder(l)}`])
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage per locale
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: buildAlternates(l => `/${l}`),
    });
  }

  // Content pages per locale
  for (const slug of CONTENT_PAGES) {
    for (const locale of locales) {
      const localizedSlug = getLocalizedSlug(slug, locale);
      entries.push({
        url: `${BASE_URL}/${locale}/${localizedSlug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: buildAlternates(l => `/${l}/${getLocalizedSlug(slug, l)}`),
      });
    }
  }

  // Product pages per locale
  for (const slug of PRODUCT_SLUGS) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/product/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: buildAlternates(l => `/${l}/product/${slug}`),
      });
    }
  }

  // Quotation page per locale
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}/quotation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: buildAlternates(l => `/${l}/quotation`),
    });
  }

  return entries;
}
