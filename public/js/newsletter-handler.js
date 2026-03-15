/**
 * Newsletter Form Handler
 * Intercepts the Webflow newsletter form and POSTs to /api/newsletter.
 * Shows Webflow's built-in success/error states.
 */
(function () {
  'use strict';

  function init() {
    // Find the Webflow newsletter form(s) — they use Webflow naming patterns
    var forms = document.querySelectorAll('form[name="wf-form-Subscribe"], form[data-name="Subscribe"]');
    if (!forms.length) {
      // Fallback: look for footer email forms
      forms = document.querySelectorAll('.footer-form form, .newsletter-form form');
    }

    forms.forEach(function (form) {
      // Prevent Webflow's default form handling
      form.setAttribute('action', 'javascript:void(0)');
      form.setAttribute('method', 'post');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var emailInput = form.querySelector('input[type="email"], input[name*="email"], input[name*="Email"]');
        if (!emailInput || !emailInput.value.trim()) return;

        var email = emailInput.value.trim();
        var submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email }),
        })
          .then(function (res) {
            if (res.ok) {
              // Show Webflow success state
              form.style.display = 'none';
              var successEl = form.parentElement && form.parentElement.querySelector('.w-form-done');
              if (successEl) {
                successEl.style.display = 'block';
              } else {
                // Fallback: replace form with success message
                var msg = document.createElement('div');
                msg.style.cssText = 'color:#25D366;font-size:14px;padding:8px 0;';
                msg.textContent = window.__LOCALE__ === 'en' ? 'Successfully subscribed!'
                  : window.__LOCALE__ === 'es' ? '¡Suscripción exitosa!'
                  : 'Erfolgreich abonniert!';
                form.parentElement.appendChild(msg);
              }

              // GA4 event
              if (typeof gtag === 'function') {
                gtag('event', 'newsletter_signup', { method: 'footer_form' });
              }
            } else {
              throw new Error('Subscription failed');
            }
          })
          .catch(function () {
            // Show Webflow error state
            var failEl = form.parentElement && form.parentElement.querySelector('.w-form-fail');
            if (failEl) {
              failEl.style.display = 'block';
            }
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
