/**
 * The firm's invoice app: Stone Art Installation's details, bank account and
 * stamp already filled in, installable on Windows, Mac, Android and iPhone.
 *
 * Behind a password (lib/invoice/firmAuth.ts) because the page carries the
 * bank account and the signed stamp. The stamp is in the repository only
 * encrypted (invoices/stamp.enc, see scripts/encrypt-stamp.mjs) and is
 * decrypted and written into the page here, after the password check.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { FIRM_COOKIE, firmPassword, isCookieValid } from "@/lib/invoice/firmAuth";
import { firmStamp } from "@/lib/invoice/firmStamp";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};

export async function GET(request: Request) {
  const password = firmPassword();
  if (!password) {
    return new Response("The invoice app is not set up yet: INVOICE_PASSWORD is missing.", { status: 503 });
  }
  const jar = await cookies();
  if (!isCookieValid(jar.get(FIRM_COOKIE)?.value)) {
    const failed = new URL(request.url).searchParams.has("wrong");
    return new Response(loginPage(failed), { status: 200, headers: { ...PRIVATE_HEADERS, "x-invoices-login": "1" } });
  }

  let html = await readFile(path.join(process.cwd(), "invoices", "firm-app.html"), "utf8");
  const stamp = (await firmStamp(password)) ?? "";
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(stamp)) {
    html = html.replace('var BUILTIN_STAMP = "";', () => `var BUILTIN_STAMP = "${stamp}";`);
  }
  return new Response(html, { headers: PRIVATE_HEADERS });
}

function loginPage(failed: boolean): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Stone Art Installation — Invoices</title>
<link rel="manifest" href="/invoices/manifest.webmanifest">
<link rel="icon" href="/invoices/icon-192.png">
<link rel="apple-touch-icon" href="/invoices/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0d0d0d">
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f2f0; font: 16px/1.5 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #0d0d0d; }
  form { width: min(360px, calc(100vw - 32px)); background: #fff; border: 1px solid #ddd; border-radius: 14px; padding: 28px 24px; box-sizing: border-box; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { margin: 0 0 18px; color: #555; font-size: 14px; }
  input { width: 100%; box-sizing: border-box; font-size: 17px; padding: 12px; border: 1px solid #bbb; border-radius: 10px; }
  button { margin-top: 14px; width: 100%; font-size: 16px; font-weight: 600; padding: 12px; border: 0; border-radius: 10px; background: #0d0d0d; color: #fff; }
  .err { color: #b3261e; margin: 10px 0 0; font-size: 14px; }
</style>
</head>
<body>
<form method="post" action="/invoices/login">
  <h1>Stone Art Installation</h1>
  <p>Invoices. Enter the password once on this device.</p>
  <input type="password" name="password" autocomplete="current-password" placeholder="Password" required autofocus>
  <button type="submit">Open</button>
  ${failed ? '<p class="err">Wrong password. Try again.</p>' : ""}
</form>
</body>
</html>`;
}
