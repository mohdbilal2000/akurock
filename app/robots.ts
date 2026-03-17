import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/_next/',
          '/*/cart',
          '/*/shopping-cart',
          '/*/carrito',
          '/*/quotation',
          '/*/quotation-success',
          '/*/allgemeine-geschaeftsbedingungen',
          '/*/terms-and-conditions',
          '/*/terminos-y-condiciones',
          '/*/cookie-und-datschenschutzerklaerung',
          '/*/privacy-policy',
          '/*/politica-de-privacidad',
          '/*/impressum',
          '/*/legal-notice',
          '/*/aviso-legal',
        ],
      },
      // Block AI training crawlers
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'Google-Extended', allow: '/' }, // Allow Gemini for AEO
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
    ],
    sitemap: 'https://www.akurock.com/sitemap.xml',
    host: 'https://www.akurock.com',
  };
}
