import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { translateHTML } from '@/lib/i18n/translate-html';
import type { Locale } from '@/lib/i18n/config';
import { locales } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Map of URL slugs to HTML filenames (German slugs are canonical)
const SLUG_TO_FILE: Record<string, string> = {
  'akurock-muster': 'akurock-muster.html',
  'akustik': 'akustik.html',
  'allgemeine-geschaeftsbedingungen': 'allgemeine-geschaeftsbedingungen.html',
  'blog-news': 'blog-news.html',
  'cart': 'cart.html',
  'cookie-und-datschenschutzerklaerung': 'cookie-und-datschenschutzerklaerung.html',
  'faq': 'faq.html',
  'galerie': 'galerie.html',
  'impressum': 'impressum.html',
  'installation-and-guide': 'installation-and-guide.html',
  'kontaktier-uns': 'kontaktier-uns.html',
  'stein-selektion': 'stein-selektion.html',
  'stoneskin': 'stoneskin.html',
  'uber-uns': 'uber-uns.html',
  'verantwortung': 'verantwortung.html',
  'visualizer': 'visualizer.html',
  'zahlung-und-versand': 'zahlung-und-versand.html',
  'zubehoer': 'zubehoer.html',
  // English slug aliases
  'shopping-cart': 'cart.html',
  'sample-box': 'akurock-muster.html',
  'acoustics': 'akustik.html',
  'terms-and-conditions': 'allgemeine-geschaeftsbedingungen.html',
  'privacy-policy': 'cookie-und-datschenschutzerklaerung.html',
  'gallery': 'galerie.html',
  'legal-notice': 'impressum.html',
  'contact-us': 'kontaktier-uns.html',
  'our-stones': 'stein-selektion.html',
  'about-us': 'uber-uns.html',
  'responsibility': 'verantwortung.html',
  'payment-and-shipping': 'zahlung-und-versand.html',
  'accessories': 'zubehoer.html',
  // Spanish slug aliases
  'carrito': 'cart.html',
  'caja-de-muestras': 'akurock-muster.html',
  'acustica': 'akustik.html',
  'terminos-y-condiciones': 'allgemeine-geschaeftsbedingungen.html',
  'politica-de-privacidad': 'cookie-und-datschenschutzerklaerung.html',
  'galeria': 'galerie.html',
  'aviso-legal': 'impressum.html',
  'contactenos': 'kontaktier-uns.html',
  'nuestras-piedras': 'stein-selektion.html',
  'sobre-nosotros': 'uber-uns.html',
  'responsabilidad': 'verantwortung.html',
  'pago-y-envio': 'zahlung-und-versand.html',
  'accesorios': 'zubehoer.html',
  'visualizador': 'visualizer.html',
  'guia-de-instalacion': 'installation-and-guide.html',
  'blog-noticias': 'blog-news.html',
  'preguntas-frecuentes': 'faq.html',
};

// Map localized slugs back to their canonical (German) slug for SEO/titles
const SLUG_CANONICAL: Record<string, string> = {
  // English aliases → canonical
  'shopping-cart': 'cart',
  'sample-box': 'akurock-muster',
  'acoustics': 'akustik',
  'terms-and-conditions': 'allgemeine-geschaeftsbedingungen',
  'privacy-policy': 'cookie-und-datschenschutzerklaerung',
  'gallery': 'galerie',
  'legal-notice': 'impressum',
  'contact-us': 'kontaktier-uns',
  'our-stones': 'stein-selektion',
  'about-us': 'uber-uns',
  'responsibility': 'verantwortung',
  'payment-and-shipping': 'zahlung-und-versand',
  'accessories': 'zubehoer',
  // Spanish aliases → canonical
  'carrito': 'cart',
  'caja-de-muestras': 'akurock-muster',
  'acustica': 'akustik',
  'terminos-y-condiciones': 'allgemeine-geschaeftsbedingungen',
  'politica-de-privacidad': 'cookie-und-datschenschutzerklaerung',
  'galeria': 'galerie',
  'aviso-legal': 'impressum',
  'contactenos': 'kontaktier-uns',
  'nuestras-piedras': 'stein-selektion',
  'sobre-nosotros': 'uber-uns',
  'responsabilidad': 'verantwortung',
  'pago-y-envio': 'zahlung-und-versand',
  'accesorios': 'zubehoer',
  'visualizador': 'visualizer',
  'guia-de-instalacion': 'installation-and-guide',
  'blog-noticias': 'blog-news',
  'preguntas-frecuentes': 'faq',
};

// Map canonical slugs to their localized versions for link generation
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

