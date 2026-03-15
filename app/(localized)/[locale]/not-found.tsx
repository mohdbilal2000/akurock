export default function LocaleNotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 20px',
      fontFamily: '"Playfair Display", Georgia, serif',
    }}>
      <h1 style={{
        fontSize: '96px',
        fontWeight: 700,
        margin: 0,
        color: '#0d0d0d',
        lineHeight: 1,
      }}>404</h1>

      <h2 id="nf-subtitle" style={{
        fontSize: '22px',
        fontWeight: 400,
        marginTop: '16px',
        color: '#333',
      }}>
        Diese Seite wurde nicht gefunden
      </h2>

      <p id="nf-description" style={{
        fontSize: '15px',
        color: '#666',
        marginTop: '12px',
        maxWidth: '420px',
        lineHeight: 1.6,
      }}>
        Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
      </p>

      <div style={{
        marginTop: '32px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <a id="nf-home" href="/de" style={{
          padding: '12px 28px',
          backgroundColor: '#0d0d0d',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: '"Playfair Display", Georgia, serif',
        }}>
          Zur Startseite
        </a>
        <a id="nf-products" href="/de/stein-selektion" style={{
          padding: '12px 28px',
          border: '1px solid #0d0d0d',
          color: '#0d0d0d',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: '"Playfair Display", Georgia, serif',
        }}>
          Produkte entdecken
        </a>
      </div>

      {/* Client-side locale detection to show correct language */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var locale = window.__LOCALE__ || 'de';
          var t = {
            de: { sub: 'Diese Seite wurde nicht gefunden', desc: 'Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.', home: 'Zur Startseite', products: 'Produkte entdecken' },
            en: { sub: 'Page not found', desc: 'The page you are looking for does not exist or has been moved.', home: 'Go to Homepage', products: 'Browse Products' },
            es: { sub: 'Pagina no encontrada', desc: 'La pagina que busca no existe o ha sido movida.', home: 'Ir al inicio', products: 'Explorar productos' },
          };
          var strings = t[locale] || t.de;
          var slugs = {
            de: { home: '/de', products: '/de/stein-selektion' },
            en: { home: '/en', products: '/en/our-stones' },
            es: { home: '/es', products: '/es/nuestras-piedras' },
          };
          var links = slugs[locale] || slugs.de;

          document.getElementById('nf-subtitle').textContent = strings.sub;
          document.getElementById('nf-description').textContent = strings.desc;
          var homeEl = document.getElementById('nf-home');
          homeEl.textContent = strings.home;
          homeEl.href = links.home;
          var productsEl = document.getElementById('nf-products');
          productsEl.textContent = strings.products;
          productsEl.href = links.products;
        })();
      `}} />
    </div>
  );
}
