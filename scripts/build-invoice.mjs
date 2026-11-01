// Builds invoices/akurock-tax-invoice.html: the template with the invoice
// engine and the brand logo inlined, so the result is one file that works
// offline, opens from WhatsApp, and is what /admin/invoice serves.
import { readFileSync, writeFileSync } from "node:fs";

// Vendor bundles contain HTML-looking strings ("<script ...>") that can make
// the HTML parser end the <script> early and dump the code as page text.
// Base64 has no "<", so embedding it is always parser-safe.
function inlineSafe(code) {
  const b64 = Buffer.from(code, "utf8").toString("base64");
  return `(0,eval)(new TextDecoder().decode(Uint8Array.from(atob("${b64}"),function(c){return c.charCodeAt(0)})));`;
}
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function buildInvoiceHtml() {
  const template = readFileSync(path.join(root, "invoices/invoice.template.html"), "utf8");
  const engine = readFileSync(path.join(root, "lib/invoice/engine.js"), "utf8");
  const logo = readFileSync(path.join(root, "invoices/logo.svg.html"), "utf8").trim();
  const h2c = readFileSync(path.join(root, "lib/invoice/vendor/html2canvas.min.js"), "utf8");
  const jspdf = readFileSync(path.join(root, "lib/invoice/vendor/jspdf.umd.min.js"), "utf8");
  return template
    .replace("/*@HTML2CANVAS@*/", () => inlineSafe(h2c))
    .replace("/*@JSPDF@*/", () => inlineSafe(jspdf))
    .replace("/*@ENGINE@*/", () => engine)
    .replace("/*@LOGO@*/", () => logo);
}

// The installable app is the same sheet plus a manifest link and the
// service worker that lets it open offline.
// The app is served publicly, so it ships with no firm or bank details:
// each computer fills them in once ("Save my details") and keeps them
// locally. The real details live only behind the admin password.
const BLANK_SELLER = `var SELLER_DEFAULTS = {
    s_legal: "", s_addr: "", s_gstin: "", s_contact: "", s_iec: "", lutArn: "",
    bk_name: "", bk_acc: "", bk_ifsc: "", bk_swift: "", bk_bank: "", bk_upi: "",
    prefix: "SAI"
  };`;

// Visible "Install app" button: browsers only show a tiny address-bar icon.
const INSTALL_SCRIPT = `<script>(function () {
  var bar = document.getElementById("btn-pdf"); if (!bar) return;
  var standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return;
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "btn"; btn.id = "btn-install"; btn.textContent = "Install app";
  bar.parentNode.insertBefore(btn, bar);
  var deferred = null;
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  addEventListener("appinstalled", function () { btn.remove(); });
  btn.addEventListener("click", function () {
    if (deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; }); return; }
    var ua = navigator.userAgent;
    var msg = /iPhone|iPad/.test(ua) ? "On iPhone/iPad: open this page in Safari, tap Share, then 'Add to Home Screen'."
      : /Firefox/.test(ua) ? "Firefox can't install apps. Open this page in Chrome or Microsoft Edge, then click Install app."
      : /Edg\\//.test(ua) ? "In Edge: click the ... menu (top right) > Apps > Install this site as an app."
      : "In Chrome: click the install icon at the right end of the address bar, or the ⋮ menu > Cast, save and share > Install page as app.";
    alert(msg);
  });
})();</script>`;

export function buildAppHtml() {
  const html = buildInvoiceHtml();
  const blanked = html.replace(/var SELLER_DEFAULTS = \{[\s\S]*?\n  \};/, BLANK_SELLER);
  if (blanked === html) throw new Error("SELLER_DEFAULTS block not found; refusing to publish real details");
  return blanked
    .replace("<title>", '<link rel="manifest" href="/invoice-app/manifest.webmanifest">\n<meta name="theme-color" content="#0d0d0d">\n<link rel="icon" href="/invoice-app/icon-192.png">\n<title>')
    .replace("</body>", '<script>if ("serviceWorker" in navigator) navigator.serviceWorker.register("/invoice-app/sw.js", { scope: "/invoice-app" }).catch(function () {});</script>\n' + INSTALL_SCRIPT + '\n</body>');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  writeFileSync(path.join(root, "invoices/akurock-tax-invoice.html"), buildInvoiceHtml());
  writeFileSync(path.join(root, "public/invoice-app/index.html"), buildAppHtml());
  console.log("built invoices/akurock-tax-invoice.html and public/invoice-app/index.html");
}
