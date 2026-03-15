/**
 * Cart Page Handler
 * Populates the full cart page (/cart) with items from localStorage.
 * Works with the Webflow cart.html template structure.
 */
(function() {
  'use strict';

  var CART_STORAGE_KEY = 'stonearts-cart';

  // i18n strings
  var i18n = {
    de: {
      emptyCart: 'Dein Warenkorb ist leer.',
      product: 'Produkt',
      dimensions: 'Ma\u00dfe:',
      delete: 'L\u00f6schen',
      subtotal: 'Bestellwert:',
      discount: 'Rabatt:',
      total: 'Gesamtsumme:',
      checkout: 'Angebot anfordern',
      continueShopping: 'Weiter einkaufen',
      shoppingCart: 'Einkaufswagen',
      shippingNote: 'Versandkosten werden im Checkout-Prozess individuell ermittelt und angezeigt.',
      weAccept: 'Wir akzeptieren',
      update: 'Aktualisieren'
    },
    en: {
      emptyCart: 'Your cart is empty.',
      product: 'Product',
      dimensions: 'Dimensions:',
      delete: 'Delete',
      subtotal: 'Subtotal:',
      discount: 'Discount:',
      total: 'Total:',
      checkout: 'Request Quote',
      continueShopping: 'Continue Shopping',
      shoppingCart: 'Shopping Cart',
      shippingNote: 'Shipping costs will be calculated during checkout.',
      weAccept: 'We accept',
      update: 'Update'
    },
    es: {
      emptyCart: 'Tu carrito est\u00e1 vac\u00edo.',
      product: 'Producto',
      dimensions: 'Dimensiones:',
      delete: 'Eliminar',
      subtotal: 'Subtotal:',
      discount: 'Descuento:',
      total: 'Total:',
      checkout: 'Solicitar presupuesto',
      continueShopping: 'Seguir comprando',
      shoppingCart: 'Carrito de compras',
      shippingNote: 'Los costes de env\u00edo se calcular\u00e1n durante el proceso de pago.',
      weAccept: 'Aceptamos',
      update: 'Actualizar'
    }
  };

  function getLocale() {
    return window.__LOCALE__ || 'de';
  }

  function t(key) {
    var locale = getLocale();
    return (i18n[locale] && i18n[locale][key]) || i18n.de[key] || key;
  }

  function getCart() {
    try {
      var cartJson = localStorage.getItem(CART_STORAGE_KEY);
      return cartJson ? JSON.parse(cartJson) : { items: [] };
    } catch (e) {
      return { items: [] };
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }

  function formatPrice(price, currency) {
    currency = currency || 'EUR';
    return '\u20ac' + price.toFixed(2) + ' ' + currency;
  }

  function isCartPage() {
    // Detect if we're on the full cart page
    var path = window.location.pathname;
    return /\/(de|en|es)?\/?cart(\/)?$/.test(path) ||
           /\/(de|en|es)?\/?shopping-cart(\/)?$/.test(path) ||
           /\/(de|en|es)?\/?carrito(\/)?$/.test(path) ||
           !!document.querySelector('.section.is-hero.einakufswagen');
  }

  function renderCartPage() {
    if (!isCartPage()) return;

    console.log('Cart Page Handler: Rendering cart page...');

    var locale = getLocale();
    var cart = getCart();
    var cartItemsContainer = document.querySelector('.cart-items');
    var cartForm = document.querySelector('.cart-form');

    if (!cartItemsContainer) {
      console.warn('Cart Page Handler: .cart-items container not found');
      return;
    }

    // Translate static labels
    var heading = document.querySelector('.paragraph-109');
    if (heading) heading.textContent = t('shoppingCart');

    var shippingNote = document.querySelector('.paragraph-115');
    if (shippingNote) shippingNote.textContent = t('shippingNote');

    var acceptLabel = document.querySelector('.text-block-119');
    if (acceptLabel) acceptLabel.textContent = t('weAccept');

    // Translate checkout button
    var checkoutBtn = document.querySelector('.submit-button-2');
    if (checkoutBtn) checkoutBtn.value = t('checkout');

    // Hide the Webflow update button
    var updateBtn = document.querySelector('.submit-button-3');
    if (updateBtn) updateBtn.style.display = 'none';

    // Clear placeholder items
    cartItemsContainer.innerHTML = '';

    if (cart.items.length === 0) {
      // Show empty state
      cartItemsContainer.innerHTML = '<div class="cart-empty-state" style="text-align:center;padding:60px 20px;"><p style="font-family:\'Playfair Display\',serif;font-size:20px;color:#333;margin-bottom:24px;">' + t('emptyCart') + '</p><a href="/' + locale + '" class="submit-button-2 w-button" style="display:inline-block;text-decoration:none;background-color:#000;color:#fff;padding:12px 32px;font-size:14px;letter-spacing:1px;text-transform:uppercase;">' + t('continueShopping') + '</a></div>';

      // Hide footer (totals + checkout)
      var gridFooter = document.querySelector('.w-layout-grid.grid-95');
      if (gridFooter) gridFooter.style.display = 'none';

      return;
    }

    // Render each cart item
    cart.items.forEach(function(item, index) {
      var itemEl = document.createElement('div');
      itemEl.className = 'cart-item-2';
      itemEl.setAttribute('data-cart-index', index);
      itemEl.setAttribute('data-product-id', item.productId);
      itemEl.setAttribute('data-variant-id', item.variantId);

      var imageSrc = item.image || 'https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg';
      if (imageSrc && !imageSrc.startsWith('http') && !imageSrc.startsWith('/')) {
        imageSrc = '/' + imageSrc;
      }

      var productLink = item.productSlug ? ('/' + locale + '/product/' + item.productSlug) : '#';
      var itemTotal = (item.price * item.quantity).toFixed(2);
      var dimensions = item.dimensions || '';

      itemEl.innerHTML =
        '<div class="link-block-20">' +
          '<a href="' + productLink + '">' +
            '<img src="' + imageSrc + '" loading="lazy" alt="' + (item.name || '') + '" class="image-217" onerror="this.style.display=\'none\'">' +
          '</a>' +
        '</div>' +
        '<div class="div-block-2">' +
          '<div class="product_price_wrapper">' +
            '<div class="link-block-19">' +
              '<div class="description_wrapper">' +
                '<a href="' + productLink + '" style="text-decoration:none;color:inherit;">' +
                  '<p class="paragraph-110">' + (item.name || t('product')) + '</p>' +
                '</a>' +
                (dimensions ? '<div class="options_wrapper"><div class="options_container"><div class="text-block-129">' + t('dimensions') + '</div><div class="text-block-130">' + dimensions + '</div></div></div>' : '') +
              '</div>' +
              '<div class="q-group is-einkauf">' +
                '<button type="button" class="q-dec cart-page-qty-btn" data-action="decrease" data-product-id="' + item.productId + '" data-variant-id="' + item.variantId + '" aria-label="Decrease">' +
                  '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z" fill="currentColor"/></svg>' +
                '</button>' +
                '<input class="q-num is-einkauf w-input" type="number" min="1" value="' + item.quantity + '" data-product-id="' + item.productId + '" data-variant-id="' + item.variantId + '">' +
                '<button type="button" class="q-inc cart-page-qty-btn" data-action="increase" data-product-id="' + item.productId + '" data-variant-id="' + item.variantId + '" aria-label="Increase">' +
                  '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
            '<div class="cart_right is-einkauf">' +
              '<a href="#" class="link-2 cart-page-delete" data-product-id="' + item.productId + '" data-variant-id="' + item.variantId + '">' + t('delete') + '</a>' +
              '<div class="text-block-115 is-einkauf">\u20ac' + itemTotal + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      cartItemsContainer.appendChild(itemEl);
    });

    // Update totals
    updateTotals(cart);

    // Attach event listeners
    attachCartPageListeners();
  }

  function updateTotals(cart) {
    var total = 0;
    cart.items.forEach(function(item) {
      total += item.price * item.quantity;
    });

    // Update subtotal
    var subtotalEl = document.querySelector('[cart="total-price"]');
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);

    // Update discount (always 0 for now)
    var discountEl = document.querySelector('[cart="total-discount"]');
    if (discountEl) discountEl.textContent = formatPrice(0);

    // Update grand total
    var grandTotalEl = document.querySelector('[cart="original-total-price"]');
    if (grandTotalEl) grandTotalEl.textContent = formatPrice(total);

    // Translate total labels
    var subtotalLabel = document.querySelector('.text-block-120');
    if (subtotalLabel) subtotalLabel.textContent = t('subtotal');

    var discountLabel = document.querySelector('.text-block-113');
    if (discountLabel) discountLabel.textContent = t('discount');

    var totalLabel = document.querySelector('.text-block-112');
    if (totalLabel) totalLabel.textContent = t('total');
  }

  function attachCartPageListeners() {
    // Quantity buttons
    document.querySelectorAll('.cart-page-qty-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var action = this.getAttribute('data-action');
        var productId = this.getAttribute('data-product-id');
        var variantId = this.getAttribute('data-variant-id');
        var cart = getCart();
        var item = cart.items.find(function(i) {
          return i.productId === productId && i.variantId === variantId;
        });

        if (!item) return;

        if (action === 'increase') {
          item.quantity += 1;
        } else if (action === 'decrease') {
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            cart.items = cart.items.filter(function(i) {
              return !(i.productId === productId && i.variantId === variantId);
            });
          }
        }

        saveCart(cart);
        renderCartPage();
        // Update cart badge in nav
        if (window.CartManager) {
          window.CartManager.updateCartBadge();
        }
      });
    });

    // Delete links
    document.querySelectorAll('.cart-page-delete').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var productId = this.getAttribute('data-product-id');
        var variantId = this.getAttribute('data-variant-id');
        var cart = getCart();
        cart.items = cart.items.filter(function(i) {
          return !(i.productId === productId && i.variantId === variantId);
        });
        saveCart(cart);
        renderCartPage();
        if (window.CartManager) {
          window.CartManager.updateCartBadge();
        }
      });
    });

    // Quantity input change
    document.querySelectorAll('.cart-items .q-num').forEach(function(input) {
      input.addEventListener('change', function() {
        var productId = this.getAttribute('data-product-id');
        var variantId = this.getAttribute('data-variant-id');
        var newQty = parseInt(this.value, 10);
        if (isNaN(newQty) || newQty < 1) newQty = 1;

        var cart = getCart();
        var item = cart.items.find(function(i) {
          return i.productId === productId && i.variantId === variantId;
        });
        if (item) {
          item.quantity = newQty;
          saveCart(cart);
          renderCartPage();
          if (window.CartManager) {
            window.CartManager.updateCartBadge();
          }
        }
      });
    });

    // Intercept form submission (prevent Webflow default behavior)
    var cartForm = document.querySelector('.cart-form');
    if (cartForm) {
      cartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Navigate to quotation page
        var locale = getLocale();
        window.location.href = '/' + locale + '/quotation';
      });
    }

    // Fix checkout button to go to quotation
    var checkoutBtn = document.querySelector('.submit-button-2');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var locale = getLocale();
        window.location.href = '/' + locale + '/quotation';
      });
    }
  }

  // Initialize when DOM is ready
  function init() {
    if (isCartPage()) {
      console.log('Cart Page Handler: Cart page detected, initializing...');
      // Small delay to let other scripts load
      setTimeout(renderCartPage, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
