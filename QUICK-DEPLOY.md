# Quick Deploy — akurock.com on Hostinger Shared Hosting

## Prerequisites

- Hostinger Premium or Business shared hosting plan (Node.js support)
- Domain `akurock.com` pointed to Hostinger (already done)
- Node.js 18+ installed locally for building

---

## Step 1: Build the deployment package

On your local machine, in the project root:

```bash
bash deploy.sh
```

This creates a `deploy-ready/` folder with everything Hostinger needs.

---

## Step 2: Set up Node.js on Hostinger

1. Log in to **hPanel** → your hosting dashboard
2. Go to **Website** → **Advanced** → **Node.js**
3. Click **Create Application**
4. Configure:
   - **Node.js version**: 18.x or 20.x
   - **Application root**: `public_html` (or your domain's document root)
   - **Application startup file**: `app.js`
   - **Application URL**: `https://www.akurock.com`
5. Click **Create**

---

## Step 3: Upload files

Upload everything inside `deploy-ready/` to your Hostinger **application root** (`public_html/`):

**Option A — hPanel File Manager:**
1. Open **File Manager** in hPanel
2. Navigate to `public_html/`
3. Delete existing files (back up first if needed)
4. Upload all contents of `deploy-ready/` here

**Option B — SSH (faster for large uploads):**
```bash
# Zip the deployment package
cd deploy-ready && zip -r ../akurock-deploy.zip . && cd ..

# Upload via SCP
scp akurock-deploy.zip u123456789@your-server-ip:~/public_html/

# SSH in and unzip
ssh u123456789@your-server-ip
cd ~/public_html
unzip akurock-deploy.zip -o
rm akurock-deploy.zip
```

**Option C — Git (if configured on Hostinger):**
```bash
git push hostinger main
# Then SSH in to build, or use deploy.sh output
```

---

## Step 4: Set environment variables

In hPanel → **Node.js application** → **Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `ADMIN_PASSWORD` | `your-strong-password` | Yes |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Optional |

> Without `ADMIN_PASSWORD`, the admin panel returns 503.
> Without `GA_MEASUREMENT_ID`, analytics simply won't load (no errors).

---

## Step 5: Restart and verify

1. In hPanel → Node.js → click **Restart Application**
2. Visit `https://www.akurock.com` — homepage should load
3. Test these URLs:
   - `https://www.akurock.com/de` — German homepage
   - `https://www.akurock.com/en` — English homepage
   - `https://www.akurock.com/sitemap.xml` — XML sitemap
   - `https://www.akurock.com/robots.txt` — Robots file
   - `https://www.akurock.com/admin` — Should prompt for password
   - `https://www.akurock.com/de/nonexistent` — Should show 404 page

---

## DNS (already configured)

Your DNS at Hostinger is already set:
- **A record**: `@` → `2.57.91.91`
- **CNAME**: `www` → `akurock.com`

Make sure **SSL** is enabled (hPanel → SSL → enable free SSL certificate).

---

## Troubleshooting

**Site shows "503 Service Unavailable":**
- Check Node.js app is running in hPanel
- Check startup file is set to `app.js`
- Look at error logs: hPanel → Files → Error Logs

**Admin returns 503:**
- Set `ADMIN_PASSWORD` environment variable and restart

**Static files (images, CSS) not loading:**
- Verify `public/` folder exists inside your application root
- Verify `.next/static/` folder exists inside your application root

**Site loads but pages are blank:**
- Check Node.js version is 18+ in hPanel
- Check error logs for startup failures

---

## File structure on Hostinger

After upload, `public_html/` should look like:

```
public_html/
  app.js              ← Hostinger startup (loads server.js)
  server.js           ← Next.js standalone server
  .htaccess           ← Passenger config
  package.json
  .next/
    static/           ← CSS/JS chunks
    server/           ← Server-side code
  public/
    images/           ← Product images
    fonts/            ← Web fonts
    js/               ← Client JS (cart, widgets)
    css/              ← Stylesheets
    html/             ← Webflow HTML templates
    videos/           ← Video files
    data/             ← CMS data
  node_modules/       ← Minimal production deps
  lib/                ← i18n + utilities
  app/                ← Next.js app router
```
