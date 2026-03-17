# Akurock.com — SEO / AEO / GEO Master Plan

## Current State: 7/10 — Good foundation, major gaps in content signals and structured data

---

## COMPETITIVE LANDSCAPE (Research Summary)

**Direct competitors:**
- **Slate-Lite** (slate-lite.com) — Only real competitor for "natural stone acoustic panels". Has localized DE/ES/US domains. BUT they don't manufacture in Austria.
- **WoodUpp** (woodupp.de) — Major player but wood-only, not stone. Has strong FAQ pages and Trustpilot reviews.
- **Audimute AcoustiStone** (US) — Faux-stone panels, NRC 0.95. Strong US presence.

**Akurock's unique advantage:** The ONLY Austrian manufacturer combining 100% real natural stone with acoustic technology. No competitor occupies this exact niche.

**Market gaps identified:**
1. **Spanish market** — virtually zero competition for "paneles acústicos piedra natural". First-mover advantage available.
2. **Room calculator** — no German-language acoustic panel site has one. Multiple English competitors do (Audimute, GIK Acoustics, Acoustimac).
3. **Comparison content** — nobody has "Naturstein vs Holz Akustikpaneele" in German.
4. **Buying guides** — "Akustikpaneele kaufen Ratgeber" is underserved.

**Important: FAQ schema update (Aug 2023):** Google no longer shows FAQ rich snippets for commercial sites. FAQ content still helps AEO (AI answers) but won't display as expandable results in SERPs. Focus Review/Product schema for visible SERP features instead.

**AEO stats:** AI search expected to capture 25% of search volume by late 2026. Content with proper schema has 2.5x higher chance of appearing in AI-generated answers. Zero-click searches reached ~69% in 2025.

---

## PHASE 1: CRITICAL FIXES (Immediate Impact)

### 1.1 — Fix 600+ Empty Image Alt Texts Across All HTML Templates

**Problem:** 36 empty `alt=""` on homepage, 86 on FAQ, 66 on product template — total ~600 across 23 templates. Google cannot index these images. AI assistants cannot understand them. Accessibility is broken.

**Fix:** Add descriptive, keyword-rich alt texts to every image in every HTML template. Examples:
- Nav logo: `alt="stonearts® — Naturstein Akustikpaneele"`
- Product slider images: `alt="Akurock Brush Akustikpaneel an Wohnzimmerwand — cremefarbener Sandstein"`
- Social icons: keep `alt=""` (decorative, correct)
- Installation photos: `alt="DIY-Montage eines Akurock-Akustikpaneels — Paneel wird an Wand geklebt"`

**Files:** All 23 HTML files in `public/html/`

**Impact:** Image SEO, accessibility, AEO (AI can understand images), Core Web Vitals

---

### 1.2 — Fix Product Template: 4 H1 Tags → 1 H1

**Problem:** `detail_product.html` has 4 `<h1>` tags (lines 893, 1311, 1697, 1838) all saying "Akurock" or "AKUROCK". Google expects exactly 1 H1 per page.

**Fix:** Keep 1 H1 with the product name (e.g., "Akurock Brush — Cremefarbener Sandstein Akustikpaneel"). Change the other 3 to `<h2>` or `<span>`.

**Files:** `public/detail_product_template.html`

**Impact:** On-page SEO signal clarity, heading hierarchy

---

### 1.3 — Add Product-Level JSON-LD Schema to Product Template

**Problem:** Product pages have JSON-LD generated in `page.tsx` but the template HTML itself doesn't contribute. The generated schema is good but missing `Review` objects and `AggregateRating` tied to individual products.

**Fix:** Already partially done in `page.tsx`. Verify that the rendered output includes:
- `@type: Product` with `name`, `description`, `image`, `sku`, `brand`
- `offers` with `price`, `priceCurrency`, `availability`, `priceValidUntil`
- `aggregateRating` with `ratingValue`, `reviewCount`
- `review` array (even if just 1-2 sample reviews per product)

**Files:** `app/(localized)/[locale]/product/[slug]/page.tsx`

**Impact:** Rich snippets in Google (price, rating stars, availability), AEO

---

## PHASE 2: STRUCTURED DATA & AEO (Rich Snippets + AI Answers)

### 2.1 — Add Review/Testimonial Schema

**Problem:** No individual reviews in structured data. Only a global `aggregateRating` (4.9/5, 30 reviews) exists in the layout. Google shows star ratings in SERPs when Review schema is present.

