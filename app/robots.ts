import type { MetadataRoute } from 'next';

// Pages that should never be indexed (utility, legal, transactional) — applied
// to every crawler group, including the AI answer engines below.
const DISALLOW = [
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
];

// AI answer / generative-search crawlers. We WANT Akurock cited in AI answers
// (AEO/GEO), so these are allowed to read marketing content while the utility
// and legal routes above stay excluded. If you ever want to opt out of AI
// model *training* specifically, set GPTBot / CCBot / Applebot-Extended to
// disallow: '/' — that blocks training without losing answer-engine citations
// from OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot and Google-Extended.
const AI_CRAWLERS = [
  'Google-Extended',   // Google Gemini / AI Overviews
  'GPTBot',            // OpenAI
  'OAI-SearchBot',     // ChatGPT Search
  'ChatGPT-User',      // ChatGPT user-initiated browsing
  'anthropic-ai',      // Anthropic (legacy token)
  'ClaudeBot',         // Anthropic Claude
  'Claude-Web',        // Anthropic Claude web
  'PerplexityBot',     // Perplexity
  'Perplexity-User',   // Perplexity user-initiated
  'Applebot-Extended', // Apple Intelligence
  'Amazonbot',         // Amazon / Alexa
  'Bytespider',        // TikTok / Doubao
  'CCBot',             // Common Crawl (feeds many AI datasets)
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      // Explicitly allow AI answer engines to crawl indexable content (AEO/GEO),
      // while keeping the same utility/legal exclusions.
      ...AI_CRAWLERS.map(userAgent => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: 'https://www.akurock.com/sitemap.xml',
    host: 'https://www.akurock.com',
  };
}
