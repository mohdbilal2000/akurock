import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { translateHTML } from '@/lib/i18n/translate-html';
import type { Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales } from '@/lib/i18n/config';

// Read and parse the product template once at build time
function getProductTemplate(): { headStyles: string; bodyHTML: string } {
  try {
    const possiblePaths = [
      join(process.cwd(), 'public/detail_product_template.html'),
      join(process.cwd(), '../stoneartscrm/detail_product.html'),
      join(process.cwd(), '../../stoneartscrm/detail_product.html'),
    ];

    for (const htmlPath of possiblePaths) {
      try {
        if (!existsSync(htmlPath)) continue;
        const content = readFileSync(htmlPath, 'utf-8');

        // Extract <head> styles so they aren't lost
        const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        let headStyles = '';
        if (headMatch && headMatch[1]) {
          // Pull out all <style> blocks from <head>
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

        // Extract <body> content
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
          return { headStyles, bodyHTML: bodyMatch[1].trim() };
        }
      } catch {
        continue;
      }
    }
  } catch {
    // fall through to fallback
  }

  return {
    headStyles: '',
    bodyHTML: `
      <div class="page_wrap">
        <div id="Main" class="w-embed">
          <style>.page_wrap { overflow: clip; }</style>
        </div>
        <div id="product-content-placeholder" style="padding: 2rem; text-align: center;">
          <p>Loading product...</p>
        </div>
      </div>
    `,
  };
}

// CMS product data for SEO (read at build time)
interface ProductData {
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  price: string;
  priceValue: number;
  image: string;
  stone: string;
  dimensions: string;
  slug: string;
  seoTitleEn: string;
  seoTitleEs: string;
  seoDescriptionEn: string;
  seoDescriptionEs: string;
  descriptionEn: string;
  descriptionEs: string;
}

