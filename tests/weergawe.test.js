/* Weergawe-hek (geen netwerk): elke ?v= in index.html, version.json se "v" en WALLIE.APP_VERSION in sync.js
   moet presies dieselfde string wees. Bump al drie saam by elke vrystelling. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const fails = [];
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ver = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8")).v;
const m = fs.readFileSync(path.join(root, "assets", "js", "sync.js"), "utf8").match(/WALLIE\.APP_VERSION\s*=\s*"([^"]+)"/);
const app = m ? m[1] : null;

const tags = [...html.matchAll(/<(?:script[^>]*\ssrc|link[^>]*\shref)="(assets\/(?:js|css)\/[^"]+)"/g)].map((x) => x[1]);
const vs = new Set();
for (const t of tags) {
  const q = t.match(/\?v=([^"&]+)$/);
  if (!q) fails.push(`geen ?v= op ${t}`);
  else vs.add(q[1]);
}
if (typeof ver !== "string" || !ver) fails.push("version.json het geen v nie");
if (!app) fails.push("WALLIE.APP_VERSION nie gevind nie");
if (tags.length < 20) fails.push(`te min plaaslike skrip/styl-etikette (${tags.length})`);
if (vs.size > 1) fails.push(`verskillende ?v=-waardes: ${[...vs].join(", ")}`);
for (const v of vs) {
  if (v !== ver) fails.push(`?v=${v} verskil van version.json (${ver})`);
  if (v !== app) fails.push(`?v=${v} verskil van APP_VERSION (${app})`);
}
if (ver !== app) fails.push(`version.json (${ver}) verskil van APP_VERSION (${app})`);

if (fails.length) {
  console.error("weergawe: FOUT\n - " + fails.join("\n - "));
  process.exit(1);
}
console.log(`weergawe: ok (${tags.length} etikette, v=${ver})`);