**Fix:** Add 2-3 real customer reviews per product as `Review` objects inside the Product schema. Example:
```json
{
  "@type": "Review",
  "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
  "author": { "@type": "Person", "name": "Thomas W." },
  "reviewBody": "Brush sieht fantastisch aus in unserem Wohnzimmer. Die Montage war einfacher als erwartet."
}
```

**Files:** `app/(localized)/[locale]/product/[slug]/page.tsx`, `public/data/mock-cms-data.json`

**Impact:** Star ratings in Google SERPs, trust signals, AEO (AI cites reviews)

---

### 2.2 — Add SpeakableSpecification for AEO

**Problem:** AI assistants (Google Assistant, Alexa, Siri) don't know which parts of the page to read aloud.

**Fix:** Add `speakable` property to WebPage schema on key pages:
```json
{
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".hero-description", ".product-description", ".faq-answer"]
  }
}
```

**Files:** `app/(localized)/[locale]/layout.tsx`, content page schemas

**Impact:** Voice search, AI assistant answers

---

### 2.3 — Add VideoObject Schema to Installation Guide

**Problem:** The installation guide page references a video tutorial but has no VideoObject schema. Google can show video thumbnails in SERPs.

**Fix:** Add VideoObject schema:
```json
{
  "@type": "VideoObject",
  "name": "How to Install Akurock Acoustic Panels",
  "description": "Step-by-step DIY installation guide...",
  "thumbnailUrl": "...",
  "uploadDate": "2024-01-01",
  "duration": "PT5M",
  "contentUrl": "..."
}
```

**Files:** `app/(localized)/[locale]/[...slug]/page.tsx`

**Impact:** Video rich snippets, YouTube visibility

---

### 2.4 — Optimize FAQ Content for Featured Snippets / AI Overviews

**Problem:** FAQ page has content but the Q&A pairs in schema are only 5 questions. Google shows up to 10. Competitors like WoodUpp have extensive FAQ sections.

**Fix:** Expand FAQ schema to 8-10 questions covering:
- "Wie schwer ist ein Akurock Paneel?" / "How heavy is an Akurock panel?"
- "Kann man Akurock in Badezimmern verwenden?" / "Can Akurock be used in bathrooms?"
- "Wie pflege ich meine Akurock Paneele?" / "How do I clean Akurock panels?"
- "Welche Wände sind geeignet?" / "What walls are suitable?"
- "Wie viele Paneele brauche ich?" / "How many panels do I need?"

Each answer should be 40-60 words — the ideal length for featured snippets.

**Files:** `app/(localized)/[locale]/[...slug]/page.tsx`, dictionaries

**Impact:** Featured snippets, AI overviews, AEO

---

## PHASE 3: GEO (Geographic/Local SEO)

### 3.1 — Add LocalBusiness Schema (Separate from Organization)

**Problem:** Only `Organization` schema exists. For local search (Google Maps, "acoustic panels near me"), `LocalBusiness` is needed.

**Fix:** Add `LocalBusiness` schema alongside Organization:
```json
{
  "@type": "LocalBusiness",
  "name": "stonearts® GmbH — Akurock Showroom",
  "address": { "streetAddress": "Spohrstraße 29/23/1", "addressLocality": "Wien", ... },
  "openingHoursSpecification": { "dayOfWeek": ["Monday", ...], "opens": "09:00", "closes": "17:00" },
  "hasMap": "https://maps.google.com/...",
  "priceRange": "€€"
}
```

**Files:** `app/(localized)/[locale]/layout.tsx`

**Impact:** Google Maps visibility, local pack, "near me" searches

---

### 3.2 — Emphasize "Made in Austria" / "Handgefertigt in Österreich" Across All Pages

**Problem:** Austrian manufacturing is mentioned in meta descriptions but NOT prominently in on-page content. This is a key differentiator.

**Fix:** Add visible "Handcrafted in Austria" badge/text in:
- Homepage hero section or below-the-fold section
- Every product page (near price)
- Footer (already has company info, add origin badge)
- About Us page (expand Vienna/Austria story)

This is a **content/copy change in the HTML templates**, not a code change.

**Files:** `public/html/index.html`, `public/detail_product_template.html`

**Impact:** Brand trust, local SEO, E-E-A-T, differentiation from Chinese/mass-produced alternatives

---

### 3.3 — Add Region-Specific Hreflang Tags

**Problem:** Current hreflang only targets language (de, en, es). Should also target regions:
- `de-AT` (Austrian German — primary market)
- `de-DE` (German German — secondary market)
- `de-CH` (Swiss German — secondary market)

**Fix:** Expand hreflang in layout.tsx to include region codes where applicable.

**Files:** `app/(localized)/[locale]/layout.tsx`

