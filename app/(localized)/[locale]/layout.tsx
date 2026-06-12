import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import "../../../styles/normalize.css";
import "../../../styles/webflow.css";
import "../../../styles/stonearts-r-webshop.webflow.css";
import "../../../styles/nextjs-overrides.css";

// Cache-buster for the unhashed /public/js scripts. /js/* is served with
// stale-while-revalidate (7 days), so after a deploy browsers kept running
// WEEK-OLD copies of cart-manager.js etc. — e.g. the mobile "cart freezes
// the screen" bug was an old cached script opening the cart underneath the
// navbar. Versioning the query string by deploy makes every deploy bust
// every client's cache instantly (the SHA changes per Vercel deployment).
const ASSET_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  '1';

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
      // Set these in Vercel env vars to verify ownership without a code change.
      // Google Search Console → Settings → Ownership verification → HTML tag:
      // copy the content="..." value into NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.
      ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
        ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
        : {}),
      // Bing Webmaster Tools (imports from GSC, but tag supported too)
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
        : {}),
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

  // NOTE: This nested layout must NOT render <html>/<head>/<body> — the root
  // layout (app/layout.tsx) already provides them. Rendering them here produced
  // nested <html>/<body>, which the browser strips, causing a React hydration
  // mismatch (#418) that re-rendered the page and detached the imperatively
  // attached nav/menu click handlers. React 19 hoists <link>/<meta>/<title>
  // into <head>; scripts render in order.
  return (
    <>
      <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        {/* Playfair Display via a direct HTTPS stylesheet link. Replaces the old
            WebFont.load loader, which fetched over http:// (CSP-blocked) and
            raced ("WebFont is not defined") — this is faster and reliable. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
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
                  url: "https://www.akurock.com/images/stonearts-logo-black-long.svg",
                  width: 300,
                  height: 60,
                },
                image: {
                  "@type": "ImageObject",
                  url: "https://www.akurock.com/images/stonearts-og-image.webp",
                  width: 1200,
                  height: 630,
                },
                telephone: "+91 90575 97719",
                email: "aasatali@gmail.com",
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
                telephone: "+91 90575 97719",
                email: "aasatali@gmail.com",
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
                // GEO targeting: ships across the DACH region
                areaServed: [
                  { "@type": "Country", name: "AT" },
                  { "@type": "Country", name: "DE" },
                  { "@type": "Country", name: "CH" },
                ],
                currenciesAccepted: "EUR",
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
        {/* jQuery is loaded once below (Webflow's 3.5.1 build, before webflow.js).
            The previous code.jquery.com 3.6.0 here was a redundant second jQuery
            that, being deferred, also clobbered window.jQuery AFTER webflow.js
            had initialized. Removed. */}
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
        {/* Pass locale to client-side JS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__LOCALE__ = "${locale}"; try{document.documentElement.lang="${locale}";}catch(e){}`,
          }}
        />
        {/* Resilient images: on a flaky mobile connection an <img> can fail to
            download and the browser paints the ugly "?" broken-image icon
            (e.g. the contact-page photo over weak LTE). Retry each failed
            image ONCE with a cache-busting query a moment later; this
            self-heals transient failures and does nothing when images load
            fine. Capture phase so it catches errors before paint settles. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener('error',function(e){var el=e.target;if(!el||el.tagName!=='IMG')return;if(el.dataset.retried)return;var src=el.currentSrc||el.src;if(!src||src.indexOf('data:')===0)return;el.dataset.retried='1';setTimeout(function(){el.src=src+(src.indexOf('?')>-1?'&':'?')+'_r='+Date.now();},800);},true);`,
          }}
        />
        {children}
        <script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=64ad4116e38ed7d405f77d26" type="text/javascript" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossOrigin="anonymous"></script>
        <script src={`/js/webflow.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/cart-manager.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/populate-cms.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/add-to-cart-handler.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/cart-page-handler.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/button-click-fix.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/i18n-client.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/scroll-animations.js?v=${ASSET_VERSION}`} type="text/javascript" defer></script>
        <script src={`/js/mobile-nav.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
        <script src={`/js/cookie-consent.js?v=${ASSET_VERSION}`} type="text/javascript" defer></script>
        <script src={`/js/whatsapp-widget.js?v=${ASSET_VERSION}`} type="text/javascript" defer></script>
        <script src={`/js/social-share.js?v=${ASSET_VERSION}`} type="text/javascript" defer></script>
        <script src={`/js/newsletter-handler.js?v=${ASSET_VERSION}`} type="text/javascript" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js"></script>
        <script src={`/js/inline-scripts.js?v=${ASSET_VERSION}`} type="text/javascript"></script>
    </>
  );
}
