import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import "../../../styles/normalize.css";
import "../../../styles/webflow.css";
import "../../../styles/stonearts-r-webshop.webflow.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const ogLocale = locale === 'de' ? 'de_AT' : locale === 'en' ? 'en_US' : 'es_ES';
  const canonicalUrl = `https://www.akurock.com/${locale}`;

  return {
    title: {
      default: dict['meta.title'],
      template: `%s | stonearts®`,
    },
    description: dict['meta.description'],
    metadataBase: new URL('https://www.akurock.com'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...Object.fromEntries(locales.map(l => [l, `/${l}`])),
        'de-AT': '/de',
        'de-DE': '/de',
        'de-CH': '/de',
        'x-default': `/${defaultLocale}`,
      },
    },
    openGraph: {
      title: dict['meta.title'],
      description: dict['meta.description'],
      type: 'website',
      url: canonicalUrl,
      siteName: 'stonearts®',
      locale: ogLocale,
      alternateLocale: locales.filter(l => l !== locale).map(l =>
        l === 'de' ? 'de_AT' : l === 'en' ? 'en_US' : 'es_ES'
      ),
      images: [
        {
          url: '/images/stonearts-og-image.webp',
          width: 1200,
          height: 630,
          alt: 'stonearts® Akurock Acoustic Panels',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict['meta.title'],
      description: dict['meta.description'],
      images: ['/images/stonearts-og-image.webp'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add your verification codes here when ready
      // google: 'your-google-verification-code',
    },
    other: {
      // GEO meta tags for local SEO
      'geo.region': 'AT',
      'geo.placename': 'Wien',
      'geo.position': '48.1765;16.2845',
      'ICBM': '48.1765, 16.2845',
    },
  };
}

export default async function LocalizedLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return (
    <html lang={locale} data-wf-page="64ad4116e38ed7d405f77d2f" data-wf-site="64ad4116e38ed7d405f77d26">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" type="text/javascript"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `WebFont.load({  google: {    families: ["Playfair Display:regular,500,600,700,800,900"]  }});`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);`,
          }}
        />
        <link href="/images/favicon.jpg" rel="shortcut icon" type="image/x-icon" />
        <link href="/images/webclip.jpg" rel="apple-touch-icon" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
        .js-accordion-item, .js-accordion-header {
            -webkit-tap-highlight-color: transparent;
        }
        .js-link {
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
        }
        .js-accordion-body {
          display: none;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          user-select: none;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(e,t){e[t]=new Proxy(e[t]||{},{get:(e,o)=>new Proxy(e[o]||function(){},{apply:(n,r,a)=>{const c=()=>e[o](...a);"complete"===document.readyState?c():document.addEventListener("readystatechange",(n=>{"complete"===n.target.readyState&&(e?.[o]?c():console.error(\`\${t}.\${o} is not a function. Did it load correctly from the CDN? If not, did you use the correct name.\`))}))}})})}(globalThis,"CodeCrumbs");`,
          }}
        />
        {/* Organization + WebSite + BreadcrumbList JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": ["Organization", "Brand"],
                "@id": "https://www.akurock.com/#organization",
                name: "stonearts® GmbH",
                legalName: "stonearts® GmbH",
                alternateName: ["stonearts", "Akurock", "AKUROCK"],
                description: "Austrian manufacturer of handcrafted natural stone acoustic panels. Akurock panels feature 100% real stone surfaces, Sound Class A absorption, and DIY installation.",
                url: "https://www.akurock.com",
                logo: {
                  "@type": "ImageObject",
                  url: "https://www.akurock.com/images/stonearts%C2%AE-logo-black-long.svg",
                  width: 300,
                  height: 60,
                },
                image: {
                  "@type": "ImageObject",
                  url: "https://www.akurock.com/images/stonearts-og-image.webp",
                  width: 1200,
                  height: 630,
                },
                telephone: "+43 660 855 10 01",
                email: "office@stonearts.at",
                foundingDate: "2021",
                foundingLocation: {
                  "@type": "Place",
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: "AT",
                    addressLocality: "Wien",
                  },
                },
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Spohrstraße 29/23/1",
                  addressLocality: "Wien",
                  addressRegion: "Wien",
                  postalCode: "1130",
                  addressCountry: "AT",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: 48.1765,
                  longitude: 16.2845,
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.9",
                  reviewCount: "30",
                  bestRating: "5",
                  worstRating: "1",
                },
                sameAs: [
                  "https://www.instagram.com/stonearts_official/",
                  "https://www.youtube.com/channel/UCpdPxE-_gXMg9hG_p3hvrkw",
                  "https://www.tiktok.com/@stonearts_official",
                  "https://at.pinterest.com/17qo2x7ctqzuy3hlhny50ia1rfuphi/",
                  "https://www.facebook.com/stoneartsglobal",
                ],
                knowsAbout: [
                  "Acoustic panels",
                  "Natural stone wall panels",
                  "Sound absorption",
                  "Interior design",
                  "Sustainable building materials",
                ],
                hasOfferCatalog: {
                  "@type": "OfferCatalog",
                  name: "Akurock Natural Stone Acoustic Panels",
                  itemListElement: [
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Akurock Brush" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Akurock Whisper" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Akurock Ligia" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Akurock Gaia" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Akurock Yami" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Akurock Yuki" } },
                  ],
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "@id": "https://www.akurock.com/#localbusiness",
                name: "stonearts® GmbH — Akurock Showroom",
                image: "https://www.akurock.com/images/stonearts-og-image.webp",
                url: "https://www.akurock.com",
                telephone: "+43 660 855 10 01",
                email: "office@stonearts.at",
                priceRange: "€€",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Spohrstraße 29/23/1",
                  addressLocality: "Wien",
                  addressRegion: "Wien",
                  postalCode: "1130",
                  addressCountry: "AT",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: 48.1765,
                  longitude: 16.2845,
                },
                openingHoursSpecification: {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "17:00",
                },
                sameAs: [
                  "https://www.instagram.com/stonearts_official/",
                  "https://www.youtube.com/channel/UCpdPxE-_gXMg9hG_p3hvrkw",
                  "https://www.tiktok.com/@stonearts_official",
                  "https://www.facebook.com/stoneartsglobal",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://www.akurock.com/#website",
                url: "https://www.akurock.com",
                name: "stonearts® Akurock",
                description: "Akurock natural stone acoustic wall panels – handcrafted in Austria",
                publisher: { "@id": "https://www.akurock.com/#organization" },
                inLanguage: ["de-AT", "en", "es"],
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://www.akurock.com/de/stein-selektion?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        {/* SpeakableSpecification for voice search / AI assistants */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: [
                  ".hero-description",
                  ".product-description",
                  ".faq-answer",
                  ".heading-157",
                  ".heading-158",
                  ".pd-heading",
                ],
              },
            }),
          }}
        />
        <script src="https://embedsocial.com/cdn/rsh2.js"></script>
        {/* Google Analytics 4 — Consent Mode v2 (denied by default, unlocked by cookie-consent.js) */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('consent', 'default', {
                    analytics_storage: 'denied',
                    ad_storage: 'denied',
                    wait_for_update: 500,
                  });
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    anonymize_ip: true,
                  });
                `,
              }}
            />
          </>
        )}
        <script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css" />
        <script async src="https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsload@1/cmsload.js"></script>
        {/* Hreflang tags for SEO - per-locale alternate links */}
        {/* Base language tags */}
        <link key="de" rel="alternate" hrefLang="de" href="https://www.akurock.com/de" />
        <link key="en" rel="alternate" hrefLang="en" href="https://www.akurock.com/en" />
        <link key="es" rel="alternate" hrefLang="es" href="https://www.akurock.com/es" />
        {/* DACH region-specific variants */}
        <link key="de-AT" rel="alternate" hrefLang="de-AT" href="https://www.akurock.com/de" />
        <link key="de-DE" rel="alternate" hrefLang="de-DE" href="https://www.akurock.com/de" />
        <link key="de-CH" rel="alternate" hrefLang="de-CH" href="https://www.akurock.com/de" />
        {/* x-default fallback */}
        <link rel="alternate" hrefLang="x-default" href={`https://www.akurock.com/${defaultLocale}`} />
      </head>
      <body>
        {/* Pass locale to client-side JS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__LOCALE__ = "${locale}";`,
          }}
        />
        {children}
        <script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=64ad4116e38ed7d405f77d26" type="text/javascript" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossOrigin="anonymous"></script>
        <script src="/js/webflow.js" type="text/javascript"></script>
        <script src="/js/cart-manager.js" type="text/javascript"></script>
        <script src="/js/populate-cms.js" type="text/javascript"></script>
        <script src="/js/add-to-cart-handler.js" type="text/javascript"></script>
        <script src="/js/cart-page-handler.js" type="text/javascript"></script>
        <script src="/js/button-click-fix.js" type="text/javascript"></script>
        <script src="/js/i18n-client.js" type="text/javascript"></script>
        <script src="/js/scroll-animations.js" type="text/javascript" defer></script>
        <script src="/js/cookie-consent.js" type="text/javascript" defer></script>
        <script src="/js/whatsapp-widget.js" type="text/javascript" defer></script>
        <script src="/js/social-share.js" type="text/javascript" defer></script>
        <script src="/js/newsletter-handler.js" type="text/javascript" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js"></script>
        <script src="/js/inline-scripts.js" type="text/javascript"></script>
      </body>
    </html>
  );
}
