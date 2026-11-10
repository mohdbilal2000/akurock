# SEO / AEO / GEO — task list for the SEO person

Site: https://www.akurock.com (German default, English, Spanish). Written 2026-11-10.
Everything here is free unless marked. Work top to bottom: section 0 blocks most of the rest.

## 0. Blockers — need the owner's decision first (see OWNER-QUESTIONS.md)

- [ ] **Business identity.** The site's schema, `llms.txt`, titles and footer present the seller as "stonearts® GmbH, Spohrstraße 29/23/1, 1130 Wien", while the contact is an Indian phone number and a Gmail address. Until the owner confirms which legal entity sells, do **not** build citations or directory listings: name, address and phone (NAP) must be identical everywhere, and they are not yet settled.
- [ ] **Rating markup.** Every page carries `AggregateRating` 4.9 / 30 reviews. Find the 30 reviews it refers to. If they are not visible on the site and attributable, the markup must be removed (Google's review-snippet policy; risk of a manual action).
- [ ] **Target market.** Europe (DACH, € pricing) or India (₹, WhatsApp)? Keyword research, directories and content below differ completely.

## 1. Set up measurement (week 1)

- [ ] Google Search Console: verify the domain property, submit `https://www.akurock.com/sitemap.xml` (61 URLs).
- [ ] Bing Webmaster Tools: import from Search Console, submit the sitemap. Bing's index feeds ChatGPT Search and Copilot.
- [ ] IndexNow is wired in: run `npm run seo:indexnow` after every content change (or ask the developer to run it on deploy).
- [ ] Confirm GA4 is receiving data; mark as key events: WhatsApp click, quotation form submit, add-to-cart, visualizer "quote on WhatsApp".
- [ ] Microsoft Clarity (free heatmaps and session recordings) — needs a developer to add the tag and allow it in the Content-Security-Policy.
- [ ] Record a baseline: indexed pages, impressions, clicks, top 20 queries, Core Web Vitals (PageSpeed Insights for `/de`, `/en`, one product page, `/visualizer`).

## 2. On-site (content — the technical base is already in place)

Already done, do not redo: unique titles and descriptions, canonical tags, de/en/es hreflang with x-default, XML sitemap, robots.txt that admits AI crawlers, one H1 per page, Product / FAQPage / HowTo / BreadcrumbList / LocalBusiness schema, `llms.txt`, share images on every page, WebApplication schema on the visualizer. The empty `alt=""` attributes are all decorative icons (arrows, social icons) and are correct as they are.

- [ ] Keyword map: one primary query per page, per language. Start from Search Console queries once data exists; until then use Google autocomplete, "People also ask" and Keyword Planner.
- [ ] Rewrite the six product pages so each has unique copy (stone origin, colour, where it suits, maintenance). Check they are not near-duplicates of each other.
- [ ] Comparison pages (nobody ranks for these in German): natural stone vs wood acoustic panels; acoustic panels vs acoustic foam; real stone veneer vs printed panels.
- [ ] Buyer guides: price per m² and per wall; how many panels for a wall (link the visualizer); installation on plaster, concrete, drywall; bathroom and kitchen use; cleaning and care.
- [ ] Room pages: living room, bedroom, home office, home cinema, restaurant, office — each with real project photos.
- [ ] Technical data page: dimensions, weight, absorption coefficients by frequency, fire class, test certificates as downloadable PDFs. Answer engines quote tables and certificates.
- [ ] Blog: two articles a month answering one real question each. Put the answer in the first two sentences, then the detail.
- [ ] Internal links: every article links to one product and to the visualizer; every product links to the installation guide and the FAQ.
- [ ] Spanish market has almost no competition for "paneles acústicos piedra natural": prioritise Spanish versions of the guides.
- [ ] If India is a target: English (India) pages with ₹ prices, GST note, delivery cities, and city landing pages only where there is real delivery or installation.

## 3. Off-site

- [ ] Google Business Profile for the real business address: categories, photos of real installations, products, weekly posts, Q&A. Ask every customer for a review.
- [ ] Reviews on a third-party platform (Google, Trustpilot free tier). Replace the unverifiable rating markup with these.
- [ ] Directories with identical NAP — Europe: Houzz, Architonic, Archiproducts, Homify, Europages. India: IndiaMART, TradeIndia, JustDial, Houzz India.
- [ ] Pinterest and Instagram: one board/collection per stone finish and per room type; every pin links to the matching page.
- [ ] YouTube: installation video, before/after of real walls, a 30-second visualizer demo. Embed each on the matching page.
- [ ] Architects and interior designers: send sample boxes; ask for a project page on their site linking back.
- [ ] Digital PR: pitch "the first wall visualizer that runs entirely in your browser" and the stone-sourcing story to interior, architecture and acoustics blogs.
- [ ] Backlink check monthly (Search Console links report; free tiers of Ahrefs Webmaster Tools / Bing). Disavow only if there is a manual action.

## 4. AEO — being the answer in Google AI Overviews, voice and featured snippets

- [ ] Every page opens with a 40–60 word direct answer to the query it targets.
- [ ] Question-form H2s matching how people ask ("How much do stone acoustic panels cost per m²?").
- [ ] Keep FAQ answers under ~50 words, factual, with numbers and units.
- [ ] Add tables for anything comparable (finish × colour × stone × price; absorption by frequency).
- [ ] Add a visible "last updated" date to guides and keep them updated.
- [ ] Add named authorship and an "about the author/company" block to guides (experience and expertise signals).

## 5. GEO — being cited by ChatGPT, Gemini, Perplexity, Claude

- [ ] After section 0 is settled, update `public/llms.txt` with the confirmed legal entity, address, markets and prices (developer task; 10 minutes).
- [ ] Get the brand mentioned on sites these models read: Reddit (r/HomeImprovement, r/audiophile, r/InteriorDesign), Quora, Houzz discussions, architecture forums. Answer real questions; no drive-by links.
- [ ] Publish original data only this business has: measured absorption results, a price-per-m² guide, a stone-origin explainer. Models cite primary sources.
- [ ] A Wikidata entry for the brand once there is independent press coverage to reference.
- [ ] Monthly check: ask ChatGPT, Gemini, Perplexity and Copilot the top 10 buyer questions; record whether Akurock is named and which sources they cite; target those sources.

## 6. Monthly report to the owner

Impressions, clicks, average position, indexed pages, top queries and pages, enquiries by source (WhatsApp, form, cart), new reviews, new referring domains, AI-answer mentions, and next month's three priorities.
