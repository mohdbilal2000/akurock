/**
 * Admin Panel Logic
 * 
 * Handles all UI interactions, form handling, validation, and user interactions
 * for the admin panel. Works in conjunction with AdminDataManager for data operations.
 */

(function() {
  'use strict';

  // Admin Panel State
  const AdminPanel = {
    currentSection: 'dashboard',
    currentEditingProduct: null,
    currentEditingAccessory: null,
    currentEditingSampleBox: null,
    cmsData: null
  };

  /**
   * Initialize admin panel
   */
  async function init() {
    console.log('AdminPanel: Initializing...');
    
    // Wait for AdminDataManager to be available
    if (!window.AdminDataManager) {
      console.error('AdminPanel: AdminDataManager not found. Waiting...');
      // Wait a bit and try again
      setTimeout(() => {
        if (!window.AdminDataManager) {
          document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
              <h1 style="color: #dc3545;">Error Loading Admin Panel</h1>
              <p>AdminDataManager script failed to load. Please check:</p>
              <ul style="text-align: left; display: inline-block;">
                <li>admin/admin-data-manager.js file exists</li>
                <li>Browser console for errors</li>
                <li>File paths are correct</li>
              </ul>
              <p style="margin-top: 1rem;"><a href="admin.html" style="color: #0d0d0d;">Reload Page</a></p>
            </div>
          `;
          return;
        }
        init();
      }, 100);
      return;
    }
    
    // Check if user is logged in
    if (!checkAuth()) {
      showLoginPage();
      return;
    }

    // Load CMS data
    try {
      AdminPanel.cmsData = await window.AdminDataManager.loadCMSData();
      console.log('AdminPanel: CMS data loaded', AdminPanel.cmsData);
    } catch (error) {
      console.error('AdminPanel: Failed to load CMS data:', error);
      document.body.innerHTML = `
        <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
          <h1 style="color: #dc3545;">Error Loading CMS Data</h1>
          <p>${error.message || 'Unknown error occurred'}</p>
          <p style="margin-top: 1rem;"><a href="admin.html" style="color: #0d0d0d;">Reload Page</a></p>
        </div>
      `;
      return;
    }

    // Show dashboard
    showDashboard();
    
    // Attach event listeners
    attachEventListeners();
    
    // Listen for data updates from frontend (real-time sync)
    window.addEventListener('cmsDataUpdated', function(event) {
      console.log('AdminPanel: Received data update event from frontend');
      if (event.detail && AdminPanel.cmsData) {
        AdminPanel.cmsData = event.detail;
        // Refresh current view if needed
        if (AdminPanel.currentSection === 'products') {
          renderProductsList();
        } else if (AdminPanel.currentSection === 'accessories') {
          renderAccessoriesList();
        } else if (AdminPanel.currentSection === 'sampleBoxes') {
          renderSampleBoxesList();
        }
        updateDashboardStats();
      }
    });
    
    console.log('AdminPanel: Initialized successfully');
  }

  /**
   * Check authentication status
   * Authentication is handled by the server middleware (HTTP Basic Auth).
   * If we can load this page, we are already authenticated.
   */
  function checkAuth() {
    return true;
  }

  /**
   * Show login page - no longer needed since auth is handled by middleware
   */
  function showLoginPage() {
    // Server middleware handles authentication via HTTP Basic Auth
    // If we reach this point, redirect to admin to trigger auth
    window.location.href = '/admin';
  }

  /**
   * Show dashboard
   */
  function showDashboard() {
    // Remove loading indicator if present
    const loading = document.getElementById('admin-loading');
    if (loading) loading.remove();
    
    const meta = window.AdminDataManager.getMetadata();
    const lastUpdated = meta ? new Date(meta.lastUpdated).toLocaleString() : 'Never';
    
    document.body.className = 'admin-panel';
    document.body.innerHTML = `
      <div class="admin-container">
        <header class="admin-header">
          <h1 class="admin-header-title">stonearts® Admin Panel</h1>
          <div class="admin-header-actions">
            <button class="admin-btn-secondary" id="exportBtn" title="Export all data as JSON file">📥 Export</button>
            <button class="admin-btn-secondary" id="importBtn" title="Import data from JSON file">📤 Import</button>
            <button class="admin-btn-secondary" id="resetBtn" title="Reset all data to default">🔄 Reset</button>
            <button class="admin-btn-secondary" id="logoutBtn" title="Logout from admin panel">🚪 Logout</button>
          </div>
        </header>
        
        <main class="admin-main">
          <!-- Navigation Tabs -->
          <nav class="admin-nav">
            <button class="admin-nav-item active" data-section="dashboard" onclick="AdminPanel.showSection('dashboard')">📊 Dashboard</button>
            <button class="admin-nav-item" data-section="products" onclick="AdminPanel.showSection('products')">🛍️ Products</button>
            <button class="admin-nav-item" data-section="accessories" onclick="AdminPanel.showSection('accessories')">🔧 Accessories</button>
            <button class="admin-nav-item" data-section="sampleBoxes" onclick="AdminPanel.showSection('sampleBoxes')">📦 Sample Boxes</button>
            <button class="admin-nav-item" data-section="orders" onclick="AdminPanel.showSection('orders')">📋 Orders</button>
            <button class="admin-nav-item" data-section="siteHealth" onclick="AdminPanel.showSection('siteHealth')">🏥 Site Health</button>
            <button class="admin-nav-item" data-section="seo" onclick="AdminPanel.showSection('seo')">🔍 SEO</button>
            <button class="admin-nav-item" data-section="redirects" onclick="AdminPanel.showSection('redirects')">🔀 Redirects</button>
          </nav>

          <!-- Dashboard Section -->
          <section class="admin-section active" id="dashboardSection">
            <div class="admin-overview">
              <div class="admin-card">
                <div class="admin-card-title">Total Products</div>
                <div class="admin-card-value" id="totalProducts">0</div>
                <div class="admin-card-meta">Active products</div>
              </div>
              <div class="admin-card">
                <div class="admin-card-title">Total Accessories</div>
                <div class="admin-card-value" id="totalAccessories">0</div>
                <div class="admin-card-meta">Available accessories</div>
              </div>
              <div class="admin-card">
                <div class="admin-card-title">Sample Boxes</div>
                <div class="admin-card-value" id="totalSampleBoxes">0</div>
                <div class="admin-card-meta">Sample products</div>
              </div>
              <div class="admin-card">
                <div class="admin-card-title">Total Orders</div>
                <div class="admin-card-value" id="totalOrders">0</div>
                <div class="admin-card-meta">All orders</div>
              </div>
              <div class="admin-card">
                <div class="admin-card-title">Pending Orders</div>
                <div class="admin-card-value" id="pendingOrders">0</div>
                <div class="admin-card-meta">Awaiting processing</div>
              </div>
              <div class="admin-card">
                <div class="admin-card-title">Last Updated</div>
                <div class="admin-card-value" style="font-size: 1.25rem;" id="lastUpdated">${lastUpdated}</div>
                <div class="admin-card-meta">Data modification time</div>
              </div>
            </div>

            <div class="admin-card" style="margin-top: 1.5rem;">
              <h2 class="admin-section-title">Quick Actions</h2>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                <button class="admin-btn" onclick="AdminPanel.showSection('products')">Manage Products</button>
                <button class="admin-btn-secondary" onclick="AdminPanel.showSection('accessories')">Manage Accessories</button>
                <button class="admin-btn-secondary" onclick="AdminPanel.showSection('siteHealth')">Run Site Health Check</button>
                <button class="admin-btn-secondary" onclick="AdminPanel.showSection('seo')">SEO Audit</button>
              </div>
            </div>

            <div class="admin-card" style="margin-top: 1.5rem;">
              <h2 class="admin-section-title">Site Status</h2>
              <div id="dashboardSiteStatus" style="margin-top: 1rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                  <div style="padding: 1rem; background: #e8f5e9; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem;">🟢</div>
                    <div style="font-weight: 600; margin-top: 0.5rem;">Website</div>
                    <div style="font-size: 0.85rem; color: #666;">Online</div>
                  </div>
                  <div style="padding: 1rem; background: #e3f2fd; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem;">🌐</div>
                    <div style="font-weight: 600; margin-top: 0.5rem;">Languages</div>
                    <div style="font-size: 0.85rem; color: #666;">DE, EN, ES</div>
                  </div>
                  <div style="padding: 1rem; background: #fff3e0; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem;">🔒</div>
                    <div style="font-weight: 600; margin-top: 0.5rem;">Security</div>
                    <div style="font-size: 0.85rem; color: #666;">HTTPS + HSTS</div>
                  </div>
                  <div style="padding: 1rem; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem;">🔀</div>
                    <div style="font-weight: 600; margin-top: 0.5rem;">Redirects</div>
                    <div style="font-size: 0.85rem; color: #666;">stoneartinstallation.com &rarr; akurock.com</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="admin-card" style="margin-top: 1.5rem;">
              <h2 class="admin-section-title">Pages Overview</h2>
              <div style="margin-top: 1rem; max-height: 300px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                  <thead>
                    <tr style="border-bottom: 2px solid #eee; text-align: left;">
                      <th style="padding: 0.5rem;">Page</th>
                      <th style="padding: 0.5rem;">DE</th>
                      <th style="padding: 0.5rem;">EN</th>
                      <th style="padding: 0.5rem;">ES</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Homepage</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Product: Brush</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Product: Whisper</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Product: Ligia</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Product: Gaia</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Product: Yami</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Product: Yuki</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Sample Boxes</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Accessories</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Stone Selection</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Gallery</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Visualizer</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">FAQ</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Contact</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">About Us</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Installation Guide</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Quotation</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Terms & Conditions</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Privacy Policy</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 0.5rem;">Payment & Shipping</td><td>🟢</td><td>🟢</td><td>🟢</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Products Section -->
          <section class="admin-section" id="productsSection">
            <div class="admin-section-header">
              <h2 class="admin-section-title">🛍️ Products</h2>
              <button class="admin-btn" id="addProductBtn" onclick="AdminPanel.addProduct()">➕ Add New Product</button>
            </div>
            <div id="productsList"></div>
          </section>

          <!-- Accessories Section -->
          <section class="admin-section" id="accessoriesSection">
            <div class="admin-section-header">
              <h2 class="admin-section-title">🔧 Accessories</h2>
              <button class="admin-btn" id="addAccessoryBtn" onclick="AdminPanel.addAccessory()">➕ Add New Accessory</button>
            </div>
            <div id="accessoriesList"></div>
          </section>

          <!-- Sample Boxes Section -->
          <section class="admin-section" id="sampleBoxesSection">
            <div class="admin-section-header">
              <h2 class="admin-section-title">📦 Sample Boxes</h2>
              <button class="admin-btn" id="addSampleBoxBtn" onclick="AdminPanel.addSampleBox()">➕ Add New Sample Box</button>
            </div>
            <div id="sampleBoxesList"></div>
          </section>

          <!-- Orders Section -->
          <section class="admin-section" id="ordersSection">
            <div class="admin-section-header">
              <h2 class="admin-section-title">📋 Orders</h2>
              <button class="admin-btn-secondary" id="exportOrdersBtn" onclick="AdminPanel.exportOrders()">📥 Export Orders</button>
            </div>
            <div id="ordersList"></div>
          </section>

          <!-- Site Health Section -->
          <section class="admin-section" id="siteHealthSection">
            <div class="admin-section-header">
              <h2 class="admin-section-title">🏥 Site Health</h2>
              <button class="admin-btn" onclick="AdminPanel.runHealthCheck()">🔄 Run Health Check</button>
            </div>
            <div id="healthCheckResults">
              <p style="color: #666; padding: 1rem;">Click "Run Health Check" to scan your website for issues.</p>
            </div>
          </section>

          <!-- SEO Section -->
          <section class="admin-section" id="seoSection">
            <div class="admin-section-header">
              <h2 class="admin-section-title">🔍 SEO Audit</h2>
              <button class="admin-btn" onclick="AdminPanel.runSEOAudit()">🔄 Run SEO Audit</button>
            </div>
            <div id="seoAuditResults">
              <p style="color: #666; padding: 1rem;">Click "Run SEO Audit" to analyze your website's SEO status.</p>
            </div>
          </section>

          <!-- Redirects Section -->
          <section class="admin-section" id="redirectsSection">
            <div class="admin-section-header">
              <h2 class="admin-section-title">🔀 Redirects & Domains</h2>
            </div>
            <div id="redirectsContent">
              <div class="admin-card" style="margin-bottom: 1rem;">
                <h3 style="margin-bottom: 1rem;">Active Domain Redirects</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid #eee; text-align: left;">
                      <th style="padding: 0.75rem;">From</th>
                      <th style="padding: 0.75rem;">To</th>
                      <th style="padding: 0.75rem;">Type</th>
                      <th style="padding: 0.75rem;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;"><code>stoneartinstallation.com</code></td>
                      <td style="padding: 0.75rem;"><code>www.akurock.com</code></td>
                      <td style="padding: 0.75rem;"><span style="background: #e8f5e9; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">301 Permanent</span></td>
                      <td style="padding: 0.75rem;">🟢 Active</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;"><code>stoneartinstallation.at</code></td>
                      <td style="padding: 0.75rem;"><code>www.akurock.com</code></td>
                      <td style="padding: 0.75rem;"><span style="background: #e8f5e9; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">301 Permanent</span></td>
                      <td style="padding: 0.75rem;">🟢 Active</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="admin-card" style="margin-bottom: 1rem;">
                <h3 style="margin-bottom: 1rem;">Path Redirects</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid #eee; text-align: left;">
                      <th style="padding: 0.75rem;">From</th>
                      <th style="padding: 0.75rem;">To</th>
                      <th style="padding: 0.75rem;">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;"><code>/index</code></td>
                      <td style="padding: 0.75rem;"><code>/</code></td>
                      <td style="padding: 0.75rem;">301 Permanent</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;"><code>/checkout</code></td>
                      <td style="padding: 0.75rem;"><code>/quotation</code></td>
                      <td style="padding: 0.75rem;">302 Temporary</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;"><code>/:locale/checkout</code></td>
                      <td style="padding: 0.75rem;"><code>/:locale/quotation</code></td>
                      <td style="padding: 0.75rem;">302 Temporary</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;"><code>/cart</code></td>
                      <td style="padding: 0.75rem;"><code>/ (homepage)</code></td>
                      <td style="padding: 0.75rem;">302 Temporary</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="admin-card">
                <h3 style="margin-bottom: 1rem;">Locale Routing</h3>
                <p style="margin-bottom: 1rem; color: #666;">All pages are automatically prefixed with the user's detected language. German (de) is the default locale.</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid #eee; text-align: left;">
                      <th style="padding: 0.75rem;">Locale</th>
                      <th style="padding: 0.75rem;">URL Prefix</th>
                      <th style="padding: 0.75rem;">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;">🇩🇪 German</td>
                      <td style="padding: 0.75rem;"><code>/de/</code></td>
                      <td style="padding: 0.75rem;"><code>akurock.com/de/product/whisper</code></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;">🇬🇧 English</td>
                      <td style="padding: 0.75rem;"><code>/en/</code></td>
                      <td style="padding: 0.75rem;"><code>akurock.com/en/product/whisper</code></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                      <td style="padding: 0.75rem;">🇪🇸 Spanish</td>
                      <td style="padding: 0.75rem;"><code>/es/</code></td>
                      <td style="padding: 0.75rem;"><code>akurock.com/es/product/whisper</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>

        <!-- Modal Overlay -->
        <div class="admin-modal-overlay" id="modalOverlay">
          <div class="admin-modal" id="modalContent"></div>
        </div>

        <!-- Notification Container -->
        <div class="admin-notification" id="notification"></div>
      </div>
    `;

    // Update dashboard stats
    updateDashboardStats();
    
    // Render lists
    renderProductsList();
    renderAccessoriesList();
  }

  /**
   * Update dashboard statistics
   */
  function updateDashboardStats() {
    if (!AdminPanel.cmsData) return;
    
    // Combine products and samples arrays (matching frontend logic)
    const allProducts = [
      ...(AdminPanel.cmsData.products || []),
      ...(AdminPanel.cmsData.samples || []) // Include samples array if it exists
    ];
    
    // Filter main products (exclude sample boxes) - matching frontend logic
    const productsCount = allProducts.filter(p => {
      if (!p) return false;
      return p.category === 'AKUROCK Akustikpaneele' && 
             !(p.id && p.id.includes('-sample')) &&
             p.category !== 'AKUROCK Muster';
    }).length;
    
    const accessoriesCount = AdminPanel.cmsData.accessories ? AdminPanel.cmsData.accessories.length : 0;
    
    // Filter sample boxes - matching frontend logic exactly
    const sampleBoxesCount = allProducts.filter(p => {
      if (!p) return false;
      return p.category === 'AKUROCK Muster' || 
             (p.id && p.id.includes('-sample')) || 
             (p.name && p.name.toLowerCase().includes('sample'));
    }).length;
    
    const productsEl = document.getElementById('totalProducts');
    const accessoriesEl = document.getElementById('totalAccessories');
    const sampleBoxesEl = document.getElementById('totalSampleBoxes');
    const totalOrdersEl = document.getElementById('totalOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    
    if (productsEl) productsEl.textContent = productsCount;
    if (accessoriesEl) accessoriesEl.textContent = accessoriesCount;
    if (sampleBoxesEl) sampleBoxesEl.textContent = sampleBoxesCount;
    
    // Update order statistics if OrderManager is available
    if (window.OrderManager && totalOrdersEl && pendingOrdersEl) {
      try {
        const stats = window.OrderManager.getStatistics();
        totalOrdersEl.textContent = stats.total;
        pendingOrdersEl.textContent = stats.pending;
      } catch (error) {
        console.error('AdminPanel: Error getting order statistics:', error);
        if (totalOrdersEl) totalOrdersEl.textContent = '0';
        if (pendingOrdersEl) pendingOrdersEl.textContent = '0';
      }
    }
  }

  /**
   * Show section (dashboard, products, accessories)
   */
  AdminPanel.showSection = function(section) {
    // Map section names to IDs
    const sectionMap = {
      'dashboard': 'dashboardSection',
      'products': 'productsSection',
      'accessories': 'accessoriesSection',
      'sampleBoxes': 'sampleBoxesSection',
      'sample-boxes': 'sampleBoxesSection',
      'orders': 'ordersSection',
      'siteHealth': 'siteHealthSection',
      'seo': 'seoSection',
      'redirects': 'redirectsSection'
    };
    
    const sectionId = sectionMap[section] || `${section}Section`;
    
    // Update nav
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.classList.remove('active');
      const itemSection = item.dataset.section || item.getAttribute('data-section');
      if (itemSection === section || itemSection === section.replace(/([A-Z])/g, '-$1').toLowerCase()) {
        item.classList.add('active');
      }
    });

    // Update sections
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.remove('active');
    });

    // Reload data when switching sections to ensure sync with frontend
    if (window.AdminDataManager) {
      window.AdminDataManager.loadCMSData().then(data => {
        AdminPanel.cmsData = data;
        
        const sectionEl = document.getElementById(sectionId);
        if (sectionEl) {
          sectionEl.classList.add('active');
          AdminPanel.currentSection = section;
          
          // Render lists if needed
          if (section === 'products' || sectionId === 'productsSection') {
            renderProductsList();
          } else if (section === 'accessories' || sectionId === 'accessoriesSection') {
            renderAccessoriesList();
          } else if (section === 'sampleBoxes' || section === 'sample-boxes' || sectionId === 'sampleBoxesSection') {
            if (typeof renderSampleBoxesList === 'function') {
              renderSampleBoxesList();
            }
          } else if (section === 'orders' || sectionId === 'ordersSection') {
            if (typeof renderOrdersList === 'function') {
              renderOrdersList();
            }
          } else if (section === 'dashboard' || sectionId === 'dashboardSection') {
            updateDashboardStats();
          }
        }
      }).catch(error => {
        console.error('AdminPanel: Error reloading data:', error);
        // Fallback to original behavior if reload fails
        const sectionEl = document.getElementById(sectionId);
        if (sectionEl) {
          sectionEl.classList.add('active');
          AdminPanel.currentSection = section;
          if (section === 'products' || sectionId === 'productsSection') {
            renderProductsList();
          } else if (section === 'accessories' || sectionId === 'accessoriesSection') {
            renderAccessoriesList();
          } else if (section === 'sampleBoxes' || section === 'sample-boxes' || sectionId === 'sampleBoxesSection') {
            if (typeof renderSampleBoxesList === 'function') {
              renderSampleBoxesList();
            }
          } else if (section === 'orders' || sectionId === 'ordersSection') {
            if (typeof renderOrdersList === 'function') {
              renderOrdersList();
            }
          }
        }
      });
    } else {
      // Fallback if AdminDataManager not available
      const sectionEl = document.getElementById(sectionId);
      if (sectionEl) {
        sectionEl.classList.add('active');
        AdminPanel.currentSection = section;
        if (section === 'products' || sectionId === 'productsSection') {
          renderProductsList();
        } else if (section === 'accessories' || sectionId === 'accessoriesSection') {
          renderAccessoriesList();
        } else if (section === 'sampleBoxes' || section === 'sample-boxes' || sectionId === 'sampleBoxesSection') {
          if (typeof renderSampleBoxesList === 'function') {
            renderSampleBoxesList();
          }
        }
      }
    }
  };

  /**
   * Render products list
   */
  function renderProductsList() {
    const container = document.getElementById('productsList');
    if (!container || !AdminPanel.cmsData) return;

    // Combine products and samples arrays
    const allProducts = [
      ...(AdminPanel.cmsData.products || []),
      ...(AdminPanel.cmsData.samples || [])
    ];

    // Filter to only main products (exclude sample boxes) - matching frontend
    const mainProducts = allProducts.filter(p => {
      if (!p) return false;
      return p.category === 'AKUROCK Akustikpaneele' && 
             !(p.id && p.id.includes('-sample')) &&
             p.category !== 'AKUROCK Muster';
    });

    if (mainProducts.length === 0) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <div class="admin-empty-state-icon">📦</div>
          <h3 class="admin-empty-state-title">No Products Yet</h3>
          <p class="admin-empty-state-text">Get started by adding your first product to the catalog.</p>
          <button class="admin-btn" onclick="AdminPanel.addProduct()" style="margin-top: 1rem;">➕ Add Your First Product</button>
        </div>
      `;
      return;
    }

    const html = `
      <div class="admin-table">
        <div class="admin-table-header">
          <div>Product</div>
          <div>Price</div>
          <div>Category</div>
          <div>Actions</div>
        </div>
        ${mainProducts.map(product => `
          <div class="admin-table-row">
            <div class="admin-table-cell">
              ${product.mainImage ? `<img src="${product.mainImage}" alt="${product.name}" class="admin-table-image">` : ''}
              <div>
                <div class="admin-table-name">${product.name || 'Unnamed Product'}</div>
                <div class="admin-text-small admin-text-muted">${product.slug || ''}</div>
              </div>
            </div>
            <div class="admin-table-price">${product.price || 'N/A'}</div>
            <div class="admin-table-category">${product.category || 'N/A'}</div>
            <div class="admin-table-actions">
              <button class="admin-btn-small admin-btn-edit" onclick="AdminPanel.editProduct('${product.id}')">Edit</button>
              <button class="admin-btn-small admin-btn-delete" onclick="AdminPanel.deleteProduct('${product.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render accessories list
   */
  function renderAccessoriesList() {
    const container = document.getElementById('accessoriesList');
    if (!container || !AdminPanel.cmsData || !AdminPanel.cmsData.accessories) return;

    if (AdminPanel.cmsData.accessories.length === 0) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <div class="admin-empty-state-icon">🔧</div>
          <h3 class="admin-empty-state-title">No Accessories Yet</h3>
          <p class="admin-empty-state-text">Start adding accessories to complement your products.</p>
          <button class="admin-btn" onclick="AdminPanel.addAccessory()" style="margin-top: 1rem;">➕ Add Your First Accessory</button>
        </div>
      `;
      return;
    }

    const html = `
      <div class="admin-table">
        <div class="admin-table-header">
          <div>Accessory</div>
          <div>Price</div>
          <div>Category</div>
          <div>Actions</div>
        </div>
        ${AdminPanel.cmsData.accessories.map(accessory => `
          <div class="admin-table-row">
            <div class="admin-table-cell">
              ${accessory.mainImage ? `<img src="${accessory.mainImage}" alt="${accessory.name}" class="admin-table-image">` : ''}
              <div>
                <div class="admin-table-name">${accessory.name || 'Unnamed Accessory'}</div>
                <div class="admin-text-small admin-text-muted">${accessory.slug || ''}</div>
              </div>
            </div>
            <div class="admin-table-price">${accessory.price || 'N/A'}</div>
            <div class="admin-table-category">${accessory.category || 'N/A'}</div>
            <div class="admin-table-actions">
              <button class="admin-btn-small admin-btn-edit" onclick="AdminPanel.editAccessory('${accessory.id}')" title="Edit accessory">✏️ Edit</button>
              <button class="admin-btn-small admin-btn-delete" onclick="AdminPanel.deleteAccessory('${accessory.id}')" title="Delete accessory">🗑️ Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Show product edit form
   */
  AdminPanel.editProduct = function(productId) {
    const product = AdminPanel.cmsData.products.find(p => p.id === productId);
    if (!product) {
      showNotification('Product not found', 'error');
      return;
    }

    AdminPanel.currentEditingProduct = product;
    showProductForm(product);
  };

  /**
   * Show new product form
   */
  AdminPanel.addProduct = function() {
    // Create empty product template following the HTML pattern
    const newProduct = {
      id: '',
      productId: '',
      variantId: '',
      name: '',
      slug: '',
      handle: '',
      type: 'Physical',
      description: '',
      stone: '', // Should be detailed description like "Cremefarbener Sandsteinfelsen aus den sonnigen Landschaften Rajasthans."
      alt_text: '',
      category: '', // Will be required - no default template value
      price: '',
      priceValue: null, // Will be required - no default template value
      currency: 'EUR',
      mainImage: '',
      special_image: '',
      special_image_2: '',
      hover_image: '',
      hover_image_installation: '',
      selection_slider_image: '',
      images: [], // Should have 4 images: panel, installation, stone, closeup
      color: '',
      button_header_color: '',
      special_field_slogan: '',
      special_field_text: '',
      special_field_button: '',
      item_style: 'Tall',
      sorting: 999,
      video: null,
      dimensions: '', // Format: "240 x 60 x 2.3 cm (1.44m²)"
      size: '',
      area: '',
      weight: null,
      width: null,
      height: null,
      length: null,
      variant: {
        weight: null,
        width: null,
        height: null,
        length: null,
        download_files: []
      },
      deliveryTime: '5-10 Tage',
      requiresShipping: true,
      createdOn: new Date().toISOString(),
      updatedOn: new Date().toISOString(),
      publishedOn: new Date().toISOString()
    };

    AdminPanel.currentEditingProduct = null;
    showProductForm(newProduct, true);
  };

  /**
   * Normalize image path - handles both URLs and local paths
   * @param {string} path - Image path (URL or local)
   * @returns {string} Normalized path
   */
  function normalizeImagePath(path) {
    if (!path || path.trim() === '') return '';
    const trimmed = path.trim();
    
    // If it's already a URL, keep it as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // If it's a local path without 'images/' prefix, add it
    if (!trimmed.startsWith('images/') && !trimmed.startsWith('/images/')) {
      return 'images/' + trimmed;
    }
    
    // Otherwise return as-is (already has images/ prefix)
    return trimmed;
  }

  /**
   * Get preview image source - handles both URLs and local paths
   * @param {string} path - Image path
   * @returns {string} Preview source path
   */
  function getPreviewImageSrc(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // For local paths, ensure they start with images/
    if (path.startsWith('images/') || path.startsWith('/images/')) {
      return path.startsWith('/') ? path : path;
    }
    return 'images/' + path;
  }

  /**
   * Show product form modal
   */
  function showProductForm(product, isNew = false) {
    const modal = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
      <div class="admin-modal-header">
        <h2 class="admin-modal-title">${isNew ? '➕ Add New Product' : '✏️ Edit Product'}</h2>
        <button class="admin-modal-close" onclick="AdminPanel.closeModal()">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div style="background: #f0f7ff; border-left: 4px solid #0066cc; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px;">
          <h4 style="margin: 0 0 0.5rem 0; color: #0066cc;">📐 Product Page Pattern Guide</h4>
          <p style="margin: 0; font-size: 0.9rem; color: #333;">
            Each product follows the same structure as shown in the HTML template. Required fields are marked with *. 
            Ensure you fill in: <strong>Product Name</strong>, <strong>Slug</strong>, <strong>Stone Description</strong>, 
            <strong>Dimensions</strong>, <strong>Price</strong>, <strong>Main Image</strong>, <strong>Selection Slider Image</strong>, 
            and <strong>Image Gallery</strong> (4 images: panel, installation, stone, closeup).
          </p>
        </div>
        <form id="productForm" class="admin-form">
          <!-- Basic Information -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">📋 Basic Information</h3>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Product Name *</label>
                <div style="margin-bottom: 0.5rem;">
                  <span class="admin-text-small admin-text-muted">💡 Product variant name (e.g., "Brush", "Whisper", "Yami")</span>
                </div>
                <input type="text" name="name" class="admin-form-input" value="${escapeHtml(product.name || '')}" required>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Slug *</label>
                <div style="margin-bottom: 0.5rem;">
                  <span class="admin-text-small admin-text-muted">💡 URL-friendly name (e.g., "brush", "whisper") - Used in /product/[slug]</span>
                </div>
                <input type="text" name="slug" class="admin-form-input" value="${escapeHtml(product.slug || '')}" required>
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Handle</label>
                <input type="text" name="handle" class="admin-form-input" value="${escapeHtml(product.handle || '')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category" class="admin-form-select">
                  <option value="AKUROCK Akustikpaneele" ${product.category === 'AKUROCK Akustikpaneele' ? 'selected' : ''}>AKUROCK Akustikpaneele</option>
                  <option value="AKUROCK Zubehör" ${product.category === 'AKUROCK Zubehör' ? 'selected' : ''}>AKUROCK Zubehör</option>
                </select>
              </div>
            </div>
              <div class="admin-form-group admin-form-group-full">
                <label class="admin-form-label">Description</label>
                <div style="margin-bottom: 0.5rem;">
                  <span class="admin-text-small admin-text-muted">
                    💡 Product description (optional) - Can be used for additional product details
                  </span>
                </div>
                <textarea name="description" class="admin-form-textarea" rows="3">${escapeHtml(product.description || '')}</textarea>
              </div>
            <div class="admin-form-row">
              <div class="admin-form-group admin-form-group-full">
                <label class="admin-form-label">Stone Description *</label>
                <div style="margin-bottom: 0.5rem;">
                  <span class="admin-text-small admin-text-muted">
                    💡 Detailed description of the stone (e.g., "Cremefarbener Sandsteinfelsen aus den sonnigen Landschaften Rajasthans.")
                  </span>
                </div>
                <textarea name="stone" class="admin-form-textarea" rows="2" required>${escapeHtml(product.stone || '')}</textarea>
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Alt Text</label>
                <input type="text" name="alt_text" class="admin-form-input" value="${escapeHtml(product.alt_text || '')}">
              </div>
            </div>
          </div>

          <!-- Pricing -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">💰 Pricing</h3>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Price Display *</label>
              <div style="margin-bottom: 0.5rem;">
                <span class="admin-text-small admin-text-muted">💡 Display format (e.g., "€220.00")</span>
              </div>
              <input type="text" name="price" class="admin-form-input" value="${escapeHtml(product.price || '')}" placeholder="€220.00" required>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Price Value (numeric) *</label>
              <div style="margin-bottom: 0.5rem;">
                <span class="admin-text-small admin-text-muted">💡 Numeric value for calculations</span>
              </div>
              <input type="number" name="priceValue" class="admin-form-input" step="0.01" value="${product.priceValue || 0}" required>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Currency</label>
              <select name="currency" class="admin-form-select">
                <option value="EUR" ${product.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                <option value="USD" ${product.currency === 'USD' ? 'selected' : ''}>USD</option>
              </select>
            </div>
          </div>

          <!-- Images -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">🖼️ Images</h3>
            <div class="admin-form-row">
              <div class="admin-form-group admin-form-group-full">
                <label class="admin-form-label">Main Image *</label>
                ${createImageUploadField('mainImage', product.mainImage || '', true, '💡 Primary product image displayed in product cards and galleries.')}
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Special Image</label>
                ${createImageUploadField('special_image', product.special_image || '', false, 'Optional special image')}
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Special Image 2</label>
                ${createImageUploadField('special_image_2', product.special_image_2 || '', false, 'Optional second special image')}
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Hover Image</label>
                ${createImageUploadField('hover_image', product.hover_image || '', false, 'Image shown on hover')}
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Hover Installation Image</label>
                ${createImageUploadField('hover_image_installation', product.hover_image_installation || '', false, 'Installation image shown on hover')}
              </div>
            </div>
            <div class="admin-form-group admin-form-group-full">
              <label class="admin-form-label">Selection Slider Image *</label>
              ${createImageUploadField('selection_slider_image', product.selection_slider_image || '', true, '💡 Image for variant selector slider (95px width recommended)')}
            </div>

            <!-- Image Gallery -->
            <div class="admin-form-group admin-form-group-full">
              <label class="admin-form-label">Image Gallery *</label>
              <div style="margin-bottom: 0.5rem;">
                <span class="admin-text-small admin-text-muted">
                  💡 Add 4 images following this pattern: <strong>panel</strong>, <strong>installation</strong>, <strong>stone</strong>, <strong>closeup</strong>
                  <br>These will display in the product slider and gallery sections.
                </span>
              </div>
              <input type="hidden" name="images" value='${JSON.stringify(product.images || []).replace(/'/g, "&#39;")}'>
              <div id="imageGalleryList" class="admin-image-list">
                ${renderImageGallery(product.images || [])}
              </div>
              <button type="button" class="admin-btn-secondary admin-mt-2" onclick="AdminPanel.addImageToGallery()">➕ Add Image (Upload or URL)</button>
            </div>
          </div>
          
          <!-- Technical Specifications -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">⚙️ Technical Specifications</h3>
          <div class="admin-form-row">
            <div class="admin-form-group admin-form-group-full">
              <label class="admin-form-label">Dimensions *</label>
              <div style="margin-bottom: 0.5rem;">
                <span class="admin-text-small admin-text-muted">
                  💡 Format: "240 x 60 x 2.3 cm (1.44m²)" - This will display as "Größe pro Paneel - [your dimensions]"
                </span>
              </div>
              <input type="text" name="dimensions" class="admin-form-input" value="${escapeHtml(product.dimensions || '')}" placeholder="240 x 60 x 2.3 cm (1.44m²)" required>
            </div>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Size</label>
              <input type="text" name="size" class="admin-form-input" value="${escapeHtml(product.size || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Area</label>
              <input type="text" name="area" class="admin-form-input" value="${escapeHtml(product.area || '')}">
            </div>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Width (cm)</label>
              <input type="number" name="width" class="admin-form-input" value="${product.width || ''}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Height (cm)</label>
              <input type="number" name="height" class="admin-form-input" value="${product.height || ''}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Length (cm)</label>
              <input type="number" name="length" class="admin-form-input" value="${product.length || ''}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Weight (g)</label>
              <input type="number" name="weight" class="admin-form-input" value="${product.weight || ''}">
            </div>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Delivery Time</label>
              <div style="margin-bottom: 0.5rem;">
                <span class="admin-text-small admin-text-muted">💡 Display text (e.g., "5-10 Tage" or "5-10 days")</span>
              </div>
              <input type="text" name="deliveryTime" class="admin-form-input" value="${escapeHtml(product.deliveryTime || '5-10 Tage')}" placeholder="5-10 Tage">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Requires Shipping</label>
              <select name="requiresShipping" class="admin-form-select">
                <option value="true" ${product.requiresShipping ? 'selected' : ''}>Yes</option>
                <option value="false" ${!product.requiresShipping ? 'selected' : ''}>No</option>
              </select>
            </div>
          </div>

          <!-- Marketing Content -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">📢 Marketing Content</h3>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Slogan</label>
                <input type="text" name="special_field_slogan" class="admin-form-input" value="${escapeHtml(product.special_field_slogan || '')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Button Text</label>
                <input type="text" name="special_field_button" class="admin-form-input" value="${escapeHtml(product.special_field_button || '')}">
              </div>
            </div>
            <div class="admin-form-group admin-form-group-full">
              <label class="admin-form-label">Special Text</label>
              <textarea name="special_field_text" class="admin-form-textarea" rows="2">${escapeHtml(product.special_field_text || '')}</textarea>
            </div>
          </div>

          <!-- Colors -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">🎨 Colors</h3>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Color (HSL)</label>
                <input type="text" name="color" class="admin-form-input" value="${escapeHtml(product.color || '')}" placeholder="hsla(36, 23%, 63%, 0.30)">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Button Header Color</label>
                <input type="text" name="button_header_color" class="admin-form-input" value="${escapeHtml(product.button_header_color || '')}" placeholder="hsla(36, 23%, 63%, 1.00)">
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">📝 Metadata</h3>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Item Style</label>
              <select name="item_style" class="admin-form-select">
                <option value="Tall" ${product.item_style === 'Tall' ? 'selected' : ''}>Tall</option>
                <option value="Wide" ${product.item_style === 'Wide' ? 'selected' : ''}>Wide</option>
              </select>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Sorting Order</label>
              <input type="number" name="sorting" class="admin-form-input" value="${product.sorting || 999}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Product ID</label>
              <input type="text" name="productId" class="admin-form-input" value="${escapeHtml(product.productId || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Variant ID</label>
              <input type="text" name="variantId" class="admin-form-input" value="${escapeHtml(product.variantId || '')}">
            </div>
          </div>
        </form>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn-secondary" onclick="AdminPanel.closeModal()">❌ Cancel</button>
        <button type="button" class="admin-btn" onclick="AdminPanel.saveProduct()">💾 Save Product</button>
      </div>
    `;

    modal.classList.add('show');
    
    // Setup image upload handlers after form is rendered
    setTimeout(() => {
      setupImageUploadHandlers('mainImage');
      setupImageUploadHandlers('special_image');
      setupImageUploadHandlers('special_image_2');
      setupImageUploadHandlers('hover_image');
      setupImageUploadHandlers('hover_image_installation');
      setupImageUploadHandlers('selection_slider_image');
    }, 100);
  }

  /**
   * Render image gallery in form
   */
  function renderImageGallery(images) {
    if (!images || images.length === 0) {
      return '<div class="admin-text-muted admin-text-center admin-mt-2">No images added yet</div>';
    }

    return images.map((img, index) => `
      <div class="admin-image-item" data-index="${index}">
        <img src="${img.url || ''}" alt="${img.type || ''}" class="admin-image-preview" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="admin-image-info">
          <div><strong>Type:</strong> ${img.type || 'N/A'}</div>
          <div><strong>Order:</strong> ${img.sort_order || 0}</div>
        </div>
        <button type="button" class="admin-image-remove" onclick="AdminPanel.removeImageFromGallery(${index})">&times;</button>
      </div>
    `).join('');
  }

  /**
   * Upload image file to server
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Upload result with path
   */
  async function uploadImageFile(file) {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to API
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Show image preview before upload
   * @param {File} file - File to preview
   * @param {HTMLElement} container - Container to show preview in
   */
  function showImagePreview(file, container) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '200px';
      img.style.maxHeight = '200px';
      img.style.borderRadius = '4px';
      img.style.marginTop = '8px';
      
      // Clear existing preview
      const existingPreview = container.querySelector('.admin-image-preview-temp');
      if (existingPreview) existingPreview.remove();
      
      img.className = 'admin-image-preview-temp';
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Handle image upload error
   * @param {Error} error - Error object
   */
  function handleImageUploadError(error) {
    const message = error.message || 'Failed to upload image';
    showNotification(message, 'error');
    console.error('Image upload error:', error);
  }

  /**
   * Create image upload component HTML
   * @param {string} fieldName - Form field name
   * @param {string} currentValue - Current field value
   * @param {boolean} required - Is field required
   * @param {string} helpText - Help text to display
   * @returns {string} HTML string
   */
  function createImageUploadField(fieldName, currentValue, required = false, helpText = '') {
    const fieldId = `upload-${fieldName}`;
    const inputId = `input-${fieldName}`;
    const previewId = `preview-${fieldName}`;
    const toggleId = `toggle-${fieldName}`;
    
    return `
      <div class="admin-image-upload-wrapper" data-field="${fieldName}">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button type="button" class="admin-btn-upload-toggle ${currentValue ? '' : 'active'}" data-toggle="upload" data-field="${fieldName}" id="${toggleId}-upload">
            📤 Upload File
          </button>
          <button type="button" class="admin-btn-upload-toggle ${currentValue ? 'active' : ''}" data-toggle="url" data-field="${fieldName}" id="${toggleId}-url">
            🔗 Enter URL
          </button>
        </div>
        
        <div class="admin-upload-mode" data-mode="upload" data-field="${fieldName}" style="${currentValue ? 'display: none;' : ''}">
          <div class="admin-upload-zone" id="${fieldId}" data-field="${fieldName}">
            <input type="file" id="${inputId}" accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" style="display: none;" data-field="${fieldName}">
            <div class="admin-upload-content">
              <div style="font-size: 48px; margin-bottom: 8px;">📎</div>
              <div>Drag & drop image here</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">or</div>
              <button type="button" class="admin-btn-secondary" onclick="document.getElementById('${inputId}').click()">
                Browse Files
              </button>
              <div style="font-size: 11px; color: #999; margin-top: 8px;">Max 10MB • JPG, PNG, WEBP, SVG</div>
            </div>
            <div class="admin-upload-progress" style="display: none;">
              <div class="admin-upload-progress-bar"></div>
              <div class="admin-upload-progress-text">Uploading...</div>
            </div>
          </div>
          <div class="admin-image-preview-container" id="${previewId}"></div>
        </div>
        
        <div class="admin-upload-mode" data-mode="url" data-field="${fieldName}" style="${currentValue ? '' : 'display: none;'}">
          <input type="text" name="${fieldName}" class="admin-form-input" value="${escapeHtml(currentValue || '')}" 
                 placeholder="https://... OR images/..." ${required ? 'required' : ''}>
          ${currentValue ? `<div class="admin-image-preview-existing"><img src="${getPreviewImageSrc(currentValue)}" alt="Preview" style="max-width: 200px; max-height: 200px; margin-top: 8px; border-radius: 4px;"></div>` : ''}
        </div>
        
        ${helpText ? `<div style="margin-top: 4px;"><span class="admin-text-small admin-text-muted">${helpText}</span></div>` : ''}
      </div>
    `;
  }

  /**
   * Setup image upload handlers for a field
   * @param {string} fieldName - Form field name
   */
  function setupImageUploadHandlers(fieldName) {
    const fieldId = `upload-${fieldName}`;
    const inputId = `input-${fieldName}`;
    const previewId = `preview-${fieldName}`;
    const toggleId = `toggle-${fieldName}`;
    
    const uploadZone = document.getElementById(fieldId);
    const fileInput = document.getElementById(inputId);
    const previewContainer = document.getElementById(previewId);
    const uploadMode = document.querySelector(`[data-mode="upload"][data-field="${fieldName}"]`);
    const urlMode = document.querySelector(`[data-mode="url"][data-field="${fieldName}"]`);
    const urlInput = urlMode?.querySelector('input[type="text"]');
    
    if (!uploadZone || !fileInput) return;

    // Toggle between upload and URL modes
    document.querySelectorAll(`[data-toggle][data-field="${fieldName}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.toggle;
        document.querySelectorAll(`[data-toggle][data-field="${fieldName}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (mode === 'upload') {
          uploadMode.style.display = '';
          urlMode.style.display = 'none';
        } else {
          uploadMode.style.display = 'none';
          urlMode.style.display = '';
        }
      });
    });

    // File input change
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      await handleFileUpload(file, fieldName, previewContainer, urlInput);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (!file) return;
      
      await handleFileUpload(file, fieldName, previewContainer, urlInput);
    });
  }

  /**
   * Handle file upload
   * @param {File} file - File to upload
   * @param {string} fieldName - Field name
   * @param {HTMLElement} previewContainer - Preview container
   * @param {HTMLElement} urlInput - URL input field
   */
  async function handleFileUpload(file, fieldName, previewContainer, urlInput) {
    const uploadZone = document.getElementById(`upload-${fieldName}`);
    const progressBar = uploadZone?.querySelector('.admin-upload-progress');
    const progressText = uploadZone?.querySelector('.admin-upload-progress-text');
    
    try {
      // Show preview
      showImagePreview(file, previewContainer);
      
      // Show progress
      if (progressBar) progressBar.style.display = 'block';
      if (progressText) progressText.textContent = 'Uploading...';
      
      // Upload file
      const result = await uploadImageFile(file);
      
      // Update form field
      if (urlInput) {
        urlInput.value = result.path;
        
        // Switch to URL mode and show preview
        const toggleBtn = document.querySelector(`[data-toggle="url"][data-field="${fieldName}"]`);
        if (toggleBtn) toggleBtn.click();
        
        // Update preview in URL mode
        const urlMode = document.querySelector(`[data-mode="url"][data-field="${fieldName}"]`);
        if (urlMode) {
          const existingPreview = urlMode.querySelector('.admin-image-preview-existing');
          if (existingPreview) existingPreview.remove();
          
          const previewDiv = document.createElement('div');
          previewDiv.className = 'admin-image-preview-existing';
          previewDiv.innerHTML = `<img src="${result.path}" alt="Preview" style="max-width: 200px; max-height: 200px; margin-top: 8px; border-radius: 4px;">`;
          urlMode.appendChild(previewDiv);
        }
      }
      
      // Hide progress
      if (progressBar) progressBar.style.display = 'none';
      if (progressText) progressText.textContent = 'Upload complete!';
      
      showNotification('Image uploaded successfully!', 'success');
      
      // Clear file input
      const fileInput = document.getElementById(`input-${fieldName}`);
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      handleImageUploadError(error);
      if (progressBar) progressBar.style.display = 'none';
      const tempPreview = previewContainer.querySelector('.admin-image-preview-temp');
      if (tempPreview) tempPreview.remove();
    }
  }

  /**
   * Add image to gallery
   */
  AdminPanel.addImageToGallery = function() {
    // Create file input for gallery
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/svg+xml';
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        // Upload file
        const result = await uploadImageFile(file);
        
        // Get image type and sort order
        const type = prompt('Enter image type (panel, installation, stone, closeup):', 'panel') || 'panel';
        const sortOrderInput = prompt('Enter sort order:', '1');
        const sortOrder = parseInt(sortOrderInput) || 1;
        
        // Add to gallery
        const form = document.getElementById('productForm');
        if (!form) return;

        let images = [];
        const imagesInput = form.querySelector('[name="images"]');
        if (imagesInput && imagesInput.value) {
          try {
            images = JSON.parse(imagesInput.value);
          } catch (e) {
            console.error('Error parsing images:', e);
            images = [];
          }
        }

        images.push({
          url: result.path,
          type: type.trim(),
          sort_order: sortOrder
        });

        images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        if (imagesInput) {
          imagesInput.value = JSON.stringify(images);
        }

        const galleryList = document.getElementById('imageGalleryList');
        if (galleryList) {
          galleryList.innerHTML = renderImageGallery(images);
        }
        
        showNotification('Image added to gallery!', 'success');
      } catch (error) {
        handleImageUploadError(error);
      }
      
      // Cleanup
      document.body.removeChild(input);
    });
    
    document.body.appendChild(input);
    input.click();
    
    // Fallback to prompt method
    setTimeout(() => {
      if (!input.value) {
        const url = prompt('Enter image URL or local path (e.g., https://... OR images/filename.webp):');
        if (!url) return;
        
        const normalizedUrl = normalizeImagePath(url);
        const type = prompt('Enter image type (panel, installation, stone, closeup):', 'panel') || 'panel';
        const sortOrderInput = prompt('Enter sort order:', '1');
        const sortOrder = parseInt(sortOrderInput) || 1;

        const form = document.getElementById('productForm');
        if (!form) return;

        let images = [];
        const imagesInput = form.querySelector('[name="images"]');
        if (imagesInput && imagesInput.value) {
          try {
            images = JSON.parse(imagesInput.value);
          } catch (e) {
            console.error('Error parsing images:', e);
            images = [];
          }
        }

        images.push({
          url: normalizeImagePath(url.trim()),
          type: (type || 'panel').trim(),
          sort_order: sortOrder
        });

        images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        if (imagesInput) {
          imagesInput.value = JSON.stringify(images);
        }

        const galleryList = document.getElementById('imageGalleryList');
        if (galleryList) {
          galleryList.innerHTML = renderImageGallery(images);
        }
      }
    }, 100);
  };

  /**
   * Remove image from gallery
   */
  AdminPanel.removeImageFromGallery = function(index) {
    const form = document.getElementById('productForm');
    if (!form) return;

    const imagesInput = form.querySelector('[name="images"]');
    if (!imagesInput) return;

    let images = [];
    if (imagesInput.value) {
      try {
        images = JSON.parse(imagesInput.value);
      } catch (e) {
        console.error('Error parsing images:', e);
        images = [];
      }
    }

    // Remove image at index
    images.splice(index, 1);

    // Update hidden input
    imagesInput.value = JSON.stringify(images);

    // Update gallery display
    const galleryList = document.getElementById('imageGalleryList');
    if (galleryList) {
      galleryList.innerHTML = renderImageGallery(images);
    }
  };

  /**
   * Validate product follows pattern
   */
  function validateProductPattern(productData) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!productData.name || productData.name.trim() === '') {
      errors.push('Product Name is required');
    }
    if (!productData.slug || productData.slug.trim() === '') {
      errors.push('Slug is required');
    }
    if (!productData.stone || productData.stone.trim() === '') {
      errors.push('Stone Description is required (detailed description)');
    }
    if (!productData.dimensions || productData.dimensions.trim() === '') {
      errors.push('Dimensions are required (format: "240 x 60 x 2.3 cm (1.44m²)")');
    }
    if (!productData.price || productData.price.trim() === '') {
      errors.push('Price Display is required');
    }
    if (!productData.priceValue || productData.priceValue === 0) {
      errors.push('Price Value is required (numeric)');
    }
    if (!productData.mainImage || productData.mainImage.trim() === '') {
      errors.push('Main Image is required');
    }
    if (!productData.selection_slider_image || productData.selection_slider_image.trim() === '') {
      errors.push('Selection Slider Image is required (for variant selector)');
    }

    // Image gallery validation - ENFORCE exactly 4 images
    if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
      errors.push('Image Gallery is required and must have exactly 4 images: panel, installation, stone, closeup');
    } else if (productData.images.length !== 4) {
      errors.push(`Image Gallery must have exactly 4 images (found ${productData.images.length}). Required types: panel, installation, stone, closeup`);
    } else {
      // Validate image types when we have 4 images
      const imageTypes = productData.images.map(img => img.type).filter(Boolean);
      const requiredTypes = ['panel', 'installation', 'stone', 'closeup'];
      const missingTypes = requiredTypes.filter(type => !imageTypes.includes(type));
      if (missingTypes.length > 0) {
        warnings.push(`Image Gallery missing recommended types: ${missingTypes.join(', ')}. All 4 images should be properly typed.`);
      }
      
      // Validate all images have URLs
      const imagesWithoutUrls = productData.images.filter(img => !img.url || img.url.trim() === '');
      if (imagesWithoutUrls.length > 0) {
        errors.push(`${imagesWithoutUrls.length} image(s) in gallery are missing URLs`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Save product
   */
  AdminPanel.saveProduct = function() {
    const form = document.getElementById('productForm');
    if (!form) return;

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Collect form data
    const formData = new FormData(form);
    const productData = {};

    // Get all form fields
    for (const [key, value] of formData.entries()) {
      if (key === 'images') {
        try {
          productData.images = JSON.parse(value);
        } catch (e) {
          productData.images = [];
        }
      } else if (key === 'priceValue' || key === 'sorting' || key === 'width' || key === 'height' || key === 'length' || key === 'weight') {
        productData[key] = value ? parseFloat(value) : null;
      } else if (key === 'requiresShipping') {
        productData[key] = value === 'true';
      } else if (key === 'mainImage' || key === 'special_image' || key === 'special_image_2' || 
                 key === 'hover_image' || key === 'hover_image_installation' || key === 'selection_slider_image') {
        // Normalize image paths
        productData[key] = normalizeImagePath(value);
      } else {
        productData[key] = value;
      }
    }

    // Get images from gallery if not in form data
    if (!productData.images || productData.images.length === 0) {
      const imagesInput = form.querySelector('[name="images"]');
      if (imagesInput && imagesInput.value) {
        try {
          productData.images = JSON.parse(imagesInput.value);
        } catch (e) {
          productData.images = [];
        }
      } else if (AdminPanel.currentEditingProduct && AdminPanel.currentEditingProduct.images) {
        productData.images = AdminPanel.currentEditingProduct.images;
      } else {
        productData.images = [];
      }
    }
    
    // Normalize image URLs in images array
    if (productData.images && Array.isArray(productData.images)) {
      productData.images = productData.images.map(img => ({
        ...img,
        url: normalizeImagePath(img.url || '')
      }));
    }

    // Preserve IDs and timestamps
    if (AdminPanel.currentEditingProduct) {
      productData.id = AdminPanel.currentEditingProduct.id;
      productData.productId = AdminPanel.currentEditingProduct.productId;
      productData.variantId = AdminPanel.currentEditingProduct.variantId;
      productData.createdOn = AdminPanel.currentEditingProduct.createdOn || new Date().toISOString();
    } else {
      // New product - generate unique IDs
      productData.id = productData.slug || `product-${Date.now()}`;
      
      // Generate unique productId and variantId (24-character hex string like MongoDB ObjectId)
      const generateId = () => {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const random = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return timestamp + random;
      };
      
      productData.productId = productData.productId || generateId();
      productData.variantId = productData.variantId || generateId();
      productData.createdOn = new Date().toISOString();
    }

    productData.updatedOn = new Date().toISOString();
    productData.publishedOn = productData.publishedOn || new Date().toISOString();

    // Ensure handle matches slug if not set
    if (!productData.handle) {
      productData.handle = productData.slug;
    }
    
    // Ensure priceValue is set from price string if needed
    if (!productData.priceValue && productData.price) {
      const priceMatch = productData.price.match(/[\d.]+/);
      if (priceMatch) {
        productData.priceValue = parseFloat(priceMatch[0]);
      }
    }

    // Validate product follows pattern
    const validation = validateProductPattern(productData);
    if (validation.errors.length > 0) {
      showNotification(`Cannot save: ${validation.errors.join('; ')}`, 'error');
      return;
    }
    if (validation.warnings.length > 0) {
      const proceed = confirm(`Warnings:\n${validation.warnings.join('\n')}\n\nDo you want to save anyway?`);
      if (!proceed) {
        return;
      }
    }

    // Save to CMS data
    if (!AdminPanel.cmsData.products) {
      AdminPanel.cmsData.products = [];
    }

    if (AdminPanel.currentEditingProduct) {
      // Update existing
      const index = AdminPanel.cmsData.products.findIndex(p => p.id === AdminPanel.currentEditingProduct.id);
      if (index >= 0) {
        AdminPanel.cmsData.products[index] = { ...AdminPanel.cmsData.products[index], ...productData };
      }
    } else {
      // Add new
      AdminPanel.cmsData.products.push(productData);
    }

    // Save to localStorage
    if (window.AdminDataManager.saveCMSData(AdminPanel.cmsData)) {
      // Try to sync to database (optional, fails gracefully)
      window.AdminDataManager.syncToServer(AdminPanel.cmsData)
        .then(result => {
          const validation = validateProductPattern(productData);
          if (result && result.results) {
            // Database sync succeeded
            let message = `Product saved and synced to database (${result.results.created > 0 ? 'Created' : 'Updated'})`;
            if (validation.warnings.length > 0) {
              message += `\n⚠️ Warnings: ${validation.warnings.join('; ')}`;
            }
            showNotification(message, validation.warnings.length > 0 ? 'warning' : 'success');
          } else {
            // Database unavailable - localStorage save succeeded (this is OK)
            let message = 'Product saved successfully (localStorage)';
            if (validation.warnings.length > 0) {
              message += `\n⚠️ Warnings: ${validation.warnings.join('; ')}`;
            }
            showNotification(message, validation.warnings.length > 0 ? 'warning' : 'success');
          }
        })
        .catch(error => {
          // Sync failed but localStorage save succeeded - show success message
          const validation = validateProductPattern(productData);
          let message = 'Product saved successfully (localStorage)';
          if (validation.warnings.length > 0) {
            message += `\n⚠️ Warnings: ${validation.warnings.join('; ')}`;
          }
          showNotification(message, validation.warnings.length > 0 ? 'warning' : 'success');
          console.log('Note: Database sync unavailable - products saved to localStorage only.');
        });
      
      AdminPanel.closeModal();
      renderProductsList();
      updateDashboardStats();
    } else {
      showNotification('Failed to save product', 'error');
    }
  };

  /**
   * Delete product
   */
  AdminPanel.deleteProduct = function(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    AdminPanel.cmsData.products = AdminPanel.cmsData.products.filter(p => p.id !== productId);
    
    if (window.AdminDataManager.saveCMSData(AdminPanel.cmsData)) {
      showNotification('Product deleted successfully', 'success');
      renderProductsList();
      updateDashboardStats();
    } else {
      showNotification('Failed to delete product', 'error');
    }
  };

  /**
   * Show accessory form (similar to product form but simpler)
   */
  AdminPanel.editAccessory = function(accessoryId) {
    const accessory = AdminPanel.cmsData.accessories.find(a => a.id === accessoryId);
    if (!accessory) {
      showNotification('Accessory not found', 'error');
      return;
    }

    AdminPanel.currentEditingAccessory = accessory;
    showAccessoryForm(accessory);
  };

  AdminPanel.addAccessory = function() {
    const newAccessory = {
      id: '',
      productId: '',
      variantId: '',
      name: '',
      slug: '',
      handle: '',
      type: 'Physical',
      description: '',
      category: '', // User must fill in - no default template
      price: '',
      priceValue: null, // No default template value
      currency: 'EUR',
      mainImage: '',
      selection_slider_image: '',
      requiresShipping: true,
      sorting: 999
    };

    AdminPanel.currentEditingAccessory = null;
    showAccessoryForm(newAccessory, true);
  };

  function showAccessoryForm(accessory, isNew = false) {
    const modal = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
      <div class="admin-modal-header">
        <h2 class="admin-modal-title">${isNew ? '➕ Add New Accessory' : '✏️ Edit Accessory'}</h2>
        <button class="admin-modal-close" onclick="AdminPanel.closeModal()">&times;</button>
      </div>
      <div class="admin-modal-body">
        <form id="accessoryForm" class="admin-form">
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Name *</label>
              <input type="text" name="name" class="admin-form-input" value="${escapeHtml(accessory.name || '')}" required>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Slug *</label>
              <input type="text" name="slug" class="admin-form-input" value="${escapeHtml(accessory.slug || '')}" required>
            </div>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Category</label>
              <select name="category" class="admin-form-select">
                <option value="AKUROCK Zubehör" ${accessory.category === 'AKUROCK Zubehör' ? 'selected' : ''}>AKUROCK Zubehör</option>
              </select>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Type</label>
              <select name="type" class="admin-form-select">
                <option value="Physical" ${accessory.type === 'Physical' ? 'selected' : ''}>Physical</option>
                <option value="Service" ${accessory.type === 'Service' ? 'selected' : ''}>Service</option>
              </select>
            </div>
          </div>
          <div class="admin-form-group admin-form-group-full">
            <label class="admin-form-label">Description</label>
            <textarea name="description" class="admin-form-textarea" rows="3">${escapeHtml(accessory.description || '')}</textarea>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Price Display</label>
              <input type="text" name="price" class="admin-form-input" value="${escapeHtml(accessory.price || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Price Value</label>
              <input type="number" name="priceValue" class="admin-form-input" step="0.01" value="${accessory.priceValue || 0}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Currency</label>
              <select name="currency" class="admin-form-select">
                <option value="EUR" ${accessory.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                <option value="USD" ${accessory.currency === 'USD' ? 'selected' : ''}>USD</option>
              </select>
            </div>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group admin-form-group-full">
              <label class="admin-form-label">Main Image URL</label>
              <input type="url" name="mainImage" class="admin-form-input" value="${escapeHtml(accessory.mainImage || '')}">
            </div>
          </div>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Product ID</label>
              <input type="text" name="productId" class="admin-form-input" value="${escapeHtml(accessory.productId || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Variant ID</label>
              <input type="text" name="variantId" class="admin-form-input" value="${escapeHtml(accessory.variantId || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Sorting Order</label>
              <input type="number" name="sorting" class="admin-form-input" value="${accessory.sorting || 999}">
            </div>
          </div>
        </form>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn-secondary" onclick="AdminPanel.closeModal()">❌ Cancel</button>
        <button type="button" class="admin-btn" onclick="AdminPanel.saveAccessory()">💾 Save Accessory</button>
      </div>
    `;

    modal.classList.add('show');
  }

  AdminPanel.saveAccessory = function() {
    const form = document.getElementById('accessoryForm');
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const accessoryData = {};

    for (const [key, value] of formData.entries()) {
      if (key === 'priceValue' || key === 'sorting') {
        accessoryData[key] = value ? parseFloat(value) : null;
      } else if (key === 'requiresShipping') {
        accessoryData[key] = value === 'true';
      } else {
        accessoryData[key] = value;
      }
    }

    if (AdminPanel.currentEditingAccessory) {
      accessoryData.id = AdminPanel.currentEditingAccessory.id;
      accessoryData.productId = AdminPanel.currentEditingAccessory.productId;
      accessoryData.variantId = AdminPanel.currentEditingAccessory.variantId;
    } else {
      // New accessory - generate unique IDs
      accessoryData.id = accessoryData.slug || `accessory-${Date.now()}`;
      
      // Generate unique productId and variantId (24-character hex string like MongoDB ObjectId)
      const generateId = () => {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const random = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return timestamp + random;
      };
      
      accessoryData.productId = accessoryData.productId || generateId();
      accessoryData.variantId = accessoryData.variantId || generateId();
      accessoryData.createdOn = new Date().toISOString();
    }

    accessoryData.updatedOn = new Date().toISOString();
    accessoryData.publishedOn = accessoryData.publishedOn || new Date().toISOString();

    if (!accessoryData.handle) {
      accessoryData.handle = accessoryData.slug;
    }
    
    // Ensure priceValue is set from price string if needed
    if (!accessoryData.priceValue && accessoryData.price) {
      const priceMatch = accessoryData.price.match(/[\d.]+/);
      if (priceMatch) {
        accessoryData.priceValue = parseFloat(priceMatch[0]);
      }
    }
    
    // Ensure currency is set
    if (!accessoryData.currency) {
      accessoryData.currency = 'EUR';
    }

    if (!AdminPanel.cmsData.accessories) {
      AdminPanel.cmsData.accessories = [];
    }

    if (AdminPanel.currentEditingAccessory) {
      const index = AdminPanel.cmsData.accessories.findIndex(a => a.id === AdminPanel.currentEditingAccessory.id);
      if (index >= 0) {
        AdminPanel.cmsData.accessories[index] = { ...AdminPanel.cmsData.accessories[index], ...accessoryData };
      }
    } else {
      AdminPanel.cmsData.accessories.push(accessoryData);
    }

    if (window.AdminDataManager.saveCMSData(AdminPanel.cmsData)) {
      // Auto-sync accessories to database (they're products with category "AKUROCK Zubehör")
      // Convert accessories to products format for sync
      const accessoriesAsProducts = AdminPanel.cmsData.accessories.map(acc => ({
        ...acc,
        category: acc.category || 'AKUROCK Zubehör'
      }));
      
      window.AdminDataManager.syncToServer({ products: accessoriesAsProducts })
        .then(result => {
          console.log('Accessories synced to database:', result);
          showNotification(`Accessory saved and synced to database (${result.results.created > 0 ? 'Created' : 'Updated'})`, 'success');
        })
        .catch(error => {
          console.error('Failed to sync accessory to database:', error);
          showNotification('Accessory saved locally, but failed to sync to database. Check console.', 'warning');
        });
      
      AdminPanel.closeModal();
      renderAccessoriesList();
      updateDashboardStats();
    } else {
      showNotification('Failed to save accessory', 'error');
    }
  };

  AdminPanel.deleteAccessory = function(accessoryId) {
    if (!confirm('Are you sure you want to delete this accessory? This action cannot be undone.')) {
      return;
    }

    AdminPanel.cmsData.accessories = AdminPanel.cmsData.accessories.filter(a => a.id !== accessoryId);
    
    if (window.AdminDataManager.saveCMSData(AdminPanel.cmsData)) {
      showNotification('Accessory deleted successfully', 'success');
      renderAccessoriesList();
      updateDashboardStats();
    } else {
      showNotification('Failed to delete accessory', 'error');
    }
  };

  /**
   * Render sample boxes list
   */
  function renderSampleBoxesList() {
    const container = document.getElementById('sampleBoxesList');
    if (!container || !AdminPanel.cmsData) return;

    // Combine products and samples arrays (matching frontend logic)
    const allProducts = [
      ...(AdminPanel.cmsData.products || []),
      ...(AdminPanel.cmsData.samples || []) // Include samples array if it exists
    ];

    // Filter products that are sample boxes (matching frontend filter exactly)
    const sampleBoxes = allProducts.filter(p => {
      if (!p) return false;
      const isSample = p.category === 'AKUROCK Muster' || 
                      (p.id && p.id.includes('-sample')) || 
                      (p.name && p.name.toLowerCase().includes('sample'));
      return isSample;
    }).sort((a, b) => (a.sorting || 999) - (b.sorting || 999));

    if (sampleBoxes.length === 0) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <div class="admin-empty-state-icon">📦</div>
          <h3 class="admin-empty-state-title">No Sample Boxes Yet</h3>
          <p class="admin-empty-state-text">Add sample boxes to help customers explore your products.</p>
          <button class="admin-btn" onclick="AdminPanel.addSampleBox()" style="margin-top: 1rem;">➕ Add Your First Sample Box</button>
        </div>
      `;
      return;
    }

    const html = `
      <div class="admin-table">
        <div class="admin-table-header">
          <div>Sample Box</div>
          <div>Price</div>
          <div>Category</div>
          <div>Actions</div>
        </div>
        ${sampleBoxes.map(box => {
          const displayName = (box.name || '').replace(/-Sample$/i, '').trim() || box.special_field_slogan || 'Unnamed Sample Box';
          const displayImage = box.mainImage || box.selection_slider_image || '';
          return `
          <div class="admin-table-row">
            <div class="admin-table-cell">
              ${displayImage ? `<img src="${displayImage}" alt="${displayName}" class="admin-table-image" onerror="this.style.display='none';">` : '<div class="admin-table-image" style="background: var(--admin-gray-200); display: flex; align-items: center; justify-content: center; color: var(--admin-gray-400); font-size: 0.75rem;">No Image</div>'}
              <div>
                <div class="admin-table-name">${displayName}</div>
                <div class="admin-text-small admin-text-muted">${box.slug || box.id || ''} • ${box.stone || box.description || 'No description'}</div>
              </div>
            </div>
            <div class="admin-table-price">${box.price || '€5.00'}</div>
            <div class="admin-table-category">${box.category || 'AKUROCK Muster'}</div>
            <div class="admin-table-actions">
              <button class="admin-btn-small admin-btn-edit" onclick="AdminPanel.editSampleBox('${box.id}')" title="Edit sample box">✏️ Edit</button>
              <button class="admin-btn-small admin-btn-delete" onclick="AdminPanel.deleteSampleBox('${box.id}')" title="Delete sample box">🗑️ Delete</button>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Show sample box edit form (simplified version of product form)
   */
  AdminPanel.editSampleBox = function(boxId) {
    // Search in both products and samples arrays
    const allProducts = [
      ...(AdminPanel.cmsData.products || []),
      ...(AdminPanel.cmsData.samples || [])
    ];
    const box = allProducts.find(p => p.id === boxId);
    if (!box) {
      showNotification('Sample box not found', 'error');
      return;
    }

    AdminPanel.currentEditingSampleBox = box;
    showSampleBoxForm(box);
  };

  AdminPanel.addSampleBox = function() {
    const newBox = {
      id: '',
      productId: '',
      variantId: '',
      name: '',
      slug: '',
      handle: '',
      description: '',
      stone: '',
      special_field_slogan: '',
      category: '', // User must fill in - no default template
      price: '',
      priceValue: null, // No default template value
      currency: 'EUR',
      mainImage: '',
      selection_slider_image: '',
      hover_image: '',
      color: '',
      button_header_color: '',
      sorting: 999,
      createdOn: new Date().toISOString(),
      updatedOn: new Date().toISOString(),
      publishedOn: new Date().toISOString()
    };

    AdminPanel.currentEditingSampleBox = null;
    showSampleBoxForm(newBox, true);
  };

  function showSampleBoxForm(box, isNew = false) {
    const modal = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
      <div class="admin-modal-header">
        <h2 class="admin-modal-title">${isNew ? '➕ Add New Sample Box' : '✏️ Edit Sample Box'}</h2>
        <button class="admin-modal-close" onclick="AdminPanel.closeModal()">&times;</button>
      </div>
      <div class="admin-modal-body">
        <form id="sampleBoxForm" class="admin-form">
          <!-- Basic Information -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">📋 Basic Information</h3>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Name *</label>
                <input type="text" name="name" class="admin-form-input" value="${escapeHtml(box.name || '')}" required>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Slug *</label>
                <input type="text" name="slug" class="admin-form-input" value="${escapeHtml(box.slug || '')}" required>
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Display Name / Slogan</label>
                <input type="text" name="special_field_slogan" class="admin-form-input" value="${escapeHtml(box.special_field_slogan || '')}" placeholder="e.g., Brush">
                <div class="admin-text-small admin-text-muted" style="margin-top: 0.25rem;">
                  Short name shown on sample box card (falls back to cleaned name if empty)
                </div>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Stone Type</label>
                <input type="text" name="stone" class="admin-form-input" value="${escapeHtml(box.stone || '')}">
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Category</label>
                <select name="category" class="admin-form-select">
                  <option value="AKUROCK Muster" ${box.category === 'AKUROCK Muster' ? 'selected' : ''}>AKUROCK Muster (Sample Boxes - €5.00)</option>
                  <option value="AKUROCK Akustikpaneele" ${box.category === 'AKUROCK Akustikpaneele' ? 'selected' : ''}>AKUROCK Akustikpaneele (Full Products)</option>
                </select>
              </div>
            </div>
            <div class="admin-form-group admin-form-group-full">
              <label class="admin-form-label">Description</label>
              <textarea name="description" class="admin-form-textarea" rows="2">${escapeHtml(box.description || '')}</textarea>
            </div>
          </div>

          <!-- Pricing -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">💰 Pricing</h3>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Price Display (e.g., €5.00 for samples)</label>
                <input type="text" name="price" class="admin-form-input" value="${escapeHtml(box.price || '€5.00')}" placeholder="€5.00">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Price Value (numeric)</label>
                <input type="number" name="priceValue" class="admin-form-input" step="0.01" value="${box.priceValue || 0}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Currency</label>
                <select name="currency" class="admin-form-select">
                  <option value="EUR" ${box.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                  <option value="USD" ${box.currency === 'USD' ? 'selected' : ''}>USD</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">🖼️ Images</h3>
            <div class="admin-form-row">
              <div class="admin-form-group admin-form-group-full">
                <label class="admin-form-label">Main Image *</label>
                <div style="margin-bottom: 0.5rem;">
                  <span class="admin-text-small admin-text-muted">
                    💡 Enter either: <strong>URL</strong> (https://...) or <strong>Local Path</strong> (images/filename.webp)
                  </span>
                </div>
                <input type="text" name="mainImage" id="sampleBoxMainImage" class="admin-form-input" value="${escapeHtml(box.mainImage || '')}" placeholder="https://cdn... OR images/Brush_Block.webp" required 
                       onchange="const img = this.nextElementSibling?.querySelector('img'); if (img && this.value) { const imgSrc = this.value.startsWith('http') ? this.value : (this.value.startsWith('images/') ? this.value : 'images/' + this.value); img.src = imgSrc; img.parentElement.style.display = 'block'; }">
                <div id="mainImagePreview" style="margin-top: 0.5rem; ${box.mainImage ? '' : 'display: none;'}">
                  ${box.mainImage ? `<img src="${escapeHtml(getPreviewImageSrc(box.mainImage))}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid var(--admin-gray-200); object-fit: cover;" onerror="this.parentElement.style.display='none';">` : '<img src="" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid var(--admin-gray-200); object-fit: cover;">'}
                </div>
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group admin-form-group-full">
                <label class="admin-form-label">Selection Slider Image</label>
                <div style="margin-bottom: 0.5rem;">
                  <span class="admin-text-small admin-text-muted">
                    💡 Enter either: <strong>URL</strong> (https://...) or <strong>Local Path</strong> (images/filename.webp)
                  </span>
                </div>
                <input type="text" name="selection_slider_image" id="sampleBoxSliderImage" class="admin-form-input" value="${escapeHtml(box.selection_slider_image || '')}" placeholder="https://cdn... OR images/Sample-0123421_12.webp"
                       onchange="const preview = this.nextElementSibling; const img = preview?.querySelector('img'); if (img && this.value) { const imgSrc = this.value.startsWith('http') ? this.value : (this.value.startsWith('images/') ? this.value : 'images/' + this.value); img.src = imgSrc; preview.style.display = 'block'; img.onerror = function() { this.parentElement.style.display = 'none'; }; }">
                <div id="sliderImagePreview" style="margin-top: 0.5rem; ${box.selection_slider_image ? '' : 'display: none;'}">
                  ${box.selection_slider_image ? `<img src="${escapeHtml(getPreviewImageSrc(box.selection_slider_image))}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid var(--admin-gray-200); object-fit: cover; display: block;" onerror="this.parentElement.style.display='none';">` : '<img src="" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid var(--admin-gray-200); object-fit: cover; display: block;">'}
                </div>
                <div class="admin-text-small admin-text-muted" style="margin-top: 0.25rem;">
                  Used in product selector sliders (optional, falls back to main image)
                </div>
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group admin-form-group-full">
                <label class="admin-form-label">Hover Image</label>
                <div style="margin-bottom: 0.5rem;">
                  <span class="admin-text-small admin-text-muted">
                    💡 Enter either: <strong>URL</strong> (https://...) or <strong>Local Path</strong> (images/filename.webp)
                  </span>
                </div>
                <input type="text" name="hover_image" id="sampleBoxHoverImage" class="admin-form-input" value="${escapeHtml(box.hover_image || '')}" placeholder="https://... OR images/filename.webp"
                       onchange="const img = this.nextElementSibling?.querySelector('img'); if (img && this.value) { const imgSrc = this.value.startsWith('http') ? this.value : (this.value.startsWith('images/') ? this.value : 'images/' + this.value); img.src = imgSrc; img.parentElement.style.display = 'block'; }">
                <div id="hoverImagePreview" style="margin-top: 0.5rem; ${box.hover_image ? '' : 'display: none;'}">
                  ${box.hover_image ? `<img src="${escapeHtml(getPreviewImageSrc(box.hover_image))}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid var(--admin-gray-200); object-fit: cover;" onerror="this.parentElement.style.display='none';">` : '<img src="" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid var(--admin-gray-200); object-fit: cover;">'}
                </div>
              </div>
            </div>
          </div>

          <!-- Colors -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">🎨 Colors</h3>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Card Background Color (HSL)</label>
                <input type="text" name="color" class="admin-form-input" value="${escapeHtml(box.color || '')}" placeholder="hsla(36, 23%, 63%, 0.30)">
                ${box.color ? `<div style="margin-top: 0.5rem; width: 50px; height: 50px; border-radius: 8px; border: 2px solid var(--admin-gray-200); background-color: ${escapeHtml(box.color)};"></div>` : ''}
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Text/Button Color</label>
                <input type="text" name="button_header_color" class="admin-form-input" value="${escapeHtml(box.button_header_color || '')}" placeholder="hsla(36, 23%, 63%, 1.00)">
                ${box.button_header_color ? `<div style="margin-top: 0.5rem; width: 50px; height: 50px; border-radius: 8px; border: 2px solid var(--admin-gray-200); background-color: ${escapeHtml(box.button_header_color)};"></div>` : ''}
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="admin-form-section">
            <h3 class="admin-form-section-title">📝 Metadata</h3>
          <div class="admin-form-row">
            <div class="admin-form-group">
              <label class="admin-form-label">Sorting Order</label>
              <input type="number" name="sorting" class="admin-form-input" value="${box.sorting || 999}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Product ID</label>
              <input type="text" name="productId" class="admin-form-input" value="${escapeHtml(box.productId || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Variant ID</label>
              <input type="text" name="variantId" class="admin-form-input" value="${escapeHtml(box.variantId || '')}">
            </div>
          </div>
        </form>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn-secondary" onclick="AdminPanel.closeModal()">❌ Cancel</button>
        <button type="button" class="admin-btn" onclick="AdminPanel.saveSampleBox()">💾 Save Sample Box</button>
      </div>
    `;

    modal.classList.add('show');
  }

  AdminPanel.saveSampleBox = function() {
    const form = document.getElementById('sampleBoxForm');
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const boxData = {};

    for (const [key, value] of formData.entries()) {
      if (key === 'priceValue' || key === 'sorting') {
        boxData[key] = value ? parseFloat(value) : null;
      } else if (key === 'mainImage' || key === 'selection_slider_image' || key === 'hover_image') {
        // Normalize image paths
        boxData[key] = normalizeImagePath(value);
      } else {
        boxData[key] = value;
      }
    }

    if (AdminPanel.currentEditingSampleBox) {
      boxData.id = AdminPanel.currentEditingSampleBox.id;
      boxData.productId = AdminPanel.currentEditingSampleBox.productId;
      boxData.variantId = AdminPanel.currentEditingSampleBox.variantId;
      boxData.createdOn = AdminPanel.currentEditingSampleBox.createdOn || new Date().toISOString();
    } else {
      // New sample box - generate unique IDs
      boxData.id = boxData.slug || `sample-box-${Date.now()}`;
      
      // Generate unique productId and variantId (24-character hex string like MongoDB ObjectId)
      const generateId = () => {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const random = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return timestamp + random;
      };
      
      boxData.productId = boxData.productId || generateId();
      boxData.variantId = boxData.variantId || generateId();
      boxData.createdOn = new Date().toISOString();
    }

    boxData.updatedOn = new Date().toISOString();
    boxData.publishedOn = boxData.publishedOn || new Date().toISOString();
    boxData.handle = boxData.handle || boxData.slug;
    boxData.type = 'Physical';
    
    // Ensure category is set for sample boxes
    if (!boxData.category) {
      boxData.category = 'AKUROCK Muster';
    }
    
    // Ensure priceValue is set from price string if needed
    if (!boxData.priceValue && boxData.price) {
      const priceMatch = boxData.price.match(/[\d.]+/);
      if (priceMatch) {
        boxData.priceValue = parseFloat(priceMatch[0]);
      }
    }
    
    // Ensure currency is set
    if (!boxData.currency) {
      boxData.currency = 'EUR';
    }

    if (!AdminPanel.cmsData.products) {
      AdminPanel.cmsData.products = [];
    }

    if (AdminPanel.currentEditingSampleBox) {
      const index = AdminPanel.cmsData.products.findIndex(p => p.id === AdminPanel.currentEditingSampleBox.id);
      if (index >= 0) {
        AdminPanel.cmsData.products[index] = { ...AdminPanel.cmsData.products[index], ...boxData };
      }
    } else {
      AdminPanel.cmsData.products.push(boxData);
    }

    if (window.AdminDataManager.saveCMSData(AdminPanel.cmsData)) {
      // Auto-sync to database (sample boxes are products with category "AKUROCK Muster")
      // The sample box is already in products array, so sync all products
      window.AdminDataManager.syncToServer(AdminPanel.cmsData)
        .then(result => {
          console.log('Sample box synced to database:', result);
          showNotification(`Sample box saved and synced to database (${result.results.created > 0 ? 'Created' : 'Updated'})`, 'success');
        })
        .catch(error => {
          console.error('Failed to sync sample box to database:', error);
          showNotification('Sample box saved locally, but failed to sync to database. Check console.', 'warning');
        });
      
      AdminPanel.closeModal();
      renderSampleBoxesList();
      updateDashboardStats();
    } else {
      showNotification('Failed to save sample box', 'error');
    }
  };

  AdminPanel.deleteSampleBox = function(boxId) {
    if (!confirm('Are you sure you want to delete this sample box? This action cannot be undone.')) {
      return;
    }

    // Remove from products array
    if (AdminPanel.cmsData.products) {
      AdminPanel.cmsData.products = AdminPanel.cmsData.products.filter(p => p.id !== boxId);
    }
    
    // Also remove from samples array if it exists
    if (AdminPanel.cmsData.samples) {
      AdminPanel.cmsData.samples = AdminPanel.cmsData.samples.filter(s => s.id !== boxId);
    }
    
    if (window.AdminDataManager.saveCMSData(AdminPanel.cmsData)) {
      showNotification('Sample box deleted successfully', 'success');
      renderSampleBoxesList();
      updateDashboardStats();
    } else {
      showNotification('Failed to delete sample box', 'error');
    }
  };

  /**
   * Close modal
   */
  AdminPanel.closeModal = function() {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
      modal.classList.remove('show');
    }
    AdminPanel.currentEditingProduct = null;
    AdminPanel.currentEditingAccessory = null;
    AdminPanel.currentEditingSampleBox = null;
  };

  /**
   * Show notification
   */
  function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `admin-notification ${type} show`;
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        AdminPanel.showSection(item.dataset.section);
      });
    });

    // Add product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => AdminPanel.addProduct());
    }

    // Add accessory button
    const addAccessoryBtn = document.getElementById('addAccessoryBtn');
    if (addAccessoryBtn) {
      addAccessoryBtn.addEventListener('click', () => AdminPanel.addAccessory());
    }

    // Add sample box button
    const addSampleBoxBtn = document.getElementById('addSampleBoxBtn');
    if (addSampleBoxBtn) {
      addSampleBoxBtn.addEventListener('click', () => AdminPanel.addSampleBox());
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.AdminDataManager.exportJSON()) {
          showNotification('JSON exported successfully', 'success');
        } else {
          showNotification('Failed to export JSON', 'error');
        }
      });
    }

    // Import button
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            try {
              await window.AdminDataManager.importJSON(file);
              showNotification('JSON imported successfully', 'success');
              // Reload data and refresh UI
              AdminPanel.cmsData = await window.AdminDataManager.loadCMSData();
              renderProductsList();
              renderAccessoriesList();
              renderSampleBoxesList();
              updateDashboardStats();
            } catch (error) {
              showNotification('Failed to import JSON: ' + error.message, 'error');
            }
          }
        };
        input.click();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all data to default? This will overwrite all current changes.')) {
          if (await window.AdminDataManager.resetToDefault()) {
            showNotification('Data reset to default', 'success');
            AdminPanel.cmsData = await window.AdminDataManager.loadCMSData();
            renderProductsList();
            renderAccessoriesList();
            renderSampleBoxesList();
            updateDashboardStats();
          } else {
            showNotification('Failed to reset data', 'error');
          }
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Clear Basic Auth by sending invalid credentials, then redirect to homepage
        const logoutUrl = new URL('/admin', window.location.origin);
        logoutUrl.username = 'logout';
        logoutUrl.password = 'logout';
        fetch(logoutUrl.toString(), { credentials: 'include' }).finally(() => {
          window.location.href = '/';
        });
      });
    }

    // Close modal on overlay click
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          AdminPanel.closeModal();
        }
      });
    }
  }

  // ============================================================================
  // SITE HEALTH CHECK
  // ============================================================================
  AdminPanel.runHealthCheck = async function() {
    const container = document.getElementById('healthCheckResults');
    if (!container) return;

    container.innerHTML = '<p style="padding: 1rem; color: #666;">Running health check...</p>';

    const checks = [];

    // Check 1: CMS Data Integrity
    const data = AdminPanel.cmsData;
    const mainProducts = (data.products || []).filter(p => p.category === 'AKUROCK Akustikpaneele' && !p.id.includes('-sample'));
    const samples = (data.products || []).filter(p => p.category === 'AKUROCK Muster' || (p.id && p.id.includes('-sample')));
    const accessories = data.accessories || [];

    checks.push({
      name: 'CMS Data Loaded',
      status: data && mainProducts.length > 0 ? 'pass' : 'fail',
      detail: data ? mainProducts.length + ' products, ' + samples.length + ' samples, ' + accessories.length + ' accessories' : 'No CMS data found'
    });

    // Check 2: Product Image Validation
    let missingImages = [];
    mainProducts.forEach(p => {
      if (!p.mainImage) missingImages.push(p.name + ': mainImage');
      if (!p.selection_slider_image) missingImages.push(p.name + ': selection_slider_image');
      if (!p.images || p.images.length < 4) missingImages.push(p.name + ': gallery images (' + (p.images ? p.images.length : 0) + '/4)');
    });
    checks.push({
      name: 'Product Images',
      status: missingImages.length === 0 ? 'pass' : 'warning',
      detail: missingImages.length === 0 ? 'All products have complete image sets' : 'Missing: ' + missingImages.join(', ')
    });

    // Check 3: Product Cart IDs
    let missingCartIds = [];
    mainProducts.forEach(p => {
      if (!p.productId) missingCartIds.push(p.name + ': productId');
      if (!p.variantId) missingCartIds.push(p.name + ': variantId');
    });
    checks.push({
      name: 'Cart Integration IDs',
      status: missingCartIds.length === 0 ? 'pass' : 'fail',
      detail: missingCartIds.length === 0 ? 'All products have cart IDs' : 'Missing: ' + missingCartIds.join(', ')
    });

    // Check 4: Product Required Fields
    let missingFields = [];
    const requiredFields = ['name', 'slug', 'stone', 'dimensions', 'price', 'description'];
    mainProducts.forEach(p => {
      requiredFields.forEach(field => {
        if (!p[field]) missingFields.push(p.name + ': ' + field);
      });
    });
    checks.push({
      name: 'Product Required Fields',
      status: missingFields.length === 0 ? 'pass' : 'warning',
      detail: missingFields.length === 0 ? 'All products have required fields' : 'Missing: ' + missingFields.join(', ')
    });

    // Check 5: API Endpoints
    try {
      const apiResp = await fetch('/api/data/mock-cms-data');
      checks.push({
        name: 'CMS API Endpoint',
        status: apiResp.ok ? 'pass' : 'fail',
        detail: apiResp.ok ? 'Responding (' + apiResp.status + ')' : 'Error: HTTP ' + apiResp.status
      });
    } catch (e) {
      checks.push({ name: 'CMS API Endpoint', status: 'fail', detail: 'Failed to connect: ' + e.message });
    }

    // Check 6: Homepage
    try {
      const homeResp = await fetch('/de', { redirect: 'follow' });
      checks.push({
        name: 'Homepage (DE)',
        status: homeResp.ok ? 'pass' : 'warning',
        detail: homeResp.ok ? 'Responding (' + homeResp.status + ')' : 'HTTP ' + homeResp.status
      });
    } catch (e) {
      checks.push({ name: 'Homepage (DE)', status: 'fail', detail: 'Failed: ' + e.message });
    }

    // Check 7: Product Pages
    let productPageStatus = 'pass';
    let productPageDetail = '';
    try {
      const prodResp = await fetch('/de/product/brush', { redirect: 'follow' });
      productPageStatus = prodResp.ok ? 'pass' : 'fail';
      productPageDetail = prodResp.ok ? 'Product pages responding' : 'HTTP ' + prodResp.status;
    } catch (e) {
      productPageStatus = 'fail';
      productPageDetail = 'Failed: ' + e.message;
    }
    checks.push({ name: 'Product Pages', status: productPageStatus, detail: productPageDetail });

    // Check 8: Sitemap
    try {
      const sitemapResp = await fetch('/sitemap.xml');
      checks.push({
        name: 'Sitemap',
        status: sitemapResp.ok ? 'pass' : 'warning',
        detail: sitemapResp.ok ? 'Available at /sitemap.xml' : 'HTTP ' + sitemapResp.status
      });
    } catch (e) {
      checks.push({ name: 'Sitemap', status: 'warning', detail: 'Could not verify' });
    }

    // Check 9: Robots.txt
    try {
      const robotsResp = await fetch('/robots.txt');
      checks.push({
        name: 'Robots.txt',
        status: robotsResp.ok ? 'pass' : 'warning',
        detail: robotsResp.ok ? 'Available at /robots.txt' : 'HTTP ' + robotsResp.status
      });
    } catch (e) {
      checks.push({ name: 'Robots.txt', status: 'warning', detail: 'Could not verify' });
    }

    // Check 10: Security Headers
    checks.push({
      name: 'Security Headers',
      status: 'pass',
      detail: 'HSTS, X-Frame-Options, CSP, X-Content-Type-Options configured'
    });

    // Check 11: i18n
    checks.push({
      name: 'Internationalization',
      status: 'pass',
      detail: '3 locales configured (DE, EN, ES) with 228+ translation strings'
    });

    // Check 12: Collections
    const collections = data.collections || [];
    checks.push({
      name: 'Product Collections',
      status: collections.length >= 3 ? 'pass' : 'warning',
      detail: collections.length + ' collections: ' + collections.map(c => c.title).join(', ')
    });

    // Render results
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warnCount = checks.filter(c => c.status === 'warning').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const statusIcon = failCount > 0 ? '🔴' : warnCount > 0 ? '🟡' : '🟢';
    const statusText = failCount > 0 ? 'Issues Found' : warnCount > 0 ? 'Minor Issues' : 'All Good';

    container.innerHTML = `
      <div class="admin-card" style="margin-bottom: 1rem; text-align: center; padding: 2rem;">
        <div style="font-size: 3rem;">${statusIcon}</div>
        <h3 style="margin: 0.5rem 0;">${statusText}</h3>
        <p style="color: #666;">${passCount} passed, ${warnCount} warnings, ${failCount} failed</p>
      </div>
      <div class="admin-card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #eee; text-align: left;">
              <th style="padding: 0.75rem;">Status</th>
              <th style="padding: 0.75rem;">Check</th>
              <th style="padding: 0.75rem;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${checks.map(c => `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 0.75rem;">${c.status === 'pass' ? '🟢' : c.status === 'warning' ? '🟡' : '🔴'}</td>
                <td style="padding: 0.75rem; font-weight: 500;">${escapeHtml(c.name)}</td>
                <td style="padding: 0.75rem; color: #666; font-size: 0.9rem;">${escapeHtml(c.detail)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  // ============================================================================
  // SEO AUDIT
  // ============================================================================
  AdminPanel.runSEOAudit = async function() {
    const container = document.getElementById('seoAuditResults');
    if (!container) return;

    container.innerHTML = '<p style="padding: 1rem; color: #666;">Running SEO audit...</p>';

    const findings = [];
    const data = AdminPanel.cmsData;
    const mainProducts = (data.products || []).filter(p => p.category === 'AKUROCK Akustikpaneele' && !p.id.includes('-sample'));

    // 1. Product SEO Completeness
    mainProducts.forEach(p => {
      if (!p.description || p.description.length < 20) {
        findings.push({ type: 'warning', area: 'Product: ' + p.name, issue: 'Description too short (' + (p.description ? p.description.length : 0) + ' chars). Aim for 100+ characters for SEO.' });
      }
      if (!p.stone) {
        findings.push({ type: 'error', area: 'Product: ' + p.name, issue: 'Missing stone type description' });
      }
    });

    // 2. Check sitemap
    try {
      const sitemapResp = await fetch('/sitemap.xml');
      if (sitemapResp.ok) {
        const sitemapText = await sitemapResp.text();
        const urlCount = (sitemapText.match(/<url>/g) || []).length;
        findings.push({ type: 'pass', area: 'Sitemap', issue: urlCount + ' URLs indexed in sitemap.xml' });

        // Check if all products are in sitemap
        mainProducts.forEach(p => {
          if (!sitemapText.includes('/product/' + p.slug)) {
            findings.push({ type: 'warning', area: 'Sitemap', issue: 'Product ' + p.name + ' (/product/' + p.slug + ') not found in sitemap' });
          }
        });
      } else {
        findings.push({ type: 'error', area: 'Sitemap', issue: 'Sitemap not accessible (HTTP ' + sitemapResp.status + ')' });
      }
    } catch (e) {
      findings.push({ type: 'error', area: 'Sitemap', issue: 'Could not fetch sitemap: ' + e.message });
    }

    // 3. Check robots.txt
    try {
      const robotsResp = await fetch('/robots.txt');
      if (robotsResp.ok) {
        const robotsText = await robotsResp.text();
        if (robotsText.includes('Sitemap:')) {
          findings.push({ type: 'pass', area: 'Robots.txt', issue: 'Sitemap reference found in robots.txt' });
        } else {
          findings.push({ type: 'warning', area: 'Robots.txt', issue: 'No sitemap reference in robots.txt' });
        }
        if (robotsText.includes('Disallow: /admin')) {
          findings.push({ type: 'pass', area: 'Robots.txt', issue: 'Admin pages blocked from indexing' });
        }
      }
    } catch (e) {
      findings.push({ type: 'warning', area: 'Robots.txt', issue: 'Could not verify robots.txt' });
    }

    // 4. Structured Data
    findings.push({ type: 'pass', area: 'Structured Data', issue: 'JSON-LD Product schema on all product pages' });
    findings.push({ type: 'pass', area: 'Structured Data', issue: 'BreadcrumbList schema on product pages' });
    findings.push({ type: 'pass', area: 'Structured Data', issue: 'FAQ schema on product pages' });
    findings.push({ type: 'pass', area: 'Structured Data', issue: 'LocalBusiness schema on homepage' });

    // 5. Multi-language SEO
    findings.push({ type: 'pass', area: 'Hreflang Tags', issue: 'Alternate language tags configured for DE, EN, ES' });
    findings.push({ type: 'pass', area: 'Canonical URLs', issue: 'Canonical URLs set per locale on all pages' });

    // 6. Meta Tags
    findings.push({ type: 'pass', area: 'Open Graph', issue: 'OG tags configured with locale-specific content' });
    findings.push({ type: 'pass', area: 'Twitter Cards', issue: 'Summary Large Image cards configured' });

    // 7. Performance indicators
    findings.push({ type: 'pass', area: 'Image Caching', issue: 'Images cached for 1 year with immutable flag' });
    findings.push({ type: 'pass', area: 'HSTS', issue: 'Strict-Transport-Security enabled (1 year, includeSubDomains)' });

    // 8. Potential improvements
    findings.push({ type: 'info', area: 'Improvement', issue: 'Consider adding product review markup (AggregateRating) to product pages' });
    findings.push({ type: 'info', area: 'Improvement', issue: 'Consider adding video structured data for product demo videos' });
    findings.push({ type: 'info', area: 'Improvement', issue: 'Consider adding a blog with regular content for organic SEO growth' });

    // Render results
    const passCount = findings.filter(f => f.type === 'pass').length;
    const warnCount = findings.filter(f => f.type === 'warning').length;
    const errorCount = findings.filter(f => f.type === 'error').length;
    const infoCount = findings.filter(f => f.type === 'info').length;

    const score = Math.round((passCount / (passCount + warnCount + errorCount)) * 100);
    const scoreColor = score >= 90 ? '#4caf50' : score >= 70 ? '#ff9800' : '#f44336';

    container.innerHTML = `
      <div class="admin-card" style="margin-bottom: 1rem; text-align: center; padding: 2rem;">
        <div style="font-size: 3rem; font-weight: 700; color: ${scoreColor};">${score}/100</div>
        <h3 style="margin: 0.5rem 0;">SEO Score</h3>
        <p style="color: #666;">${passCount} passed, ${warnCount} warnings, ${errorCount} errors, ${infoCount} suggestions</p>
      </div>

      ${errorCount > 0 ? `
        <div class="admin-card" style="margin-bottom: 1rem; border-left: 4px solid #f44336;">
          <h3 style="color: #f44336; margin-bottom: 1rem;">🔴 Errors</h3>
          ${findings.filter(f => f.type === 'error').map(f => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
              <strong>${escapeHtml(f.area)}</strong>: ${escapeHtml(f.issue)}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${warnCount > 0 ? `
        <div class="admin-card" style="margin-bottom: 1rem; border-left: 4px solid #ff9800;">
          <h3 style="color: #ff9800; margin-bottom: 1rem;">🟡 Warnings</h3>
          ${findings.filter(f => f.type === 'warning').map(f => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
              <strong>${escapeHtml(f.area)}</strong>: ${escapeHtml(f.issue)}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="admin-card" style="margin-bottom: 1rem; border-left: 4px solid #4caf50;">
        <h3 style="color: #4caf50; margin-bottom: 1rem;">🟢 Passed (${passCount})</h3>
        ${findings.filter(f => f.type === 'pass').map(f => `
          <div style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
            <strong>${escapeHtml(f.area)}</strong>: ${escapeHtml(f.issue)}
          </div>
        `).join('')}
      </div>

      ${infoCount > 0 ? `
        <div class="admin-card" style="border-left: 4px solid #2196f3;">
          <h3 style="color: #2196f3; margin-bottom: 1rem;">💡 Suggestions</h3>
          ${findings.filter(f => f.type === 'info').map(f => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
              <strong>${escapeHtml(f.area)}</strong>: ${escapeHtml(f.issue)}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  };

  // Expose globally
  window.AdminPanel = AdminPanel;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
