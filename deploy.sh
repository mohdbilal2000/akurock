#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# deploy.sh — Build & package Next.js standalone for Hostinger
# ─────────────────────────────────────────────────────────────
# Usage:  bash deploy.sh
# Output: deploy-ready/  folder — upload its contents to Hostinger
# ─────────────────────────────────────────────────────────────
set -euo pipefail

echo "╔═══════════════════════════════════════════════╗"
echo "║  akurock.com — Hostinger Deployment Builder   ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# ── Step 1: Install dependencies ──
echo "→ Installing dependencies..."
npm ci --prefer-offline 2>/dev/null || npm install
echo "  ✓ Dependencies installed"

# ── Step 2: Build the Next.js standalone app ──
echo "→ Building Next.js (standalone mode)..."
npx next build
echo "  ✓ Build complete"

# ── Step 3: Package the standalone output ──
DEPLOY_DIR="deploy-ready"
echo "→ Packaging standalone into ${DEPLOY_DIR}/..."

# Clean previous deploy
rm -rf "${DEPLOY_DIR}"

# Copy the standalone server (handles nested worktree paths gracefully)
STANDALONE_ROOT=".next/standalone"
# Find the server.js inside standalone (may be nested if built from a worktree)
SERVER_JS=$(find "${STANDALONE_ROOT}" -maxdepth 5 -name "server.js" \
  ! -path "*/node_modules/*" -type f | head -1)

if [ -z "$SERVER_JS" ]; then
  echo "  ✗ ERROR: server.js not found in .next/standalone/"
  exit 1
fi

# The server's parent directory is the effective app root
APP_ROOT=$(dirname "$SERVER_JS")
echo "  Found server at: ${SERVER_JS}"

# Copy the standalone app
cp -r "${APP_ROOT}" "${DEPLOY_DIR}"

# ── Step 4: Copy static assets (Next.js standalone DOESN'T include these) ──
echo "→ Copying static assets..."

# public/ → deploy-ready/public/
if [ -d "public" ]; then
  cp -r public "${DEPLOY_DIR}/public"
  echo "  ✓ public/ copied (images, fonts, js, css, html, videos)"
fi

# .next/static/ → deploy-ready/.next/static/
if [ -d ".next/static" ]; then
  mkdir -p "${DEPLOY_DIR}/.next/static"
  cp -r .next/static/* "${DEPLOY_DIR}/.next/static/"
  echo "  ✓ .next/static/ copied (webpack chunks, CSS)"
fi

# ── Step 5: Create Hostinger startup wrapper ──
cat > "${DEPLOY_DIR}/app.js" << 'STARTUP'
// Hostinger Node.js entry point
// Phusion Passenger on Hostinger uses this file as the startup script.
// It wraps Next.js standalone server.js with the correct env vars.

process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '0.0.0.0';
// PORT is set automatically by Passenger on Hostinger — don't override it.

require('./server.js');
STARTUP
echo "  ✓ app.js startup wrapper created"

# ── Step 6: Create .htaccess for Passenger (Hostinger shared hosting) ──
cat > "${DEPLOY_DIR}/.htaccess" << 'HTACCESS'
PassengerNodejs /usr/bin/node
PassengerAppType node
PassengerStartupFile app.js
HTACCESS
echo "  ✓ .htaccess created for Passenger"

# ── Step 7: Summary ──
TOTAL_FILES=$(find "${DEPLOY_DIR}" -type f | wc -l)
TOTAL_SIZE=$(du -sh "${DEPLOY_DIR}" | cut -f1)

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  ✓ DEPLOYMENT PACKAGE READY                  ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║  Folder:  ${DEPLOY_DIR}/"
echo "║  Files:   ${TOTAL_FILES} files"
echo "║  Size:    ${TOTAL_SIZE}"
echo "╠═══════════════════════════════════════════════╣"
echo "║  Upload ${DEPLOY_DIR}/* to Hostinger via:     ║"
echo "║    • hPanel File Manager → public_html/       ║"
echo "║    • Or SSH: scp -r ${DEPLOY_DIR}/* user@host:~/public_html/"
echo "║                                               ║"
echo "║  Then set env vars in hPanel:                 ║"
echo "║    ADMIN_PASSWORD=your-strong-password        ║"
echo "║    NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX    ║"
echo "╚═══════════════════════════════════════════════╝"