**Impact:** Regional search targeting, DACH market coverage

---

### 3.4 — Create "About stonearts® Vienna" Content

**Problem:** The About Us page is generic. No Vienna/Austria story that ties to local search.

**Fix:** Enhance the About Us page copy to include:
- "Designed in our Vienna studio" / "Entworfen in unserem Wiener Atelier"
- Stone sourcing story (India → Austria craftsmanship)
- Team photo alt texts with location
- Mention of Austrian quality standards

**Files:** `public/html/uber-uns.html`, dictionaries

**Impact:** E-E-A-T, local relevance, brand story

---

## PHASE 4: CONTENT & ON-PAGE SEO

### 4.1 — Optimize Generic Page Titles

**Problem:** Many HTML pages have generic, non-SEO-optimized `<title>` tags that the CMS/Webflow left behind. The Next.js `generateMetadata` overrides these, but the HTML `<title>` inside the template body can still leak.

**Current → Target:**
| Page | Current Title | Target Title (DE) |
|------|--------------|-------------------|
| FAQ | "Faq" | "Häufige Fragen zu Akurock Akustikpaneelen | stonearts®" |
| Gallery | "Gallery" | "Galerie & Inspiration — Akurock in echten Räumen | stonearts®" |
| Stone Selection | "Stone-Selection" | "Alle 6 Akurock Steinsorten im Überblick | stonearts®" |
| About Us | "Über uns" | "Über stonearts® — Handwerk aus Wien, Stein aus der Natur" |
| Installation | "Installation and Guide" | "Installationsanleitung — Akurock in 4 Schritten montieren" |

Note: The Next.js `generateMetadata` in `[...slug]/page.tsx` already sets proper titles via `SLUG_TO_TITLE`. These HTML `<title>` tags in the templates are likely overridden. **Verify this works correctly.**

**Files:** `app/(localized)/[locale]/[...slug]/page.tsx` (SLUG_TO_TITLE map)

**Impact:** CTR improvement in SERPs, keyword targeting

---

### 4.2 — Improve Internal Linking in HTML Templates

**Problem:** Pages don't cross-link enough. Product pages should link to installation guide, sample box, accessories. FAQ should link to products. Gallery should link to products.

**Fix:** Add contextual internal links:
- Product pages: "Need help installing? → Installation Guide" (already partially done)
- FAQ: Link answers to relevant product/installation pages
- Gallery: Link gallery items to specific product pages
- Acoustics page: Link to products with "Shop Akurock Brush →"
- Sample box: Link each stone to its product page

**Files:** HTML templates, possibly `translateHTML` function

**Impact:** Crawl depth, link equity distribution, user engagement

---

### 4.3 — Add Breadcrumb Navigation (Visible on Page)

**Problem:** BreadcrumbList schema exists in JSON-LD but no visible breadcrumbs on page. Visible breadcrumbs improve UX and CTR.

**Fix:** Add a simple breadcrumb bar above page content:
```
stonearts® > Unsere Steine > Akurock Brush
```

**Files:** `public/detail_product_template.html`, CSS

**Impact:** UX, CTR, navigation signals

---

### 4.4 — Add "Comparison" Content to Acoustics Page

**Problem:** No comparison content exists. Users searching "Akustikpaneele Vergleich" or "Holz vs Stein Akustikpaneel" find nothing from akurock.com.

**Fix:** Add a comparison section to the acoustics page or create a new page:
- Akurock (natural stone) vs wood acoustic panels
- Akurock vs polyester felt panels
- Comparison table: weight, sound class, durability, aesthetics, price

**Files:** New content in `public/html/akustik.html` or new HTML file

**Impact:** Long-tail keywords, buying decision content, featured snippets

---

## PHASE 5: TECHNICAL SEO

### 5.1 — Add `www` → Non-`www` Canonical Redirect (or vice versa)

**Problem:** Both `akurock.com` and `www.akurock.com` might serve content. Canonical URLs point to `www.akurock.com`. Need to ensure the redirect is consistent.

**Fix:** Add redirect in `proxy.ts`:
```typescript
if (hostname === 'akurock.com') {
  return NextResponse.redirect(new URL(`https://www.akurock.com${pathname}`, request.url), 301);
}
```

**Files:** `proxy.ts`

**Impact:** Prevent duplicate content, consolidate link equity

---

### 5.2 — Add Proper Cache Headers for HTML Pages

**Problem:** HTML pages don't have explicit cache headers. Hostinger CDN may cache aggressively (as we saw with the IM & Associates issue).

**Fix:** Add `Cache-Control` headers for HTML:
```
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

