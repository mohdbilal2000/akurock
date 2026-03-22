import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.akurock.com';
const locales = ['de', 'en', 'es'] as const;

// Indexable content pages only (no cart, legal, or utility pages)
const CONTENT_PAGES = [
  'akurock-muster',      // priority: sample box — high commercial intent
  'akustik',             // how acoustic panels work — educational, high AEO value
  'faq',                 // FAQs — rich snippet eligible
  'galerie',             // gallery — visual discovery
  'installation-and-guide', // HowTo — rich snippet eligible
  'kontaktier-uns',      // contact
  'stein-selektion',     // stone selection — product discovery
  'stoneskin',           // technology page — brand/AEO value
  'uber-uns',            // about us — trust/E-E-A-T signal
  'verantwortung',       // sustainability — E-E-A-T signal
  'visualizer',          // visualizer tool
  'zahlung-und-versand', // payment & shipping
  'zubehoer',            // accessories
  'blog-news',           // blog
  // Excluded: cart, quotation, legal pages, privacy policy, impressum
];

// Localized slug aliases (matches [...slug]/page.tsx CANONICAL_TO_LOCALIZED)
const CANONICAL_TO_LOCALIZED: Record<string, Record<string, string>> = {
  'akurock-muster': { en: 'sample-box', es: 'caja-de-muestras' },
  'cart': { en: 'shopping-cart', es: 'carrito' },
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

// Static last-modified dates (update when content actually changes)
const LAST_MODIFIED: Record<string, string> = {
  _homepage: '2025-12-04',
  'akurock-muster': '2025-07-11',
  'akustik': '2025-06-25',
  'faq': '2025-06-25',
  'galerie': '2025-06-25',
  'installation-and-guide': '2025-06-25',
  'kontaktier-uns': '2025-06-25',
  'stein-selektion': '2025-12-04',
  'stoneskin': '2025-06-25',
  'uber-uns': '2025-06-25',
  'verantwortung': '2025-06-25',
  'visualizer': '2025-06-25',
  'zahlung-und-versand': '2025-06-25',
  'zubehoer': '2025-07-11',
  'blog-news': '2025-12-04',
  _product: '2025-12-04',
};

function getLastModified(key: string): Date {
  const dateStr = LAST_MODIFIED[key] || LAST_MODIFIED._homepage;
  return new Date(dateStr);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage per locale
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: getLastModified('_homepage'),
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: buildAlternates(l => `/${l}`),
    });
  }

  // Content pages per locale
  for (const slug of CONTENT_PAGES) {
    for (const locale of locales) {
      const localizedSlug = getLocalizedSlug(slug, locale);
      // Priority by page type
      const HIGH_PRIORITY = ['akurock-muster', 'akustik', 'faq', 'stein-selektion', 'installation-and-guide'];
      const pagePriority = HIGH_PRIORITY.includes(slug) ? 0.8 : 0.6;
      const pageFreq = slug === 'blog-news' ? 'weekly' : 'monthly';
      entries.push({
        url: `${BASE_URL}/${locale}/${localizedSlug}`,
        lastModified: getLastModified(slug),
        changeFrequency: pageFreq,
        priority: pagePriority,
        alternates: buildAlternates(l => `/${l}/${getLocalizedSlug(slug, l)}`),
      });
    }
  }

  // Product pages per locale
  for (const slug of PRODUCT_SLUGS) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/product/${slug}`,
        lastModified: getLastModified('_product'),
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: buildAlternates(l => `/${l}/product/${slug}`),
      });
    }
  }

  // Quotation/cart pages intentionally excluded from sitemap (noindex via robots.txt)

  return entries;
}
