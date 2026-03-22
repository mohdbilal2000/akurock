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
  // Page-specific meta descriptions (SEO-optimised, 150-155 chars)
  const PAGE_DESCRIPTIONS: Record<string, Record<string, string>> = {
    'akurock-muster': {
      de: 'Teste Akurock-Naturstein-Akustikpaneele an deiner Wand – bestelle jetzt deine Musterbox für nur 5€ pro Stein. 6 Steinsorten: Brush, Whisper, Ligia, Gaia, Yami, Yuki.',
      en: 'Try Akurock natural stone acoustic panels on your wall – order your sample box from just €5 per stone. 6 stone varieties: Brush, Whisper, Ligia, Gaia, Yami, Yuki.',
      es: 'Prueba paneles acústicos Akurock de piedra natural en tu pared – pide tu caja de muestras desde solo 5€. 6 variedades: Brush, Whisper, Ligia, Gaia, Yami, Yuki.',
    },
    'faq': {
      de: 'Häufig gestellte Fragen zu Akurock-Akustikpaneelen: Installation, Pflege, Materialien und Lieferung. Alle Antworten von stonearts® auf einen Blick.',
      en: 'Frequently asked questions about Akurock acoustic panels: installation, care, materials and delivery. All answers from stonearts® at a glance.',
      es: 'Preguntas frecuentes sobre los paneles acústicos Akurock: instalación, cuidado, materiales y entrega. Todas las respuestas de stonearts®.',
    },
    'installation-and-guide': {
      de: 'Schritt-für-Schritt Installationsanleitung für Akurock Akustikpaneele. Kleben oder schrauben – keine Fachkräfte nötig. Inkl. Video-Tutorial und Datenblatt.',
      en: 'Step-by-step installation guide for Akurock acoustic panels. Glue or screw – no specialists needed. Including video tutorial and data sheet.',
      es: 'Guía de instalación paso a paso para paneles acústicos Akurock. Pegar o atornillar – sin necesidad de especialistas. Incluye tutorial en vídeo.',
    },
    'akustik': {
      de: 'Wie funktionieren Naturstein-Akustikpaneele? Akurock erreicht Schallklasse A und reduziert Nachhall um bis zu 70%. Alle technischen Details erklärt.',
      en: 'How do natural stone acoustic panels work? Akurock achieves Sound Class A and reduces reverberation by up to 70%. All technical details explained.',
      es: '¿Cómo funcionan los paneles acústicos de piedra natural? Akurock logra la Clase de Sonido A y reduce la reverberación hasta un 70%.',
    },
    'stein-selektion': {
      de: 'Alle 6 Akurock-Steinsorten im Überblick: Brush (Sandstein), Whisper, Ligia (Schiefer), Gaia, Yami und Yuki (Marmor). Maße, Farben und Preise vergleichen.',
      en: 'All 6 Akurock stone varieties: Brush (sandstone), Whisper, Ligia (slate), Gaia, Yami and Yuki (marble). Compare dimensions, colours and prices.',
      es: 'Las 6 variedades de piedra Akurock: Brush (arenisca), Whisper, Ligia (pizarra), Gaia, Yami y Yuki (mármol). Compara dimensiones, colores y precios.',
    },
    'stoneskin': {
      de: 'Stoneskin® – die patentierte Technologie hinter Akurock: echter Naturstein, hauchdünn auf MDF-Lamellen. Flexibel, leicht und dennoch 100% Naturstein.',
      en: 'Stoneskin® – the patented technology behind Akurock: real natural stone, paper-thin on MDF slats. Flexible, lightweight and yet 100% natural stone.',
      es: 'Stoneskin® – la tecnología patentada detrás de Akurock: piedra natural real, ultrafina sobre listones de MDF. Flexible, ligero y 100% piedra natural.',
    },
    'uber-uns': {
      de: 'stonearts® GmbH – die österreichische Manufaktur hinter Akurock. Unsere Geschichte beginnt am Fuße des Aravalli-Gebirges. Handwerk, Leidenschaft, Verantwortung.',
      en: 'stonearts® GmbH – the Austrian studio behind Akurock. Our story begins at the foot of the Aravalli mountains. Craftsmanship, passion, responsibility.',
      es: 'stonearts® GmbH – el estudio austríaco detrás de Akurock. Nuestra historia comienza al pie de las montañas Aravalli. Artesanía, pasión, responsabilidad.',
    },
    'zubehoer': {
      de: 'Zubehör für Akurock-Akustikpaneele: Wandkleber, weiße und schwarze Schrauben, Nano-Versiegeler. Alles für eine professionelle Montage.',
      en: 'Accessories for Akurock acoustic panels: wall adhesive, white and black screws, nano sealer. Everything you need for a professional installation.',
      es: 'Accesorios para paneles acústicos Akurock: adhesivo para pared, tornillos blancos y negros, sellador nano. Todo para una instalación profesional.',
    },
    'kontaktier-uns': {
      de: 'Kontaktiere stonearts® – wir antworten innerhalb von 24 Stunden. Fragen zu Akurock-Akustikpaneelen, Bestellungen oder individuellen Projekten.',
      en: 'Contact stonearts® – we respond within 24 hours. Questions about Akurock acoustic panels, orders or custom projects.',
      es: 'Contacta con stonearts® – respondemos en 24 horas. Preguntas sobre paneles acústicos Akurock, pedidos o proyectos personalizados.',
    },
    'verantwortung': {
      de: 'Nachhaltigkeit bei stonearts®: Recycelter PET-Akustikfilz, Holz aus nachhaltiger Forstwirtschaft, 90% geringere CO2-Belastung als Massivstein.',
      en: 'Sustainability at stonearts®: recycled PET acoustic felt, timber from sustainable forestry, 90% lower carbon footprint than solid stone.',
      es: 'Sostenibilidad en stonearts®: fieltro acústico de PET reciclado, madera de silvicultura sostenible, 90% menos huella de carbono que piedra maciza.',
    },
  };
  const description = PAGE_DESCRIPTIONS[canonicalSlug]?.[locale] || PAGE_DESCRIPTIONS[pageSlug]?.[locale] || dict['meta.description'];
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

  // Page-specific JSON-LD schemas
  const pageJsonLd: object[] = [breadcrumbJsonLd];

  if (canonicalSlug === 'faq') {
    const faqByLocale: Record<string, Array<{ q: string; a: string }>> = {
      de: [
        { q: 'Ist die Oberfläche wirklich echter Naturstein?', a: 'Ja. Jedes Akurock-Paneel trägt eine 100% echte Natursteinoberfläche – kein Druck, kein Laminat. Jedes Stück ist ein Unikat, geformt durch Millionen Jahre Erdgeschichte.' },
        { q: 'Ist die Montage der Akurock-Paneele schwierig?', a: 'Nein. Die Paneele können geklebt oder verschraubt werden – ganz ohne Fachbetrieb. Die meisten Kunden installieren ihr Akurock an einem halben Tag.' },
        { q: 'Woraus besteht das Akurock-Akustikpaneel?', a: '9 mm Akustikfilz aus recyceltem PET-Kunststoff + MDF-Lamellen mit echter Steinfurnieroberfläche. Holz aus nachhaltiger Forstwirtschaft.' },
        { q: 'Wie lange dauert die Lieferung?', a: 'Alle vorrätigen Produkte werden innerhalb von 5–10 Werktagen versandt. Du erhältst eine Versandbestätigung und Sendungsverfolgungsnummer per E-Mail.' },
        { q: 'Welche Schallklasse erreicht Akurock?', a: 'Akurock-Akustikpaneele erreichen Schallklasse A – die höchste Bewertung nach EN ISO 11654. Sie reduzieren Nachhall und Lärm messbar.' },
        { q: 'Wie lange dauert die Lieferung der Akustikpaneele?', a: 'Standardlieferung innerhalb Österreichs dauert 5–10 Werktage. Für Deutschland und die Schweiz rechne mit 7–14 Werktagen. Du erhältst vorab eine Sendungsverfolgung per E-Mail.' },
        { q: 'Kann ich die Akurock Paneele selbst montieren?', a: 'Absolut. Akurock ist als DIY-Produkt konzipiert. Du brauchst nur Wandkleber oder Schrauben und eine Wasserwaage. Eine Schritt-für-Schritt-Anleitung und ein Video-Tutorial liegen bei.' },
        { q: 'Welche Schallschutzklasse erreichen die Paneele?', a: 'Akurock erreicht Schallabsorptionsklasse A nach EN ISO 11654 – die höchstmögliche Bewertung. Die 9 mm dicke Akustikfilzschicht aus recyceltem PET sorgt für eine Nachhallreduzierung von bis zu 70%.' },
        { q: 'Sind die Naturstein-Paneele für Feuchträume geeignet?', a: 'Die Standardpaneele sind für trockene Innenräume konzipiert. Für Badezimmer oder Küchen empfehlen wir unseren Nano-Versiegeler als Zusatzschutz. Kontaktiere uns für eine individuelle Beratung.' },
        { q: 'Wie pflege ich meine Akustikpaneele?', a: 'Akurock-Paneele sind sehr pflegeleicht. Einfach mit einem trockenen oder leicht feuchten Tuch abstauben. Keine aggressiven Reinigungsmittel verwenden – die Natursteinoberfläche bleibt so jahrelang schön.' },
      ],
      en: [
        { q: 'Is the surface really natural stone?', a: 'Yes. Every Akurock panel features a 100% genuine natural stone surface – no printing, no laminate. Each piece is unique, shaped by millions of years of geological history.' },
        { q: 'Is installing Akurock panels difficult?', a: 'Not at all. Panels can be glued or screwed to the wall – no tradespeople required. Most customers complete their installation in half a day.' },
        { q: 'What is the Akurock acoustic panel made of?', a: '9 mm acoustic felt made from recycled PET plastic + MDF slats with a genuine stone veneer surface. All timber is sourced from certified sustainable forestry.' },
        { q: 'How long does delivery take?', a: 'All in-stock products are dispatched within 5–10 business days. You will receive a shipping confirmation and tracking number by email.' },
        { q: 'What sound class does Akurock achieve?', a: 'Akurock acoustic panels achieve Sound Class A – the highest rating under EN ISO 11654. They measurably reduce reverberation and noise.' },
        { q: 'How long does shipping of acoustic panels take?', a: 'Standard delivery within Austria takes 5–10 business days. For Germany and Switzerland, allow 7–14 business days. You will receive a tracking link by email before dispatch.' },
        { q: 'Can I install Akurock panels myself?', a: 'Absolutely. Akurock is designed as a DIY product. All you need is wall adhesive or screws and a spirit level. A step-by-step guide and video tutorial are included with every order.' },
        { q: 'What sound absorption class do the panels achieve?', a: 'Akurock achieves Sound Absorption Class A under EN ISO 11654 – the highest possible rating. The 9 mm recycled PET acoustic felt layer reduces reverberation by up to 70%.' },
        { q: 'Are the natural stone panels suitable for wet rooms?', a: 'The standard panels are designed for dry interior spaces. For bathrooms or kitchens, we recommend our nano sealer as additional protection. Contact us for personalised advice.' },
        { q: 'How do I care for my acoustic panels?', a: 'Akurock panels are very low-maintenance. Simply dust with a dry or slightly damp cloth. Avoid harsh cleaning agents – the natural stone surface will stay beautiful for years.' },
      ],
      es: [
        { q: '¿Es realmente una superficie de piedra natural?', a: 'Sí. Cada panel Akurock cuenta con una superficie de piedra natural 100% auténtica – sin impresión, sin laminado. Cada pieza es única, moldeada por millones de años de historia geológica.' },
        { q: '¿Es difícil instalar los paneles Akurock?', a: 'No. Los paneles se pueden pegar o atornillar a la pared – sin necesidad de especialistas. La mayoría de los clientes completan la instalación en medio día.' },
        { q: '¿De qué está hecho el panel acústico Akurock?', a: 'Fieltro acústico de 9 mm de PET reciclado + listones de MDF con superficie de chapa de piedra auténtica. Toda la madera proviene de silvicultura sostenible certificada.' },
        { q: '¿Cuánto tarda la entrega?', a: 'Todos los productos en stock se envían en 5–10 días hábiles. Recibirás una confirmación de envío y número de seguimiento por correo electrónico.' },
        { q: '¿Qué clase de sonido alcanza Akurock?', a: 'Los paneles acústicos Akurock alcanzan la Clase de Sonido A – la calificación más alta según EN ISO 11654. Reducen de forma medible la reverberación y el ruido.' },
        { q: '¿Cuánto tarda el envío de los paneles acústicos?', a: 'La entrega estándar en Austria tarda 5–10 días hábiles. Para Alemania y Suiza, calcula 7–14 días hábiles. Recibirás un enlace de seguimiento por correo electrónico antes del envío.' },
        { q: '¿Puedo instalar los paneles Akurock yo mismo?', a: 'Por supuesto. Akurock está diseñado como producto DIY. Solo necesitas adhesivo de pared o tornillos y un nivel de burbuja. Cada pedido incluye una guía paso a paso y un videotutorial.' },
        { q: '¿Qué clase de absorción acústica alcanzan los paneles?', a: 'Akurock alcanza la Clase de Absorción Acústica A según EN ISO 11654 – la calificación más alta posible. La capa de fieltro acústico de PET reciclado de 9 mm reduce la reverberación hasta un 70%.' },
        { q: '¿Son los paneles de piedra natural aptos para zonas húmedas?', a: 'Los paneles estándar están diseñados para interiores secos. Para baños o cocinas, recomendamos nuestro sellador nano como protección adicional. Contáctanos para asesoramiento personalizado.' },
        { q: '¿Cómo cuido mis paneles acústicos?', a: 'Los paneles Akurock requieren muy poco mantenimiento. Simplemente limpia el polvo con un paño seco o ligeramente húmedo. Evita productos de limpieza agresivos – la superficie de piedra natural se mantendrá bella durante años.' },
      ],
    };
    const faqs = faqByLocale[locale] || faqByLocale.de;
    pageJsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }

  if (canonicalSlug === 'installation-and-guide') {
    const howToByLocale: Record<string, { name: string; description: string; supplies: string[]; tools: string[]; steps: Array<{ name: string; text: string }> }> = {
      de: {
        name: 'Akurock Akustikpaneele installieren',
        description: 'Schritt-für-Schritt-Anleitung zur Installation von Akurock Naturstein-Akustikpaneelen. Kleben oder verschrauben – keine Fachkräfte nötig.',
        supplies: ['Akurock Akustikpaneele', 'Wandkleber oder Schrauben', 'Wasserwaage'],
        tools: ['Säge oder Cutter', 'Schraubenzieher oder Bohrmaschine'],
        steps: [
          { name: 'Wand vorbereiten', text: 'Wand reinigen, trocknen und auf Ebenheit prüfen. Bei starken Unebenheiten vorher ausgleichen.' },
          { name: 'Paneele ausmessen', text: 'Wandfläche messen und Paneele entsprechend zuschneiden. Akurock-Paneele lassen sich mit einer feinen Säge oder einem Cutter schneiden.' },
          { name: 'Kleben oder Schrauben', text: 'Wandkleber auf die Rückseite des Akustikfilzes auftragen und Paneel andrücken. Alternativ durch den Akustikfilz hindurch in die Wand schrauben.' },
          { name: 'Fertigstellung', text: 'Fugen prüfen, Paneele ausrichten und ggf. fixieren bis der Kleber abbindet.' },
        ],
      },
      en: {
        name: 'How to Install Akurock Acoustic Panels',
        description: 'Step-by-step guide to installing Akurock natural stone acoustic panels. Glue or screw – no specialists needed.',
        supplies: ['Akurock acoustic panels', 'Wall adhesive or screws', 'Spirit level'],
        tools: ['Fine saw or cutter', 'Screwdriver or drill'],
        steps: [
          { name: 'Prepare the wall', text: 'Clean the wall, ensure it is dry and level. Even out any major irregularities beforehand.' },
          { name: 'Measure and cut panels', text: 'Measure the wall area and cut panels to size. Akurock panels can be cut with a fine saw or utility knife.' },
          { name: 'Glue or screw', text: 'Apply wall adhesive to the back of the acoustic felt and press the panel into place. Alternatively, screw through the acoustic felt into the wall.' },
          { name: 'Finishing', text: 'Check joints, align panels and secure until the adhesive has set.' },
        ],
      },
      es: {
        name: 'Cómo instalar paneles acústicos Akurock',
        description: 'Guía paso a paso para instalar paneles acústicos Akurock de piedra natural. Pegar o atornillar – sin necesidad de especialistas.',
        supplies: ['Paneles acústicos Akurock', 'Adhesivo de pared o tornillos', 'Nivel de burbuja'],
        tools: ['Sierra fina o cúter', 'Destornillador o taladro'],
        steps: [
          { name: 'Preparar la pared', text: 'Limpiar la pared, asegurarse de que esté seca y nivelada. Igualar cualquier irregularidad importante previamente.' },
          { name: 'Medir y cortar paneles', text: 'Medir la superficie de la pared y cortar los paneles a medida. Los paneles Akurock se pueden cortar con una sierra fina o un cúter.' },
          { name: 'Pegar o atornillar', text: 'Aplicar adhesivo en la parte trasera del fieltro acústico y presionar el panel en su lugar. Alternativamente, atornillar a través del fieltro acústico a la pared.' },
          { name: 'Acabado', text: 'Revisar juntas, alinear paneles y fijar hasta que el adhesivo haya fraguado.' },
        ],
      },
    };
    const howTo = howToByLocale[locale] || howToByLocale.de;
    pageJsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: howTo.name,
      description: howTo.description,
      totalTime: 'PT4H',
      estimatedCost: { '@type': 'MonetaryAmount', currency: 'EUR', value: '0' },
      supply: howTo.supplies.map(name => ({ '@type': 'HowToSupply', name })),
      tool: howTo.tools.map(name => ({ '@type': 'HowToTool', name })),
      step: howTo.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
    });
  }

  if (canonicalSlug === 'akurock-muster') {
    const sampleByLocale: Record<string, { name: string; description: string; stones: string[] }> = {
      de: {
        name: 'Akurock Musterbox – Naturstein Akustikpaneele',
        description: 'Teste alle 6 Akurock Steinsorten an deiner Wand. Jeder Stein kostet 5€.',
        stones: ['Akurock Brush – Cremefarbener Sandstein', 'Akurock Whisper – Weißer Sandstein', 'Akurock Ligia – Silbergrauer Glimmerschiefer', 'Akurock Gaia – Roter Schiefer', 'Akurock Yami – Schwarzer Schiefer', 'Akurock Yuki – Weißer Kristallmarmor'],
      },
      en: {
        name: 'Akurock Sample Box – Natural Stone Acoustic Panels',
        description: 'Try all 6 Akurock stone varieties on your wall. Each stone sample just €5.',
        stones: ['Akurock Brush – Cream Sandstone', 'Akurock Whisper – White Sandstone', 'Akurock Ligia – Silver-Grey Mica Schist', 'Akurock Gaia – Red Slate', 'Akurock Yami – Black Slate', 'Akurock Yuki – White Crystal Marble'],
      },
      es: {
        name: 'Caja de Muestras Akurock – Paneles Acústicos de Piedra Natural',
        description: 'Prueba las 6 variedades de piedra Akurock en tu pared. Cada muestra por solo 5€.',
        stones: ['Akurock Brush – Arenisca Crema', 'Akurock Whisper – Arenisca Blanca', 'Akurock Ligia – Micaesquisto Gris Plata', 'Akurock Gaia – Pizarra Roja', 'Akurock Yami – Pizarra Negra', 'Akurock Yuki – Mármol Cristalino Blanco'],
      },
    };
    const sample = sampleByLocale[locale] || sampleByLocale.de;
    const productSlugs = ['brush', 'whisper', 'ligia', 'gaia', 'yami', 'yuki'];
    pageJsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: sample.name,
      description: sample.description,
      numberOfItems: 6,
      itemListElement: sample.stones.map((name, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name,
        url: `https://www.akurock.com/${locale}/product/${productSlugs[i]}`,
      })),
    });
  }

  return (
    <>
      {/* Inject head styles from the template */}
      {headStyles && (
        <div dangerouslySetInnerHTML={{ __html: headStyles }} />
      )}
      {/* Page-specific JSON-LD schemas */}
      {pageJsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div dangerouslySetInnerHTML={{ __html: translatedHTML }} />
    </>
  );
}