**Files:** `next.config.ts`

**Impact:** Performance, CDN behavior control

---

### 5.3 — Add `X-Robots-Tag` Headers for Non-Indexable Routes

**Problem:** Legal/privacy/terms pages are blocked in robots.txt but don't have `noindex` headers. Belt-and-suspenders approach.

**Fix:** Add `X-Robots-Tag: noindex` header for `/*/allgemeine-geschaeftsbedingungen/*`, `/*/impressum/*`, etc.

**Files:** `next.config.ts` or `proxy.ts`

**Impact:** Crawl budget optimization

---

### 5.4 — Fix Sitemap lastModified Dates

**Problem:** All sitemap entries use `new Date()` (today's date). This tells Google everything changed today, every day. Google may reduce crawl frequency because the dates are unreliable.

**Fix:** Use actual content modification dates or at least static dates per page.

**Files:** `app/sitemap.ts`

**Impact:** Crawl budget, freshness signals

---

## PHASE 6: MULTILINGUAL SEO (EN & ES Markets)

### 6.1 — Localize Product SEO Titles/Descriptions in CMS Data

**Problem:** `mock-cms-data.json` has `seo_title` and `seo_description` only in German. English and Spanish product pages fall back to generated titles.

**Fix:** Add `seo_title_en`, `seo_title_es`, `seo_description_en`, `seo_description_es` fields to each product in `mock-cms-data.json`. Then update `page.tsx` to use them.

Example for Brush:
- EN: "Akurock Brush — Cream Sandstone Acoustic Panel | stonearts®"
- ES: "Akurock Brush — Panel Acústico de Arenisca Crema | stonearts®"

**Files:** `public/data/mock-cms-data.json`, `app/(localized)/[locale]/product/[slug]/page.tsx`

**Impact:** International SEO, localized SERP appearance

---

### 6.2 — Localize Product Descriptions in CMS Data

**Problem:** Product `description` field in CMS is German-only. English/Spanish product pages show German descriptions.

**Fix:** Add `description_en` and `description_es` fields for each product. The product template rendering should pick the right locale.

**Files:** `public/data/mock-cms-data.json`, translation logic

**Impact:** User experience, international conversion, multilingual SEO

---

## PRIORITY ORDER (Effort vs. Impact)

| Priority | Task | Effort | SEO Impact | AEO Impact | GEO Impact |
|----------|------|--------|------------|------------|------------|
| 1 | Fix 600+ empty alt texts | HIGH | HIGH | HIGH | LOW |
| 2 | Fix product H1 (4→1) | LOW | HIGH | LOW | LOW |
| 3 | Add Review schema | MEDIUM | HIGH | MEDIUM | LOW |
| 4 | Expand FAQ schema (5→10 questions, all locales) | MEDIUM | HIGH | HIGH | LOW |
| 5 | Add www redirect | LOW | MEDIUM | LOW | LOW |
| 6 | Add LocalBusiness schema | LOW | LOW | LOW | HIGH |
| 7 | Localize CMS product SEO titles/descriptions | MEDIUM | HIGH | MEDIUM | LOW |
| 8 | Add visible breadcrumbs | MEDIUM | MEDIUM | LOW | LOW |
| 9 | Add region-specific hreflang (de-AT, de-DE, de-CH) | LOW | MEDIUM | LOW | HIGH |
| 10 | Enhance "Made in Austria" messaging | LOW | LOW | LOW | HIGH |
| 11 | Add SpeakableSpecification | LOW | LOW | HIGH | LOW |
| 12 | Add VideoObject schema | LOW | MEDIUM | MEDIUM | LOW |
| 13 | Fix sitemap lastModified | LOW | MEDIUM | LOW | LOW |
| 14 | Add comparison content | HIGH | HIGH | HIGH | LOW |
| 15 | Improve internal linking | MEDIUM | MEDIUM | LOW | LOW |

---

## WHAT I CAN IMPLEMENT NOW (Code Changes Only)

Everything above that involves changing code files:
- Phase 1: Alt texts (HTML templates), H1 fix, product schema verification
- Phase 2: Review schema, SpeakableSpecification, VideoObject, FAQ expansion
- Phase 3: LocalBusiness schema, hreflang expansion, www redirect
- Phase 4: Title optimization (already done in generateMetadata)
- Phase 5: Cache headers, X-Robots-Tag, sitemap dates
- Phase 6: CMS data localization

**Cannot implement from code:** Google Business Profile setup, actual customer reviews (need real data), Google Search Console verification code, Hostinger CDN purge settings.
