const fs = require("fs");
const files = [
  "assets/js/data.js",
  "assets/js/storage.js",
  "assets/js/schedule.js",
  "assets/js/surveys.js",
  "assets/js/proctor.js",
  "assets/js/app.js",
];
let fail = 0;
for (const f of files) {
  try {
    new Function(fs.readFileSync(f, "utf8"));
    console.log("OK parse", f);
  } catch (e) {
    fail++;
    console.log("FAIL", f, e.message);
  }
}
const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
console.log("scripts:", scripts.join(", "));
for (const s of scripts) {
  if (s.startsWith("http")) continue;
  console.log(fs.existsSync(s) ? "exists" : "MISSING", s);
}
const hasModal = html.includes('id="wallie-survey-modal"');
const hasHidden = /id="wallie-survey-modal"[^>]*class="[^"]*hidden/.test(html) || html.includes('class="modal hidden"');
console.log("modal present", hasModal, "hidden class", hasHidden);
console.log("fail count", fail);
process.exit(fail ? 1 : 0);
