(function() {
  'use strict';

  var locale = window.__LOCALE__ || 'de';

  // Flag SVGs for each locale (small circular country flags)
  var flags = {
    de: '<svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="15" fill="#FFCE00"/><path d="M1,16 a15,15 0 0,1 30,0" fill="#DD0000"/><path d="M1.8,10.5 a15,15 0 0,1 28.4,0" fill="#000"/><circle cx="16" cy="16" r="15" fill="none" stroke="#ddd" stroke-width="0.5"/></svg>',
    en: '<svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="15" fill="#012169"/><path d="M3,3 L29,29 M29,3 L3,29" stroke="#fff" stroke-width="4"/><path d="M3,3 L29,29 M29,3 L3,29" stroke="#C8102E" stroke-width="2"/><path d="M16,1 V31 M1,16 H31" stroke="#fff" stroke-width="6"/><path d="M16,1 V31 M1,16 H31" stroke="#C8102E" stroke-width="3"/><circle cx="16" cy="16" r="15" fill="none" stroke="#ddd" stroke-width="0.5"/></svg>',
    es: '<svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="15" fill="#FFCE00"/><path d="M1,11 a15,15 0 0,1 30,0" fill="#C60B1E"/><path d="M1,21 a15,15 0 0,0 30,0" fill="#C60B1E"/><circle cx="16" cy="16" r="15" fill="none" stroke="#ddd" stroke-width="0.5"/></svg>'
  };

  var labels = { de: 'DE', en: 'EN', es: 'ES' };
  var allLocales = ['de', 'en', 'es'];
  var otherLocales = allLocales.filter(function(l) { return l !== locale; });

  // Slug localization map: canonical (German) → { en: ..., es: ... }
  var SLUG_MAP = {
    'akurock-muster': { en: 'sample-box', es: 'caja-de-muestras' },
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
    'stoneskin': { en: 'stoneskin', es: 'stoneskin' }
  };

  // Build reverse map: localized slug → canonical slug
  var REVERSE_MAP = {};
  Object.keys(SLUG_MAP).forEach(function(canonical) {
    // The canonical (DE) slug maps to itself
    REVERSE_MAP[canonical] = canonical;
    Object.keys(SLUG_MAP[canonical]).forEach(function(lang) {
      REVERSE_MAP[SLUG_MAP[canonical][lang]] = canonical;
    });
  });

  function getCurrentPagePath() {
    var path = window.location.pathname;
    var match = path.match(/^\/(de|en|es)(\/.*)?$/);
    return match ? (match[2] || '') : path;
  }

  function getLocalizedPath(targetLocale) {
    var pagePath = getCurrentPagePath();
    if (!pagePath || pagePath === '/') return '/' + targetLocale;

    // Extract the first slug segment
    var segments = pagePath.replace(/^\//, '').split('/');
    var firstSlug = segments[0];

    // Check if this slug can be localized
    var canonical = REVERSE_MAP[firstSlug];
    if (canonical && SLUG_MAP[canonical]) {
      var localizedSlug;
      if (targetLocale === 'de') {
        localizedSlug = canonical; // Use canonical (German) slug
      } else {
        localizedSlug = SLUG_MAP[canonical][targetLocale] || canonical;
      }
      segments[0] = localizedSlug;
    }

    return '/' + targetLocale + '/' + segments.join('/');
  }

  function createSwitcher() {
    var container = document.createElement('div');
    container.id = 'lang-switcher';
    container.innerHTML =
      '<style>' +
      '#lang-switcher { position: fixed; bottom: calc(88px + env(safe-area-inset-bottom)); right: 16px; z-index: 9996; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }' +
      '#lang-switcher .lang-main { width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s; padding: 0; }' +
      '#lang-switcher .lang-main:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }' +
      '#lang-switcher .lang-options { position: absolute; bottom: 56px; right: 0; display: flex; flex-direction: column; gap: 8px; opacity: 0; pointer-events: none; transform: translateY(8px); transition: opacity 0.25s ease, transform 0.25s ease; }' +
      '#lang-switcher.open .lang-options { opacity: 1; pointer-events: auto; transform: translateY(0); }' +
      '#lang-switcher .lang-option { width: 44px; height: 44px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.12); transition: transform 0.15s; padding: 0; text-decoration: none; }' +
      '#lang-switcher .lang-option:hover { transform: scale(1.1); }' +
      '@media (max-width: 480px) { #lang-switcher { bottom: calc(84px + env(safe-area-inset-bottom)); right: 12px; } }' +
      '</style>' +
      '<div class="lang-options">' +
      otherLocales.map(function(l) {
        return '<a href="' + getLocalizedPath(l) + '" class="lang-option" title="' + labels[l] + '" aria-label="Switch to ' + labels[l] + '">' + flags[l] + '</a>';
      }).join('') +
      '</div>' +
      '<button class="lang-main" title="' + labels[locale] + '" aria-label="Change language">' + flags[locale] + '</button>';

    document.body.appendChild(container);

    // Toggle dropdown
    var mainBtn = container.querySelector('.lang-main');
    mainBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      container.classList.toggle('open');
    });

    // Close on click outside
    document.addEventListener('click', function() {
      container.classList.remove('open');
    });

    // Prevent closing when clicking options area
    container.querySelector('.lang-options').addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSwitcher);
  } else {
    createSwitcher();
  }
})();
