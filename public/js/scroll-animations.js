/**
 * Scroll-triggered reveal animations using IntersectionObserver.
 * Replaces Webflow IX2 interactions that don't fire in Next.js context.
 *
 * Targets elements with data-w-id attributes (Webflow interaction triggers)
 * and common section/content classes that should animate on scroll.
 */
(function () {
  'use strict';

  // CSS for reveal animations — injected once
  var style = document.createElement('style');
  style.textContent = [
    /* Initial hidden state */
    '.sa-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }',
    '.sa-reveal-left { opacity: 0; transform: translateX(-30px); transition: opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }',
    '.sa-reveal-right { opacity: 0; transform: translateX(30px); transition: opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }',
    '.sa-reveal-scale { opacity: 0; transform: scale(0.95); transition: opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }',
    /* Visible state */
    '.sa-visible { opacity: 1 !important; transform: translateY(0) translateX(0) scale(1) !important; }',
    /* Stagger children */
    '.sa-stagger > .sa-reveal:nth-child(2) { transition-delay: 0.1s; }',
    '.sa-stagger > .sa-reveal:nth-child(3) { transition-delay: 0.2s; }',
    '.sa-stagger > .sa-reveal:nth-child(4) { transition-delay: 0.3s; }',
    '.sa-stagger > .sa-reveal:nth-child(5) { transition-delay: 0.4s; }',
    '.sa-stagger > .sa-reveal:nth-child(6) { transition-delay: 0.5s; }',
  ].join('\n');
  document.head.appendChild(style);

  // Selectors for elements that should animate on scroll
  var REVEAL_SELECTORS = [
    // Major content sections
    '.section-medium',
    '.section-bento-main',
    '.section_video_product',
    '.section-2',
    '.section.content-tile',
    // Bento grid items
    '.cta-bento',
    '.img_bento',
    '.long_img_bento',
    '.bento-img-container',
    // Content wrappers
    '.shout-out-wrapper',
    '.taps-left',
    '.tile-wrapper',
    '.review-wrapper',
    // Headings and text blocks that Webflow would normally animate
    '.slogan_installation_guide_wrap',
    '.gallerie_header_wrap',
    '.shout-outs-wrapper',
    // Selection tiles (product grid items)
    '.selection-tile_link-block',
    // Slider sections
    '.slider-page-padding',
    // Health / sustainability columns
    '.health-text-container',
    '.health-text-container-2',
    // Footer
    '.footer-content-wrapper',
  ];

  function init() {
    if (!('IntersectionObserver' in window)) return; // graceful fallback: everything visible

    var elements = document.querySelectorAll(REVEAL_SELECTORS.join(','));

    elements.forEach(function (el) {
      // Skip elements already above the fold (visible immediately)
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        // Element is already in view — don't add animation, just ensure it's visible
        return;
      }
      el.classList.add('sa-reveal');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('sa-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    document.querySelectorAll('.sa-reveal, .sa-reveal-left, .sa-reveal-right, .sa-reveal-scale').forEach(function (el) {
      observer.observe(el);
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure all content has rendered
    setTimeout(init, 100);
  }
})();
