// Encrypts the firm's stamp image for the password-protected /invoices app.
//
//   INVOICE_PASSWORD=... node scripts/encrypt-stamp.mjs <stamp image file>
//
// Writes invoices/stamp.enc. The repository is public, so the stamp (it
// carries a signature) is only ever committed encrypted: AES-256-GCM with a
// key derived from INVOICE_PASSWORD by scrypt. The server decrypts it after
// the password check (lib/invoice/firmStamp.ts). Changing INVOICE_PASSWORD
// in Vercel means re-running this script with the new password.
import { randomBytes, scryptSync, createCipheriv } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const password = process.env.INVOICE_PASSWORD;
const file = process.argv[2];
if (!password || !file) throw new Error("usage: INVOICE_PASSWORD=... node scripts/encrypt-stamp.mjs <image>");
const ext = path.extname(file).slice(1).toLowerCase().replace("jpg", "jpeg");
const dataUrl = `data:image/${ext};base64,` + readFileSync(file).toString("base64");

const salt = randomBytes(16), iv = randomBytes(12);
const key = scryptSync(password, salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const cipher = createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([cipher.update(dataUrl, "utf8"), cipher.final()]);
const out = ["v1", salt, iv, cipher.getAuthTag(), body].map((x) => (typeof x === "string" ? x : x.toString("base64"))).join(".");
writeFileSync(path.join(process.cwd(), "invoices", "stamp.enc"), out + "\n");
console.log(`invoices/stamp.enc written (${out.length} chars)`);
