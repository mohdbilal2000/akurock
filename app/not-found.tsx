export default function RootNotFound() {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>404 - Seite nicht gefunden | stonearts&reg;</title>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, backgroundColor: '#fafafa' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 20px',
          fontFamily: '"Playfair Display", Georgia, serif',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <a href="/de" style={{ textDecoration: 'none', color: '#0d0d0d' }}>
              <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                stonearts&reg;
              </span>
            </a>
          </div>
          <h1 style={{ fontSize: '96px', fontWeight: 700, margin: 0, color: '#0d0d0d', lineHeight: 1 }}>
            404
          </h1>
          <h2 style={{ fontSize: '22px', fontWeight: 400, marginTop: '16px', color: '#333' }}>
            Diese Seite wurde nicht gefunden
          </h2>
          <p style={{ fontSize: '15px', color: '#666', marginTop: '12px', maxWidth: '420px', lineHeight: 1.6 }}>
            Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
          </p>
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/de" style={{
              padding: '12px 28px', backgroundColor: '#0d0d0d', color: '#fff',
              textDecoration: 'none', borderRadius: '4px', fontSize: '14px',
              fontFamily: '"Playfair Display", Georgia, serif',
              transition: 'opacity 0.2s',
            }}>Zur Startseite</a>
            <a href="/de/stein-selektion" style={{
              padding: '12px 28px', border: '1px solid #0d0d0d', color: '#0d0d0d',
              textDecoration: 'none', borderRadius: '4px', fontSize: '14px',
              fontFamily: '"Playfair Display", Georgia, serif',
              transition: 'opacity 0.2s',
            }}>Produkte entdecken</a>
          </div>
          <div style={{ marginTop: '40px', fontSize: '13px', color: '#999' }}>
            <a href="/en" style={{ color: '#999', textDecoration: 'underline', marginRight: '12px' }}>English</a>
            <a href="/es" style={{ color: '#999', textDecoration: 'underline' }}>Espa&ntilde;ol</a>
          </div>
        </div>
      </body>
    </html>
  );
}