function getProductData(slug: string): ProductData | null {
  try {
    const dataPath = join(process.cwd(), 'public/data/mock-cms-data.json');
    if (!existsSync(dataPath)) return null;
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    const product = data.products?.find((p: { slug: string }) => p.slug === slug);
    if (!product) return null;
    return {
      name: product.name || '',
      description: product.description || product.stone || '',
      seoTitle: product.seo_title || '',
      seoDescription: product.seo_description || '',
      seoTitleEn: product.seo_title_en || '',
      seoTitleEs: product.seo_title_es || '',
      seoDescriptionEn: product.seo_description_en || '',
      seoDescriptionEs: product.seo_description_es || '',
      descriptionEn: product.description_en || '',
      descriptionEs: product.description_es || '',
      price: product.price || '',
      priceValue: product.priceValue || 220,
      image: product.mainImage ? `https://www.akurock.com${product.mainImage}` : '',
      stone: product.stone || '',
      dimensions: product.dimensions || '240 x 60 x 2.3 cm',
      slug: product.slug || slug,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = getDictionary(locale as Locale);
  const product = getProductData(slug);
  const productName = product?.name || 'Akurock';
  const siteName = 'stonearts®';
  // SEO-optimised title: includes stone name, category keyword, brand, and locale hint
  const localeSuffix = locale === 'de' ? ' | Österreich' : locale === 'es' ? ' | España' : '';
  const titleByLocale: Record<string, string> = {
    de: `Akurock ${productName} – Naturstein Akustikpaneel | ${siteName}${localeSuffix}`,
    en: `Akurock ${productName} – Natural Stone Acoustic Panel | ${siteName}`,
    es: `Akurock ${productName} – Panel Acústico de Piedra Natural | ${siteName}${localeSuffix}`,
  };
  const seoTitleByLocale: Record<string, string> = {
    de: product?.seoTitle || '',
    en: product?.seoTitleEn || '',
    es: product?.seoTitleEs || '',
  };
  const title = seoTitleByLocale[locale] || product?.seoTitle || titleByLocale[locale] || titleByLocale.en;
  const descByLocale: Record<string, string> = {
    de: `Akurock ${productName} – ${product?.description || ''} Handgefertigtes Naturstein-Akustikpaneel, 240×60 cm, ab ${product?.price || '€220'}. ✓ Schallklasse A ✓ DIY-Montage.`,
    en: `Akurock ${productName} – handcrafted natural stone acoustic panel, 240×60 cm, from ${product?.price || '€220'}. ✓ Sound Class A ✓ DIY installation. Made in Austria.`,
    es: `Akurock ${productName} – panel acústico de piedra natural hecho a mano, 240×60 cm, desde ${product?.price || '€220'}. ✓ Clase de Sonido A ✓ Instalación DIY. Hecho en Austria.`,
  };
  const seoDescByLocale: Record<string, string> = {
    de: product?.seoDescription || '',
    en: product?.seoDescriptionEn || '',
    es: product?.seoDescriptionEs || '',
  };
  const description = seoDescByLocale[locale] || product?.seoDescription ||
    (product?.description && product?.stone
      ? descByLocale[locale] || descByLocale.en
      : dict['meta.description']);
  const canonicalUrl = `https://www.akurock.com/${locale}/product/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        locales.map(l => [l, `/${l}/product/${slug}`])
      ),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
      images: product?.image ? [{ url: product.image, width: 1200, height: 630, alt: productName }] : [],
      locale: locale === 'de' ? 'de_AT' : locale === 'en' ? 'en_US' : 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product?.image ? [product.image] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const { headStyles, bodyHTML } = getProductTemplate();
  const translatedHTML = translateHTML(bodyHTML, locale as Locale);

  // Build JSON-LD structured data for SEO
  const product = getProductData(slug);
  const dict = getDictionary(locale as Locale);
  const productName = product?.name || slug;

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Akurock ${product.name} – Naturstein Akustikpaneel`,
    description: `${product.description} ${product.stone}. Handgefertigtes Naturstein-Akustikpaneel von stonearts®. Maße: 240×60×2,3 cm (1,44 m²). Schallklasse A. DIY-Montage ohne Fachbetrieb.`,
    image: [product.image],
    sku: `AKUROCK-${product.slug?.toUpperCase() || slug.toUpperCase()}`,
    mpn: `SA-${product.slug?.toUpperCase() || slug.toUpperCase()}`,
    brand: {
      '@type': 'Brand',
      name: 'stonearts®',
      url: 'https://www.akurock.com',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'stonearts® GmbH',
      url: 'https://www.akurock.com',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'AT',
        addressLocality: 'Wien',
      },
    },
    material: product.stone,
    color: product.stone,
    width: { '@type': 'QuantitativeValue', value: 60, unitCode: 'CMT' },
    height: { '@type': 'QuantitativeValue', value: 240, unitCode: 'CMT' },
    depth: { '@type': 'QuantitativeValue', value: 2.3, unitCode: 'CMT' },
    weight: { '@type': 'QuantitativeValue', value: 7.5, unitCode: 'KGM' },
    category: 'Acoustic Wall Panels > Natural Stone',
    offers: {
      '@type': 'Offer',
      url: `https://www.akurock.com/${locale}/product/${slug}`,
      priceCurrency: 'EUR',
      price: String(product.priceValue || 220),
      priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'stonearts® GmbH',
        url: 'https://www.akurock.com',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'EUR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
          },
          cutoffTime: '12:00:00+01:00',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'd' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'd' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/OriginalShippingFees',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '30',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
        author: { '@type': 'Person', name: 'Thomas W.' },
        datePublished: '2024-11-15',
        reviewBody: 'Fantastische Qualität – der echte Naturstein fühlt sich unglaublich an. Die Raumakustik in meinem Wohnzimmer hat sich spürbar verbessert. Montage war einfach.',
      },
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
        author: { '@type': 'Person', name: 'Sarah M.' },
        datePublished: '2024-09-22',
        reviewBody: 'Wir haben drei Paneele im Büro montiert. Der Nachhall ist komplett weg. Jeder fragt, ob das echte Steinwände sind – perfekte Optik und Akustik.',
      },
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
        author: { '@type': 'Person', name: 'Marco B.' },
        datePublished: '2025-01-08',
        reviewBody: 'Handmade in Austria – man merkt die Qualität. Die DIY-Montage ging in 2 Stunden. Absolut empfehlenswert für alle, die echten Stein an der Wand wollen.',
      },
    ],
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Sound Class', value: 'A' },
      { '@type': 'PropertyValue', name: 'Installation', value: 'DIY – glue or screw' },
      { '@type': 'PropertyValue', name: 'Surface', value: '100% natural stone' },
      { '@type': 'PropertyValue', name: 'Backing', value: 'Recycled PET acoustic felt' },
      { '@type': 'PropertyValue', name: 'Country of Origin', value: 'Austria' },
      { '@type': 'PropertyValue', name: 'Fire Rating', value: 'B-s1-d0' },
    ],
  } : null;

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
        name: 'Akurock',
        item: `https://www.akurock.com/${locale}/stein-selektion`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Akurock ${productName}`,
      },
    ],
  };

  // FAQ JSON-LD (8 product FAQ questions, locale-aware — helps AEO/AI answers)
  const faqQuestions = [
    { q: 'product.faq.naturalSurface', a: 'product.faq.naturalSurfaceAnswer' },
    { q: 'product.faq.installDifficult', a: 'product.faq.installAnswer' },
    { q: 'product.faq.composition', a: 'product.faq.compositionAnswer' },
    { q: 'product.faq.soundClass', a: 'product.faq.soundClassAnswer' },
    { q: 'product.faq.weight', a: 'product.faq.weightAnswer' },
    { q: 'product.faq.maintenance', a: 'product.faq.maintenanceAnswer' },
    { q: 'product.faq.fireRating', a: 'product.faq.fireRatingAnswer' },
    { q: 'product.faq.madeInAustria', a: 'product.faq.madeInAustriaAnswer' },
  ];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqQuestions.map(({ q, a }) => ({
      '@type': 'Question',
      name: dict[q as keyof typeof dict],
      acceptedAnswer: {
        '@type': 'Answer',
        text: dict[a as keyof typeof dict],
      },
    })),
  };

  return (
    <>
      {/* Inject head styles that were extracted from the template <head> */}
      {headStyles && (
        <div dangerouslySetInnerHTML={{ __html: headStyles }} />
      )}
      {/* Product JSON-LD for SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div dangerouslySetInnerHTML={{ __html: translatedHTML }} />
    </>
  );
}
