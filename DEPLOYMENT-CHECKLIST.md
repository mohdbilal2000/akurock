# Production Deployment Checklist — akurock.com

## Pre-Deployment

- [x] Next.js build passes (`npx next build` — zero errors)
- [x] Standalone output mode configured (`output: 'standalone'`)
- [x] Image optimization disabled for shared hosting (`unoptimized: true`)
- [x] Domain set to `akurock.com` in sitemap, robots, metadata, canonical URLs
- [x] Security headers configured (CSP, HSTS, X-Frame-Options)
- [x] Admin panel protected (HTTP Basic Auth via `ADMIN_PASSWORD`)
- [x] API rate limiting active (quotation: 5/min, admin: 20/min, newsletter: 3/min)
- [x] Input sanitization on all form endpoints
- [x] GDPR cookie consent banner (blocks GA4 until accepted)
- [x] EU ODR link in footer (all 3 languages)
- [x] Custom 404 pages (root + locale-aware)
- [x] XML sitemap with ~72 URLs and hreflang alternates
- [x] robots.txt disallows /admin, /api/, /_next/
- [x] JSON-LD structured data (LocalBusiness, Product, BreadcrumbList, FAQPage)
- [x] GA4 with Consent Mode v2 (denied by default)
- [x] WhatsApp widget, social share, newsletter handler
- [x] Deploy script created (`bash deploy.sh`)
- [x] `.env.example` documents all environment variables

## DNS (Hostinger)

- [x] A record: `@` → `2.57.91.91`
- [x] CNAME: `www` → `akurock.com`
- [ ] SSL certificate enabled (hPanel → SSL)

## Environment Variables to Set on Hostinger

| Variable | Purpose | Required |
|----------|---------|----------|
| `NODE_ENV` | Must be `production` | Yes |
| `ADMIN_PASSWORD` | Protects /admin and /api/admin/* | Yes |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 tracking | When ready |
| `DATABASE_URL` | PostgreSQL connection string | When adding DB |
| `NEXTAUTH_SECRET` | Session encryption key | When adding auth |

## Deployment Steps

See **QUICK-DEPLOY.md** for step-by-step instructions.

```bash
# Build & package
bash deploy.sh

# Upload deploy-ready/ contents to Hostinger public_html/
# Set env vars in hPanel
# Restart Node.js application
```

## Post-Deployment Verification

- [ ] Homepage loads at `https://www.akurock.com`
- [ ] Language switcher works (DE/EN/ES)
- [ ] Product pages load with images
- [ ] Add-to-cart works (cart drawer opens)
- [ ] Quotation form submits successfully
- [ ] `/admin` prompts for HTTP Basic Auth
- [ ] `/sitemap.xml` returns valid XML
- [ ] `/robots.txt` returns correct content
- [ ] Non-existent page shows branded 404
- [ ] Cookie consent banner appears on first visit
- [ ] WhatsApp widget visible bottom-left
- [ ] Response headers include CSP, HSTS, X-Frame-Options
- [ ] Mobile layout renders correctly
- [ ] All 3 locales work (de/en/es URLs)
- [ ] SSL certificate active (padlock in browser)

## Post-Launch

- [ ] Submit sitemap to Google Search Console (`https://www.akurock.com/sitemap.xml`)
- [ ] Set up Google Analytics 4 property and add Measurement ID
- [ ] Test GA4 events: page views, add_to_cart, generate_lead, newsletter_signup
- [ ] Monitor error logs (hPanel → Error Logs)
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Verify Google indexes pages (Search Console → Coverage)