// Human-readable page titles for SEO
const SLUG_TO_TITLE: Record<string, Record<string, string>> = {
  'akurock-muster': { de: 'Musterbox bestellen', en: 'Order Sample Box', es: 'Pedir caja de muestras' },
  'cart': { de: 'Einkaufswagen', en: 'Shopping Cart', es: 'Carrito de compras' },
  'akustik': { de: 'Wie funktioniert ein Akustikpaneel?', en: 'How Do Acoustic Panels Work?', es: '¿Cómo funcionan los paneles acústicos?' },
  'faq': { de: 'Häufig gestellte Fragen', en: 'Frequently Asked Questions', es: 'Preguntas frecuentes' },
  'galerie': { de: 'Galerie & Inspiration', en: 'Gallery & Inspiration', es: 'Galería e Inspiración' },
  'installation-and-guide': { de: 'Installationsanleitung', en: 'Installation Guide', es: 'Guía de instalación' },
  'kontaktier-uns': { de: 'Kontaktiere uns', en: 'Contact Us', es: 'Contáctanos' },
  'stein-selektion': { de: 'Unsere Steine', en: 'Our Stones', es: 'Nuestras piedras' },
  'stoneskin': { de: 'Stoneskin Technologie', en: 'Stoneskin Technology', es: 'Tecnología Stoneskin' },
  'uber-uns': { de: 'Über uns', en: 'About Us', es: 'Sobre nosotros' },
  'verantwortung': { de: 'Nachhaltige Verantwortung', en: 'Sustainability & Responsibility', es: 'Responsabilidad sostenible' },
  'visualizer': { de: 'Visualizer - Probiere es an deiner Wand', en: 'Visualizer - Try It on Your Wall', es: 'Visualizador - Pruébalo en tu pared' },
  'zahlung-und-versand': { de: 'Zahlung & Versand', en: 'Payment & Shipping', es: 'Pago y envío' },
  'zubehoer': { de: 'Zubehör', en: 'Accessories', es: 'Accesorios' },
  'blog-news': { de: 'Blog & News', en: 'Blog & News', es: 'Blog y noticias' },
  'impressum': { de: 'Impressum', en: 'Legal Notice', es: 'Aviso legal' },
  'allgemeine-geschaeftsbedingungen': { de: 'AGBs', en: 'Terms & Conditions', es: 'Términos y condiciones' },
  'cookie-und-datschenschutzerklaerung': { de: 'Datenschutzerklärung', en: 'Privacy Policy', es: 'Política de privacidad' },
};

function getPageContent(slug: string): { headStyles: string; bodyHTML: string } | null {
  const filename = SLUG_TO_FILE[slug];
  if (!filename) return null;

  const htmlPath = join(process.cwd(), 'public/html', filename);
  try {
    if (!existsSync(htmlPath)) return null;
    const content = readFileSync(htmlPath, 'utf-8');

    // Extract head styles
    const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    let headStyles = '';
    if (headMatch && headMatch[1]) {
      const styleBlocks: string[] = [];
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let m;
      while ((m = styleRegex.exec(headMatch[1])) !== null) {
        styleBlocks.push(m[1]);
      }
      if (styleBlocks.length > 0) {
        headStyles = `<style>${styleBlocks.join('\n')}</style>`;
      }
    }

    // Extract body content
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyHTML = bodyMatch?.[1]?.trim();
    if (!bodyHTML) return null;

    return { headStyles, bodyHTML };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pageSlug = slug.join('/');
  // Resolve to canonical slug for title lookup
  const canonicalSlug = SLUG_CANONICAL[pageSlug] || pageSlug;
  const dict = getDictionary(locale as Locale);
  const pageTitle = SLUG_TO_TITLE[canonicalSlug]?.[locale] || SLUG_TO_TITLE[pageSlug]?.[locale] || pageSlug;
  const siteName = 'stonearts®';
  const title = `${pageTitle} | ${siteName}`;
  const description = dict['meta.description'];
  // Use locale-appropriate slug for canonical URL
  const localizedSlug = CANONICAL_TO_LOCALIZED[canonicalSlug]?.[locale] || canonicalSlug;
  const canonicalUrl = `https://www.akurock.com/${locale}/${localizedSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        locales.map(l => {
          const lSlug = CANONICAL_TO_LOCALIZED[canonicalSlug]?.[l] || canonicalSlug;
          return [l, `/${l}/${lSlug}`];
        })
      ),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
      locale: locale === 'de' ? 'de_AT' : locale === 'en' ? 'en_US' : 'es_ES',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const pageSlug = slug.join('/');

  const pageContent = getPageContent(pageSlug);
  if (!pageContent) {
    notFound();
  }

  const { headStyles, bodyHTML } = pageContent;
  const translatedHTML = translateHTML(bodyHTML, locale as Locale);

  // Resolve page title for breadcrumb
  const canonicalSlug = SLUG_CANONICAL[pageSlug] || pageSlug;
  const pageTitle = SLUG_TO_TITLE[canonicalSlug]?.[locale] || SLUG_TO_TITLE[pageSlug]?.[locale] || pageSlug;

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'stonearts®',
        item: `https://www.akurock.com/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageTitle,
      },
    ],
  };

  return (
    <>
      {/* Inject head styles from the template */}
      {headStyles && (
        <div dangerouslySetInnerHTML={{ __html: headStyles }} />
      )}
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div dangerouslySetInnerHTML={{ __html: translatedHTML }} />
    </>
  );
}
