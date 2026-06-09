'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  dimensions?: string;
  variant?: string;
}

export default function QuotationPage() {
  const params = useParams();
  const locale = (params?.locale as string || 'de') as Locale;
  const t = getDictionary(locale);

  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 768;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', address: '', city: '', postalCode: '',
    country: '', message: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cartData = localStorage.getItem('stonearts_cart');
      if (cartData) {
        try {
          const cart = JSON.parse(cartData);
          if (cart.items && Array.isArray(cart.items)) {
            setCartItems(cart.items);
            const calculatedTotal = cart.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
            setTotal(calculatedTotal);
          }
        } catch (error) {
          console.error('Error loading cart:', error);
        }
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const quotationData = { ...formData, cartItems, total, submittedAt: new Date().toISOString() };
      const quotations = JSON.parse(localStorage.getItem('stonearts_quotations') || '[]');
      quotations.push({ id: `quote-${Date.now()}`, ...quotationData });
      localStorage.setItem('stonearts_quotations', JSON.stringify(quotations));
      setSubmitStatus('success');

      // GA4: track generate_lead conversion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (typeof win.gtag === 'function') {
        win.gtag('event', 'generate_lead', {
          currency: 'EUR',
          value: total,
          items: cartItems.map(item => ({
            item_id: item.id,
            item_name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        });
      }

      localStorage.removeItem('stonearts_cart');
      setTimeout(() => { window.location.href = `/${locale}/quotation-success`; }, 3000);
    } catch (error) {
      console.error('Error submitting quotation:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : locale === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency', currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="quotation-page" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Branded header — gives the quotation page site navigation (logo links home) */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#faf8f7', borderBottom: '1px solid #ececec', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href={`/${locale}`} aria-label="stonearts® Akurock — Home" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img src="/images/stonearts-logo-black-long.svg" alt="stonearts® Akurock" style={{ height: '26px', width: 'auto' }} />
        </a>
        <a href={`/${locale}`} style={{ color: '#0d0d0d', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>← {t['nav.shop'] || 'Shop'}</a>
      </header>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '24px' : '40px', padding: isMobile ? '20px' : '40px 20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px', color: '#0d0d0d' }}>{t['quotation.title']}</h1>
          <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px' }}>{t['quotation.subtitle']}</p>

          {submitStatus === 'success' && (
            <div style={{ padding: '20px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', marginBottom: '24px', color: '#155724' }}>
              <strong>{t['quotation.thankYou']}</strong> {t['quotation.successMsg']}
            </div>
          )}
          {submitStatus === 'error' && (
            <div style={{ padding: '20px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', marginBottom: '24px', color: '#721c24' }}>
              <strong>Error!</strong> {t['quotation.errorMsg']}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.firstName']}</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.lastName']}</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.email']}</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.phone']}</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.company']}</label>
              <input type="text" name="company" value={formData.company} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.address']}</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.city']}</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.postalCode']}</label>
                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.country']}</label>
              <input type="text" name="country" value={formData.country} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>{t['quotation.message']}</label>
              <textarea name="message" value={formData.message} onChange={handleInputChange} rows={4} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontFamily: 'inherit', resize: 'vertical' }} placeholder={t['quotation.messagePlaceholder']} />
            </div>
            <button type="submit" disabled={isSubmitting || cartItems.length === 0} style={{ padding: '16px 32px', backgroundColor: isSubmitting || cartItems.length === 0 ? '#ccc' : '#f24616', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: isSubmitting || cartItems.length === 0 ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', marginTop: '8px' }}>
              {isSubmitting ? t['quotation.submitting'] : t['quotation.submit']}
            </button>
          </form>
        </div>
        <div>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', position: 'sticky', top: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#0d0d0d' }}>{t['quotation.orderSummary']}</h2>
            {cartItems.length === 0 ? (
              <p style={{ color: '#666' }}>{t['quotation.emptyCart']}</p>
            ) : (
              <>
                <div style={{ marginBottom: '24px' }}>
                  {cartItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: '1px solid #eee' }}>
                      {item.image && <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: '#0d0d0d' }}>{item.name}</h3>
                        {item.variant && <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>{item.variant}</p>}
                        {item.dimensions && <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>{item.dimensions}</p>}
                        <p style={{ fontSize: '14px', color: '#666' }}>{t['quotation.quantity']}: {item.quantity}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#0d0d0d' }}>{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: '24px', borderTop: '2px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 600, color: '#0d0d0d' }}>Total</span>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#0d0d0d' }}>{formatPrice(total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
