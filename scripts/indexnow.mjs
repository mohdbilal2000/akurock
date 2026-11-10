// Tells Bing, Yandex, Seznam and Naver (and through Bing's index, ChatGPT
// Search and Copilot) that pages changed, so they re-crawl in minutes
// instead of weeks. Free, no account: https://www.indexnow.org
//
//   npm run seo:indexnow            submit every URL in the live sitemap
//   npm run seo:indexnow -- <url>…  submit specific URLs
//
// Google does not use IndexNow: submit the sitemap in Search Console.
const HOST = "www.akurock.com";
const KEY = "4c4a0274594b5ba60d185f2df41ee154"; // must match public/<KEY>.txt

let urls = process.argv.slice(2);
if (urls.length === 0) {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
if (urls.length === 0) throw new Error("no URLs to submit");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URLs submitted, HTTP ${res.status}`);
if (!res.ok && res.status !== 202) process.exitCode = 1;
