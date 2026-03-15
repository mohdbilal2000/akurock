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
function getProductData(slug: string): { name: string; description: string; price: string; image: string; stone: string } | null {
  try {
    const dataPath = join(process.cwd(), 'public/data/mock-cms-data.json');
    if (!existsSync(dataPath)) return null;
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    const product = data.products?.find((p: { slug: string }) => p.slug === slug);
    if (!product) return null;
    return {
      name: product.name || '',
      description: product.description || product.stone || '',
      price: product.price || '',
      image: product.mainImage || '',
      stone: product.stone || '',
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
  const title = `Akurock ${productName} | ${siteName}`;
  const description = product?.description
    ? `${productName} - ${product.description}. ${product.price}`
    : dict['meta.description'];
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
    name: `Akurock ${product.name}`,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: 'stonearts®' },
    offers: {
      '@type': 'Offer',
      price: product.price?.replace(/[^0-9.]/g, '') || '220.00',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://www.akurock.com/${locale}/product/${slug}`,
    },
    material: product.stone,
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

  // FAQ JSON-LD (3 product FAQ questions, locale-aware)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: dict['product.faq.naturalSurface'],
        acceptedAnswer: {
          '@type': 'Answer',
          text: dict['product.faq.naturalSurfaceAnswer'],
        },
      },
      {
        '@type': 'Question',
        name: dict['product.faq.installDifficult'],
        acceptedAnswer: {
          '@type': 'Answer',
          text: dict['product.faq.installAnswer'],
        },
      },
      {
        '@type': 'Question',
        name: dict['product.faq.composition'],
        acceptedAnswer: {
          '@type': 'Answer',
          text: dict['product.faq.compositionAnswer'],
        },
      },
    ],
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
