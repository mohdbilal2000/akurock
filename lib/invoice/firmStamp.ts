/**
 * The firm's stamp for the /invoices app, decrypted on the server after the
 * password check. See scripts/encrypt-stamp.mjs for why it is encrypted.
 * INVOICE_STAMP (a data: URL) in the environment, if set, takes precedence.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createDecipheriv, scryptSync } from "node:crypto";

let cached: { password: string; stamp: string | null } | null = null;

export async function firmStamp(password: string): Promise<string | null> {
  const fromEnv = process.env.INVOICE_STAMP;
  if (fromEnv) return fromEnv;
  if (cached && cached.password === password) return cached.stamp;
  let stamp: string | null = null;
  try {
    const raw = (await readFile(path.join(process.cwd(), "invoices", "stamp.enc"), "utf8")).trim();
    const [version, salt, iv, tag, body] = raw.split(".");
    if (version === "v1") {
      const key = scryptSync(password, Buffer.from(salt, "base64"), 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
      decipher.setAuthTag(Buffer.from(tag, "base64"));
      stamp = Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8");
    }
  } catch {
    stamp = null; // missing file, or encrypted with a different password
  }
  cached = { password, stamp };
  return stamp;
}
