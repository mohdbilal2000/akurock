/**
 * Mobile navigation + accordion controller — self-contained, vanilla JS.
 *
 * Replaces the jQuery-based initMobileNav + initAccordion in inline-scripts.js.
 * Uses a single document-level click listener (event delegation), so it:
 *   - has no jQuery / Webflow dependency,
 *   - keeps working even if React re-renders the DOM (the listener lives on
 *     `document`, not on the buttons),
 *   - covers every .js-accordion on the site (mobile nav, FAQ, product pages).
 *
 * Open state is expressed with the `active` class; nextjs-overrides.css shows
 * the matching .js-accordion-body when its item is `active`.
 */
(function () {
  'use strict';

  function closeMobileMenu() {
    var drop = document.querySelector('.nav-mobile-drop');
    var btn = document.querySelector('.menu-button');
    if (drop) drop.style.display = 'none';
    if (btn) btn.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  }

  document.addEventListener(
    'click',
    function (e) {
      // 1) Hamburger button — open/close the mobile menu
      var menuBtn = e.target.closest && e.target.closest('.menu-button');
      if (menuBtn) {
        e.preventDefault();
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

      // 2) Accordion header — expand/collapse (Shop/Inspiration/Kundenservice,
      //    plus FAQ and product-page accordions)
      var header = e.target.closest && e.target.closest('.js-accordion-header');
      if (header) {
        var item = header.closest('.js-accordion-item');
        if (item) {
          item.classList.toggle('active');
          var icon = header.querySelector('.js-accordion-icon');
          if (icon) icon.classList.toggle('active');
        }
        return;
      }

      // 3) Tapping a link inside the open mobile menu — close it after nav
      var linkInDrop = e.target.closest && e.target.closest('.nav-mobile-drop a');
      if (linkInDrop) {
        setTimeout(closeMobileMenu, 120);
      }
    },
    false
  );
})();
