/**
 * CMS Content Populator
 * Populates missing CMS content in HTML pages using complete Webflow CMS data
 * Handles all metafields: special images, colors, marketing content, relationships
 */

(function() {
  'use strict';

  // ============================================================================
  // CLIENT-SIDE TRANSLATION HELPER
  // ============================================================================
  const _locale = window.__LOCALE__ || 'de';
  let _i18nDict = null;

  async function loadI18n() {
    if (_locale === 'de') return; // No translation needed for German
    try {
      const resp = await fetch(`/data/i18n/${_locale}.json?v=${Date.now()}`);
      if (resp.ok) _i18nDict = await resp.json();
    } catch (e) {
      console.warn('populate-cms.js: Could not load i18n for', _locale);
    }
  }

  function t(text) {
    if (!text || !_i18nDict) return text;
    return _i18nDict[text] || text;
  }

  // Load CMS data
  let cmsData = null;
  let cartManagerInitialized = false; // Prevent double-initialization

  // ============================================================================
  // PHASE 1: DISABLE WEBFLOW COMMERCE HANDLERS AT SOURCE
  // This must run BEFORE Webflow.js loads to prevent it from attaching handlers
  // ============================================================================
  (function() {
    // Intercept Webflow's require function to disable commerce module
    if (typeof window !== 'undefined') {
      // Store original Webflow if it exists
      const originalWebflow = window.Webflow;
      
      // Override Webflow.require to disable commerce
      Object.defineProperty(window, 'Webflow', {
        configurable: true,
        get: function() {
          return originalWebflow || {};
        },
        set: function(value) {
          if (value && value.require) {
            const originalRequire = value.require;
            value.require = function(module) {
              // Disable commerce/ecommerce modules
              if (module === 'commerce' || module === 'ecommerce' || 
                  (typeof module === 'string' && module.includes('commerce'))) {
                console.log('🚫 Webflow commerce module disabled:', module);
                return {
                  // Return stub object to prevent errors
                  on: function() {},
                  off: function() {},
                  trigger: function() {}
                };
              }
              return originalRequire.apply(this, arguments);
            };
          }
          // Store the modified Webflow
          Object.defineProperty(window, 'Webflow', {
            value: value,
            writable: true,
            configurable: true
          });
        }
      });
      
      // If Webflow already exists, disable its commerce handlers
      if (originalWebflow && originalWebflow.require) {
        const originalRequire = originalWebflow.require;
        originalWebflow.require = function(module) {
          if (module === 'commerce' || module === 'ecommerce' || 
              (typeof module === 'string' && module.includes('commerce'))) {
            console.log('🚫 Webflow commerce module disabled (existing):', module);
            return {
              on: function() {},
              off: function() {},
              trigger: function() {}
            };
          }
          return originalRequire.apply(this, arguments);
        };
      }
      
      // Prevent Webflow from attaching form handlers
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        // If this is a form submit listener on a commerce form, block it
        if (type === 'submit' && this.matches && this.matches('[data-node-type="commerce-add-to-cart-form"]')) {
          // Check if this is Webflow's handler (has specific patterns)
          const listenerStr = listener.toString();
          if (listenerStr.includes('ecommerce') || listenerStr.includes('commerce') || 
              listenerStr.includes('Webflow') || listenerStr.includes('w-commerce')) {
            console.log('🚫 Blocked Webflow form handler attachment');
            return; // Don't attach the handler
          }
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      console.log('✅ Webflow commerce handlers disabled at source');
    }
  })();

  // Fetch CMS data
  // Priority: localStorage (admin edits) → JSON file (fallback)
  async function loadCMSData() {
    try {
      // First, check if AdminDataManager is available (admin panel loaded)
      // If available, use it to load data (handles localStorage → JSON fallback)
      if (window.AdminDataManager) {
        console.log('populate-cms.js: Using AdminDataManager to load CMS data');
        cmsData = await window.AdminDataManager.loadCMSData();
        return cmsData;
      }
      
      // Fallback: Check localStorage directly (use same key as AdminDataManager)
      const STORAGE_KEY = 'stonearts_cms_data';
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          // Validate localStorage data - check if it has products and at least some sample boxes
          if (parsedData && parsedData.products && Array.isArray(parsedData.products) && parsedData.products.length > 0) {
            // Check if localStorage has old CDN URLs - if so, prefer JSON file
            // Check both images array and selection_slider_image fields
            const brushProduct = parsedData.products.find(p => p.slug === 'brush' || p.id === 'brush');
            const yamiProduct = parsedData.products.find(p => p.slug === 'yami' || p.id === 'yami');
            const gaiaProduct = parsedData.products.find(p => p.slug === 'gaia' || p.id === 'gaia');
            
            const hasOldCDNUrls = 
              (brushProduct && brushProduct.images && brushProduct.images.some(img => 
                img.url && (img.url.includes('cdn.prod.website-files.com') || img.url.includes('uploads-ssl.webflow.com'))
              )) ||
              (yamiProduct && yamiProduct.selection_slider_image && (
                yamiProduct.selection_slider_image.includes('cdn.prod.website-files.com') || 
                yamiProduct.selection_slider_image.includes('uploads-ssl.webflow.com')
              )) ||
              (gaiaProduct && gaiaProduct.selection_slider_image && (
                gaiaProduct.selection_slider_image.includes('cdn.prod.website-files.com') || 
                gaiaProduct.selection_slider_image.includes('uploads-ssl.webflow.com')
              ));
            
            if (hasOldCDNUrls) {
              console.warn('populate-cms.js: localStorage has old CDN URLs (images or selection_slider_image), forcing reload from JSON file');
              localStorage.removeItem(STORAGE_KEY); // Clear old data
              // Continue to JSON file load below
            } else {
              // Check if there are any sample boxes in localStorage data
              const hasSampleBoxes = parsedData.products.some(p => 
                p.category === 'AKUROCK Muster' || 
                (p.id && p.id.includes('-sample')) || 
                (p.name && p.name.toLowerCase().includes('sample'))
              );
              
              if (hasSampleBoxes) {
                console.log('populate-cms.js: Loaded CMS data from localStorage (valid data with sample boxes)');
                cmsData = parsedData;
                return cmsData;
              } else {
                console.warn('populate-cms.js: localStorage data exists but has no sample boxes, falling back to JSON file');
              }
            }
          } else {
            console.warn('populate-cms.js: localStorage data is invalid or empty, falling back to JSON file');
          }
        } catch (e) {
          console.error('populate-cms.js: Error parsing localStorage data, falling back to JSON:', e);
        }
      }
      
      // Final fallback: Load from JSON file - try API route first, then static file
      console.log('populate-cms.js: Loading CMS data from JSON file');
      let response;
      try {
        // Try API route first (works better on serverless platforms)
        const cacheBuster = '?v=' + Date.now();
        response = await fetch('/api/data/mock-cms-data' + cacheBuster);
        if (!response.ok) {
          throw new Error(`API route failed: ${response.statusText}`);
        }
      } catch (apiError) {
        console.warn('populate-cms.js: API route failed, trying static file:', apiError);
        // Fallback to static file
        const cacheBuster = '?v=' + Date.now();
        response = await fetch('/data/mock-cms-data.json' + cacheBuster);
        if (!response.ok) {
          throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }
      }
      const jsonText = await response.text();
      console.log('populate-cms.js: JSON file size:', jsonText.length, 'characters');
      console.log('populate-cms.js: First 500 chars:', jsonText.substring(0, 500));
      console.log('populate-cms.js: Last 200 chars:', jsonText.substring(jsonText.length - 200));
      cmsData = JSON.parse(jsonText);
      console.log('populate-cms.js: Parsed JSON - Products count:', cmsData.products?.length || 0);
      
      // Save to localStorage for future use (if AdminDataManager is available)
      if (window.AdminDataManager && cmsData) {
        try {
          window.AdminDataManager.saveCMSData(cmsData);
          console.log('populate-cms.js: Saved JSON data to localStorage for future use');
        } catch (e) {
          console.warn('populate-cms.js: Could not save to localStorage:', e);
        }
      }
      
      return cmsData;
    } catch (error) {
      console.error('Error loading CMS data:', error);
      return null;
    }
  }
  
  // ============================================================================
  // GLOBAL SETUP FORM FUNCTION - Must be in global scope to be accessible everywhere
  // ============================================================================
  function setupFormImmediately(form, productId, variantId) {
    try {
      // Skip if already set up
      if (form.dataset.formSetupComplete === 'true') {
        return;
      }
      
      // Ensure we have IDs
      if (!productId) productId = form.getAttribute('data-wf-product-id');
      if (!variantId) variantId = form.getAttribute('data-wf-variant-id');
      
      if (!productId || !variantId) {
        console.warn('⚠️ setupFormImmediately: Form missing IDs', { productId, variantId });
        return;
      }
      
      // 1. Change button type FIRST (before any handlers can attach)
      // Find button using multiple selectors to catch all cases
      const submitButton = form.querySelector('[data-node-type="commerce-add-to-cart-button"]') ||
                          form.querySelector('[type="submit"]') ||
                          form.querySelector('[type="button"]') ||
                          form.querySelector('input[value*="Warenkorb"]') ||
                          form.querySelector('input[value*="warenkorb"]') ||
                          form.querySelector('input[value*="In den Warenkorb"]');
      
      if (submitButton) {
        // FORCE button type change - use multiple methods to ensure it sticks
        if (submitButton.type === 'submit' || submitButton.getAttribute('type') === 'submit') {
          submitButton.setAttribute('type', 'button');
          submitButton.type = 'button'; // Set directly on DOM property
          submitButton.removeAttribute('type'); // Remove attribute first
          submitButton.setAttribute('type', 'button'); // Set again
          console.log('✅ Changed submit button type to button', { 
            button: submitButton, 
            type: submitButton.type,
            hasAttribute: submitButton.getAttribute('type')
          });
        }
        
        // Also ensure button doesn't have form submission behavior
        submitButton.setAttribute('form', ''); // Remove form association
        submitButton.setAttribute('formnovalidate', 'formnovalidate');
      }
      
      // 2. Set form attributes IMMEDIATELY
      form.setAttribute('action', 'javascript:void(0);');
      form.setAttribute('onsubmit', 'return false;');
      form.setAttribute('method', 'post');
      form.setAttribute('novalidate', 'novalidate');
      form.action = 'javascript:void(0);';
      form.onsubmit = function() { return false; };
      
      // 3. Create handler function
      const formHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const quantityInput = form.querySelector('input[name="commerce-add-to-cart-quantity-input"]') ||
                              form.querySelector('input.q-num') ||
                              form.querySelector('input[type="number"]');
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
        
        if (window.CartManager) {
          const success = window.CartManager.addToCart(productId, variantId, quantity);
          if (success) {
            console.log('✅ Form handler: Item added to cart');
          } else {
            console.error('❌ Form handler: addToCart returned false');
          }
        } else {
          console.error('❌ Form handler: CartManager not available');
        }
        return false;
      };
      
      // 4. Attach handlers to form (submit event)
      form.removeEventListener('submit', formHandler, true); // Remove if exists
      form.addEventListener('submit', formHandler, true);
      
      // 5. Attach handlers to button (click and mousedown events)
      // Use multiple event types and phases to ensure clicks are caught
      if (submitButton) {
        // Remove any existing handlers first
        submitButton.removeEventListener('click', formHandler, true);
        submitButton.removeEventListener('click', formHandler, false);
        submitButton.removeEventListener('mousedown', formHandler, true);
        submitButton.removeEventListener('mousedown', formHandler, false);
        submitButton.removeEventListener('mouseup', formHandler, true);
        
        // Attach handlers in capture phase (fires first)
        submitButton.addEventListener('click', formHandler, true);
        submitButton.addEventListener('mousedown', formHandler, true);
        submitButton.addEventListener('mouseup', formHandler, true);
        
        // Also attach in bubble phase as backup
        submitButton.addEventListener('click', formHandler, false);
        
        // Add inline onclick as ultimate fallback (works even if event listeners fail)
        const inlineHandler = function() {
          formHandler({ preventDefault: () => {}, stopPropagation: () => {}, stopImmediatePropagation: () => {} });
          return false;
        };
        submitButton.onclick = inlineHandler;
        submitButton.setAttribute('onclick', 'return false;'); // Prevent default form submission
        
        console.log('✅ Attached handlers to button', { 
          button: submitButton, 
          type: submitButton.type,
          hasHandlers: true
        });
      }
      
      // Mark as set up
      form.dataset.formSetupComplete = 'true';
      console.log('✅ setupFormImmediately: Form set up successfully', { productId, variantId });
    } catch (error) {
      console.error('❌ Error setting up form immediately:', error);
    }
  }

  // ============================================================================
  // PHASE 2: ENHANCED GLOBAL FORM INTERCEPTOR + BUTTON CLICK INTERCEPTOR
  // Block ALL commerce-add-to-cart-form submissions AND button clicks
  // This runs IMMEDIATELY before Webflow.js handlers
  // ============================================================================
  
  // Global click interceptor for add-to-cart buttons (safety net)
  // This catches clicks even if button type wasn't changed or handlers weren't attached
  document.addEventListener('click', function(e) {
    const target = e.target;
    const button = target.closest('[data-node-type="commerce-add-to-cart-button"]') ||
                   (target.matches && target.matches('[data-node-type="commerce-add-to-cart-button"]') ? target : null) ||
                   (target.type === 'submit' && target.closest('[data-node-type="commerce-add-to-cart-form"]'));
    
    if (button) {
      const form = button.closest('[data-node-type="commerce-add-to-cart-form"]') ||
                   button.closest('form');
      
      if (form) {
        const productId = form.getAttribute('data-wf-product-id');
        const variantId = form.getAttribute('data-wf-variant-id');
        
        // Only intercept if form has IDs and CartManager is available
        if (productId && variantId && window.CartManager) {
          // Check if this is already handled by setupFormImmediately
          // If form is marked as set up, let the existing handler work
          if (form.dataset.formSetupComplete === 'true') {
            return; // Let existing handler work
          }
          
          // Otherwise, handle it here as fallback
          console.log('🔧 Global interceptor: Caught button click', { productId, variantId });
          
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Force button type change
          if (button.type === 'submit') {
            button.type = 'button';
            button.setAttribute('type', 'button');
          }
          
          const quantityInput = form.querySelector('input[name="commerce-add-to-cart-quantity-input"]') ||
                                form.querySelector('input.q-num') ||
                                form.querySelector('input[type="number"]');
          const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
          
          try {
            const success = window.CartManager.addToCart(productId, variantId, quantity);
            if (success) {
              console.log('✅ Global interceptor: Item added to cart');
            } else {
              console.error('❌ Global interceptor: addToCart returned false');
            }
          } catch (error) {
            console.error('❌ Global interceptor: Error adding to cart', error);
          }
          
          return false;
        }
      }
    }
  }, true); // Capture phase - fires before other handlers
  
  (function() {
    // Function to handle form submission or button click
    function handleAddToCartEvent(e) {
      let form = null;
      let button = null;
      
      // Check if this is a form submission
      if (e.target.matches && e.target.matches('[data-node-type="commerce-add-to-cart-form"]')) {
        form = e.target;
      } else {
        // Check if this is a button click
        button = e.target.closest('[data-node-type="commerce-add-to-cart-button"]') ||
                 e.target.closest('input[type="submit"]') ||
                 e.target.closest('input[type="button"]') ||
                 e.target.closest('button[type="submit"]') ||
                 e.target.closest('button[type="button"]');
        
        if (button) {
          form = button.closest('[data-node-type="commerce-add-to-cart-form"]') ||
                 button.form;
        }
      }
      
      if (!form || !form.matches || !form.matches('[data-node-type="commerce-add-to-cart-form"]')) {
        return; // Not a commerce form, let it proceed
      }
      
      // ALWAYS prevent default behavior
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      console.log('🚫 Global interceptor: Prevented form submission/button click - API call blocked');
      
      // Try to handle the form if CartManager is available
      if (window.CartManager) {
        const productId = form.getAttribute('data-wf-product-id');
        const variantId = form.getAttribute('data-wf-variant-id');
        
        if (productId && variantId) {
          // Get quantity
          const quantityInput = form.querySelector('input[name="commerce-add-to-cart-quantity-input"]') ||
                                form.querySelector('input.q-num') ||
                                form.querySelector('input[type="number"]');
          const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
          
          // Add to cart
          try {
            const success = window.CartManager.addToCart(productId, variantId, quantity);
            if (success) {
              console.log('✅ Global interceptor: Item added to cart');
            } else {
              console.error('❌ Global interceptor: addToCart returned false');
            }
          } catch (error) {
            console.error('❌ Global interceptor: Error adding to cart', error);
          }
        } else {
          console.warn('⚠️ Global interceptor: Form missing product/variant IDs', {
            productId: productId || 'missing',
            variantId: variantId || 'missing'
          });
        }
      } else {
        console.warn('⚠️ Global interceptor: CartManager not available yet');
      }
      
      return false;
    }
    
    // Attach to MULTIPLE event types and phases
    // Form submit events (capture phase - runs FIRST)
    document.addEventListener('submit', handleAddToCartEvent, true);
    
    // Button click events (capture phase - runs FIRST)
    document.addEventListener('click', handleAddToCartEvent, true);
    document.addEventListener('mousedown', handleAddToCartEvent, true);
    
    // Also attach to document.body when it's ready
    if (document.body) {
      document.body.addEventListener('submit', handleAddToCartEvent, true);
      document.body.addEventListener('click', handleAddToCartEvent, true);
      document.body.addEventListener('mousedown', handleAddToCartEvent, true);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.addEventListener('submit', handleAddToCartEvent, true);
        document.body.addEventListener('click', handleAddToCartEvent, true);
        document.body.addEventListener('mousedown', handleAddToCartEvent, true);
      });
    }
    
    console.log('✅ Enhanced global interceptor: Installed (submit, click, mousedown events)');
  })();

  // Listen for data updates from admin panel
  // This allows the website to reflect changes immediately when admin saves
  window.addEventListener('cmsDataUpdated', function(event) {
    console.log('populate-cms.js: CMS data updated event received');
    if (event.detail) {
      cmsData = event.detail;
      // Re-populate current page with new data
      const pathname = window.location.pathname.toLowerCase();
      const filename = pathname.split('/').pop() || '';
      
      if (filename.includes('detail_product') ||
          pathname.includes('detail_product') ||
          pathname.includes('product/') ||
          document.querySelector('[bind="44360311-a628-3bd3-7fc8-c24734f06683"]')) {
        console.log('populate-cms.js: Re-populating product page');
        populateProductPage();
      } else if (filename.includes('zubehoer') || pathname.includes('zubehoer') ||
                 filename.includes('accessories') || pathname.includes('accessories') ||
                 filename.includes('accesorios') || pathname.includes('accesorios') ||
                 document.querySelector('[bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d73b"]')) {
        console.log('populate-cms.js: Re-populating accessories page');
        populateAccessoriesPage();
      } else if (pathname === '/' || filename === 'index.html' || filename === '' || filename.includes('index')) {
        console.log('populate-cms.js: Re-populating homepage');
        populateHomePageSlider();
        populateMarketingContent();
      } else if (filename.includes('akurock-muster') || pathname.includes('akurock-muster') ||
                 filename.includes('sample-box') || pathname.includes('sample-box') ||
                 filename.includes('caja-de-muestras') || pathname.includes('caja-de-muestras') ||
                 document.querySelector('#sample-boxes-grid-container')) {
        console.log('populate-cms.js: Re-populating sample boxes page');
        populateSampleBoxesPage();
      }
    }
  });

  /**
   * Get image path - tries local first, falls back to provided URL
   * This is SAFE - never breaks, always has fallback
   * @param {object} product - Product object
   * @param {string} imageField - Field name (mainImage, selection_slider_image, etc.)
   * @param {string} imageType - Optional image type (panel, installation, stone, closeup) for gallery images
   * @returns {string} Image path (local or CDN)
   */
  function getImagePath(product, imageField = 'mainImage', imageType = null) {
    const providedUrl = product[imageField];
    if (!providedUrl) return '';
    
    // If it's already a local path, normalize it (ensure leading slash for Next.js)
    if (providedUrl.startsWith('images/') || providedUrl.startsWith('/images/')) {
      // Ensure it starts with / for Next.js public folder
      return providedUrl.startsWith('/') ? providedUrl : '/' + providedUrl;
    }
    
    // If it's a CDN URL, try to find local equivalent
    if (providedUrl.includes('cdn.prod.website-files.com') || providedUrl.includes('uploads-ssl.webflow.com')) {
      const productSlug = (product.slug || product.id || '').toLowerCase();
      const productName = (product.name || '').toLowerCase();
      
      // Extract filenames from CDN URL to find local equivalents
      // CDN URLs format: https://cdn.prod.website-files.com/.../6672c45aa4067e84ea2efbae_Brush_Paneele.webp
      let extractedFilename = '';
      try {
        const urlParts = providedUrl.split('/');
        extractedFilename = urlParts[urlParts.length - 1] || '';
        // Decode URL encoding if present
        extractedFilename = decodeURIComponent(extractedFilename);
      } catch (e) {
        console.warn('populate-cms.js: Error extracting filename from CDN URL:', e);
      }
      
      // For sample boxes - map to sample images
      if (product.category === 'AKUROCK Muster' || product.id?.includes('-sample')) {
        const sampleMap = {
          'brush-sample': 'images/Brush_sample.png',
          'whisper-sample': 'images/Whisper_sample.png',
          'gaia-sample': 'images/Gaia_sample.png',
          'ligia-sample': 'images/Ligia_sample.png',
          'yami-sample': 'images/Yami_sample.png',
          'yuki-sample': 'images/Yuki_sample.png',
        };
        
        const localPath = sampleMap[productSlug] || sampleMap[product.id];
        if (localPath) {
          console.log(`populate-cms.js: Using local sample image for ${product.name}: ${localPath}`);
          return '/' + localPath;
        }
      }
      
      // For gallery images with type - try to map based on product + type
      if (imageType && productSlug) {
        // Try to find local images based on product slug and image type
        // This is a fallback - if exact filenames don't match, we'll try the CDN URL
        // The browser's onerror handler will handle 404s
        const typeBasedPath = `images/${extractedFilename}`;
        if (extractedFilename) {
          console.log(`populate-cms.js: Trying local path for gallery image (${imageType}): /${typeBasedPath}`);
          return '/' + typeBasedPath;
        }
      }
      
      // For gallery images - try to find local files by extracted filename
      if (extractedFilename && !imageType) {
        // Try direct match first
        const directLocalPath = 'images/' + extractedFilename;
        // Note: We can't check if file exists client-side, but we can try it
        // The browser will handle 404s via onerror handler
        console.log(`populate-cms.js: Trying local path for extracted filename: ${directLocalPath}`);
        return '/' + directLocalPath;
      }
      
      // For main products - map to block images (fallback for mainImage)
      const localImageMap = {
        'brush': 'images/667530dfb4d435589f6b7508_Brush.webp',
        'whisper': 'images/whisper_block.webp',
        'gaia': 'images/667530ff3fb596c83de661fc_Gaia.png',
        'ligia': 'images/Ligia_block.webp',
        'yami': 'images/667530f03d356da1743e6c58_Yami.webp',
        'yuki': 'images/yuki_block.webp',
        'scirocco': 'images/Scirocco_block.webp', // Check if exists
        'obsidian': 'images/Obsidian_block.webp', // Check if exists
      };
      
      const localPath = localImageMap[productSlug] || localImageMap[productName];
      if (localPath) {
        console.log(`populate-cms.js: Using local image for ${product.name}: ${localPath}`);
        return '/' + localPath;
      }
    }
    
    // Fallback to original URL (CDN or whatever was provided)
    // For CDN URLs, return as-is - browser will try to load them
    // The onerror handler in the img tag will handle failures gracefully
    return providedUrl;
  }

  // Get product from URL or default
  function getCurrentProduct() {
    if (!cmsData || !cmsData.products || cmsData.products.length === 0) {
      console.error('populate-cms.js: Cannot get product - cmsData is null or empty');
      return null;
    }

    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const productParam = searchParams.get('product');
    const match = path.match(/\/product\/([^\/]+)/);
    const slug = productParam || (match ? match[1] : null) || 'brush';
    
    console.log('populate-cms.js: Looking for product with slug:', slug);
    
    // Check main products first
    let product = cmsData.products.find(p => p.slug === slug || p.handle === slug || p.id === slug);
    
    // If not found, check samples
    if (!product && cmsData.samples) {
      product = cmsData.samples.find(p => p.slug === slug || p.handle === slug || p.id === slug);
      // If sample found, get parent product for full data
      if (product && product.parent_product_id) {
        const parent = cmsData.products.find(p => p.id === product.parent_product_id);
        if (parent) {
          // Merge sample data with parent data
          product = { ...parent, ...product };
        }
      }
    }
    
    if (product) {
      console.log('populate-cms.js: Found product:', product.name);
      // Validate that product has required cart IDs
      if (!product.productId || !product.variantId) {
        console.warn('populate-cms.js: Product found but missing cart IDs - cart may not work', {
          name: product.name,
          slug: product.slug,
          hasProductId: !!product.productId,
          hasVariantId: !!product.variantId,
          productId: product.productId,
          variantId: product.variantId
        });
      }
    } else {
      console.warn('populate-cms.js: Product not found, will use fallback');
    }
    
    return product || cmsData.products[0];
  }

  // Apply color scheme to elements
  function applyColorScheme(product) {
    if (!product || !product.color || !product.button_header_color) return;

    // Apply background color to product sections
    const productSections = document.querySelectorAll('[data-product-color]');
    productSections.forEach(section => {
      section.style.backgroundColor = product.color;
    });

    // Apply button/header color
    const colorElements = document.querySelectorAll('[data-product-accent-color]');
    colorElements.forEach(el => {
      el.style.color = product.button_header_color;
      el.style.borderColor = product.button_header_color;
    });

    // Apply to buttons
    const buttons = document.querySelectorAll('.button-outline-white, .button-outline-black');
    buttons.forEach(btn => {
      if (btn.closest('[data-product-section]')) {
        btn.style.borderColor = product.button_header_color;
        const text = btn.querySelector('.button-text');
        if (text) text.style.color = product.button_header_color;
      }
    });
  }

  // Reinitialize Swiper after content is added
  function reinitSwiper(container) {
    if (!container) return;
    
    // Wait a bit for DOM to update
    setTimeout(() => {
      // Check if Swiper is already initialized
      if (window.Swiper) {
        try {
          // Try to find swiper instance on the container or the swiper element
          const swiperElement = container.querySelector ? container.querySelector('.swiper') : container;
          if (swiperElement && swiperElement.swiper) {
            swiperElement.swiper.update();
            swiperElement.swiper.updateSlides();
            swiperElement.swiper.updateSlidesClasses();
            swiperElement.swiper.updateSize();
            swiperElement.swiper.slideTo(0, 0); // Reset to first slide without animation
            console.log('populate-cms.js: Swiper updated successfully');
          } else if (container.swiper) {
            // Fallback: check if swiper is on container directly
            container.swiper.update();
            container.swiper.updateSlides();
            container.swiper.updateSlidesClasses();
            container.swiper.updateSize();
            container.swiper.slideTo(0, 0);
            console.log('populate-cms.js: Swiper updated successfully (fallback)');
          } else {
            console.warn('populate-cms.js: Swiper instance not found, may need to reinitialize');
            // Try to reinitialize if jQuery and Swiper are available
            if (window.$ && window.Swiper && container.querySelector) {
              const $container = $(container);
              if ($container.hasClass('slider-selector_component') || $container.closest('.slider-selector_component').length) {
                const $element = $container.hasClass('slider-selector_component') ? $container : $container.closest('.slider-selector_component');
                const swiperContainer = $element.find('.swiper')[0];
                if (swiperContainer && !swiperContainer.swiper) {
                  // Reinitialize Swiper
                  const swiperConfig = {
                    slidesPerView: $element.hasClass('is-slider-product') ? 1 : 'auto',
                    slidesPerGroup: 1,
                    speed: 300,
                    slideToClickedSlide: false,
                    followFinger: true,
                    rewind: false,
                    loop: false,
                    centeredSlides: false,
                    touchEventsTarget: 'container',
                    touchStartPreventDefault: false,
                    touchMoveStopPropagation: false,
                    simulateTouch: true,
                    allowTouchMove: true,
                    touchRatio: 1,
                    touchAngle: 45,
                    grabCursor: true,
                  };
                  const swiper = new Swiper(swiperContainer, {
                    ...swiperConfig,
                    pagination: {
                      el: $element.find('.swiper-bullet-wrapper')[0],
                      bulletActiveClass: 'is-active',
                      bulletClass: 'swiper-bullet',
                      bulletElement: 'button',
                      clickable: true,
                      dynamicBullets: $element.hasClass('is-slider-product'),
                    },
                    navigation: {
                      nextEl: $element.find('.swiper-next')[0],
                      prevEl: $element.find('.swiper-prev')[0],
                      disabledClass: 'is-disabled'
                    },
                    scrollbar: {
                      el: $element.find('.swiper-drag-wrapper')[0],
                      draggable: true,
                      dragClass: 'swiper-drag',
                      snapOnRelease: true
                    }
                  });
                  swiperContainer.swiper = swiper;
                  console.log('populate-cms.js: Swiper reinitialized successfully');
                }
              }
            }
          }
        } catch (e) {
          console.warn('populate-cms.js: Could not update Swiper:', e);
        }
      }
    }, 200); // Increased timeout to ensure DOM is fully updated
  }

  /**
   * Populate product detail page
   * 
   * PATTERN ENFORCEMENT: All product pages follow the same structure and pattern.
   * This function ensures consistent population of:
   * - Product name (bind="44360311-a628-3bd3-7fc8-c24734f06683")
   * - Stone description (bind="116c2318-c33b-dcc5-4ef0-b6d435cfdf1a")
   * - Price (bind="44360311-a628-3bd3-7fc8-c24734f0668a")
   * - Dimensions (.text-block-127)
   * - Image gallery (bind="2fb8e092-727e-f3ca-475b-8178c0fc0239")
   * - Variant selector (bind="116c2318-c33b-dcc5-4ef0-b6d435cfdf1f")
   * 
   * All products must have:
   * - name, slug, stone, dimensions, price, priceValue, mainImage, selection_slider_image
   * - 4 images: panel, installation, stone, closeup
   * 
   * See PRODUCT-PAGE-PATTERN.md for full pattern documentation.
   */
  function populateProductPage() {
    console.log('🔄 populate-cms.js: populateProductPage() called');
    
    // Check if we're on a product detail page
    const productPageIndicator = document.querySelector('[bind="44360311-a628-3bd3-7fc8-c24734f06683"]');
    if (!productPageIndicator) {
      console.warn('populate-cms.js: Not a product detail page, skipping population');
      return;
    }
    
    console.log('✅ populate-cms.js: Product page detected, starting population...');
    
    // CRITICAL: Hide ALL empty states on product detail page FIRST
    // This ensures consistent layout regardless of data availability
    const productPageEmptyStates = document.querySelectorAll(
      '.section.product .w-dyn-empty, ' +
      '[bind="d37286f8-45ee-d5c0-5042-fa9b1e03f774"] .w-dyn-empty, ' +
      '[bind="2fb8e092-727e-f3ca-475b-8178c0fc0239"] .w-dyn-empty, ' +
      '[bind="116c2318-c33b-dcc5-4ef0-b6d435cfdf1f"] .w-dyn-empty, ' +
      '[bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae10"] .w-dyn-empty'
    );
    productPageEmptyStates.forEach(state => {
      state.style.display = 'none';
    });
    
    let product = getCurrentProduct();
    console.log('📦 populate-cms.js: Current product:', product ? {
      name: product.name,
      slug: product.slug,
      imageCount: product.images?.length || 0,
      images: product.images?.map(img => ({ type: img.type, url: img.url })) || []
    } : 'NOT FOUND');
    if (!product) {
      console.warn('populate-cms.js: Product not found in URL, using first available product as fallback');
      // Fallback to first product if none found
      if (cmsData && cmsData.products && cmsData.products.length > 0) {
        product = cmsData.products[0];
        console.log('populate-cms.js: Using fallback product:', product.name);
      } else {
        console.error('populate-cms.js: No products available in CMS data');
        return;
      }
    } else {
      console.log('populate-cms.js: Populating product page for:', product.name);
    }

    // Validate product has required fields for pattern consistency
    const requiredFields = ['name', 'slug', 'stone', 'dimensions', 'price', 'priceValue', 'mainImage', 'selection_slider_image'];
    const missingFields = requiredFields.filter(field => !product[field] || (Array.isArray(product[field]) && product[field].length === 0));
    if (missingFields.length > 0) {
      console.warn('populate-cms.js: Product missing required fields:', missingFields, 'Product:', product.name);
    }
    
    // Validate image gallery has exactly 4 images
    if (!product.images || product.images.length !== 4) {
      console.error('populate-cms.js: Product MUST have exactly 4 images (panel, installation, stone, closeup). Found:', product.images?.length || 0, 'Product:', product.name);
      // Don't proceed if images are missing - this is critical for the page to work correctly
      if (!product.images || product.images.length === 0) {
        console.error('populate-cms.js: Cannot populate product page without images');
        return;
      }
    }
    
    // Verify image types are correct
    if (product.images && product.images.length > 0) {
      const imageTypes = product.images.map(img => img.type).filter(Boolean);
      const requiredTypes = ['panel', 'installation', 'stone', 'closeup'];
      const missingTypes = requiredTypes.filter(type => !imageTypes.includes(type));
      if (missingTypes.length > 0 && product.images.length < 4) {
        console.warn('populate-cms.js: Missing image types:', missingTypes, 'Product:', product.name);
      }
    }

    console.log('populate-cms.js: Product data:', {
      name: product.name,
      slug: product.slug,
      stone: product.stone ? '✓' : '✗ Missing',
      dimensions: product.dimensions ? '✓' : '✗ Missing',
      images: product.images?.length || 0,
      hasAccessories: cmsData.accessories?.length > 0
    });

    // Apply color scheme
    applyColorScheme(product);

    // Product variant name - update ALL visible instances (mobile and desktop)
    // This is the product name (e.g., "Brush", "Whisper", "Yami")
    const variantNameEls = document.querySelectorAll('[bind="44360311-a628-3bd3-7fc8-c24734f06683"], [bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae05"]');
    variantNameEls.forEach(el => {
      const section = el.closest('.product_text_wrapper');
      if (section && window.getComputedStyle(section).display !== 'none') {
        if (product.name) {
          el.textContent = t(product.name);
        } else {
          console.warn('populate-cms.js: Product missing name');
        }
      }
    });

    // Price - update ALL visible price elements (mobile and desktop)
    // Format should match template: "€220.00 EUR"
    const priceEls = document.querySelectorAll('[bind="44360311-a628-3bd3-7fc8-c24734f0668a"], [bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae06"], [data-commerce-type="variation-price"]');
    let priceText = '';
    if (product.price) {
      // Ensure price has € symbol
      priceText = product.price.includes('€') ? product.price : `€${product.price}`;
      // Ensure it has proper formatting (e.g., €220.00)
      if (!priceText.match(/€\s*\d+\.\d{2}/)) {
        // Try to format it properly
        const numMatch = priceText.match(/[\d.]+/);
        if (numMatch) {
          const num = parseFloat(numMatch[0]);
          priceText = `€${num.toFixed(2)}`;
        }
      }
    } else if (product.priceValue) {
      priceText = `€${product.priceValue.toFixed(2)}`;
    } else {
      console.warn('populate-cms.js: Product missing price:', product.name);
      priceText = '€220.00';
    }
    const fullPriceText = `${priceText} ${product.currency || 'EUR'}`;
    
    priceEls.forEach(el => {
      const section = el.closest('.product_text_wrapper');
      if (section && window.getComputedStyle(section).display !== 'none') {
        el.textContent = fullPriceText;
      }
    });

    // Stone description - populate variant selector label (bind="116c2318-c33b-dcc5-4ef0-b6d435cfdf1a")
    // This should be the detailed stone description, not the product name
    const stoneDescriptionEls = document.querySelectorAll('[bind="116c2318-c33b-dcc5-4ef0-b6d435cfdf1a"], [bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae0b"], [bind="409f9c8b-4b78-5f06-d0ad-57ad5bbfb2ac"], [bind="3cf4aa70-0d84-d294-71cd-b36d5959da37"]');
    stoneDescriptionEls.forEach(el => {
      if (product.stone) {
        el.textContent = t(product.stone);
      } else {
        console.warn('populate-cms.js: Product missing stone description:', product.name);
      }
    });

    // Product description - update all instances
    const descriptionEls = document.querySelectorAll('.product-description-wrapper p, .product-description-text');
    descriptionEls.forEach(el => {
      if (product.description) {
        el.textContent = t(product.description);
      }
    });

    // Product dimensions - populate all dimension fields
    // Format should be: "Größe pro Paneel - 240 x 60 x 2.3 cm (1.44m²)" (German) or "Size per panel - ..." (English)
    const dimensionEls = document.querySelectorAll('.text-block-127');
    dimensionEls.forEach(el => {
      if (product.dimensions) {
        // Check if dimensions already include prefix, if not add it
        const dimText = product.dimensions.trim();
        if (dimText.toLowerCase().includes('size per panel') || dimText.toLowerCase().includes('größe pro paneel')) {
          el.textContent = dimText;
        } else {
          // Add prefix - translate label
          el.textContent = `${t('Größe pro Paneel')} - ${dimText}`;
        }
      } else {
        console.warn('populate-cms.js: Product missing dimensions:', product.name);
      }
    });

    // Product image gallery (mobile swiper) - bind="2fb8e092-727e-f3ca-475b-8178c0fc0239"
    const imageGallery = document.querySelector('[bind="2fb8e092-727e-f3ca-475b-8178c0fc0239"]');
    if (imageGallery) {
      const wrappers = imageGallery.querySelectorAll('.swiper-wrapper');
      const emptyState = imageGallery.querySelector('.w-dyn-empty');
      // ALWAYS hide empty state (already done above, but ensure)
      if (emptyState) emptyState.style.display = 'none';
      
      // ENFORCE: Must have exactly 4 images
      if (!product.images || product.images.length === 0) {
        console.error('populate-cms.js: Product has no images, cannot populate mobile gallery. Product:', product.name);
      } else if (product.images.length < 4) {
        console.warn('populate-cms.js: Product has only', product.images.length, 'images, expected 4. Product:', product.name);
      }
      
      if (product.images && product.images.length > 0) {
        // Use the LAST wrapper (the empty one meant for population) or the first if only one exists
        const wrapper = wrappers.length > 1 ? wrappers[wrappers.length - 1] : wrappers[0];
        
        if (wrapper) {
          wrapper.innerHTML = '';
          // Sort images by sort_order to ensure correct order: panel, installation, stone, closeup
          const sortedImages = [...product.images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          
          // ENFORCE: Display exactly 4 images (or as many as available, up to 4)
          // Don't add mainImage separately - use only the 4 images from the images array
          const imagesToDisplay = sortedImages.slice(0, 4);
          
          imagesToDisplay.forEach((imgObj, index) => {
            if (imgObj.url) {
              // Normalize the image path - if it's already local (starts with images/), use it directly
              // Otherwise, try to get local image via getImagePath
              let imagePath = imgObj.url;
              if (!imgObj.url.startsWith('images/') && !imgObj.url.startsWith('/images/')) {
                // Try to get local image, fallback to original URL
                imagePath = getImagePath({ ...product, mainImage: imgObj.url }, 'mainImage', imgObj.type);
              } else {
                // Already a local path - ensure it has leading slash for Next.js
                imagePath = imgObj.url.startsWith('/') ? imgObj.url : '/' + imgObj.url;
              }
              
              const slide = document.createElement('div');
              slide.className = 'swiper-slide is-swiper-product w-dyn-item';
              slide.setAttribute('role', 'listitem');
              slide.setAttribute('bind', '2fb8e092-727e-f3ca-475b-8178c0fc023b');
              slide.innerHTML = `<div class="img-hight"><img alt="${product.name} - ${imgObj.type || 'image ' + (index + 1)}" loading="lazy" bind="7978e09f-6b72-4bed-57c5-500574fcbff5" src="${imagePath}" class="img-swiper_img" onerror="this.onerror=null; this.src='${imgObj.url}'"></div>`;
              wrapper.appendChild(slide);
              console.log(`populate-cms.js: Added image ${index + 1} to mobile gallery: ${imagePath}`);
            }
          });
          
          if (imagesToDisplay.length < 4) {
            console.warn('populate-cms.js: Only added', imagesToDisplay.length, 'images to mobile gallery (expected 4). Product:', product.name);
          } else {
            console.log('populate-cms.js: Successfully added', imagesToDisplay.length, 'image slides to mobile gallery');
          }
        } else {
          console.error('populate-cms.js: Mobile gallery wrapper not found');
        }
        
        // Hide the first wrapper if it exists (the hardcoded one)
        if (wrappers.length > 1 && wrappers[0]) {
          wrappers[0].style.display = 'none';
        }
        
        // Reinitialize Swiper after adding images
        reinitSwiper(imageGallery);
      } else {
        console.error('populate-cms.js: No images found for product:', product.name);
      }
    }
    
    // Desktop image grid - bind="ba91b3e9-080a-1c76-e14e-e7aa27382349"
    const desktopImageGallery = document.querySelector('[bind="ba91b3e9-080a-1c76-e14e-e7aa27382349"]');
    if (desktopImageGallery) {
      // CRITICAL: There are TWO wrappers with the same bind - find ALL of them
      const allWrappers = desktopImageGallery.querySelectorAll('[bind="ba91b3e9-080a-1c76-e14e-e7aa2738234a"]');
      const emptyState = desktopImageGallery.querySelector('[bind="ba91b3e9-080a-1c76-e14e-e7aa2738234d"]');
      
      if (emptyState) emptyState.style.display = 'none';
      
      // ENFORCE: Must have images to display
      if (!product.images || product.images.length === 0) {
        console.error('populate-cms.js: Product has no images, cannot populate desktop gallery. Product:', product.name);
      } else if (product.images.length < 4) {
        console.warn('populate-cms.js: Product has only', product.images.length, 'images for desktop gallery (expected 4). Product:', product.name);
      }
      
      // Hide ALL hardcoded wrappers first
      allWrappers.forEach((wrapper, index) => {
        // Check if this wrapper has hardcoded images (has img elements with src already set)
        const hasHardcodedImages = wrapper.querySelectorAll('img[src]:not([src=""])').length > 0;
        if (hasHardcodedImages) {
          console.log(`populate-cms.js: Hiding hardcoded wrapper ${index + 1}`);
          wrapper.style.display = 'none';
        }
      });
      
      // Use the FIRST wrapper (the empty one meant for population)
      const gridWrapper = allWrappers[0];
      
      if (gridWrapper && product.images && product.images.length > 0) {
        console.log('populate-cms.js: Populating desktop gallery for', product.name, 'with', product.images.length, 'images');
        
        // Make sure the wrapper is visible and has correct grid styling
        gridWrapper.style.display = 'grid';
        gridWrapper.style.gridTemplateRows = 'auto auto';
        gridWrapper.style.gridTemplateColumns = '1fr 1fr';
        gridWrapper.style.gridColumnGap = '5px';
        gridWrapper.style.gridRowGap = '5px';
        gridWrapper.style.minHeight = '900px';
        
        // Clear existing content (should be empty, but clear anyway)
        gridWrapper.innerHTML = '';
        
        // Sort images by sort_order to ensure correct order: panel, installation, stone, closeup
        const sortedImages = [...product.images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        console.log('populate-cms.js: Sorted images:', sortedImages.map(img => ({ type: img.type, url: img.url })));
        
        // ENFORCE: Display exactly 4 images (or as many as available, up to 4)
        // Use only the images from the images array - don't add mainImage separately
        const imagesToDisplay = sortedImages.slice(0, 4);
        
        imagesToDisplay.forEach((imgObj, index) => {
          if (imgObj.url) {
            // Normalize the image path - if it's already local (starts with images/), use it directly
            // Otherwise, try to get local image via getImagePath
            let imagePath = imgObj.url;
            if (!imgObj.url.startsWith('images/') && !imgObj.url.startsWith('/images/')) {
              // Try to get local image, fallback to original URL
              imagePath = getImagePath({ ...product, mainImage: imgObj.url }, 'mainImage', imgObj.type);
            } else {
              // Already a local path - ensure it has leading slash for Next.js
              imagePath = imgObj.url.startsWith('/') ? imgObj.url : '/' + imgObj.url;
            }
            
            console.log(`populate-cms.js: Image ${index + 1} (${imgObj.type}): ${imgObj.url} -> ${imagePath}`);
            
            const item = document.createElement('div');
            item.className = 'collection-item-2 w-dyn-item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('bind', 'ba91b3e9-080a-1c76-e14e-e7aa2738234b');
            item.setAttribute('item', 'product-image');
            // Ensure images fill the grid cell properly and are bigger
            item.style.width = '100%';
            item.style.height = '100%';
            item.style.minHeight = '450px';
            item.style.position = 'relative';
            item.innerHTML = `<img item="product-image-src" loading="lazy" width="573" src="${imagePath}" alt="${product.name} - ${imgObj.type || 'image ' + (index + 1)}" bind="ba91b3e9-080a-1c76-e14e-e7aa2738234c" class="image-107" style="width: 100%; height: 100%; min-height: 450px; object-fit: cover;" onerror="console.error('Image failed to load:', '${imagePath}'); this.onerror=null; this.src='${imgObj.url}'">`;
            gridWrapper.appendChild(item);
          } else {
            console.warn(`populate-cms.js: Image ${index + 1} has no URL`);
          }
        });
        
        if (imagesToDisplay.length < 4) {
          console.warn('populate-cms.js: Only added', imagesToDisplay.length, 'images to desktop gallery (expected 4). Product:', product.name);
        } else {
          console.log('populate-cms.js: ✅ Successfully added 4 images to desktop gallery');
        }
      } else {
        console.error('populate-cms.js: Cannot populate desktop gallery - missing gridWrapper or images', {
          hasGridWrapper: !!gridWrapper,
          hasImages: !!(product.images && product.images.length > 0),
          imageCount: product.images?.length || 0
        });
      }
    }

    // SKU/Variant selector - use selection_slider_image
    const skuSelector = document.querySelector('[bind="116c2318-c33b-dcc5-4ef0-b6d435cfdf1f"]');
    if (skuSelector) {
      const wrappers = skuSelector.querySelectorAll('.swiper-wrapper');
      const emptyState = skuSelector.querySelector('.w-dyn-empty');
      // ALWAYS hide empty state (already done above, but ensure)
      if (emptyState) emptyState.style.display = 'none';
      
      if (cmsData.products && cmsData.products.length > 0) {
        
        // Use the LAST wrapper (the empty one meant for population) or the first if only one exists
        const wrapper = wrappers.length > 1 ? wrappers[wrappers.length - 1] : wrappers[0];
        
        if (wrapper) {
          wrapper.innerHTML = '';
          // Filter to only main products (exclude samples) and sort by sorting field
          const mainProducts = cmsData.products.filter(p => 
            p.category === 'AKUROCK Akustikpaneele' && 
            !p.id.includes('-sample')
          );
          const sortedProducts = [...mainProducts].sort((a, b) => (a.sorting || 999) - (b.sorting || 999));
          
          console.log('populate-cms.js: Adding', sortedProducts.length, 'products to variant selector');
          
          // Ensure all products in selector follow the pattern
          // PATTERN ENFORCEMENT: Only include products that have required fields
          sortedProducts.forEach((p) => {
            // Validate each product has required fields for pattern consistency
            if (!p.selection_slider_image) {
              console.warn('populate-cms.js: Product missing selection_slider_image, skipping from variant selector:', p.name);
              return; // Skip products that don't follow pattern
            }
            if (!p.name || !p.slug) {
              console.warn('populate-cms.js: Product missing name or slug, skipping from variant selector:', p);
              return; // Skip products that don't follow pattern
            }
            
            // All products follow the same pattern - use selection_slider_image for consistency
            const slide = document.createElement('div');
            slide.className = 'swiper-slide is-slider-selector w-dyn-item';
            slide.setAttribute('role', 'listitem');
            const isActive = p.slug === product.slug ? 'active' : '';
            
            // Normalize image path - ensure local paths have leading slash for Next.js
            let thumbImage = p.selection_slider_image || p.mainImage || '';
            if (thumbImage) {
              if (thumbImage.startsWith('images/') && !thumbImage.startsWith('/images/')) {
                // Add leading slash for Next.js
                thumbImage = '/' + thumbImage;
              } else if (!thumbImage.startsWith('/') && !thumbImage.startsWith('http')) {
                // If it's a relative path without images/, assume it's in images/
                thumbImage = '/images/' + thumbImage;
              }
            }
            
            console.log(`populate-cms.js: Variant selector - ${p.name}: ${p.selection_slider_image} -> ${thumbImage}`);
            
            slide.innerHTML = `
              <a href="/product/${p.slug}" class="slider-selector_link is-slider-selector w-inline-block ${isActive}">
                <div class="slider-selector_height">
                  <img loading="lazy" width="95" src="${thumbImage}" alt="${p.name || ''}" class="slider-selector_img" onerror="console.error('Variant selector image failed:', '${thumbImage}'); this.onerror=null;">
                </div>
              </a>
            `;
            wrapper.appendChild(slide);
          });
        }
        
        // Hide the first wrapper if it exists (the hardcoded one)
        if (wrappers.length > 1 && wrappers[0]) {
          wrappers[0].style.display = 'none';
        }
        
        // Reinitialize Swiper after adding variants
        reinitSwiper(skuSelector);
      } else {
        console.warn('populate-cms.js: No products found for variant selector');
      }
    }

    // Product selector slider (desktop) - bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae11"
    const productSelectorSlider = document.querySelector('[bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae10"]');
    if (productSelectorSlider) {
      const wrapper = productSelectorSlider.querySelector('[bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae11"]');
      const emptyState = productSelectorSlider.querySelector('[bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae16"]');
      
      if (emptyState) emptyState.style.display = 'none';
      
      if (wrapper && cmsData.products && cmsData.products.length > 0) {
        // Clear existing hardcoded items first
        const existingSlides = wrapper.querySelectorAll('.swiper-slide.is-slider-selector');
        existingSlides.forEach(slide => slide.remove());
        
        // Filter to only main products (exclude samples) and sort by sorting field
        const mainProducts = cmsData.products.filter(p => 
          p.category === 'AKUROCK Akustikpaneele' && 
          !p.id.includes('-sample')
        );
        const sortedProducts = [...mainProducts].sort((a, b) => (a.sorting || 999) - (b.sorting || 999));
        
        console.log('populate-cms.js: Adding', sortedProducts.length, 'products to product selector slider');
        
        // Map product slugs to their slider image URLs (matching the website)
        const sliderImageMap = {
          'yami': '/images/667530f03d356da1743e6c58_Yami.webp',
          'yuki': '/images/6672c665321c865a6ece69a9_Yuki.webp',
          'brush': '/images/6672bbb7fc31823192fae261_Brush.webp',
          'whisper': '/images/6672b96579bfa56457a41e01_Whisper.webp',
          'gaia': '/images/667530ff3fb596c83de661fc_Gaia.png',
          'ligia': '/images/6672c5e85eaae26e4deef821_ligia.webp'
        };
        
        // PATTERN ENFORCEMENT: Only include products that follow the pattern
        sortedProducts.forEach((p, index) => {
          // Validate product has required fields
          if (!p.selection_slider_image && !p.mainImage) {
            console.warn('populate-cms.js: Product missing selection_slider_image and mainImage, skipping from desktop selector:', p.name);
            return; // Skip products that don't follow pattern
          }
          if (!p.name || !p.slug) {
            console.warn('populate-cms.js: Product missing name or slug, skipping from desktop selector:', p);
            return; // Skip products that don't follow pattern
          }
          
          const isActive = p.slug === product.slug;
          // Use mapped image if available, otherwise fall back to selection_slider_image or mainImage
          // PATTERN: All products should use selection_slider_image for consistency
          let thumbImage = sliderImageMap[p.slug] || p.selection_slider_image || p.mainImage || '';
          
          // Normalize image path - ensure local paths have leading slash for Next.js
          if (thumbImage) {
            if (thumbImage.startsWith('images/') && !thumbImage.startsWith('/images/')) {
              // Add leading slash for Next.js
              thumbImage = '/' + thumbImage;
            } else if (!thumbImage.startsWith('/') && !thumbImage.startsWith('http')) {
              // If it's a relative path without images/, assume it's in images/
              thumbImage = '/images/' + thumbImage;
            }
          }
          
          console.log(`populate-cms.js: Desktop variant selector - ${p.name}: ${p.selection_slider_image} -> ${thumbImage}`);
          
          const slide = document.createElement('div');
          slide.setAttribute('bind', '1a91082b-8f19-b175-b9ba-0deb9fa8ae12');
          slide.setAttribute('role', 'group');
          slide.className = `swiper-slide is-slider-selector w-dyn-item${isActive ? ' is-active' : ''}${index === 1 ? ' swiper-slide-next' : ''}`;
          slide.setAttribute('aria-label', `${index + 1} / ${sortedProducts.length}`);
          
          slide.innerHTML = `
            <a bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae13" aria-label="Akurock Acoustic Panels Link" href="/product/${p.slug}" class="slider-selector_link is-slider-selector w-inline-block${isActive ? ' w--current' : ''}"${isActive ? ' aria-current="page"' : ''}>
              <img bind="1a91082b-8f19-b175-b9ba-0deb9fa8ae15" loading="lazy" width="95" alt="${p.name || ''}" src="${thumbImage}" class="slider-selector_img" onerror="console.error('Desktop variant selector image failed:', '${thumbImage}'); this.onerror=null;">
              <div class="swiper-main-img"></div>
            </a>
          `;
          
          wrapper.appendChild(slide);
        });
        
        // Reinitialize Swiper after adding products
        reinitSwiper(productSelectorSlider);
      } else {
        console.warn('populate-cms.js: Product selector slider wrapper not found or no products available');
      }
    }

    // Helper function to populate accessories section
    function populateAccessoriesSection(accessoriesList, imageClass = 'image-214') {
      if (!accessoriesList) return;
      // Find the CORRECT wrapper - there are two .w-dyn-items, use the LAST one (the empty one for population)
      const allWrappers = accessoriesList.querySelectorAll('.w-dyn-items');
      const wrapper = allWrappers.length > 1 ? allWrappers[allWrappers.length - 1] : allWrappers[0];
      const emptyState = accessoriesList.querySelector('.w-dyn-empty');
      // ALWAYS hide empty state (already done above, but ensure)
      if (emptyState) emptyState.style.display = 'none';
      
      // Hide the first hardcoded wrapper if multiple exist
      if (allWrappers.length > 1 && allWrappers[0]) {
        allWrappers[0].style.display = 'none';
      }
      
      if (cmsData.accessories && cmsData.accessories.length > 0) {
        
        if (wrapper) {
          wrapper.innerHTML = '';
          // Show main accessories: Schrauben weiß, Schrauben schwarz, Wandkleber
          const mainAccessories = cmsData.accessories.filter(a => 
            a.id === 'schrauben-weiss' || 
            a.id === 'wandschrauben-schwarz' || 
            a.id === 'wandkleber'
          ).sort((a, b) => (a.sorting || 999) - (b.sorting || 999));
          
          console.log('populate-cms.js: Found', mainAccessories.length, 'main accessories to display');
          
          if (mainAccessories.length > 0) {
            mainAccessories.forEach((accessory) => {
              const item = document.createElement('div');
              item.className = 'collection-item-7 w-dyn-item';
              item.setAttribute('role', 'listitem');
              const accessoryFormId = accessory.productId || '';
              const accessoryVariantId = accessory.variantId || '';
              const accessoryDataId = accessory.id || '';
              
              // Normalize image path for Next.js using getImagePath helper
              let accessoryImage = accessory.mainImage || '';
              if (accessoryImage) {
                // Use getImagePath helper to normalize paths (handles CDN to local conversion)
                const normalizedPath = getImagePath(accessory, 'mainImage');
                if (normalizedPath) {
                  accessoryImage = normalizedPath;
                } else {
                  // Fallback: manual normalization if getImagePath doesn't return a value
                  if (accessoryImage.startsWith('images/') && !accessoryImage.startsWith('/images/')) {
                    accessoryImage = '/' + accessoryImage;
                  } else if (!accessoryImage.startsWith('/') && !accessoryImage.startsWith('http')) {
                    // If it's a relative path without images/, assume it's in images/
                    accessoryImage = '/images/' + accessoryImage;
                  }
                }
              }
              
              console.log(`populate-cms.js: Accessory ${accessory.name} - image path: ${accessory.mainImage} -> ${accessoryImage}`);
              
              item.innerHTML = `
                <div class="content_additionals">
                  <div class="addtions_img_container"><img loading="lazy" src="${accessoryImage}" alt="${t(accessory.name || '')}" class="${imageClass}" onerror="console.error('Accessory image failed to load:', '${accessoryImage}'); this.onerror=null;"></div>
                  <div class="description additionals">
                    <h2 class="additional_top">${t(accessory.name || '')}</h2>
                    <div class="text-block-92">${t(accessory.description || '')}</div>
                    <div class="text-block-93">${accessory.price || ''} ${accessory.currency || 'EUR'}</div>
                  </div>
                </div>
                <div class="buy-button">
                  <form class="w-commerce-commerceaddtocartform default-state" data-node-type="commerce-add-to-cart-form" data-wf-product-id="${accessoryFormId}" data-wf-variant-id="${accessoryVariantId}" data-product-id="${accessoryDataId}">
                    <div class="quanitity_buy_wrap"><input type="submit" data-node-type="commerce-add-to-cart-button" class="w-commerce-commerceaddtocartbutton addtional-products buy_button" value="${t('Add to Cart')}"></div>
                  </form>
                </div>
              `;
              wrapper.appendChild(item);
            });
            console.log('populate-cms.js: Added', mainAccessories.length, 'accessory items');
          } else {
            console.warn('populate-cms.js: No main accessories found after filtering');
          }
        } else {
          console.warn('populate-cms.js: Accessories wrapper not found');
        }
      } else {
        console.warn('populate-cms.js: No accessories data found');
      }
    }

    // Populate mobile accessories section
    const accessoriesListMobile = document.querySelector('[bind="d37286f8-45ee-d5c0-5042-fa9b1e03f774"]');
    populateAccessoriesSection(accessoriesListMobile, 'image-214');
    
    // Populate desktop accessories section
    const accessoriesListDesktop = document.querySelector('[bind="a7947cab-d687-58a0-424a-fd0cace23832"]');
    populateAccessoriesSection(accessoriesListDesktop, 'image-211');

    // Apply hover images to product cards if available
    if (product.hover_image) {
      const productCards = document.querySelectorAll('[data-product-card]');
      productCards.forEach(card => {
        const img = card.querySelector('img');
        if (img) {
          // Add smooth transition
          img.style.transition = 'opacity 0.5s ease-in-out';
          card.addEventListener('mouseenter', () => {
            img.src = product.hover_image;
          });
          card.addEventListener('mouseleave', () => {
            img.src = product.mainImage;
          });
        }
      });
    }

    // ============================================================================
    // Use the global setupFormImmediately function (defined above)

    // Populate add-to-cart forms with product/variant IDs
    const addToCartForms = document.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
    console.log('populate-cms.js: Found', addToCartForms.length, 'add-to-cart forms');
    
    // Get product and variant IDs - MUST use product.productId and product.variantId for cart manager
    // Cart manager searches by product.productId and product.variantId fields, not by slug/id
    // CRITICAL: Do NOT fallback to product.id or product.slug - these are different identifiers
    // Using wrong IDs will cause cart lookup to fail
    
    // FIRST: Check if product has the IDs
    let productId = product.productId || '';
    let variantId = product.variantId || '';
    
    // DEBUG: Log what we're getting
    console.log('populate-cms.js: Product data check', {
      productName: product.name,
      productSlug: product.slug,
      productId: product.productId,
      variantId: product.variantId,
      productIdField: product.id
    });
    
    // If IDs are missing, try to find the product in cmsData by slug/id
    if (!productId || !variantId) {
      console.warn('populate-cms.js: Product missing IDs, searching in cmsData...');
      const foundProduct = cmsData.products.find(p => 
        p.slug === product.slug || 
        p.id === product.id || 
        p.handle === product.slug ||
        (product.slug && p.slug === product.slug)
      );
      
      if (foundProduct && foundProduct.productId && foundProduct.variantId) {
        productId = foundProduct.productId;
        variantId = foundProduct.variantId;
        console.log('populate-cms.js: Found product IDs in cmsData', { productId, variantId });
      } else {
        console.error('populate-cms.js: CRITICAL - Cannot find product IDs anywhere', {
          productName: product.name,
          productSlug: product.slug,
          searchedIn: cmsData.products ? cmsData.products.length + ' products' : 'no products array'
        });
      }
    }
    
    // Validate that required IDs are present
    if (!productId || !variantId) {
      console.error('populate-cms.js: CRITICAL - Product missing required cart IDs', {
        productName: product.name,
        productSlug: product.slug,
        productId: productId || 'MISSING',
        variantId: variantId || 'MISSING',
        productIdField: product.id,
        hasProductId: !!productId,
        hasVariantId: !!variantId
      });
      // DON'T RETURN - still try to set up forms, they just won't work
    }
    
    console.log('populate-cms.js: Setting form IDs', { productId, variantId, productName: product.name });
    
    addToCartForms.forEach((form, index) => {
      // Skip accessory forms (they have their own IDs set)
      const isAccessoryForm = form.closest('[bind="409f9c8b-4b78-5f06-d0ad-57ad5bbfb293"]') || 
                              form.closest('.add-ons') ||
                              form.querySelector('.addtional-products');
      
      if (isAccessoryForm) {
        console.log(`populate-cms.js: Form ${index} is accessory form, skipping`);
        return;
      }
      
      // Set product and variant IDs for Webflow commerce
      if (productId) {
        form.setAttribute('data-wf-product-id', productId);
        form.setAttribute('data-commerce-product-id', productId); // Also set Webflow native attribute
        console.log(`populate-cms.js: Form ${index} - Set productId:`, productId);
      } else {
        console.error(`populate-cms.js: Form ${index} - No productId available for product:`, product.name);
      }
      
      if (variantId) {
        form.setAttribute('data-wf-variant-id', variantId);
        form.setAttribute('data-commerce-sku-id', variantId); // Also set Webflow native attribute
        console.log(`populate-cms.js: Form ${index} - Set variantId:`, variantId);
      } else {
        console.error(`populate-cms.js: Form ${index} - No variantId available for product:`, product.name);
      }
      
      // CRITICAL: Prevent form submission
      form.setAttribute('action', 'javascript:void(0);');
      form.setAttribute('onsubmit', 'return false;');
      
      // Ensure button type is correct
      const submitButton = form.querySelector('[data-node-type="commerce-add-to-cart-button"]');
      if (submitButton && submitButton.type === 'submit') {
        submitButton.type = 'button';
      }
      
      // Attach handler immediately if IDs are available
      if (productId && variantId) {
        setupFormImmediately(form, productId, variantId);
      }
      
      // Also set as data attributes for custom handling
      form.setAttribute('data-product-id', productId);
      form.setAttribute('data-variant-id', variantId);
      
      // IMMEDIATELY set up the form (change button type, set attributes, attach handlers)
      setupFormImmediately(form, productId, variantId);
    });

    // Ensure accessories section is visible
    if (accessoriesList) {
      const accessoriesSection = accessoriesList.closest('section, .section, [class*="section"]');
      if (accessoriesSection) {
        accessoriesSection.style.display = '';
      }
      // Also check parent containers
      let parent = accessoriesList.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        if (parent.style && parent.style.display === 'none') {
          parent.style.display = '';
        }
        parent = parent.parentElement;
        depth++;
      }
    }

    // Ensure main product section is visible
    // NOTE: We're NOT hiding any sections automatically - only the ones already marked with inline styles
    const mainProductSectionId = 'w-node-_116c2318-c33b-dcc5-4ef0-b6d435cfdf0e-d3e03b91';
    const mainSection = document.getElementById(mainProductSectionId);
    
    if (mainSection) {
      console.log('populate-cms.js: ✅ Found main product section');
      
      // Ensure main section is visible (remove any inline styles that might hide it)
      mainSection.style.display = '';
      mainSection.style.visibility = '';
      mainSection.style.opacity = '';
      
      // Ensure parent section is visible
      const parentSection = mainSection.closest('section.product, .section.product');
      if (parentSection) {
        parentSection.style.display = '';
        parentSection.style.visibility = '';
      }
      
      console.log('populate-cms.js: Main section should be visible');
    } else {
      console.error('populate-cms.js: ❌ Main product section not found!');
    }
    
    // Note: Duplicate sections are already hidden via inline styles in HTML
    // We don't need to hide them again here
    
    // Hide empty image containers
    const emptyImageContainers = document.querySelectorAll('img[src=""], img[src="#"], img:not([src])');
    emptyImageContainers.forEach(img => {
      const container = img.closest('.slider-selector_height, .img-hight, .image_wrapper');
      if (container && !img.src) {
        console.log('populate-cms.js: Hiding empty image container');
        container.style.display = 'none';
      }
    });

    console.log('populate-cms.js: Product page population completed');
    
    // Initialize cart integration AFTER form IDs are set
    // Use setTimeout to ensure DOM is ready and forms have IDs
    setTimeout(() => {
      console.log('populate-cms.js: Initializing cart integration after IDs are set...');
      
      // Re-check forms to ensure IDs are set
      const forms = document.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
      let formsWithIds = 0;
      let formsWithoutIds = 0;
      
      forms.forEach(form => {
        const pid = form.getAttribute('data-wf-product-id');
        const vid = form.getAttribute('data-wf-variant-id');
        if (pid && vid) {
          formsWithIds++;
        } else {
          formsWithoutIds++;
          console.warn('populate-cms.js: Form still missing IDs after setup', { 
            form: form,
            productId: pid || 'missing',
            variantId: vid || 'missing'
          });
        }
      });
      
      console.log(`populate-cms.js: Forms status - ${formsWithIds} with IDs, ${formsWithoutIds} without IDs`);
      
      initCartIntegration();
      
      // AGGRESSIVE: Force button type changes and handler attachment
      // Run multiple times to catch any buttons that might be reset
      setTimeout(() => {
        const allForms = document.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
        allForms.forEach(form => {
          const productId = form.getAttribute('data-wf-product-id');
          const variantId = form.getAttribute('data-wf-variant-id');
          
          if (productId && variantId) {
            // Find all buttons in this form
            const buttons = form.querySelectorAll('[data-node-type="commerce-add-to-cart-button"], input[type="submit"], button[type="submit"]');
            buttons.forEach(button => {
              // Force button type change
              if (button.type === 'submit' || button.getAttribute('type') === 'submit') {
                button.setAttribute('type', 'button');
                button.type = 'button';
                console.log('🔧 populate-cms.js: Force-changed button type', { button, type: button.type });
              }
              
              // Re-setup form if not already done
              if (form.dataset.formSetupComplete !== 'true') {
                setupFormImmediately(form, productId, variantId);
              }
            });
          }
        });
      }, 500);
      
      // Run again after a longer delay to catch any late-loading elements
      setTimeout(() => {
        const allForms = document.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
        allForms.forEach(form => {
          const productId = form.getAttribute('data-wf-product-id');
          const variantId = form.getAttribute('data-wf-variant-id');
          
          if (productId && variantId && form.dataset.formSetupComplete !== 'true') {
            setupFormImmediately(form, productId, variantId);
          }
        });
      }, 1500);
    }, 100); // 100ms delay to ensure DOM is ready
  }

  // Populate homepage product grid (sample boxes style)
  function populateHomepageProductGrid() {
    console.log('populate-cms.js: Populating homepage product grid...');
    
    if (!cmsData || !cmsData.products) {
      console.warn('populate-cms.js: No products data available for homepage grid');
      return;
    }

    const gridContainer = document.getElementById('homepage-product-grid-container');
    if (!gridContainer) {
      console.warn('populate-cms.js: Homepage product grid container not found');
      return;
    }

    // Filter main products (exclude samples), sort by sorting field, limit to 6
    const sortedProducts = [...cmsData.products]
      .filter(p => p.category === 'AKUROCK Akustikpaneele' && !p.id.includes('-sample'))
      .sort((a, b) => (a.sorting || 999) - (b.sorting || 999))
      .slice(0, 6);

    console.log('populate-cms.js: Adding', sortedProducts.length, 'products to homepage grid');

    // Clear existing content
    gridContainer.innerHTML = '';

      // PATTERN ENFORCEMENT: Only display products that follow the pattern
      sortedProducts.forEach((product) => {
        // Validate product has required fields INCLUDING cart IDs
        if (!product.name || !product.slug || !product.mainImage) {
          console.warn('populate-cms.js: Product missing required fields for homepage grid, skipping:', product.name);
          return; // Skip products that don't follow pattern
        }
        
        // CRITICAL: Validate product has cart IDs (productId and variantId)
        if (!product.productId || !product.variantId) {
          console.error('populate-cms.js: Product missing cart IDs (productId/variantId) for homepage grid, skipping:', product.name, {
            productId: product.productId || 'MISSING',
            variantId: product.variantId || 'MISSING'
          });
          return; // Skip products without cart IDs - they won't work in cart
        }
        
        // Get product images - use first 3 images from images array or fallback to mainImage
        // PATTERN: Products should have images array with 4 images
        const productImages = product.images && product.images.length > 0 
          ? product.images.slice(0, 3).map(img => img.url)
          : product.mainImage ? [product.mainImage] : [];
      
      // Try local images first, fallback to CDN URLs
      const displayImage = getImagePath(product, 'mainImage') || 
                          (productImages[0] ? getImagePath({ ...product, mainImage: productImages[0] }, 'mainImage') : '') ||
                          productImages[0] || 
                          product.mainImage || 
                          '';
      
      // Get product colors
      const nameColor = product.button_header_color || 'hsla(0, 0%, 0%, 1.00)';
      const cardBgColor = product.color || 'hsla(0, 0%, 95%, 0.30)';
      
      // Format price - extract numeric value
      // PATTERN: All prices follow same format
      const priceValue = product.priceValue || parseFloat(product.price?.replace(/[^\d.]/g, '') || '0') || 0;
      const priceDisplay = product.price || `€${priceValue.toFixed(2)}`;
      
      // PATTERN REFERENCE: Second image shows product cards for catalog/grid
      // These can use product shots (mainImage) or interior scenes
      // Get description (stone type) - matches reference format
      // Reference shows: "Cremefarbener Sandstein", "Schwarzer Schieferstein", "Weißer Kristallmarmor"
      const stoneDescription = product.stone || product.description || '';
      
      // Create product card
      // PATTERN: Product cards show: Image, Name, Stone Type, Price
      const card = document.createElement('div');
      card.className = 'collection-item-5 w-dyn-item';
      card.setAttribute('role', 'listitem');
      card.setAttribute('data-product-id', product.productId);
      card.setAttribute('data-variant-id', product.variantId);
      
      card.innerHTML = `
        <div class="item-wrap_samples" style="background-color: ${cardBgColor};">
          <div class="top_titel-wrap">
            <div class="header-wrap_samples">
              <div class="text-block-65" style="color: ${nameColor}; font-size: 3.6rem; font-weight: 600; line-height: 3.8rem; letter-spacing: -0.05em;">${product.name || ''}</div>
              <div class="description-wrap_samples">
                <div class="text-block-70" style="color: ${nameColor}; opacity: 0.8; font-size: 15px; font-weight: 500;">${stoneDescription}</div>
              </div>
            </div>
            <div class="price-wrap_samples">
              <div class="text-block-68" style="color: ${nameColor}; font-size: 1.7rem; font-weight: 600; line-height: 1.8rem; padding-top: 0.6rem;">${priceDisplay}</div>
            </div>
          </div>
          <div class="img_wrap">
            <img src="${displayImage}" alt="${product.name || ''}" loading="lazy" width="171" class="image-132 product-main-image" data-hover-image="${product.hover_image || displayImage}" onerror="this.onerror=null; this.src='${product.mainImage || productImages[0] || ''}';">
            ${productImages.length > 1 ? `
              <img src="${productImages[1]}" alt="" loading="lazy" style="position: absolute; top: 0; left: 0; opacity: 0; transition: opacity 0.5s ease-in-out;" class="product-hover-image">
            ` : ''}
          </div>
          <div class="bottom_addtocart-wrap">
            <div class="add-to-cart">
              <form data-node-type="commerce-add-to-cart-form" 
                    class="w-commerce-commerceaddtocartform"
                    data-wf-product-id="${product.productId}"
                    data-wf-variant-id="${product.variantId}"
                    data-product-id="${product.productId}"
                    data-variant-id="${product.variantId}"
                    action="javascript:void(0);"
                    onsubmit="return false;">
                <input type="hidden" name="commerce-add-to-cart-quantity-input" value="1">
                <div class="addtocart_container" style="background-color: ${nameColor};">
                  <img src="/images/Large-Arrow-White-Selection.svg" loading="lazy" width="36" alt="" class="image-131">
                  <input type="button" 
                         data-node-type="commerce-add-to-cart-button" 
                         data-loading-text="${t('Hinzufügen..')}" 
                         aria-busy="false" 
                         aria-haspopup="dialog" 
                         class="w-commerce-commerceaddtocartbutton add-to-cart-button-2" 
                         value="${t('In den Warenkorb')}"
                         style="background-color: transparent; color: white; border: none; cursor: pointer;">
                </div>
              </form>
              <div style="display:none" class="w-commerce-commerceaddtocartoutofstock" tabindex="0">
                <div>This product is out of stock.</div>
              </div>
              <div aria-live="assertive" data-node-type="commerce-add-to-cart-error" style="display:none" class="w-commerce-commerceaddtocarterror">
                <div data-node-type="commerce-add-to-cart-error">Product is not available in this quantity.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="darken-animation-layer"></div>
      `;

      gridContainer.appendChild(card);
      
      // CRITICAL: Set up form immediately after card is added to DOM
      const cardForm = card.querySelector('[data-node-type="commerce-add-to-cart-form"]');
      if (cardForm && product.productId && product.variantId) {
        // Ensure button type is button, not submit
        const button = cardForm.querySelector('[data-node-type="commerce-add-to-cart-button"]');
        if (button) {
          button.type = 'button';
        }
        // Set up form handler immediately
        setupFormImmediately(cardForm, product.productId, product.variantId);
        console.log('populate-cms.js: Set up cart form for product card:', product.name, { productId: product.productId, variantId: product.variantId });
      } else {
        console.error('populate-cms.js: Failed to set up cart form for product card:', product.name, {
          formFound: !!cardForm,
          productId: product.productId || 'MISSING',
          variantId: product.variantId || 'MISSING'
        });
      }

      // Add hover image effect
      const mainImg = card.querySelector('.product-main-image');
      const hoverImg = card.querySelector('.product-hover-image');
      if (mainImg && hoverImg && product.hover_image) {
        // Add smooth transitions
        mainImg.style.transition = 'opacity 0.5s ease-in-out';
        hoverImg.style.transition = 'opacity 0.5s ease-in-out';
        card.addEventListener('mouseenter', () => {
          hoverImg.style.opacity = '1';
          mainImg.style.opacity = '0';
        });
        card.addEventListener('mouseleave', () => {
          hoverImg.style.opacity = '0';
          mainImg.style.opacity = '1';
        });
      } else if (mainImg && product.hover_image) {
        // Fallback: swap main image src on hover
        const originalSrc = mainImg.src;
        card.addEventListener('mouseenter', () => {
          mainImg.src = product.hover_image;
        });
        card.addEventListener('mouseleave', () => {
          mainImg.src = originalSrc;
        });
      }
    });

    console.log('populate-cms.js: Homepage product grid populated successfully');
    
    // CRITICAL: Initialize cart integration after all cards are added
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      console.log('populate-cms.js: Initializing cart integration for homepage product grid...');
      initCartIntegration();
    });
  }

  // Populate home page product slider
  function populateHomePageSlider() {
    console.log('populate-cms.js: populateHomePageSlider called');
    const productSlider = document.querySelector('[bind="64b2a859-d0e1-7585-034c-483b3d178395"]');
    if (!productSlider) {
      console.warn('populate-cms.js: Product slider element not found');
      return;
    }
    if (!cmsData) {
      console.warn('populate-cms.js: CMS data not loaded yet');
      return;
    }
    if (!cmsData.products || !Array.isArray(cmsData.products) || cmsData.products.length === 0) {
      console.warn('populate-cms.js: No products data available for homepage slider');
      return;
    }
    console.log('populate-cms.js: Found', cmsData.products.length, 'products in CMS data');

    // Find the correct wrapper - there are two swiper-wrapper divs, use the one that's a direct child
    const wrappers = productSlider.querySelectorAll('.swiper-wrapper');
    console.log('populate-cms.js: Found', wrappers.length, 'swiper-wrapper elements');
    
    // Find the wrapper that has content (hardcoded products) - usually the second one
    let wrapper = null;
    if (wrappers.length > 1) {
      // Check which wrapper has slides
      for (let i = 0; i < wrappers.length; i++) {
        const slides = wrappers[i].querySelectorAll('.swiper-slide');
        if (slides.length > 0) {
          wrapper = wrappers[i];
          console.log('populate-cms.js: Using wrapper', i, 'with', slides.length, 'existing slides');
          break;
        }
      }
      // If no wrapper with slides found, use the second one
      if (!wrapper) {
        wrapper = wrappers[1];
        console.log('populate-cms.js: No wrapper with slides found, using second wrapper');
      }
      // Hide the first wrapper if it exists (the empty one) to prevent blank section
      if (wrappers[0] && wrappers[0] !== wrapper) {
        wrappers[0].style.display = 'none';
      }
    } else {
      wrapper = wrappers[0];
    }
    
    if (!wrapper) {
      console.error('populate-cms.js: Could not find swiper-wrapper element');
      return;
    }
    
    const emptyState = productSlider.querySelector('.w-dyn-empty');
    if (emptyState) emptyState.style.display = 'none';
    
    if (wrapper) {
      // Use the collection's product list to match the reference site exactly
      // Find the "akurock-akustikpaneele" collection
      const mainCollection = cmsData.collections?.find(c => c.id === 'akurock-akustikpaneele' || c.handle === 'akurock-akustikpaneele');
      
      let sortedProducts = [];
      
      if (mainCollection && mainCollection.products && Array.isArray(mainCollection.products)) {
        // Use products from collection in the order specified
        const productMap = new Map(cmsData.products.map(p => [p.id || p.slug || p.handle, p]));
        sortedProducts = mainCollection.products
          .map(productId => productMap.get(productId))
          .filter(Boolean) // Remove any undefined products
          .filter(p => p.name && p.slug); // Validate required fields
      } else {
        // Fallback: filter by category if collection not found
        sortedProducts = [...cmsData.products]
          .filter(p => p.category === 'AKUROCK Akustikpaneele')
          .sort((a, b) => (a.sorting || 999) - (b.sorting || 999));
      }
      
      console.log('populate-cms.js: Found', sortedProducts.length, 'products to display in slider');
      
      // Only clear if we have products to add
      if (sortedProducts.length === 0) {
        console.warn('populate-cms.js: No products found to display, keeping existing slides');
        // Show the empty state if no products
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      
      // Clear existing slides and create new ones dynamically
      // Store existing slides count for logging
      const existingSlides = wrapper.querySelectorAll('.swiper-slide').length;
      console.log('populate-cms.js: Clearing', existingSlides, 'existing slides');
      wrapper.innerHTML = '';
      
      // PATTERN ENFORCEMENT: Only display products that follow the pattern
      sortedProducts.forEach((product, index) => {
        console.log(`populate-cms.js: Adding product ${index + 1}/${sortedProducts.length}: ${product.name}`);
        // Validate product has required fields
        if (!product.name || !product.slug) {
          console.warn('populate-cms.js: Product missing required fields for homepage slider, skipping:', product);
          return; // Skip products that don't follow pattern
        }
        
        const slide = document.createElement('div');
        slide.className = 'swiper-slide is-slider-main w-dyn-item';
        slide.setAttribute('role', 'listitem');
        
        // PATTERN: Prioritize interior design/application images over product shots
        // This ensures all products display as interior design examples, not product cards
        // BUT: If mainImage is a local path (images/...), prioritize it first
        // 1. Check mainImage if it's a local path (user-specified image)
        // 2. Check for installation/interior images in images array
        // 3. Check hover_image_installation (interior design scene)
        // 4. Fallback to selection_slider_image (interior design)
        // 5. Last resort: mainImage (product shot)
        let mainImageUrl = '';
        
        // PRIORITY: If mainImage is a local path, use it first (user-specified)
        if (product.mainImage && (product.mainImage.startsWith('images/') || product.mainImage.startsWith('/images/'))) {
          mainImageUrl = product.mainImage;
        }
        
        // Otherwise, check images array for installation/interior images
        if (!mainImageUrl && product.images && Array.isArray(product.images)) {
          // Look for installation or application type images (interior design scenes)
          const installationImage = product.images.find(img => 
            img.type === 'installation' || 
            img.type === 'application' || 
            img.type === 'interior' ||
            (img.url && (img.url.includes('Installation') || img.url.includes('Bedroom') || img.url.includes('Living') || img.url.includes('Bathroom')))
          );
          if (installationImage) {
            mainImageUrl = installationImage.url;
          }
        }
        
        // If no installation image found, try hover_image_installation (interior design)
        if (!mainImageUrl && product.hover_image_installation) {
          mainImageUrl = product.hover_image_installation;
        }
        
        // Fallback to selection_slider_image (usually interior design)
        if (!mainImageUrl && product.selection_slider_image) {
          mainImageUrl = product.selection_slider_image;
        }
        
        // Last resort: mainImage (product shot)
        if (!mainImageUrl) {
          mainImageUrl = product.mainImage || '';
        }
        
        // For hover, use a different interior design image if available
        // PRIORITY: Always prioritize hover_image and hover_image_installation if they exist
        // Skip images array entirely if these are set (especially for user-specified images)
        let hoverImageUrl = '';
        
        // PRIORITY 1: If hover_image is set, use it (regardless of whether it matches mainImage)
        // This ensures user-specified hover images are always used
        if (product.hover_image) {
          hoverImageUrl = product.hover_image;
          console.log(`populate-cms.js: Using hover_image for ${product.name}: ${hoverImageUrl}`);
        }
        
        // PRIORITY 2: If hover_image_installation is set and hover_image wasn't set, use it
        if (!hoverImageUrl && product.hover_image_installation) {
          hoverImageUrl = product.hover_image_installation;
          console.log(`populate-cms.js: Using hover_image_installation for ${product.name}: ${hoverImageUrl}`);
        }
        
        // PRIORITY 3: Only check images array if hover_image/hover_image_installation are NOT set
        if (!hoverImageUrl && product.images && Array.isArray(product.images)) {
          // Find a different installation/interior image for hover
          const hoverInstallationImage = product.images.find(img => 
            img.type === 'installation' && img.url !== mainImageUrl
          );
          if (hoverInstallationImage) {
            hoverImageUrl = hoverInstallationImage.url;
            console.log(`populate-cms.js: Using images array installation image for ${product.name}: ${hoverImageUrl}`);
          }
        }
        
        // Last fallback: use mainImage
        if (!hoverImageUrl) {
          hoverImageUrl = mainImageUrl;
          console.log(`populate-cms.js: Using mainImage as hover fallback for ${product.name}: ${hoverImageUrl}`);
        }
        
        // PATTERN: Use stone description (detailed), not product description
        // Reference: First image shows "Cremefarbener Sandstein" etc. (stone type)
        const stoneDescription = product.stone || product.description || '';
        const price = product.price || '€220.00';
        const currency = product.currency || 'EUR';
        
        // Ensure image path is correct (local or CDN)
        const displayImageUrl = getImagePath({ ...product, mainImage: mainImageUrl }, 'mainImage') || mainImageUrl;
        const displayHoverUrl = getImagePath({ ...product, mainImage: hoverImageUrl }, 'mainImage') || hoverImageUrl;
        
        slide.innerHTML = `
          <a href="/product/${product.slug}" class="slider-selector_link is-slider-main w-inline-block">
            <div class="slider-main_image-height is-slider-main">
              <img src="${displayImageUrl}" loading="lazy" alt="${product.name}" class="slider-main_image" onerror="this.onerror=null; this.src='${mainImageUrl}'">
              <img src="${displayHoverUrl}" loading="lazy" style="opacity:0; transition: opacity 0.5s ease-in-out;" alt="${product.name}" class="slider-main_image-2" onerror="this.onerror=null; this.src='${hoverImageUrl}'">
            </div>
            <div class="slider-main_text-wrapper is-slider-main">
              <div class="slider-main_text-holder is-slider-main">
                <h3 class="heading-142">${product.name || ''}</h3>
                <h4 class="heading-144">${stoneDescription}</h4>
              </div>
              <div class="slider-main_price-holder">
                <h3 data-commerce-type="variation-price" class="heading-143">${price} ${currency}</h3>
              </div>
            </div>
          </a>
        `;
        
        // PATTERN REFERENCE: This matches the first image - interior design examples
        // Each slide shows: Product name, Stone description, Price
        // Image shows interior design scene (bathroom, living room, etc.)
        
        // Add hover effect with smooth transitions
        const mainImg = slide.querySelector('.slider-main_image');
        const secondImg = slide.querySelector('.slider-main_image-2');
        if (mainImg && secondImg && hoverImageUrl !== mainImageUrl) {
          // Add smooth transitions
          mainImg.style.transition = 'opacity 0.5s ease-in-out';
          secondImg.style.transition = 'opacity 0.5s ease-in-out';
          slide.addEventListener('mouseenter', () => {
            mainImg.style.opacity = '0';
            secondImg.style.opacity = '1';
          });
          slide.addEventListener('mouseleave', () => {
            mainImg.style.opacity = '1';
            secondImg.style.opacity = '0';
          });
        }
        
        wrapper.appendChild(slide);
      });
      
      console.log('populate-cms.js: Successfully added', sortedProducts.length, 'product slides to homepage slider');
      
      // CRITICAL: Update Swiper after dynamically adding slides to enable touch/swipe
      // Find the Swiper instance and update it
      try {
        const swiperContainer = productSlider.closest('.slider-main_component');
        if (swiperContainer) {
          const swiperElement = swiperContainer.querySelector('.swiper');
          if (swiperElement) {
            // Wait a bit for Swiper to be initialized (it might initialize after DOM ready)
            const updateSwiper = () => {
              if (swiperElement.swiper) {
                // Swiper instance exists, update it
                swiperElement.swiper.update();
                swiperElement.swiper.updateSlides();
                swiperElement.swiper.updateSlidesClasses();
                swiperElement.swiper.updateSize();
                console.log('populate-cms.js: Swiper updated after adding slides');
                return true;
              }
              return false;
            };
            
            // Try immediately
            if (!updateSwiper()) {
              // If Swiper not initialized yet, wait and retry
              let retries = 0;
              const maxRetries = 10;
              const retryInterval = setInterval(() => {
                retries++;
                if (updateSwiper() || retries >= maxRetries) {
                  clearInterval(retryInterval);
                  if (retries >= maxRetries) {
                    console.warn('populate-cms.js: Swiper not found after adding slides, it may initialize later');
                  }
                }
              }, 100);
            }
          }
        }
      } catch (e) {
        console.warn('populate-cms.js: Could not update Swiper after adding slides:', e);
      }
    }

    // Populate marketing content sections
    populateMarketingContent();
  }

  // Populate sample boxes page (akurock-muster.html)
  function populateSampleBoxesPage() {
    console.log('🔍 populate-cms.js: ========== STARTING populateSampleBoxesPage ==========');
    console.log('🔍 populate-cms.js: cmsData exists?', !!cmsData);
    console.log('🔍 populate-cms.js: cmsData.products exists?', !!(cmsData && cmsData.products));
    console.log('🔍 populate-cms.js: cmsData.products length?', cmsData?.products?.length || 0);
    
    if (!cmsData || !cmsData.products) {
      console.warn('⚠️ populate-cms.js: No products data available for sample boxes, attempting to reload from JSON...');
      // Try to reload from JSON file directly (with cache busting)
      const cacheBuster = '?v=' + Date.now();
      fetch('/data/mock-cms-data.json' + cacheBuster)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.text();
        })
        .then(jsonText => {
          console.log('✅ populate-cms.js: Reloaded JSON file');
          console.log('📊 populate-cms.js: JSON file size:', jsonText.length, 'characters');
          console.log('🔍 populate-cms.js: Checking for sample boxes in raw JSON...');
          const hasSamples = jsonText.includes('"id": "brush-sample"') || jsonText.includes('"AKUROCK Muster"');
          console.log('🔍 populate-cms.js: JSON contains sample boxes?', hasSamples);
          const data = JSON.parse(jsonText);
          console.log('✅ populate-cms.js: Parsed JSON successfully');
          console.log('📊 populate-cms.js: Products count:', data.products?.length || 0);
          console.log('📊 populate-cms.js: Sample boxes in JSON:', data.products?.filter(p => 
            p.category === 'AKUROCK Muster' || (p.id && p.id.includes('-sample'))
          ).length || 0);
          
          cmsData = data;
          
          // Save to localStorage for future use
          if (window.AdminDataManager) {
            window.AdminDataManager.saveCMSData(data);
            console.log('✅ populate-cms.js: Saved JSON data to localStorage');
          }
          
          // Retry population after a short delay
          setTimeout(() => populateSampleBoxesPage(), 200);
        })
        .catch(error => {
          console.error('❌ populate-cms.js: Failed to reload data from JSON:', error);
          console.error('❌ populate-cms.js: Make sure /data/mock-cms-data.json exists and is accessible');
        });
      return;
    }
    
    // Additional validation: ensure we have valid products array
    if (!Array.isArray(cmsData.products) || cmsData.products.length === 0) {
      console.error('❌ populate-cms.js: cmsData.products is not a valid array or is empty');
      console.error('❌ populate-cms.js: cmsData.products type:', typeof cmsData.products);
      console.error('❌ populate-cms.js: cmsData.products value:', cmsData.products);
      return;
    }
    
    console.log('✅ populate-cms.js: Data validation passed, proceeding with population...');

    // Try multiple selectors to find the container
    const gridContainer = document.querySelector('#sample-boxes-grid-container') ||
                          document.querySelector('[bind="59ce43f0-84b9-aae1-9f05-2619e4974db1"]') ||
                          document.querySelector('.sample-grid.w-dyn-items') ||
                          document.querySelector('.w-dyn-items.sample-grid');
    
    if (!gridContainer) {
      console.error('populate-cms.js: Sample boxes grid container not found. Available containers:', {
        bind: document.querySelector('[bind="59ce43f0-84b9-aae1-9f05-2619e4974db1"]'),
        class1: document.querySelector('.sample-grid.w-dyn-items'),
        class2: document.querySelector('.w-dyn-items.sample-grid'),
        allDynItems: document.querySelectorAll('.w-dyn-items')
      });
      return;
    }
    
    console.log('✅ populate-cms.js: Found sample boxes container:', gridContainer);
    console.log('🔍 populate-cms.js: Container visibility check:');
    console.log('   - display:', window.getComputedStyle(gridContainer).display);
    console.log('   - visibility:', window.getComputedStyle(gridContainer).visibility);
    console.log('   - opacity:', window.getComputedStyle(gridContainer).opacity);
    console.log('   - current children:', gridContainer.children.length);
    
    // Ensure container is visible
    gridContainer.style.display = '';
    gridContainer.style.visibility = '';
    gridContainer.style.opacity = '';
    console.log('✅ populate-cms.js: Ensured container is visible');

    // Filter sample boxes - use products with "AKUROCK Muster" category (priced at €5.00)
    // ALSO check cmsData.samples if it exists (backward compatibility)
    const allProducts = [
      ...(cmsData.products || []),
      ...(cmsData.samples || []) // Include samples array if it exists
    ];
    
    const sampleBoxes = allProducts
      .filter(p => {
        if (!p) return false;
        const isSample = p.category === 'AKUROCK Muster' || 
                        (p.id && p.id.includes('-sample')) || 
                        (p.name && p.name.toLowerCase().includes('sample'));
        return isSample;
      })
      .sort((a, b) => (a.sorting || 999) - (b.sorting || 999));

    console.log('✅ populate-cms.js: Filtered sample boxes');
    console.log('📊 populate-cms.js: Found', sampleBoxes.length, 'sample boxes from', allProducts.length, 'total products (products:', cmsData.products?.length || 0, 'samples:', cmsData.samples?.length || 0, ')');
    console.log('📊 populate-cms.js: Sample boxes details:', sampleBoxes.map(p => ({ 
      id: p.id, 
      name: p.name, 
      category: p.category,
      price: p.price,
      hasImage: !!p.mainImage,
      productId: p.productId,
      variantId: p.variantId
    })));
    
    // Debug: Log all products to see what we have
    console.log('🔍 populate-cms.js: ALL products categories:', [...new Set(cmsData.products.map(p => p.category))]);
    console.log('🔍 populate-cms.js: Products with "sample" in ID:', cmsData.products.filter(p => p.id && p.id.includes('sample')).map(p => p.id));
    console.log('🔍 populate-cms.js: Products with "AKUROCK Muster" category:', cmsData.products.filter(p => p.category === 'AKUROCK Muster').map(p => p.id));
    
    if (sampleBoxes.length === 0) {
      console.error('populate-cms.js: No sample boxes found! Available categories:', 
        [...new Set(cmsData.products.map(p => p.category))]);
      // Show empty state
      const emptyState = document.querySelector('.w-dyn-empty');
      if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<div>No sample boxes found. Please add sample boxes in the admin panel.</div>';
      }
      return;
    }

    // Hide empty state if it exists
    const emptyState = document.querySelector('.w-dyn-empty');
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    
    // Hide any hardcoded items AND update their forms if they exist
    const hardcodedItems = gridContainer.querySelectorAll('.w-dyn-item:not([data-product-id])');
    hardcodedItems.forEach(item => {
      item.style.display = 'none';
      // Also update any forms in hardcoded items to prevent conflicts
      const forms = item.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
      forms.forEach(form => {
        form.setAttribute('data-wf-product-id', '');
        form.setAttribute('data-wf-variant-id', '');
      });
    });
    
    // Clear existing dynamically added content (items with data-product-id)
    const existingItems = gridContainer.querySelectorAll('.collection-item-5[data-product-id]');
    existingItems.forEach(item => item.remove());
    
    // Also find and update any forms in the container that might have Webflow attributes
    // Convert Webflow's native attributes to our custom ones for compatibility
    const allFormsInContainer = gridContainer.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
    allFormsInContainer.forEach(form => {
      // If form has Webflow commerce attributes but not our custom ones, convert them
      if (form.hasAttribute('data-commerce-product-id') && !form.hasAttribute('data-wf-product-id')) {
        const webflowProductId = form.getAttribute('data-commerce-product-id');
        const webflowSkuId = form.getAttribute('data-commerce-sku-id');
        
        // Convert Webflow attributes to our custom ones
        if (webflowProductId) {
          form.setAttribute('data-wf-product-id', webflowProductId);
          console.log('populate-cms.js: Converted Webflow productId to data-wf-product-id:', webflowProductId);
        }
        if (webflowSkuId) {
          form.setAttribute('data-wf-variant-id', webflowSkuId);
          console.log('populate-cms.js: Converted Webflow skuId to data-wf-variant-id:', webflowSkuId);
        }
        
        // Also hide the parent item if it's a hardcoded template item
        const parentItem = form.closest('.w-dyn-item');
        if (parentItem && !parentItem.hasAttribute('data-product-id')) {
          parentItem.style.display = 'none';
          console.log('populate-cms.js: Hid hardcoded template item with Webflow attributes');
        }
      }
    });
    
    console.log('✅ populate-cms.js: Container found and cleared');
    console.log('🔄 populate-cms.js: Now creating', sampleBoxes.length, 'sample box cards...');

    if (sampleBoxes.length === 0) {
      console.error('❌ populate-cms.js: NO SAMPLE BOXES TO ADD! This should not happen after filter.');
      return;
    }

    sampleBoxes.forEach((product, index) => {
      console.log(`🔄 populate-cms.js: Creating card ${index + 1}/${sampleBoxes.length} for:`, product.name);
      // Try local images first, fallback to CDN URLs
      const displayImage = getImagePath(product, 'mainImage') || 
                          getImagePath(product, 'selection_slider_image') ||
                          product.mainImage || 
                          product.selection_slider_image ||
                          (product.images && product.images.length > 0 ? product.images[0].url : '') ||
                          '';
      
      // Clean display name - remove "-Sample" suffix if present
      const displayName = (product.name || '').replace(/-Sample$/i, '').trim() || product.special_field_slogan || 'Sample';

      const nameColor = product.button_header_color || 'hsla(0, 0%, 0%, 1.00)';
      const cardBgColor = product.color || 'hsla(0, 0%, 95%, 0.30)';
      const priceValue = product.priceValue || parseFloat((product.price || '0').replace(/[^\d.]/g, '')) || 5.00;
      const priceDisplay = product.price || `€${priceValue.toFixed(2)}`;
      const description = t(product.stone || product.description || '');
      
      // Create sample box card
      const card = document.createElement('div');
      card.className = 'collection-item-5 w-dyn-item';
      card.setAttribute('role', 'listitem');
      card.setAttribute('data-product-id', product.productId || '');
      card.setAttribute('data-variant-id', product.variantId || '');
      card.style.cursor = 'pointer';
      
      card.innerHTML = `
        <div class="item-wrap_samples" style="background-color: ${cardBgColor};">
          <div class="top_titel-wrap">
            <div class="header-wrap_samples">
              <div class="text-block-65" style="color: ${nameColor}; font-size: 2.6rem; font-weight: 600; line-height: 3.3rem; letter-spacing: -0.05em;">${displayName}</div>
              <div class="description-wrap_samples">
                <div class="text-block-70" style="color: ${nameColor}; opacity: 0.8; font-size: 15px; font-weight: 500;">${description}</div>
              </div>
            </div>
            <div class="price-wrap_samples">
              <div class="text-block-68" style="color: ${nameColor}; font-size: 1.7rem; font-weight: 600; line-height: 1.8rem; padding-top: 0.6rem;">${priceDisplay}</div>
            </div>
          </div>
          <div class="img_wrap" style="transform: translate3d(0px, -10%, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg); transform-style: preserve-3d;">
            <img alt="${displayName}" loading="lazy" width="171" bind="b1269c68-109a-dc80-393a-178e0ae89112" src="${displayImage}" class="image-132" 
                 onerror="this.onerror=null; this.src='${product.mainImage || product.selection_slider_image || ''}';">
          </div>
          <div class="bottom_addtocart-wrap">
            <div id="item-1" bind="e19d87a7-4ff0-df81-23a1-e1aec52e1544" class="add-to-cart">
              <form bind="e19d87a7-4ff0-df81-23a1-e1aec52e1545" template-bind="e19d87a7-4ff0-df81-23a1-e1aec52e1545" position-bind-position="prepend" 
                    data-node-type="commerce-add-to-cart-form" 
                    data-commerce-product-id="${product.productId || ''}"
                    data-commerce-sku-id="${product.variantId || ''}"
                    data-wf-product-id="${product.productId || ''}"
                    data-wf-variant-id="${product.variantId || ''}"
                    data-loading-text="Adding to cart..."
                    class="w-commerce-commerceaddtocartform"
                    action="javascript:void(0);"
                    onsubmit="return false;">
                <a position-id="e19d87a7-4ff0-df81-23a1-e1aec52e1551" data-node-type="commerce-buy-now-button" data-default-text="Buy now" data-subscription-text="Subscribe now" aria-busy="false" aria-haspopup="false" style="display:none" class="w-commerce-commercebuynowbutton w-dyn-hide" href="/quotation">Buy now</a>
                <div bind="ec356d63-f585-bba1-47c8-b5a2a0763874" position-id="ec356d63-f585-bba1-47c8-b5a2a0763874" class="addtocart_container" style="background-color: ${nameColor};">
                  <img src="/images/Large-Arrow-White-Selection.svg" loading="lazy" width="36" alt="" class="image-131">
                  <input type="submit"
                         bind="e19d87a7-4ff0-df81-23a1-e1aec52e1550"
                         data-node-type="commerce-add-to-cart-button"
                         data-loading-text="${t('Hinzufügen..')}"
                         aria-busy="false"
                         aria-haspopup="dialog"
                         class="w-commerce-commerceaddtocartbutton add-to-cart-button-2"
                         value="${t('In den Warenkorb')}">
                </div>
              </form>
              <div bind="e19d87a7-4ff0-df81-23a1-e1aec52e1552" style="display:none" class="w-commerce-commerceaddtocartoutofstock" tabindex="0">
                <div>This product is out of stock.</div>
              </div>
              <div aria-live="assertive" bind="e19d87a7-4ff0-df81-23a1-e1aec52e1555" data-node-type="commerce-add-to-cart-error" style="display:none" class="w-commerce-commerceaddtocarterror">
                <div data-node-type="commerce-add-to-cart-error" data-w-add-to-cart-quantity-error="Product is not available in this quantity." data-w-add-to-cart-general-error="Something went wrong when adding this item to the cart." data-w-add-to-cart-mixed-cart-error="You can't purchase another product with a subscription." data-w-add-to-cart-buy-now-error="Something went wrong when trying to purchase this item." data-w-add-to-cart-checkout-disabled-error="Checkout is disabled on this site." data-w-add-to-cart-select-all-options-error="Please select an option in each set.">Product is not available in this quantity.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="darken-animation-layer"></div>
      `;

      gridContainer.appendChild(card);
      console.log(`✅ populate-cms.js: Card ${index + 1} appended to DOM for:`, product.name);

      // IMMEDIATELY set up the form in the card
      const cardForm = card.querySelector('[data-node-type="commerce-add-to-cart-form"]');
      if (cardForm && product.productId && product.variantId) {
        setupFormImmediately(cardForm, product.productId, product.variantId);
      }

      // Make entire card clickable to add to cart instantly
      const cardClickHandler = (e) => {
        // Don't trigger if clicking inside the form button
        if (e.target.closest('input[type="submit"]')) {
          return; // Let form handler deal with it
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        console.log('populate-cms.js: Sample box card clicked, adding to cart:', product.name);
        
        if (window.CartManager && product.productId && product.variantId) {
          const success = window.CartManager.addToCart(product.productId, product.variantId, 1);
          if (success) {
            console.log('populate-cms.js: Sample box added to cart, opening cart...');
            window.CartManager.openCart();
          }
        }
      };
      
      card.addEventListener('click', cardClickHandler);
    });

    // Verify items were added
    const addedItems = gridContainer.querySelectorAll('.collection-item-5[data-product-id]');
    console.log('populate-cms.js: ✅ Sample boxes page populated successfully');
    console.log('populate-cms.js: Added', addedItems.length, 'items to container (expected', sampleBoxes.length, ')');
    
    if (addedItems.length !== sampleBoxes.length) {
      console.warn('populate-cms.js: ⚠️ Mismatch! Expected', sampleBoxes.length, 'items but found', addedItems.length, 'in DOM');
    } else {
      console.log('populate-cms.js: ✅ All', sampleBoxes.length, 'sample boxes successfully added to page');
    }
    
    // Populate the Musterbox collection form (right-side "get the complete collection" box)
    const musterboxProduct = cmsData.products.find(p =>
      p.category === 'AKUROCK Musterbox' || p.id === 'musterbox'
    );
    if (musterboxProduct && musterboxProduct.productId && musterboxProduct.variantId) {
      // Find the collection box form (inside .sample-selection-box_wrap)
      const collectionBoxWrap = document.querySelector('.sample-selection-box_wrap');
      if (collectionBoxWrap) {
        const collectionForm = collectionBoxWrap.querySelector('[data-node-type="commerce-add-to-cart-form"]');
        if (collectionForm) {
          collectionForm.setAttribute('data-wf-product-id', musterboxProduct.productId);
          collectionForm.setAttribute('data-wf-variant-id', musterboxProduct.variantId);
          collectionForm.setAttribute('data-commerce-product-id', musterboxProduct.productId);
          collectionForm.setAttribute('data-commerce-sku-id', musterboxProduct.variantId);
          collectionForm.setAttribute('action', 'javascript:void(0);');
          collectionForm.onsubmit = function() { return false; };
          setupFormImmediately(collectionForm, musterboxProduct.productId, musterboxProduct.variantId);
          console.log('✅ populate-cms.js: Musterbox collection form populated with IDs:', musterboxProduct.productId, musterboxProduct.variantId);
        }
        // Translate the collection box text
        const collectionText = collectionBoxWrap.querySelector('.text-block-69');
        if (collectionText) {
          const locale = window.__LOCALE__ || 'de';
          if (locale === 'en') {
            collectionText.innerHTML = 'Get the complete<br>collection and try<br>them all on your wall.';
          } else if (locale === 'es') {
            collectionText.innerHTML = 'Consigue la colección<br>completa y pruébalas<br>todas en tu pared.';
          }
        }
        // Translate the add-to-cart button
        const collectionBtn = collectionBoxWrap.querySelector('.add-to-cart-button-4');
        if (collectionBtn) {
          collectionBtn.value = t('In den Warenkorb');
        }
      }
    } else {
      console.warn('⚠️ populate-cms.js: Musterbox product not found in CMS data');
    }

    // Re-initialize cart integration for the new forms AFTER IDs are set
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      console.log('populate-cms.js: Initializing cart integration for sample boxes after IDs are set...');
      initCartIntegration();
    });
  }

  // Populate accessories page
  function populateAccessoriesPage() {
    if (!cmsData || !cmsData.accessories || cmsData.accessories.length === 0) {
      console.warn('populate-cms.js: No accessories data found');
      return;
    }

    const accessoriesList = document.querySelector('[bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d73b"]');
    if (!accessoriesList) {
      console.warn('populate-cms.js: Accessories page container not found');
      return;
    }

    const wrapper = accessoriesList.querySelector('[bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d73c"]');
    const emptyState = accessoriesList.querySelector('.w-dyn-empty');
    
    if (emptyState) emptyState.style.display = 'none';
    
    if (wrapper) {
      // Clear any existing hardcoded items
      const existingItems = wrapper.querySelectorAll('.addons-collection.w-dyn-item');
      existingItems.forEach(item => item.remove());
      
      // Get ALL accessories (not filtered) and sort by sorting field
      const sortedAccessories = [...cmsData.accessories]
        .filter(a => a.category === 'AKUROCK Zubehör') // Only show accessories, not samples
        .sort((a, b) => (a.sorting || 999) - (b.sorting || 999));
      
      console.log('populate-cms.js: Populating accessories page with', sortedAccessories.length, 'accessories');
      
      sortedAccessories.forEach((accessory) => {
        const item = document.createElement('div');
        item.className = 'addons-collection w-dyn-item';
        item.setAttribute('role', 'listitem');
        item.setAttribute('id', `w-node-_4a7dc39c-fd5a-acc7-8775-f4e5a479d73d-8bde98fd`);
        item.setAttribute('data-w-id', '4a7dc39c-fd5a-acc7-8775-f4e5a479d73d');
        
        const accessoryFormId = accessory.productId || '';
        const accessoryVariantId = accessory.variantId || '';
        
        // Format description - use description if available, otherwise use category info
        let descriptionText = accessory.description || '';
        // Map descriptions based on accessory ID
        const descriptionMap = {
          'schrauben-weiss': '50 pcs.',
          'wandschrauben-schwarz': '50 pcs.',
          'wandkleber': '470g cartridge / 1 panel',
          'kartuschenpresse': '1 pc.',
          'lattenschrauben': '50 pcs.',
          'nano-versiegelung': '250ml',
          'acoustic-felt': '60% Upcycled Pet Polyester'
        };
        
        if (!descriptionText && descriptionMap[accessory.id]) {
          descriptionText = descriptionMap[accessory.id];
        }
        
        // Translate accessory names using i18n t() function
        const displayName = t(accessory.name) || accessory.name;
        
        item.innerHTML = `
          <div bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d73e" class="item-wrap_samples is-addons">
            <div class="top_titel-wrap is-addons">
              <div class="header-wrap_samples is-addons">
                <div bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d741" class="text-block-65 is-addons">${displayName}</div>
                <div class="description-wrap_samples is-addons">
                  <div bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d743" class="text-block-70 is-addons">${descriptionText}</div>
                </div>
                <div class="price-wrap_samples is-addons">
                  <div data-commerce-type="variation-price" bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d745" class="text-block-68 is-addons">${accessory.price || ''} ${accessory.currency || 'EUR'}</div>
                </div>
              </div>
            </div>
            <div class="bottom_addtocart-wrap is-addons">
              <div bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d74a" class="add-to-cart is-addons">
                <form bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d74b" template-bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d74b" position-bind-position="prepend" data-node-type="commerce-add-to-cart-form" class="w-commerce-commerceaddtocartform" data-wf-product-id="${accessoryFormId}" data-wf-variant-id="${accessoryVariantId}">
                  <a position-id="4a7dc39c-fd5a-acc7-8775-f4e5a479d756" data-node-type="commerce-buy-now-button" data-default-text="Buy now" data-subscription-text="Subscribe now" aria-busy="false" aria-haspopup="false" style="display:none" class="w-commerce-commercebuynowbutton" href="checkout.html">Buy now</a>
                  <div bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d757" position-id="4a7dc39c-fd5a-acc7-8775-f4e5a479d757" style="width:50px;height:50px" class="addtocart_container"><img src="/images/Large-Arrow-White-Selection.svg" loading="lazy" width="36" alt="" class="image-131"><input data-loading-text="${t('Hinzufügen..')}" data-node-type="commerce-add-to-cart-button" class="w-commerce-commerceaddtocartbutton add-to-cart-button-2" style="display:none;-webkit-transform:translate3d(-40px, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0) skew(0, 0);-moz-transform:translate3d(-40px, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0) skew(0, 0);-ms-transform:translate3d(-40px, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0) skew(0, 0);transform:translate3d(-40px, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0) skew(0, 0);opacity:0" aria-haspopup="dialog" type="submit" bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d759" aria-busy="false" value="${t('In den Warenkorb')}"></div>
                </form>
                <div bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d75a" style="display:none" class="w-commerce-commerceaddtocartoutofstock" tabindex="0">
                  <div>This product is out of stock.</div>
                </div>
                <div aria-live="assertive" bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d75d" data-node-type="commerce-add-to-cart-error" style="display:none" class="w-commerce-commerceaddtocarterror">
                  <div data-node-type="commerce-add-to-cart-error" data-w-add-to-cart-quantity-error="Product is not available in this quantity." data-w-add-to-cart-general-error="Something went wrong when adding this item to the cart." data-w-add-to-cart-mixed-cart-error="You can't purchase another product with a subscription." data-w-add-to-cart-buy-now-error="Something went wrong when trying to purchase this item." data-w-add-to-cart-checkout-disabled-error="Checkout is disabled on this site." data-w-add-to-cart-select-all-options-error="Please select an option in each set.">Product is not available in this quantity.</div>
                </div>
              </div>
            </div>
            <div class="darken-animation-layer is-addons"></div>
          </div>
        `;
        
        // Set background image on the item-wrap_samples
        const itemWrap = item.querySelector('.item-wrap_samples');
        if (itemWrap && accessory.mainImage) {
          itemWrap.style.backgroundImage = `url(${accessory.mainImage})`;
          itemWrap.style.backgroundSize = 'cover';
          itemWrap.style.backgroundPosition = 'center';
        }
        
        wrapper.appendChild(item);
      });
      
      console.log('populate-cms.js: Added', sortedAccessories.length, 'accessories to accessories page');
    } else {
      console.warn('populate-cms.js: Accessories wrapper not found');
    }
    
    // Initialize cart integration after dynamic content is populated
    setTimeout(initCartIntegration, 100);
  }

  // Populate marketing content (slogans, CTAs) on homepage
  function populateMarketingContent() {
    if (!cmsData || !cmsData.products) return;

    // Update hero section slogan - use first product's marketing content or default
    const heroHeading = document.querySelector('.hero-heading-2');
    if (heroHeading) {
      // Find product with marketing content, prefer Brush (sorting: 1)
      const brushProduct = cmsData.products.find(p => p.id === 'brush');
      if (brushProduct && brushProduct.special_field_text) {
        heroHeading.textContent = brushProduct.special_field_text;
      } else {
        // Default English text if no marketing content
        heroHeading.textContent = 'More than just an acoustic panel, a symphony of stone and design.';
      }
    }

    // Update health section slogan with Yami product marketing content
    const yamiProduct = cmsData.products.find(p => p.id === 'yami');
    const healthSlogan = document.querySelector('.health-text-slogan');
    if (healthSlogan && yamiProduct && yamiProduct.special_field_slogan) {
      healthSlogan.textContent = yamiProduct.special_field_slogan;
    }

    // Update "Modern und ruhig" section with Yami product marketing content
    if (yamiProduct) {
      const yamiSection = document.querySelector('[product-link="Yami"]');
      if (yamiSection) {
        const parentSection = yamiSection.closest('section');
        if (parentSection) {
          const sloganEl = parentSection.querySelector('.slogan._2.text');
          if (sloganEl && yamiProduct.special_field_slogan) {
            sloganEl.textContent = yamiProduct.special_field_slogan;
          }
        }
      }
    }

    // Update shout-out section slogan if it exists
    const shoutOutSlogan = document.querySelector('.shout-out-container.main .slogan._2.text');
    if (shoutOutSlogan && yamiProduct && yamiProduct.special_field_slogan) {
      shoutOutSlogan.textContent = yamiProduct.special_field_slogan;
    }

    // Update product link buttons to point to correct product pages
    const productLinks = document.querySelectorAll('[product-link]');
    productLinks.forEach(link => {
      const productLink = link.getAttribute('product-link');
      if (productLink) {
        const product = cmsData.products.find(p => 
          p.name.toLowerCase() === productLink.toLowerCase() || 
          p.id.toLowerCase() === productLink.toLowerCase()
        );
        if (product && link.tagName === 'A') {
          link.href = `/product/${product.slug}`;
        }
      }
    });
  }

  // ============================================================================
  // PHASE 3: BULLETPROOF HANDLER ATTACHMENT
  // Attach handlers immediately, re-attach if needed, handle ALL forms
  // ============================================================================
  function setupFormHandler(form, productId, variantId) {
    try {
      // Ensure form has IDs
      if (!productId) productId = form.getAttribute('data-wf-product-id');
      if (!variantId) variantId = form.getAttribute('data-wf-variant-id');
      
      if (!productId || !variantId) {
        console.warn('⚠️ setupFormHandler: Form missing IDs, skipping handler attachment', {
          productId: productId || 'missing',
          variantId: variantId || 'missing'
        });
        return;
      }
      
      // Use the global immediate setup function (will check if already set up)
      setupFormImmediately(form, productId, variantId);
      
      // Mark as handled
      form.dataset.cartHandlerAttached = 'true';
      console.log('✅ setupFormHandler: Form handler attached:', { productId, variantId });
    } catch (error) {
      console.error('❌ Error attaching form handler:', error);
    }
  }

  // Initialize cart integration with add-to-cart forms
  function initCartIntegration() {
    console.log('initCartIntegration: Starting cart integration...');
    
    if (!cmsData) {
      console.warn('Cart integration: CMS data not loaded yet');
      return;
    }

    // CartManager should already be initialized by populate-cms.js init() function
    // Just verify it's available
    if (!window.CartManager) {
      console.error('initCartIntegration: CartManager not available! Make sure cart-manager.js is loaded.');
      return;
    }
    
    // Only initialize if not already initialized
    if (!cartManagerInitialized && window.CartManager) {
      console.log('initCartIntegration: Initializing CartManager (late init)...');
      window.CartManager.init(cmsData);
      cartManagerInitialized = true;
    }

    // Function to handle add to cart
    function handleAddToCart(form) {
      const productId = form.getAttribute('data-wf-product-id');
      const variantId = form.getAttribute('data-wf-variant-id');
      
      console.log('initCartIntegration: Form submit detected', { productId, variantId });
      
      if (!productId || !variantId) {
        console.error('Cart integration: Missing product/variant IDs in form', {
          productId,
          variantId,
          formHTML: form.outerHTML.substring(0, 300)
        });
        return false;
      }

      // Try multiple selectors for quantity input
      const quantityInput = form.querySelector('input[name="commerce-add-to-cart-quantity-input"]') ||
                            form.querySelector('input.q-num') ||
                            form.querySelector('input[type="number"]');
      const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
      
      console.log('initCartIntegration: Adding to cart', { productId, variantId, quantity });

      if (window.CartManager) {
        const success = window.CartManager.addToCart(productId, variantId, quantity);
        console.log('initCartIntegration: Add to cart result:', success);
        if (success) {
          // Cart will open automatically via addToCart()
          console.log('initCartIntegration: Item added (cart will open automatically)');
          return true;
        }
      } else {
        console.error('Cart integration: CartManager not available');
      }
      return false;
    }

    // Function to attach form handlers (reusable) - BULLETPROOF VERSION
    function attachFormHandlers() {
      const addToCartForms = document.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
      console.log('initCartIntegration: Found', addToCartForms.length, 'forms to attach handlers');
      
      addToCartForms.forEach((form, index) => {
        try {
          const productId = form.getAttribute('data-wf-product-id');
          const variantId = form.getAttribute('data-wf-variant-id');
          
          console.log(`initCartIntegration: Form ${index} - productId:`, productId, 'variantId:', variantId);
          
          // Use the bulletproof setup function
          setupFormHandler(form, productId, variantId);
        } catch (error) {
          console.error(`❌ Error processing form ${index}:`, error);
        }
      });
    }

    // Attach handlers immediately (NO DELAY)
    attachFormHandlers();

    // Watch for dynamically added forms using MutationObserver with IMMEDIATE callback
    const observer = new MutationObserver(function(mutations) {
      let newForms = [];
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Check if node itself is a form
            if (node.matches && node.matches('[data-node-type="commerce-add-to-cart-form"]')) {
              newForms.push(node);
            }
            // Check for forms inside the node
            if (node.querySelector) {
              const forms = node.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
              forms.forEach(f => newForms.push(f));
            }
          }
        });
      });
      
      // Process new forms IMMEDIATELY
      if (newForms.length > 0) {
        console.log('initCartIntegration: New forms detected, attaching handlers immediately...', newForms.length);
        newForms.forEach(form => {
          // Skip accessory forms
          const isAccessoryForm = form.closest('[bind="409f9c8b-4b78-5f06-d0ad-57ad5bbfb293"]') || 
                                  form.closest('.add-ons') ||
                                  form.querySelector('.addtional-products');
          if (isAccessoryForm) {
            return; // Skip silently - accessory forms are handled separately
          }
          
          const productId = form.getAttribute('data-wf-product-id');
          const variantId = form.getAttribute('data-wf-variant-id');
          
          if (productId && variantId) {
            setupFormHandler(form, productId, variantId);
          } else {
            // Don't warn here - form might not be populated yet
            // The setInterval will handle it later if needed
          }
        });
      }
    });

    // Start observing immediately
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
    
    // Also re-check periodically to catch any forms we might have missed
    // This ensures forms are set up even if CartManager wasn't ready initially
    const warnedForms = new WeakSet(); // Track forms we've already warned about
    setInterval(function() {
      const allForms = document.querySelectorAll('[data-node-type="commerce-add-to-cart-form"]');
      allForms.forEach(form => {
        // Skip if already set up or handler attached
        if (form.dataset.formSetupComplete === 'true' || form.dataset.cartHandlerAttached === 'true') {
          return;
        }
        
        // Skip accessory forms (they have their own IDs set separately)
        const isAccessoryForm = form.closest('[bind="409f9c8b-4b78-5f06-d0ad-57ad5bbfb293"]') || 
                                form.closest('.add-ons') ||
                                form.querySelector('.addtional-products');
        if (isAccessoryForm) {
          return; // Skip silently - accessory forms are handled separately
        }
        
        // Skip forms that are marked to be skipped
        if (form.dataset.skipCartIntegration === 'true') {
          return;
        }
        
        const productId = form.getAttribute('data-wf-product-id');
        const variantId = form.getAttribute('data-wf-variant-id');
        
        if (productId && variantId) {
          console.log('initCartIntegration: Found unhandled form, attaching handler...', { productId, variantId });
          setupFormHandler(form, productId, variantId);
        } else {
          // Only warn once per form to avoid spam
          if (!warnedForms.has(form)) {
            // Check if this form is in a section that hasn't been populated yet
            // If it's in a product page section, it might just need more time
            const isProductPageForm = form.closest('.product, [class*="product"], section.product');
            if (isProductPageForm) {
              // Don't warn for product page forms - they'll be populated by populateProductPage
              // Just mark as warned so we don't check again
              warnedForms.add(form);
              return;
            }
            
            // Only warn for forms that are clearly not in populated sections
            console.warn('initCartIntegration: Form missing IDs, cannot attach handler', {
              productId: productId || 'missing',
              variantId: variantId || 'missing',
              formLocation: form.closest('section, .section')?.className || 'unknown'
            });
            warnedForms.add(form);
          }
        }
      });
    }, 2000); // Check every 2 seconds (reduced frequency to avoid spam)
    
    console.log('✅ initCartIntegration: Cart integration initialized successfully');
  }

  // Global fallback: catch ALL add-to-cart button clicks (even if form handler fails)
  // This runs immediately when script loads, before DOM is ready
  (function() {
    // Wait for CartManager to be available
    function waitForCartManager(callback, maxAttempts) {
      maxAttempts = maxAttempts || 50; // 5 seconds max
      let attempts = 0;
      
      function check() {
        attempts++;
        if (window.CartManager) {
          callback();
        } else if (attempts < maxAttempts) {
          setTimeout(check, 100);
        } else {
          console.warn('populate-cms.js: CartManager not available after waiting');
        }
      }
      check();
    }
    
    waitForCartManager(function() {
      console.log('populate-cms.js: Global fallback handler ready');
      
      document.addEventListener('click', function(e) {
        const target = e.target;
        const addToCartButton = target.closest && target.closest('[data-node-type="commerce-add-to-cart-button"]') ||
                                (target.matches && target.matches('[data-node-type="commerce-add-to-cart-button"]') ? target : null);
        
        if (addToCartButton) {
          const form = addToCartButton.closest('[data-node-type="commerce-add-to-cart-form"]') ||
                       addToCartButton.closest('form');
          
          if (form) {
            const productId = form.getAttribute('data-wf-product-id');
            const variantId = form.getAttribute('data-wf-variant-id');
            
            // Only handle if form handler hasn't already processed it and IDs exist
            if (productId && variantId && !e.defaultPrevented) {
              console.log('populate-cms.js: Global fallback handler triggered', { productId, variantId });
              
              // Prevent default form submission
              e.preventDefault();
              e.stopPropagation();
              
              // Try to get quantity
              const quantityInput = form.querySelector('input[name="commerce-add-to-cart-quantity-input"]') ||
                                    form.querySelector('input.q-num') ||
                                    form.querySelector('input[type="number"]');
              const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
              
              // Add to cart if CartManager is available
              if (window.CartManager && window.cmsData) {
                const success = window.CartManager.addToCart(productId, variantId, quantity);
                // Cart will open automatically from addToCart function
              } else {
                console.warn('populate-cms.js: CartManager or CMS data not available in fallback handler', {
                  hasCartManager: !!window.CartManager,
                  hasCmsData: !!window.cmsData
                });
              }
            } else if (!productId || !variantId) {
              console.warn('populate-cms.js: Global fallback - form missing IDs', {
                productId: productId || 'missing',
                variantId: variantId || 'missing'
              });
            }
          }
        }
      }, true); // Use capture phase to catch early
    });
  })();

  // Initialize on DOM ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('populate-cms.js: Starting initialization...');

    // Load i18n translations before CMS data
    loadI18n().then(() => loadCMSData()).then(data => {
      if (!data) {
        console.error('populate-cms.js: Failed to load CMS data');
        return;
      }
      
      cmsData = data;
      
      // Expose CMS data globally for CartManager
      window.cmsData = cmsData;
      console.log('populate-cms.js: CMS data loaded and exposed globally');
      
      // Initialize CartManager FIRST (before populating content) - WITH ERROR HANDLING
      try {
        if (window.CartManager && !cartManagerInitialized) {
          console.log('populate-cms.js: Initializing CartManager with CMS data...');
          window.CartManager.init(cmsData);
          cartManagerInitialized = true;
          console.log('✅ populate-cms.js: CartManager initialized successfully');
        } else if (!window.CartManager) {
          console.error('❌ populate-cms.js: CartManager not available! Make sure cart-manager.js is loaded before populate-cms.js');
        } else {
          console.log('populate-cms.js: CartManager already initialized');
        }
      } catch (error) {
        console.error('❌ populate-cms.js: Error initializing CartManager:', error);
      }
      
      // Populate based on current page
      const pathname = window.location.pathname.toLowerCase();
      const filename = pathname.split('/').pop() || '';
      
      console.log('populate-cms.js: Current page:', { pathname, filename });
      
      // Check if we're on product detail page (multiple ways to detect)
      try {
        if (filename.includes('detail_product') || 
            pathname.includes('detail_product') || 
            pathname.includes('/product/') ||
            document.querySelector('[bind="44360311-a628-3bd3-7fc8-c24734f06683"]')) {
          console.log('populate-cms.js: Detected product detail page');
          console.log('populate-cms.js: Ensuring product page follows pattern...');
          populateProductPage();
          // NOTE: initCartIntegration() is called INSIDE populateProductPage() after IDs are set
          // Do NOT call it here - it would run before form IDs are injected
        } else if (filename.includes('zubehoer') || pathname.includes('zubehoer') ||
                   filename.includes('accessories') || pathname.includes('accessories') ||
                   filename.includes('accesorios') || pathname.includes('accesorios') ||
                   document.querySelector('[bind="4a7dc39c-fd5a-acc7-8775-f4e5a479d73b"]')) {
          console.log('populate-cms.js: Detected accessories page');
          populateAccessoriesPage();
          // Initialize cart integration IMMEDIATELY
          initCartIntegration();
        } else if (pathname === '/' || filename === 'index.html' || filename === '' || filename.includes('index')) {
          console.log('populate-cms.js: Detected homepage');
          populateHomePageSlider();
          populateMarketingContent();
          populateHomepageProductGrid();
          // Initialize cart integration IMMEDIATELY
          initCartIntegration();
        } else if (filename.includes('akurock-muster') || pathname.includes('akurock-muster') ||
                   filename.includes('sample-box') || pathname.includes('sample-box') ||
                   filename.includes('caja-de-muestras') || pathname.includes('caja-de-muestras') ||
                   document.querySelector('#sample-boxes-grid-container')) {
          console.log('populate-cms.js: Detected sample boxes page');
          
          // CRITICAL: Force check if we have sample boxes in data
          const hasSampleBoxes = cmsData && cmsData.products && cmsData.products.some(p => 
            p.category === 'AKUROCK Muster' || 
            (p.id && p.id.includes('-sample'))
          );
          
          if (!hasSampleBoxes) {
            console.warn('⚠️ populate-cms.js: No sample boxes found in current data, forcing reload from JSON...');
            // Force reload from JSON (with cache busting)
            const cacheBuster = '?v=' + Date.now();
            fetch('/data/mock-cms-data.json' + cacheBuster)
              .then(response => response.text())
              .then(jsonText => {
                console.log('📊 populate-cms.js: Force-reload JSON size:', jsonText.length);
                console.log('🔍 populate-cms.js: Contains "brush-sample"?', jsonText.includes('"id": "brush-sample"'));
                console.log('🔍 populate-cms.js: Contains "AKUROCK Muster"?', jsonText.includes('"AKUROCK Muster"'));
                const data = JSON.parse(jsonText);
                const sampleCount = data.products?.filter(p => p.category === 'AKUROCK Muster' || (p.id && p.id.includes('-sample'))).length || 0;
                console.log('✅ populate-cms.js: Force-reloaded from JSON');
                console.log('📊 populate-cms.js: Total products:', data.products?.length || 0);
                console.log('📊 populate-cms.js: Sample boxes found:', sampleCount);
                cmsData = data;
                // Save to localStorage
                if (window.AdminDataManager) {
                  window.AdminDataManager.saveCMSData(data);
                  console.log('✅ populate-cms.js: Saved force-reloaded data to localStorage');
                }
                // Now populate
                populateSampleBoxesPage();
              })
              .catch(error => {
                console.error('❌ populate-cms.js: Force reload failed:', error);
                // Still try to populate with what we have
                populateSampleBoxesPage();
              });
          } else {
            populateSampleBoxesPage();
          }
          
          // Initialize cart integration AFTER population
          requestAnimationFrame(() => {
            initCartIntegration();
          });
        } else {
          // For other pages, still initialize cart integration IMMEDIATELY
          initCartIntegration();
        }
      } catch (error) {
        console.error('❌ populate-cms.js: Error in page detection/population:', error);
        // Still try to initialize cart integration
        try {
          initCartIntegration();
        } catch (initError) {
          console.error('❌ populate-cms.js: Error initializing cart integration:', initError);
        }
      }
    }).catch(error => {
      console.error('populate-cms.js: Error loading CMS data:', error);
    });
  }

  // Expose helper function to clear localStorage and reload (for debugging)
  window.reloadCMSData = function() {
    console.log('🔄 Clearing localStorage and reloading CMS data from JSON...');
    localStorage.removeItem('stonearts_cms_data');
    localStorage.removeItem('stonearts_cms_meta');
    location.reload();
  };

  // Start initialization
  init();

})();
