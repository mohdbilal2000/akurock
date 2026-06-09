/**
 * Mobile navigation + accordion controller — self-contained, vanilla JS.
 *
 * Replaces the jQuery-based initMobileNav + initAccordion in inline-scripts.js.
 * A single CAPTURE-phase document click listener so it runs before any other
 * handler and is the sole authority on these interactions — then it
 * stopImmediatePropagation()s, so no leftover/duplicate handler can toggle the
 * state back. No jQuery/Webflow dependency; survives React re-renders.
 *
 * Covers every .js-accordion on the site: the mobile menu
 * (Shop/Inspiration/Kundenservice), FAQ questions, and product-page accordions.
 */
(function () {
  'use strict';

  // Guard against the script being included/initialised more than once.
  if (window.__akurockNavInit) return;
  window.__akurockNavInit = true;

  function closeMobileMenu() {
    var drop = document.querySelector('.nav-mobile-drop');
    var btn = document.querySelector('.menu-button');
    if (drop) drop.style.display = 'none';
    if (btn) btn.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  }

  function findBody(header) {
    var sib = header.nextElementSibling;
    if (sib && sib.classList && sib.classList.contains('js-accordion-body')) return sib;
    var item = header.closest('.js-accordion-item');
    return item ? item.querySelector('.js-accordion-body') : null;
  }

  document.addEventListener(
    'click',
    function (e) {
      if (!e.target || !e.target.closest) return;

      // 1) Hamburger button — open/close the mobile menu
      var menuBtn = e.target.closest('.menu-button');
      if (menuBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var drop = document.querySelector('.nav-mobile-drop');
        if (!drop) return;
        if (menuBtn.classList.contains('is-open')) {
          drop.style.display = 'none';
          menuBtn.classList.remove('is-open');
          document.body.classList.remove('nav-open');
        } else {
          drop.style.display = 'flex';
          menuBtn.classList.add('is-open');
          document.body.classList.add('nav-open');
        }
        return;
      }

      // 2) Accordion header — expand/collapse (mobile nav, FAQ, product pages).
      //    stopImmediatePropagation so no other handler can flip it back.
      var header = e.target.closest('.js-accordion-header');
      if (header) {
        e.stopImmediatePropagation();
        var body = findBody(header);
        if (body) {
          var willOpen = window.getComputedStyle(body).display === 'none';
          body.style.setProperty('display', willOpen ? 'block' : 'none', 'important');
          var item = header.closest('.js-accordion-item');
          if (item) item.classList.toggle('active', willOpen);
          var icon = header.querySelector('.js-accordion-icon');
          if (icon) icon.classList.toggle('active', willOpen);
        }
        return;
      }

      // 3) Tapping a link inside the open mobile menu — close it after nav
      //    (do NOT stop propagation; the link must still navigate)
      if (e.target.closest('.nav-mobile-drop a')) {
        setTimeout(closeMobileMenu, 120);
      }
    },
    true // capture phase
  );
})();
