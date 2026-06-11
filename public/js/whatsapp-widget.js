/**
 * WhatsApp Chat Widget
 * Floating button (bottom-left) with locale-aware pre-filled message.
 * Does not conflict with language switcher (bottom-right).
 */
(function () {
  'use strict';

  var locale = (typeof window !== 'undefined' && window.__LOCALE__) || 'de';
  var phoneNumber = '919057597719'; // +91 90575 97719

  var messages = {
    de: 'Hallo! Ich habe eine Frage zu den Akurock Akustikpaneelen.',
    en: 'Hello! I have a question about Akurock acoustic panels.',
    es: '¡Hola! Tengo una pregunta sobre los paneles acústicos Akurock.',
  };

  function createWidget() {
    var msg = encodeURIComponent(messages[locale] || messages.de);
    var url = 'https://wa.me/' + phoneNumber + '?text=' + msg;

    var btn = document.createElement('a');
    btn.href = url;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Chat on WhatsApp');
    btn.style.cssText = [
      'position:fixed',
      'bottom:calc(16px + env(safe-area-inset-bottom))',
      'right:16px',
      'z-index:9997',
      'width:44px',
      'height:44px',
      'border-radius:50%',
      'background:#25D366',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
      'transition:transform 0.2s ease',
      'cursor:pointer',
      'text-decoration:none',
    ].join(';');

    btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="white">'
      + '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>'
      + '</svg>';

    btn.addEventListener('mouseenter', function () { btn.style.transform = 'scale(1.1)'; });
    btn.addEventListener('mouseleave', function () { btn.style.transform = 'scale(1)'; });

    document.body.appendChild(btn);

    // Hide while the cookie-consent banner (z-index 9998, spans the bottom)
    // is open — it sits above this button and intercepts taps. The banner
    // removes itself from the DOM on consent.
    function syncWithBanner() {
      btn.style.display = document.getElementById('stonearts-cookie-banner') ? 'none' : 'flex';
    }
    syncWithBanner();
    new MutationObserver(syncWithBanner).observe(document.body, { childList: true });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
