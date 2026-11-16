/**
 * Password gate for the firm's own invoice app at /invoices.
 *
 * One shared password (INVOICE_PASSWORD) unlocks the page on a device; the
 * device then keeps a long-lived cookie, so the installed app on a phone or
 * computer opens straight in. The cookie holds an HMAC of the password, not
 * the password, and changing INVOICE_PASSWORD signs every device out.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const FIRM_COOKIE = "sai_invoices";
export const FIRM_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months, the browser maximum

export function firmPassword(): string | null {
  const value = process.env.INVOICE_PASSWORD;
  return value && value.length >= 8 ? value : null;
}

export function firmToken(password: string): string {
  return createHmac("sha256", password).update("stone-art-invoices/v1").digest("base64url");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function isPasswordCorrect(given: string): boolean {
  const password = firmPassword();
  return !!password && same(given, password);
}

export function isCookieValid(cookie: string | undefined): boolean {
  const password = firmPassword();
  return !!password && !!cookie && same(cookie, firmToken(password));
}
