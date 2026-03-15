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
      languages: Object.fromEntries(
        locales.map(l => [l, `/${l}`])
      ),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://www.akurock.com",
              name: "stonearts® GmbH",
              description: "Handcrafted natural stone acoustic panels, slat walls & wall panels",
              url: "https://www.akurock.com",
              logo: "https://www.akurock.com/images/stonearts%C2%AE-logo-black-long.svg",
              image: "https://www.akurock.com/images/stonearts-og-image.webp",
              telephone: "+43 660 855 10 01",
              email: "office@stonearts.at",
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
                ratingValue: 5.0,
                reviewCount: 30,
                bestRating: 5,
              },
              sameAs: [
                "https://www.instagram.com/stonearts_official/",
                "https://www.youtube.com/@stonearts",
                "https://www.tiktok.com/@stonearts",
                "https://www.pinterest.com/stonearts/",
                "https://www.facebook.com/stonearts/",
              ],
              priceRange: "€€",
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
        {locales.map((l) => (
          <link key={l} rel="alternate" hrefLang={l === 'de' ? 'de-AT' : l === 'en' ? 'en' : 'es'} href={`https://www.akurock.com/${l}`} />
        ))}
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
        <script src="/js/button-click-fix.js" type="text/javascript"></script>
        <script src="/js/i18n-client.js" type="text/javascript"></script>
        <script src="/js/scroll-animations.js" type="text/javascript" defer></script>
        <script src="/js/cookie-consent.js" type="text/javascript" defer></script>
        <script src="/js/whatsapp-widget.js" type="text/javascript" defer></script>
        <script src="/js/social-share.js" type="text/javascript" defer></script>
        <script src="/js/newsletter-handler.js" type="text/javascript" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (globalThis.CodeCrumbs = globalThis.CodeCrumbs || {}).QuantityButtons = function(options) {
            const {
              quantityGroupClass: groupClass = "q-group",
              quantityIncrementButtonClass: incClass = "q-inc",
              quantityDecrementButtonClass: decClass = "q-dec",
              quantityNumberFieldClass: numFieldClass = "q-num",
              disableDecrementAtOne: disableAtOne = true
            } = options;
            function updateDecrementButton(input, decButton) {
              const disable = disableAtOne && parseInt(input.value, 10) <= 1;
              decButton.toggleAttribute("disabled", disable);
              decButton.classList.toggle("disabled", disable);
            }
            function init() {
              document.querySelectorAll(\`.\${groupClass}\`).forEach(group => {
                const input = group.querySelector(\`.\${numFieldClass}\`);
                const decButton = group.querySelector(\`.\${decClass}\`);
                if (input && decButton) {
                  updateDecrementButton(input, decButton);
                }
              });
            }
            if (document.readyState !== "loading") {
              init();
            } else {
              document.addEventListener("DOMContentLoaded", init);
            }
            document.addEventListener("click", function(event) {
              let target = event.target;
              while (target && target.nodeType === Node.ELEMENT_NODE && (!target.classList || (!target.classList.contains(incClass) && !target.classList.contains(decClass)))) {
                target = target.parentNode;
              }
              if (target && target instanceof Element) {
                const group = target.closest(\`.\${groupClass}\`);
                const input = group.querySelector(\`.\${numFieldClass}\`);
                const decButton = group.querySelector(\`.\${decClass}\`);
                let value = parseInt(input.value, 10);
                if (target.classList.contains(incClass)) {
                  input.value = value + 1;
                } else if (target.classList.contains(decClass)) {
                  input.value = Math.max(value - 1, 1);
                }
                updateDecrementButton(input, decButton);
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            });
            new MutationObserver((mutations) => {
              mutations.forEach(mutation => {
                if (mutation.type === "attributes" && mutation.attributeName === "value") {
                  init();
                }
              });
            }).observe(document, {
              attributes: true,
              subtree: true,
              attributeFilter: ["value"]
            });
          };
          document.addEventListener('DOMContentLoaded', function() {
            window.CodeCrumbs.QuantityButtons({
              quantityGroupClass: 'q-group',
              quantityIncrementButtonClass: 'q-inc',
              quantityDecrementButtonClass: 'q-dec',
              quantityNumberFieldClass: 'q-num',
              disableDecrementAtOne: true,
            });
          });
        `,
          }}
        />
        <script src="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          $(document).ready(function() {
            $(".slider-main_component").each(function(index) {
              let loopMode = false;
              if ($(this).attr("loop-mode") === "true") {
                loopMode = true;
              }
              let sliderDuration = 300;
              if ($(this).attr("slider-duration") !== undefined) {
                sliderDuration = +$(this).attr("slider-duration");
              }
              const swiper = new Swiper($(this).find(".swiper")[0], {
                speed: sliderDuration,
                loop: loopMode,
                autoHeight: false,
                centeredSlides: false,
                followFinger: true,
                freeMode: false,
                slideToClickedSlide: false,
                slidesPerView: 1.3,
                spaceBetween: "4%",
                rewind: false,
                watchOverflow: true,
                touchEventsTarget: 'container',
                touchStartPreventDefault: false,
                touchMoveStopPropagation: false,
                simulateTouch: true,
                allowTouchMove: true,
                touchRatio: 1,
                touchAngle: 45,
                grabCursor: true,
                mousewheel: {
                  forceToAxis: true
                },
                keyboard: {
                  enabled: false,
                  onlyInViewport: false
                },
                breakpoints: {
                  480: {
                    slidesPerView: 1,
                    spaceBetween: "3%"
                  },
                  768: {
                    slidesPerView: 2,
                    spaceBetween: "4%"
                  },
                  992: {
                    slidesPerView: 3.2,
                    spaceBetween: "1%"
                  }
                },
                pagination: {
                  el: $(this).find(".swiper-bullet-wrapper")[0],
                  bulletActiveClass: "is-active",
                  bulletClass: "swiper-bullet",
                  bulletElement: "button",
                  clickable: true
                },
                navigation: {
                  nextEl: $(this).find(".swiper-next")[0],
                  prevEl: $(this).find(".swiper-prev")[0],
                  disabledClass: "is-disabled"
                },
                scrollbar: {
                  el: $(this).find(".swiper-drag-wrapper")[0],
                  draggable: true,
                  dragClass: "swiper-drag",
                  snapOnRelease: true
                },
                slideActiveClass: "is-active",
                slideDuplicateActiveClass: "is-active"
              });
            });
          });
        `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          $(document).ready(function() {
            const accSettings = {
              speed: 300,
              oneOpen: true,
              offsetAnchor: true,
              offsetFromTop: 180,
              scrollTopDelay: 400,
              classes: {
                accordion: 'js-accordion',
                header: 'js-accordion-header',
                item: 'js-accordion-item',
                body: 'js-accordion-body',
                icon: 'js-accordion-icon',
                active: 'active',
              }
            };
            const prefix = accSettings.classes;
            const accordionElem = $(\`.\${prefix.accordion}\`);
            const accordionHeader = accordionElem.find(\`.\${prefix.header}\`);
            const accordionItem = $(\`.\${prefix.item}\`);
            const accordionBody = $(\`.\${prefix.body}\`);
            const accordionIcon = $(\`.\${prefix.icon}\`);
            const activeClass = prefix.active;
            const accordion = {
              init: function(settings) {
                $.extend(accSettings, settings);
                accordionHeader.on('click', function() {
                  accordion.toggle($(this));
                  if (accSettings.offsetAnchor) {
                    setTimeout(() => {
                      $('html, body').animate({
                        scrollTop: $(this).offset().top - accSettings.offsetFromTop
                      }, accSettings.speed);
                    }, accSettings.scrollTopDelay);
                  }
                });
                if (accSettings.oneOpen && $(\`.\${prefix.item}.\${activeClass}\`).length > 1) {
                  $(\`.\${prefix.item}.\${activeClass}:not(:first)\`).removeClass(activeClass).find(\`.\${prefix.header} > .\${prefix.icon}\`).removeClass(activeClass);
                }
                $(\`.\${prefix.item}.\${activeClass}\`).find(\`> .\${prefix.body}\`).show();
              },
              toggle: function($this) {
                if (accSettings.oneOpen && $this[0] != $this.closest(accordionElem).find(\`> .\${prefix.item}.\${activeClass} > .\${prefix.header}\`)[0]) {
                  $this.closest(accordionElem).find(\`> .\${prefix.item}\`).removeClass(activeClass).find(accordionBody).slideUp(accSettings.speed);
                  $this.closest(accordionElem).find(\`> .\${prefix.item}\`).find(\`> .\${prefix.header} > .\${prefix.icon}\`).removeClass(activeClass);
                }
                $this.closest(accordionItem).toggleClass(\`\${activeClass}\`).find(\`> .\${prefix.header} > .\${prefix.icon}\`).toggleClass(activeClass);
                $this.next().stop().slideToggle(accSettings.speed);
              }
            };
            accordion.init(accSettings);
          });
        `,
          }}
        />
      </body>
    </html>
  );
}
