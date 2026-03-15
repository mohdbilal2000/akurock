'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    AdminDataManager?: any;
  }
}

export default function AdminPage() {
  useEffect(() => {
    // Load admin CSS
    const link = document.createElement('link');
    link.href = '/admin/admin.css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    document.head.appendChild(link);

    // Load scripts in order
    const scripts = [
      '/js/order-manager.js',
      '/admin/admin-data-manager.js',
      '/admin/admin.js'
    ];

    scripts.forEach((src, index) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = index === scripts.length - 1; // Only last script async
      if (index === scripts.length - 1) {
        script.onload = () => {
          // Verify AdminDataManager loaded
          setTimeout(() => {
            if (typeof window.AdminDataManager === 'undefined') {
              console.error('AdminDataManager failed to load after timeout');
              const loading = document.getElementById('admin-loading');
              if (loading) {
                loading.innerHTML = '<div style="padding: 2rem; text-align: center;"><h1 style="color: #dc3545;">Error: AdminDataManager not loaded</h1><p>Check browser console (F12) for JavaScript errors.</p><p>Make sure admin/admin-data-manager.js exists and has no syntax errors.</p><p><a href="/admin" style="color: #0d0d0d;">Reload Page</a></p></div>';
              }
            }
          }, 100);
        };
      }
      document.body.appendChild(script);
    });

    // Check if admin panel initialized
    const checkInit = setTimeout(() => {
      const loading = document.getElementById('admin-loading');
      if (loading && loading.parentNode) {
        if (document.body.children.length === 1 && document.body.children[0].id === 'admin-loading') {
          console.error('Admin panel failed to initialize');
          loading.innerHTML = '<div style="padding: 2rem; text-align: center;"><h1 style="color: #dc3545;">Admin Panel Failed to Load</h1><p>Please check the browser console (F12) for error messages.</p><p><a href="/admin" style="color: #0d0d0d;">Reload Page</a></p></div>';
        }
      }
    }, 500);

    return () => {
      clearTimeout(checkInit);
    };
  }, []);

  return (
    <div id="admin-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Loading Admin Panel...</h2>
        <p>Please wait while the admin panel initializes.</p>
      </div>
    </div>
  );
}
