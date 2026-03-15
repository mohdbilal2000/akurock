/**
 * GDPR Cookie Consent Banner
 * Lightweight, no dependencies, 3-locale support (DE/EN/ES)
 * Manages cookie consent state and gates analytics tracking.
 */
(function () {
  'use strict';

  var COOKIE_NAME = 'stonearts_consent';
  var CONSENT_DURATION_DAYS = 365;

  var locale = (typeof window !== 'undefined' && window.__LOCALE__) || 'de';

  var strings = {
    de: {
      message: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und den Datenverkehr zu analysieren.',
      accept: 'Alle akzeptieren',
      decline: 'Nur notwendige',
      learnMore: 'Mehr erfahren',
      privacyUrl: '/de/cookie-und-datschenschutzerklaerung',
    },
    en: {
      message: 'We use cookies to improve your experience and analyze traffic.',
      accept: 'Accept all',
      decline: 'Essential only',
      learnMore: 'Learn more',
      privacyUrl: '/en/privacy-policy',
    },
    es: {
      message: 'Utilizamos cookies para mejorar su experiencia y analizar el tráfico.',
      accept: 'Aceptar todas',
      decline: 'Solo esenciales',
      learnMore: 'Más información',
      privacyUrl: '/es/politica-de-privacidad',
    },
  };

  var t = strings[locale] || strings.de;

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + value + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function hasConsented() {
    return getCookie(COOKIE_NAME) === 'accepted';
  }

  function hasDeclined() {
    return getCookie(COOKIE_NAME) === 'declined';
  }

  function hasResponded() {
    return hasConsented() || hasDeclined();
  }

  function enableAnalytics() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
      });
    }
    window.dispatchEvent(new CustomEvent('cookieConsentGranted'));
  }

  function removeBanner() {
    var banner = document.getElementById('stonearts-cookie-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity = '0';
      setTimeout(function () {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 300);
    }
  }

  function showBanner() {
    var banner = document.createElement('div');
    banner.id = 'stonearts-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');

    banner.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'z-index:9998',
      'background:#1a1a1a',
      'color:#e0e0e0',
      'padding:16px 24px',
      'font-family:"Playfair Display",Georgia,serif',
      'font-size:14px',
      'line-height:1.5',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-wrap:wrap',
      'gap:12px 24px',
      'box-shadow:0 -2px 16px rgba(0,0,0,0.3)',
      'transform:translateY(100%)',
      'opacity:0',
      'transition:transform 0.3s ease,opacity 0.3s ease',
    ].join(';');

    var messageSpan = document.createElement('span');
    messageSpan.style.cssText = 'flex:1 1 300px;min-width:200px;';
    messageSpan.textContent = t.message + ' ';

    var learnMoreLink = document.createElement('a');
    learnMoreLink.href = t.privacyUrl;
    learnMoreLink.textContent = t.learnMore;
    learnMoreLink.style.cssText = 'color:#aaa;text-decoration:underline;';
    messageSpan.appendChild(learnMoreLink);

    var btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:8px;flex-shrink:0;';

    var btnStyle = 'padding:8px 20px;border:none;border-radius:4px;font-size:13px;font-family:inherit;cursor:pointer;transition:opacity 0.2s;';

    var acceptBtn = document.createElement('button');
    acceptBtn.textContent = t.accept;
    acceptBtn.style.cssText = btnStyle + 'background:#fff;color:#0d0d0d;font-weight:600;';
    acceptBtn.addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'accepted', CONSENT_DURATION_DAYS);
      enableAnalytics();
      removeBanner();
    });

    var declineBtn = document.createElement('button');
    declineBtn.textContent = t.decline;
    declineBtn.style.cssText = btnStyle + 'background:transparent;color:#ccc;border:1px solid #555;';
    declineBtn.addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'declined', CONSENT_DURATION_DAYS);
      removeBanner();
    });

    btnContainer.appendChild(acceptBtn);
    btnContainer.appendChild(declineBtn);
    banner.appendChild(messageSpan);
    banner.appendChild(btnContainer);
    document.body.appendChild(banner);

    // Animate in after DOM insertion
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.style.transform = 'translateY(0)';
        banner.style.opacity = '1';
      });
    });
  }

  // Main entry
  function init() {
    if (!hasResponded()) {
      showBanner();
    } else if (hasConsented()) {
      enableAnalytics();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API for programmatic access
  window.CookieConsent = {
    hasConsented: hasConsented,
    hasDeclined: hasDeclined,
    hasResponded: hasResponded,
    reset: function () {
      setCookie(COOKIE_NAME, '', -1);
      location.reload();
    },
  };
})();
