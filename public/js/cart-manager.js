/**
 * Cart Manager
 * Manages shopping cart functionality using localStorage
 * Handles add, remove, update, and display of cart items
 */

(function() {
  'use strict';

  const CART_STORAGE_KEY = 'stonearts-cart';
  let cmsData = null;

  // i18n strings for cart drawer
  const cartI18n = {
    de: { yourCart: 'Dein Warenkorb', total: 'Gesamt', checkout: 'Angebot anfordern', viewCart: 'Zum Einkaufswagen', empty: 'Der Warenkorb ist leer.', delete: 'L\u00f6schen' },
    en: { yourCart: 'Your Cart', total: 'Total', checkout: 'Request Quote', viewCart: 'View Cart', empty: 'Your cart is empty.', delete: 'Delete' },
    es: { yourCart: 'Tu carrito', total: 'Total', checkout: 'Solicitar presupuesto', viewCart: 'Ver carrito', empty: 'Tu carrito est\u00e1 vac\u00ed\o.', delete: 'Eliminar' },
  };
  function cartT(key) {
    const locale = window.__LOCALE__ || 'de';
    return (cartI18n[locale] && cartI18n[locale][key]) || cartI18n.de[key] || key;
  }

  // Cart Manager Object
  const CartManager = {
    // Initialize cart system
    init: function(data) {
      // cmsData may arrive later than the first init (e.g. the self-arming
      // fallback below runs before populate-cms.js finishes loading CMS data).
      // Always take the freshest data, but never attach listeners twice.
      if (data) cmsData = data;
      if (this._initialized) {
        this.renderCart();
        this.updateCartBadge();
        return;
      }
      this._initialized = true;
      this.attachEventListeners();
      this.renderCart();
      this.updateCartBadge();
    },

    // Get cart from localStorage
    getCart: function() {
      try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        return cartJson ? JSON.parse(cartJson) : { items: [] };
      } catch (error) {
        console.error('Error reading cart from localStorage:', error);
        return { items: [] };
      }
    },

    // Save cart to localStorage
    saveCart: function(cart) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    },

    // Get product data by productId and variantId
    getProductData: function(productId, variantId) {
      if (!cmsData) {
        console.error('Cart Manager: CMS data not loaded');
        return null;
      }

      // Search in products
      if (cmsData.products) {
        const product = cmsData.products.find(p => 
          p.productId === productId && p.variantId === variantId
        );
        if (product) return product;
      }

      // Search in accessories
      if (cmsData.accessories) {
        const accessory = cmsData.accessories.find(a => 
          a.productId === productId && a.variantId === variantId
        );
        if (accessory) return accessory;
      }

      console.warn('Cart Manager: Product not found', { productId, variantId });
      return null;
    },

    // Add item to cart or update quantity if exists
    addToCart: function(productId, variantId, quantity = 1) {
      const product = this.getProductData(productId, variantId);
      if (!product) {
        console.error('Cart Manager: Cannot add product - product data not found');
        return false;
      }

      const cart = this.getCart();
      const existingItemIndex = cart.items.findIndex(item => 
        item.productId === productId && item.variantId === variantId
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        cart.items[existingItemIndex].quantity += parseInt(quantity, 10);
      } else {
        // Add new item
        const dimensions = product.dimensions || product.size || product.alt_text || '';
        const dimensionsDisplay = dimensions.replace(/\(.*?\)/g, '').trim(); // Remove area in parentheses
        const dimensionsShort = dimensionsDisplay.replace(/ x \d+\.\d+ x \d+\.\d+ cm/g, '').replace(/ x \d+ x \d+ cm/g, '').trim() || dimensionsDisplay;
        
        // Normalize image path
        let productImage = product.mainImage || (product.images && product.images[0] && product.images[0].url) || '';
        if (productImage && !productImage.startsWith('http') && !productImage.startsWith('/')) {
          productImage = '/' + productImage;
        } else if (productImage && productImage.startsWith('images/')) {
          productImage = '/' + productImage;
        }
        
        cart.items.push({
          productId: productId,
          variantId: variantId,
          productSlug: product.slug || product.id,
          name: product.name,
          price: product.priceValue || parseFloat(product.price.replace(/[^\d.]/g, '')) || 0,
          priceDisplay: product.price || `€${product.priceValue || 0}.00`,
          currency: product.currency || 'EUR',
          image: productImage,
          dimensions: dimensionsShort,
          quantity: parseInt(quantity, 10)
        });
      }

      this.saveCart(cart);
      this.renderCart();
      this.updateCartBadge();
      
      // Open cart immediately after adding item
      console.log('CartManager: Item added, opening cart...');
      this.openCart();
      
      return true;
    },

    // Remove item from cart
    removeFromCart: function(productId, variantId) {
      const cart = this.getCart();
      cart.items = cart.items.filter(item => 
        !(item.productId === productId && item.variantId === variantId)
      );
      this.saveCart(cart);
      this.renderCart();
      this.updateCartBadge();
    },

    // Update item quantity
    updateQuantity: function(productId, variantId, quantity) {
      const cart = this.getCart();
      const item = cart.items.find(item => 
        item.productId === productId && item.variantId === variantId
      );

      if (item) {
        const newQuantity = parseInt(quantity, 10);
        if (newQuantity < 1) {
          this.removeFromCart(productId, variantId);
        } else {
          item.quantity = newQuantity;
          this.saveCart(cart);
          this.renderCart();
          this.updateCartBadge();
        }
      }
    },

    // Get total item count in cart
    getCartCount: function() {
      const cart = this.getCart();
      return cart.items.reduce((total, item) => total + item.quantity, 0);
    },

    // Get total price
    getCartTotal: function() {
      const cart = this.getCart();
      const total = cart.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      return total;
    },

    // Format price
    formatPrice: function(price, currency = 'EUR') {
      return `€${price.toFixed(2)} ${currency}`;
    },

    // Render cart items in sidebar - WITH ERROR HANDLING
    renderCart: function() {
      try {
        const cart = this.getCart();
        
        // Try multiple selectors for cart list
        let cartList = document.querySelector('[bind="4bc36725-f958-4612-d2cb-e90fd749bb31"]');
        if (!cartList) cartList = document.querySelector('[bind="4bc36725-f958-4612-d2cb-e90fd749bb6e"]');
        if (!cartList) cartList = document.querySelector('.w-commerce-commercecartlist');
        if (!cartList) {
          // Try to find by class pattern
          const allDivs = document.querySelectorAll('div');
          for (let div of allDivs) {
            if (div.className && div.className.includes('commercecartlist')) {
              cartList = div;
              break;
            }
          }
        }
        
        const cartForm = document.querySelector('[data-node-type="commerce-cart-form"]');
        const emptyState = document.querySelector('[bind="4bc36725-f958-4612-d2cb-e90fd749bb50"]');
        let totalElement = document.querySelector('[bind="4bc36725-f958-4612-d2cb-e90fd749bb45"]');
        if (!totalElement) totalElement = document.querySelector('[bind="4bc36725-f958-4612-d2cb-e90fd749bb82"]');

        // Use whichever cart list exists
        const targetCartList = cartList;
        const targetTotalElement = totalElement;

        if (!targetCartList) {
          console.warn('⚠️ Cart Manager: Cart list container not found - cart items may not display');
          // Don't return - still try to update badge and total
        } else {
          // Show/hide empty state
          if (emptyState) {
            if (cart.items.length === 0) {
              emptyState.style.display = 'flex';
              emptyState.style.flexDirection = 'column';
              if (cartForm) cartForm.style.display = 'none';
            } else {
              emptyState.style.display = 'none';
              if (cartForm) cartForm.style.display = 'flex';
            }
          }

          // Clear existing items
          targetCartList.innerHTML = '';

          // Render cart items
          cart.items.forEach((item, index) => {
            try {
              const cartItem = this.createCartItemHTML(item);
              targetCartList.appendChild(cartItem);
            } catch (error) {
              console.error(`❌ Error rendering cart item ${index}:`, error);
            }
          });
        }

        // Update total
        if (targetTotalElement) {
          try {
            const total = this.getCartTotal();
            targetTotalElement.textContent = this.formatPrice(total);
          } catch (error) {
            console.error('❌ Error updating cart total:', error);
          }
        }

        // i18n: Translate cart drawer UI labels
        try {
          const locale = window.__LOCALE__ || 'de';
          // Cart heading
          document.querySelectorAll('.w-commerce-commercecartheading').forEach(el => {
            el.textContent = cartT('yourCart');
          });
          // Total label
          document.querySelectorAll('.text-block-107, .text-block-108').forEach(el => {
            el.textContent = cartT('total');
          });
          // Empty state text
          document.querySelectorAll('.w-commerce-commercecartemptystate div[aria-label], .text-block-110, .text-block-111').forEach(el => {
            el.textContent = cartT('empty');
          });
          // Checkout button
          document.querySelectorAll('[data-node-type="cart-checkout-button"]').forEach(el => {
            el.textContent = cartT('checkout');
            // Fix href to include locale
            el.setAttribute('href', '/' + locale + '/quotation');
          });
          // View cart button
          document.querySelectorAll('.einkaufswagen-button').forEach(el => {
            el.textContent = cartT('viewCart');
            // Fix href to include locale
            el.setAttribute('href', '/' + locale + '/cart');
          });
        } catch (i18nError) {
          console.warn('Cart i18n error:', i18nError);
        }
      } catch (error) {
        console.error('❌ Cart Manager: Error in renderCart:', error);
      }
    },

    // Create cart item HTML element - matching the second image design
    createCartItemHTML: function(item) {
      const div = document.createElement('div');
      div.className = 'w-commerce-commercecartitem';
      div.setAttribute('data-product-id', item.productId);
      div.setAttribute('data-variant-id', item.variantId);

      // Format dimensions for display (e.g., "240 x 60 cm")
      let dimensionsDisplay = '';
      if (item.dimensions && item.dimensions.includes('x')) {
        // Extract first two dimensions: "240 x 60 x 2.3 cm (1.44m²)" -> "240 x 60 cm"
        const parts = item.dimensions.split('x').map(s => s.trim());
        if (parts.length >= 2) {
          dimensionsDisplay = parts[0].trim() + ' x ' + parts[1].replace(/[^0-9.]/g, '').trim() + ' cm';
        }
      }

      // Normalize image path
      let itemImage = item.image || '';
      if (itemImage && !itemImage.startsWith('http') && !itemImage.startsWith('/')) {
        itemImage = '/' + itemImage;
      } else if (itemImage && itemImage.startsWith('images/')) {
        itemImage = '/' + itemImage;
      }

      // Calculate item total price
      const itemTotal = (item.price * item.quantity).toFixed(2);

      div.innerHTML = `
        <div class="cart-item-wrapper">
          <img src="${itemImage}" alt="${item.name || ''}" class="w-commerce-commercecartitemimage" onerror="this.style.display='none';">
          <div class="w-commerce-commercecartiteminfo">
            <div class="cart-item-header">
              <div class="cart-item-name-section">
                <div class="w-commerce-commercecartproductname">${item.name || ''}</div>
                ${dimensionsDisplay ? `<div class="w-commerce-commercecartproductoption">${dimensionsDisplay}</div>` : ''}
              </div>
              <div class="cart-item-price-section">
                <div class="w-commerce-commercecartproductprice">${this.formatPrice(item.price * item.quantity, item.currency)}</div>
              </div>
            </div>
            <div class="cart-item-controls">
              <div class="cart-quantity-controls">
                <button type="button" class="q-dec cart-qty-btn" data-action="decrease" data-product-id="${item.productId}" data-variant-id="${item.variantId}" aria-label="Decrease quantity" style="min-width:44px;min-height:44px;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M19 13H5v-2h14v2z" fill="currentColor"></path>
                  </svg>
                </button>
                <input type="number" class="cart-quantity-input" value="${item.quantity}" min="1" data-product-id="${item.productId}" data-variant-id="${item.variantId}" aria-label="Quantity" style="font-size:16px;min-height:44px;">
                <button type="button" class="q-inc cart-qty-btn" data-action="increase" data-product-id="${item.productId}" data-variant-id="${item.variantId}" aria-label="Increase quantity" style="min-width:44px;min-height:44px;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"></path>
                  </svg>
                </button>
              </div>
              <a href="#" class="cart-delete-link" data-action="delete" data-product-id="${item.productId}" data-variant-id="${item.variantId}">${cartT('delete')}</a>
            </div>
          </div>
        </div>
      `;

      return div;
    },

    // Update cart badge count
    updateCartBadge: function() {
      const count = this.getCartCount();
      const badges = document.querySelectorAll('[bind="4bc36725-f958-4612-d2cb-e90fd749bb26"], [bind="4bc36725-f958-4612-d2cb-e90fd749bb63"]');
      badges.forEach(badge => {
        badge.textContent = count;
      });
    },

    // Open cart sidebar with slide animation from right - ENHANCED VERSION
    openCart: function() {
      try {
        console.log('CartManager.openCart: Starting...');
        
        // Re-render cart first to ensure it's up to date
        this.renderCart();
        
        // Try ALL possible selectors in order of preference
        let container = null;
        const selectors = [
          '[data-node-type="commerce-cart-container-wrapper"]',
          '.w-commerce-commercecartcontainerwrapper',
          '[bind*="4bc36725-f958-4612-d2cb-e90fd749bb28"]',
          '[bind*="4bc36725-f958-4612-d2cb-e90fd749bb65"]',
          '.cart-container-2',
          '.cart-container-3',
          '[class*="commercecartcontainerwrapper"]'
        ];
        
        for (let selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            container = elements[0];
            console.log('✅ CartManager.openCart: Found container with selector:', selector);
            break;
          }
        }
        
        // If still not found, try to find by class name patterns
        if (!container) {
          const allDivs = document.querySelectorAll('div');
          for (let div of allDivs) {
            if (div.className && (
              div.className.includes('commercecartcontainerwrapper') ||
              div.className.includes('cart-container')
            )) {
              container = div;
              console.log('✅ CartManager.openCart: Found container by class pattern');
              break;
            }
          }
        }
        
        if (!container) {
          console.error('❌ CartManager.openCart: No cart containers found!');
          console.error('Tried selectors:', selectors);
          // Try one more time after a short delay (maybe DOM not ready)
          setTimeout(() => {
            console.log('CartManager.openCart: Retrying after delay...');
            this.openCart();
          }, 100);
          return;
        }
        
        // Get the cart wrapper
        let wrapper = container.closest('[data-node-type="commerce-cart-wrapper"]') ||
                     container.closest('.w-commerce-commercecartwrapper') ||
                     container.parentElement;
        
        // FORCE visibility with cssText using !important (most forceful)
        // Remove any inline style that might hide it first
        container.removeAttribute('style');
        
        // Lock body scroll when cart is open
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        // Set ALL styles directly with !important
        container.style.cssText = `
          display: flex !important;
          visibility: visible !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100vh !important;
          z-index: 1001 !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        `;
        
        // Get the actual cart box (white drawer)
        let cartBox = container.querySelector('[data-node-type="commerce-cart-container"]') ||
                     container.querySelector('.w-commerce-commercecartcontainer') ||
                     container.querySelector('.cart-container-2') ||
                     container.querySelector('.cart-container-3');
        
        if (!cartBox) {
          // Try to find any child div that might be the cart box
          const children = container.children;
          for (let child of children) {
            if (child.tagName === 'DIV' && child.style) {
              cartBox = child;
              break;
            }
          }
        }
        
        if (cartBox) {
          // Set up the cart box with forced styles
          var cartMaxWidth = window.innerWidth <= 479 ? '100%' : '480px';
          cartBox.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: ${cartMaxWidth} !important;
            height: 100% !important;
            background-color: #fff !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15) !important;
            transform: translateX(100%) !important;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          `;
          
          // Slide in from right - use requestAnimationFrame for smooth animation
          requestAnimationFrame(() => {
            setTimeout(() => {
              // Use setProperty to apply transform with !important, or just set it directly
              cartBox.style.setProperty('transform', 'translateX(0)', 'important');
              console.log('✅ CartManager.openCart: Cart drawer opened and slid in');
            }, 10);
          });
        } else {
          console.warn('⚠️ CartManager.openCart: Cart box not found, but container is visible');
        }
        
        // Add Webflow classes for compatibility
        if (container.classList) {
          container.classList.add('w-commerce-commercecartopen');
        }
        if (wrapper && wrapper.classList) {
          wrapper.classList.add('w-commerce-commercecartopen');
        }
        
        // Add backdrop click handler to close
        const backdropClick = (e) => {
          if (e.target === container) {
            this.closeCart();
            container.removeEventListener('click', backdropClick);
          }
        };
        container.addEventListener('click', backdropClick);
        
        console.log('✅ CartManager.openCart: Cart opened successfully');
      } catch (error) {
        console.error('❌ CartManager.openCart: Error opening cart:', error);
        // Retry once after error
        setTimeout(() => {
          console.log('CartManager.openCart: Retrying after error...');
          this.openCart();
        }, 200);
      }
    },

    // Close cart sidebar — searches all possible selectors
    closeCart: function() {
      console.log('CartManager.closeCart: Starting...');

      // Unlock body scroll
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      // Collect all possible cart containers
      const selectors = [
        '[data-node-type="commerce-cart-container-wrapper"]',
        '.w-commerce-commercecartcontainerwrapper',
        '[class*="commercecartcontainerwrapper"]'
      ];
      const containers = new Set();
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => containers.add(el));
      });

      containers.forEach(container => {
        const cartBox = container.querySelector('[data-node-type="commerce-cart-container"]') ||
                       container.querySelector('.w-commerce-commercecartcontainer') ||
                       container.querySelector('.cart-container-2') ||
                       container.querySelector('.cart-container-3');
        if (cartBox) {
          cartBox.style.setProperty('transform', 'translateX(100%)', 'important');
        }

        // Hide after animation
        setTimeout(() => {
          container.style.cssText = 'display:none !important; visibility:hidden !important; opacity:0 !important;';
          container.classList.remove('w-commerce-commercecartopen');
        }, 400);
      });

      document.querySelectorAll('[data-node-type="commerce-cart-wrapper"], .w-commerce-commercecartwrapper').forEach(wrapper => {
        wrapper.classList.remove('w-commerce-commercecartopen');
      });

      console.log('CartManager.closeCart: Cart closed');
    },

    // Attach event listeners for cart interactions
    attachEventListeners: function() {
      const self = this;

      // Close cart on Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          self.closeCart();
        }
      });

      // Delegate events for dynamically created elements
      document.addEventListener('click', function(e) {
        const action = e.target.closest('[data-action]');
        if (!action) return;

        const productId = action.getAttribute('data-product-id');
        const variantId = action.getAttribute('data-variant-id');
        const actionType = action.getAttribute('data-action');

        if (actionType === 'decrease') {
          e.preventDefault();
          const cart = self.getCart();
          const item = cart.items.find(item => 
            item.productId === productId && item.variantId === variantId
          );
          if (item && item.quantity > 1) {
            self.updateQuantity(productId, variantId, item.quantity - 1);
          } else if (item) {
            self.removeFromCart(productId, variantId);
          }
        } else if (actionType === 'increase') {
          e.preventDefault();
          const cart = self.getCart();
          const item = cart.items.find(item => 
            item.productId === productId && item.variantId === variantId
          );
          if (item) {
            self.updateQuantity(productId, variantId, item.quantity + 1);
          }
        } else if (actionType === 'delete') {
          e.preventDefault();
          self.removeFromCart(productId, variantId);
        }
      });

      // Handle quantity input changes
      document.addEventListener('change', function(e) {
        if (e.target.classList.contains('cart-quantity-input')) {
          const productId = e.target.getAttribute('data-product-id');
          const variantId = e.target.getAttribute('data-variant-id');
          const quantity = e.target.value;
          self.updateQuantity(productId, variantId, quantity);
        }
      });

      // Handle cart open/close using event delegation (works for dynamically added buttons)
      // Use capture phase to ensure we catch events early
      document.addEventListener('click', function(e) {
        const cartOpenLink = e.target.closest('[data-node-type="commerce-cart-open-link"]');
        if (cartOpenLink) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('CartManager: Cart button clicked in navbar (delegated)');
          self.renderCart();
          self.openCart();
          return false;
        }
        
        const cartCloseLink = e.target.closest('[data-node-type="commerce-cart-close-link"]');
        if (cartCloseLink) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('CartManager: Cart close button clicked (delegated)');
          self.closeCart();
          return false;
        }
      }, true); // Capture phase
      
      // Also attach directly to existing links as backup
      const cartOpenLinks = document.querySelectorAll('[data-node-type="commerce-cart-open-link"]');
      cartOpenLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('CartManager: Cart button clicked (direct handler)');
          self.renderCart();
          self.openCart();
          return false;
        }, true);
      });
      
      // Also handle cart close links
      const cartCloseLinks = document.querySelectorAll('[data-node-type="commerce-cart-close-link"]');
      cartCloseLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('CartManager: Cart close button clicked (direct handler)');
          self.closeCart();
          return false;
        }, true);
      });
    }
  };

  // Expose CartManager globally
  window.CartManager = CartManager;

  // Self-arming fallback: populate-cms.js initializes CartManager after CMS
  // data loads, but if that load fails (API route down, JSON fetch error)
  // it used to bail out without ever calling init() — leaving the cart
  // click handlers unbound, so the cart icon did NOTHING. The cart drawer
  // itself only needs localStorage, not CMS data (cmsData is only used for
  // product lookups when adding items), so make sure the cart UI always
  // arms shortly after load even if CMS data never arrives. init() guards
  // against double-binding when populate-cms.js initializes later/earlier.
  function armFallback() {
    setTimeout(function () {
      if (!CartManager._initialized) {
        console.warn('CartManager: initializing via fallback (CMS data not loaded yet)');
        CartManager.init(window.cmsData || null);
      }
    }, 300);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', armFallback);
  } else {
    armFallback();
  }

})();
