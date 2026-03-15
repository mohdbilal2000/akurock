/**
 * Social Share Buttons for Product Pages
 * Injects share links (WhatsApp, Facebook, X/Twitter, Email) below the product price area.
 * Only activates on /product/ URLs.
 */
(function () {
  'use strict';

  // Only activate on product pages
  if (!window.location.pathname.match(/\/product\//)) return;

  var locale = (typeof window !== 'undefined' && window.__LOCALE__) || 'de';
  var pageUrl = encodeURIComponent(window.location.href);
  var pageTitle = encodeURIComponent(document.title);

  var labels = { de: 'Teilen', en: 'Share', es: 'Compartir' };
  var label = labels[locale] || labels.de;

  var shareLinks = [
    {
      name: 'WhatsApp',
      url: 'https://wa.me/?text=' + pageTitle + '%20' + pageUrl,
      color: '#25D366',
      svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/sharer/sharer.php?u=' + pageUrl,
      color: '#1877F2',
      svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    },
    {
      name: 'X',
      url: 'https://twitter.com/intent/tweet?url=' + pageUrl + '&text=' + pageTitle,
      color: '#000',
      svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    },
    {
      name: 'Email',
      url: 'mailto:?subject=' + pageTitle + '&body=' + pageUrl,
      color: '#666',
      svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    },
  ];

  function createShareBar() {
    var container = document.createElement('div');
    container.className = 'stonearts-share-bar';
    container.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 0;margin:8px 0;border-top:1px solid #eee;';

    var labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.cssText = 'font-size:13px;color:#888;font-family:"Playfair Display",Georgia,serif;';
    container.appendChild(labelSpan);

    shareLinks.forEach(function (link) {
      var a = document.createElement('a');
      a.href = link.url;
      a.target = link.name === 'Email' ? '_self' : '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', 'Share via ' + link.name);
      a.style.cssText = 'display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#f5f5f5;color:' + link.color + ';text-decoration:none;transition:background 0.2s,transform 0.2s;';
      a.innerHTML = link.svg;
      a.addEventListener('mouseenter', function () {
        a.style.background = '#e8e8e8';
        a.style.transform = 'scale(1.1)';
      });
      a.addEventListener('mouseleave', function () {
        a.style.background = '#f5f5f5';
        a.style.transform = 'scale(1)';
      });
      container.appendChild(a);
    });

    // Find insertion point: after the product add-to-cart form or price section
    var target = document.querySelector('.product-detail_price-wrapper')
      || document.querySelector('[data-node-type="commerce-add-to-cart-form"]')
      || document.querySelector('.product-detail_price');

    if (target && target.parentNode) {
      target.parentNode.insertBefore(container, target.nextSibling);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createShareBar);
  } else {
    // Delay slightly to allow CMS population to run first
    setTimeout(createShareBar, 500);
  }
})();
