/**
 * Unified inline scripts for stonearts® pages.
 * Replaces inline <script> blocks that don't execute inside dangerouslySetInnerHTML.
 * Handles: Swiper initialization, Accordion, QuantityButtons
 */
(function () {
  'use strict';

  // ==========================================
  // 1. QUANTITY BUTTONS (CodeCrumbs pattern)
  // ==========================================
  (globalThis.CodeCrumbs = globalThis.CodeCrumbs || {}).QuantityButtons = function (options) {
    var groupClass = (options && options.quantityGroupClass) || 'q-group';
    var incClass = (options && options.quantityIncrementButtonClass) || 'q-inc';
    var decClass = (options && options.quantityDecrementButtonClass) || 'q-dec';
    var numFieldClass = (options && options.quantityNumberFieldClass) || 'q-num';
    var disableAtOne = options && options.disableDecrementAtOne !== undefined ? options.disableDecrementAtOne : true;

    function updateDecrementButton(input, decButton) {
      var disable = disableAtOne && parseInt(input.value, 10) <= 1;
      decButton.toggleAttribute('disabled', disable);
      decButton.classList.toggle('disabled', disable);
    }

    function init() {
      document.querySelectorAll('.' + groupClass).forEach(function (group) {
        var input = group.querySelector('.' + numFieldClass);
        var decButton = group.querySelector('.' + decClass);
        if (input && decButton) {
          updateDecrementButton(input, decButton);
        }
      });
    }

    if (document.readyState !== 'loading') {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }

    document.addEventListener('click', function (event) {
      var target = event.target;
      while (target && target.nodeType === Node.ELEMENT_NODE && (!target.classList || (!target.classList.contains(incClass) && !target.classList.contains(decClass)))) {
        target = target.parentNode;
      }
      if (target && target instanceof Element) {
        var group = target.closest('.' + groupClass);
        if (!group) return;
        var input = group.querySelector('.' + numFieldClass);
        var decButton = group.querySelector('.' + decClass);
        if (!input) return;
        var value = parseInt(input.value, 10);
        if (target.classList.contains(incClass)) {
          input.value = value + 1;
        } else if (target.classList.contains(decClass)) {
          input.value = Math.max(value - 1, 1);
        }
        if (decButton) updateDecrementButton(input, decButton);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    new MutationObserver(function () { init(); }).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ['value']
    });
  };

  // Auto-initialize QuantityButtons
  function initQuantityButtons() {
    if (window.CodeCrumbs && window.CodeCrumbs.QuantityButtons) {
      window.CodeCrumbs.QuantityButtons({
        quantityGroupClass: 'q-group',
        quantityIncrementButtonClass: 'q-inc',
        quantityDecrementButtonClass: 'q-dec',
        quantityNumberFieldClass: 'q-num',
        disableDecrementAtOne: true
      });
    }
  }

  // ==========================================
  // 2. SWIPER INITIALIZATION
  // ==========================================
  function initSwipers() {
    if (typeof Swiper === 'undefined') return;
    if (typeof $ === 'undefined' && typeof jQuery === 'undefined') return;
    var jq = typeof jQuery !== 'undefined' ? jQuery : $;

    // Homepage / general slider components
    jq('.slider-main_component').each(function (index) {
      // Skip if already initialized
      if (this.swiper) return;

      var loopMode = jq(this).attr('loop-mode') === 'true';
      var sliderDuration = 300;
      if (jq(this).attr('slider-duration') !== undefined) {
        sliderDuration = +jq(this).attr('slider-duration');
      }
      var swiperEl = jq(this).find('.swiper')[0];
      if (!swiperEl) return;

      new Swiper(swiperEl, {
        speed: sliderDuration,
        loop: loopMode,
        autoHeight: false,
        centeredSlides: false,
        followFinger: true,
        freeMode: false,
        slideToClickedSlide: false,
        slidesPerView: 1.3,
        spaceBetween: '4%',
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
        mousewheel: { forceToAxis: true },
        keyboard: { enabled: false, onlyInViewport: false },
        breakpoints: {
          480: { slidesPerView: 1, spaceBetween: '3%' },
          768: { slidesPerView: 2, spaceBetween: '4%' },
          992: { slidesPerView: 3.2, spaceBetween: '1%' }
        },
        pagination: {
          el: jq(this).find('.swiper-bullet-wrapper')[0],
          bulletActiveClass: 'is-active',
          bulletClass: 'swiper-bullet',
          bulletElement: 'button',
          clickable: true
        },
        navigation: {
          nextEl: jq(this).find('.swiper-next')[0],
          prevEl: jq(this).find('.swiper-prev')[0],
          disabledClass: 'is-disabled'
        },
        scrollbar: {
          el: jq(this).find('.swiper-drag-wrapper')[0],
          draggable: true,
          dragClass: 'swiper-drag',
          snapOnRelease: true
        },
        slideActiveClass: 'is-active',
        slideDuplicateActiveClass: 'is-active'
      });
    });

    // Product page selector sliders
    jq('.slider-selector_component').each(function () {
      if (this.swiper) return;
      var swiperEl = jq(this).find('.swiper')[0];
      if (!swiperEl) return;

      new Swiper(swiperEl, {
        speed: 300,
        loop: false,
        slidesPerView: 'auto',
        spaceBetween: 8,
        freeMode: true,
        watchOverflow: true,
        mousewheel: { forceToAxis: true },
        navigation: {
          nextEl: jq(this).find('.swiper-next')[0],
          prevEl: jq(this).find('.swiper-prev')[0],
          disabledClass: 'is-disabled'
        }
      });
    });
  }

  // ==========================================
  // 3. ACCORDION
  // ==========================================
  function initAccordion() {
    if (typeof $ === 'undefined' && typeof jQuery === 'undefined') return;
    var jq = typeof jQuery !== 'undefined' ? jQuery : $;

    var accSettings = {
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
        active: 'active'
      }
    };

    var prefix = accSettings.classes;
    var accordionElem = jq('.' + prefix.accordion);
    if (accordionElem.length === 0) return;

    // Skip if already initialized
    if (accordionElem.data('accordion-init')) return;
    accordionElem.data('accordion-init', true);

    var accordionHeader = accordionElem.find('.' + prefix.header);
    var accordionItem = jq('.' + prefix.item);
    var accordionBody = jq('.' + prefix.body);
    var activeClass = prefix.active;

    var accordion = {
      init: function () {
        accordionHeader.on('click', function () {
          accordion.toggle(jq(this));
          if (accSettings.offsetAnchor) {
            var el = jq(this);
            setTimeout(function () {
              jq('html, body').animate({
                scrollTop: el.offset().top - accSettings.offsetFromTop
              }, accSettings.speed);
            }, accSettings.scrollTopDelay);
          }
        });
        if (accSettings.oneOpen && jq('.' + prefix.item + '.' + activeClass).length > 1) {
          jq('.' + prefix.item + '.' + activeClass + ':not(:first)').removeClass(activeClass).find('.' + prefix.header + ' > .' + prefix.icon).removeClass(activeClass);
        }
        jq('.' + prefix.item + '.' + activeClass).find('> .' + prefix.body).show();
      },
      toggle: function ($this) {
        if (accSettings.oneOpen && $this[0] != $this.closest(accordionElem).find('> .' + prefix.item + '.' + activeClass + ' > .' + prefix.header)[0]) {
          $this.closest(accordionElem).find('> .' + prefix.item).removeClass(activeClass).find(accordionBody).slideUp(accSettings.speed);
          $this.closest(accordionElem).find('> .' + prefix.item).find('> .' + prefix.header + ' > .' + prefix.icon).removeClass(activeClass);
        }
        $this.closest(accordionItem).toggleClass(activeClass).find('> .' + prefix.header + ' > .' + prefix.icon).toggleClass(activeClass);
        $this.next().stop().slideToggle(accSettings.speed);
      }
    };
    accordion.init();
  }

  // ==========================================
  // 4. MOBILE NAV TOGGLE
  // ==========================================
  function initMobileNav() {
    var menuButton = document.querySelector('.menu-button');
    var navDrop = document.querySelector('.nav-mobile-drop');

    if (!menuButton || !navDrop) return;
    if (menuButton.dataset.navInit) return;
    menuButton.dataset.navInit = 'true';

    function openMenu() {
      navDrop.style.display = 'flex';
      menuButton.classList.add('is-open');
      document.body.classList.add('nav-open');
    }

    function closeMenu() {
      navDrop.style.display = 'none';
      menuButton.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    }

    menuButton.addEventListener('click', function () {
      if (menuButton.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close when tapping any link inside the mobile menu
    navDrop.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        setTimeout(closeMenu, 100);
      }
    });
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function initAll() {
    initQuantityButtons();
    initAccordion();
    initMobileNav();
    // Swiper may need a slight delay for DOM readiness
    if (typeof Swiper !== 'undefined') {
      initSwipers();
    } else {
      // Wait for Swiper to load (it might be deferred)
      var attempts = 0;
      var swiperCheck = setInterval(function () {
        attempts++;
        if (typeof Swiper !== 'undefined') {
          clearInterval(swiperCheck);
          initSwipers();
        } else if (attempts > 30) {
          clearInterval(swiperCheck);
        }
      }, 200);
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    // DOM already loaded, but wait a tick for other scripts
    setTimeout(initAll, 100);
  }

  // Also re-initialize after CMS data updates (populate-cms.js triggers this)
  document.addEventListener('cmsDataUpdated', function () {
    setTimeout(function () {
      initSwipers();
      initAccordion();
    }, 300);
  });

  // Re-initialize after page navigation (Next.js soft navigation)
  if (typeof window !== 'undefined') {
    var lastPath = window.location.pathname;
    var observer = new MutationObserver(function () {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        setTimeout(initAll, 300);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

})();
