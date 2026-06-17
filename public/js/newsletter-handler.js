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

  // Webflow custom checkboxes (e.g. the newsletter "Yes, I accept…" box) show
  // their checked state via a `w--redirected-checked` class on the visual
  // <div class="w-checkbox-input">, normally added by webflow.js. That init
  // doesn't run here, so clicking the box toggled the hidden input but showed
  // NO checkmark — it looked dead. Sync the class on every checkbox change
  // (delegated, covers all custom checkboxes) and set the initial state.
  function syncCheckbox(cb) {
    var wrap = cb.closest && cb.closest('.w-checkbox');
    if (!wrap) return;
    var vis = wrap.querySelector('.w-checkbox-input');
    if (vis) vis.classList.toggle('w--redirected-checked', cb.checked);
  }
  function initCheckboxes() {
    document.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'checkbox') syncCheckbox(e.target);
    });
    document.querySelectorAll('.w-checkbox input[type="checkbox"]').forEach(syncCheckbox);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); initCheckboxes(); });
  } else {
    init();
    initCheckboxes();
  }
})();
