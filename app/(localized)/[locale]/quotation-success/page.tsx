'use client';

import { useParams } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

export default function QuotationSuccessPage() {
  const params = useParams();
  const locale = (params?.locale as string || 'de') as Locale;
  const t = getDictionary(locale);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '48px', maxWidth: '600px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#155724" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '16px', color: '#0d0d0d' }}>{t['quotationSuccess.title']}</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>{t['quotationSuccess.message']}</p>
        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}><strong>{t['quotationSuccess.whatNext']}</strong></p>
          <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px', margin: 0 }}>
            <li>{t['quotationSuccess.step1']}</li>
            <li>{t['quotationSuccess.step2']}</li>
            <li>{t['quotationSuccess.step3']}</li>
            <li>{t['quotationSuccess.step4']}</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <a href={`/${locale}`} style={{ padding: '12px 24px', backgroundColor: '#f24616', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, display: 'inline-block' }}>{t['quotationSuccess.continueShopping']}</a>
          <a href={`/${locale}/kontaktier-uns`} style={{ padding: '12px 24px', backgroundColor: 'transparent', color: '#f24616', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, border: '2px solid #f24616', display: 'inline-block' }}>{t['quotationSuccess.contactUs']}</a>
        </div>
      </div>
    </div>
  );
}
