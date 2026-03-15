/**
 * Simple, Direct Add-to-Cart Handler
 * This is a standalone, bulletproof implementation that just works
 */

(function() {
  'use strict';

  console.log('🛒 Add-to-Cart Handler: Initializing...');

  // Main handler function - SIMPLE AND DIRECT
  function handleAddToCart(e) {
    console.log('🔍 Add-to-Cart Handler: Click detected!', {
      target: e.target,
      targetTag: e.target.tagName,
      targetType: e.target.type,
      targetClass: e.target.className,
      hasDataNodeType: e.target.getAttribute('data-node-type')
    });
    
    // Find the form - try multiple methods
    let form = null;
    let button = e.target;
    
    // Method 1: Check if clicked element is the button itself
    if (button.matches && button.matches('[data-node-type="commerce-add-to-cart-button"]')) {
      form = button.closest('[data-node-type="commerce-add-to-cart-form"]') ||
             button.closest('form');
      console.log('✅ Found form via button method 1');
    }
    // Method 2: Check if clicked element is inside the button
    else if (button.closest && button.closest('[data-node-type="commerce-add-to-cart-button"]')) {
      button = button.closest('[data-node-type="commerce-add-to-cart-button"]');
      form = button.closest('[data-node-type="commerce-add-to-cart-form"]') ||
             button.closest('form');
      console.log('✅ Found form via button method 2');
    }
    // Method 3: Check if clicked element is a submit input/button
    else if ((button.tagName === 'INPUT' && button.type === 'submit') ||
             (button.tagName === 'BUTTON' && button.type === 'submit')) {
      form = button.closest('[data-node-type="commerce-add-to-cart-form"]') ||
             button.closest('form');
      console.log('✅ Found form via submit button method');
    }
    // Method 4: Check if clicked element is the form itself
    else if (button.matches && button.matches('[data-node-type="commerce-add-to-cart-form"]')) {
      form = button;
      console.log('✅ Found form directly');
    }
    // Method 5: Check if clicked element is inside the form
    else if (button.closest && button.closest('[data-node-type="commerce-add-to-cart-form"]')) {
      form = button.closest('[data-node-type="commerce-add-to-cart-form"]');
      console.log('✅ Found form via closest method');
    }
    
    if (!form) {
      console.log('⚠️ Add-to-Cart: No form found, ignoring click');
      return; // Not our form, let it proceed
    }
    
    console.log('✅ Add-to-Cart: Form found!', form);
    
    // PREVENT DEFAULT - Always prevent Webflow from handling this
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Get product and variant IDs
    const productId = form.getAttribute('data-wf-product-id');
    const variantId = form.getAttribute('data-wf-variant-id');
    
    console.log('🔍 Add-to-Cart: Form data', { productId, variantId });
    
    if (!productId || !variantId) {
      console.error('❌ Add-to-Cart: Form missing product/variant IDs', {
        productId: productId || 'missing',
        variantId: variantId || 'missing',
        form: form,
        formHTML: form.outerHTML.substring(0, 200)
      });
      return false;
    }
    
    // Get quantity
    const quantityInput = form.querySelector('input[name="commerce-add-to-cart-quantity-input"]') ||
                          form.querySelector('input.q-num') ||
                          form.querySelector('input[type="number"]');
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
    
    console.log('🛒 Add-to-Cart: Adding to cart', { productId, variantId, quantity });
    
    // Wait for CartManager if not ready yet
    function tryAddToCart() {
      if (window.CartManager) {
        try {
          const success = window.CartManager.addToCart(productId, variantId, quantity);
          if (success) {
            console.log('✅ Add-to-Cart: Item added successfully (cart will open automatically)');

            // GA4: track add_to_cart conversion
            if (typeof gtag === 'function') {
              try {
                var productName = '';
                var priceText = '';
                var pageEl = document.querySelector('.product-detail_name, h1');
                if (pageEl) productName = pageEl.textContent || '';
                var priceEl = document.querySelector('.product-detail_price, .price');
                if (priceEl) priceText = (priceEl.textContent || '').replace(/[^\d.,]/g, '');
                gtag('event', 'add_to_cart', {
                  currency: 'EUR',
                  value: parseFloat(priceText.replace(',', '.')) || 0,
                  items: [{
                    item_id: productId,
                    item_name: productName,
                    item_variant: variantId,
                    quantity: quantity
                  }]
                });
              } catch (gaErr) {
                console.warn('GA4 add_to_cart event error:', gaErr);
              }
            }
          } else {
            console.error('❌ Add-to-Cart: addToCart returned false');
          }
        } catch (error) {
          console.error('❌ Add-to-Cart: Error calling addToCart', error);
        }
      } else {
        console.warn('⚠️ Add-to-Cart: CartManager not ready, retrying in 100ms...');
        setTimeout(tryAddToCart, 100);
      }
    }
    
    tryAddToCart();
    
    return false;
  }

  // Set up event listeners IMMEDIATELY - don't wait for CartManager
  console.log('🛒 Add-to-Cart Handler: Setting up event listeners immediately...');
  
  // Use event delegation on document - catches ALL clicks
  document.addEventListener('click', function(e) {
    // Check if this is an add-to-cart button or form
    const isAddToCartButton = e.target.matches('[data-node-type="commerce-add-to-cart-button"]') ||
                               e.target.closest('[data-node-type="commerce-add-to-cart-button"]') ||
                               (e.target.tagName === 'INPUT' && e.target.type === 'submit' && 
                                e.target.closest('[data-node-type="commerce-add-to-cart-form"]')) ||
                               (e.target.tagName === 'BUTTON' && e.target.type === 'submit' && 
                                e.target.closest('[data-node-type="commerce-add-to-cart-form"]'));
    
    const isAddToCartForm = e.target.matches('[data-node-type="commerce-add-to-cart-form"]') ||
                            e.target.closest('[data-node-type="commerce-add-to-cart-form"]');
    
    if (isAddToCartButton || isAddToCartForm) {
      console.log('🎯 Add-to-Cart Handler: Button/Form click detected!');
      handleAddToCart(e);
    }
  }, true); // Capture phase - runs FIRST
  
  // Also handle form submits
  document.addEventListener('submit', function(e) {
    if (e.target.matches && e.target.matches('[data-node-type="commerce-add-to-cart-form"]')) {
      console.log('🎯 Add-to-Cart Handler: Form submit detected!');
      handleAddToCart(e);
    }
  }, true); // Capture phase - runs FIRST
  
  // Also handle mousedown events (catches clicks before they become submits)
  document.addEventListener('mousedown', function(e) {
    const button = e.target.closest('[data-node-type="commerce-add-to-cart-button"]') ||
                   (e.target.matches && e.target.matches('[data-node-type="commerce-add-to-cart-button"]') ? e.target : null);
    
    if (button) {
      console.log('🎯 Add-to-Cart Handler: Button mousedown detected!');
      // Don't prevent default here, just log - let click handler do the work
    }
  }, true);
  
  console.log('✅ Add-to-Cart Handler: Event listeners attached immediately');

  // Function to directly attach handlers to buttons (fallback method)
  function attachDirectHandlers() {
    const buttons = document.querySelectorAll('[data-node-type="commerce-add-to-cart-button"]');
    console.log(`🔧 Add-to-Cart Handler: Found ${buttons.length} buttons to attach direct handlers`);
    
    buttons.forEach((button, index) => {
      // Remove any existing handlers to avoid duplicates
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Get the form
      const form = newButton.closest('[data-node-type="commerce-add-to-cart-form"]') ||
                   newButton.closest('form');
      
      if (form) {
        const productId = form.getAttribute('data-wf-product-id');
        const variantId = form.getAttribute('data-wf-variant-id');
        
        if (productId && variantId) {
          // Prevent form submission
          form.setAttribute('action', 'javascript:void(0);');
          form.setAttribute('onsubmit', 'return false;');
          form.action = 'javascript:void(0);';
          form.onsubmit = function() { return false; };
          
          // Change button type to prevent default submission
          if (newButton.type === 'submit') {
            newButton.type = 'button';
          }
          
          // Add direct onclick handler as fallback
          newButton.addEventListener('click', function(e) {
            console.log('🔧 Direct handler: Button clicked!', { productId, variantId });
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const quantityInput = form.querySelector('input[name="commerce-add-to-cart-quantity-input"]') ||
                                  form.querySelector('input.q-num') ||
                                  form.querySelector('input[type="number"]');
            const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
            
            function tryAddToCart() {
              if (window.CartManager) {
                try {
                  const success = window.CartManager.addToCart(productId, variantId, quantity);
                  if (success) {
                    console.log('✅ Direct handler: Item added successfully (cart will open automatically)');
                  }
                } catch (error) {
                  console.error('❌ Direct handler: Error', error);
                }
              } else {
                setTimeout(tryAddToCart, 100);
              }
            }
            
            tryAddToCart();
            return false;
          }, true);
          
          console.log(`✅ Add-to-Cart Handler: Direct handler attached to button ${index + 1}`, { productId, variantId });
        }
      }
    });
  }
  
  // Attach handlers to existing buttons when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(attachDirectHandlers, 500); // Wait a bit for forms to be populated
    });
  } else {
    setTimeout(attachDirectHandlers, 500);
  }

  // Also set up forms when they're created (for dynamically added forms)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // Check if this is a form or contains a form
          let form = null;
          if (node.matches && node.matches('[data-node-type="commerce-add-to-cart-form"]')) {
            form = node;
          } else if (node.querySelector) {
            form = node.querySelector('[data-node-type="commerce-add-to-cart-form"]');
          }
          
          if (form) {
            // Ensure form has proper attributes
            const productId = form.getAttribute('data-wf-product-id');
            const variantId = form.getAttribute('data-wf-variant-id');
            
            if (productId && variantId) {
              // Prevent form submission
              form.setAttribute('action', 'javascript:void(0);');
              form.setAttribute('onsubmit', 'return false;');
              form.action = 'javascript:void(0);';
              form.onsubmit = function() { return false; };
              
              // Change button type if needed
              const button = form.querySelector('[data-node-type="commerce-add-to-cart-button"]') ||
                            form.querySelector('input[type="submit"]') ||
                            form.querySelector('button[type="submit"]');
              if (button && button.type === 'submit') {
                button.type = 'button';
              }
              
              console.log('✅ Add-to-Cart Handler: Set up new form', { productId, variantId });
              
              // Re-attach direct handlers after a short delay
              setTimeout(attachDirectHandlers, 100);
            }
          }
        }
      });
    });
  });

  // Start observing
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  console.log('✅ Add-to-Cart Handler: Initialized');
})();
