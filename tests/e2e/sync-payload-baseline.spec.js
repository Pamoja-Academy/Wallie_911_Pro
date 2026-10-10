/* Sinkronisering-payload-basislyn: ’n standaard-sessie (begin → hartklop → tab weg/geminimiseer → waarskuwing → einde)
   met ALLE netwerk onderskep. Ons stoor net die VORM van elke versoekliggaam (gesorteerde sleutels + tipes, geen waardes,
   dus geen tydstempels of ids nie) in tests/fixtures/sync-payload-baseline.json.
   - Lêer bestaan nie, of RECORD_BASELINE=1: skryf die basislyn.
   - Andersins: die huidige vorms moet presies ooreenstem (nuwe funksies mag nie sync-payloads verander nie). */
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, hideTab, showTab, expectNoLeaks } = require("./helpers");

const FIXTURE = path.join(__dirname, "..", "fixtures", "sync-payload-baseline.json");

function shape(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) {
    const els = [...new Set(v.map((x) => JSON.stringify(shape(x))))].sort().map((s) => JSON.parse(s));
    return { array: els };
  }
  if (typeof v === "object") {
    const out = {};
    Object.keys(v)
      .sort()
      .forEach((k) => (out[k] = shape(v[k])));
    return out;
  }
  return typeof v;
}

/* Unieke (kanaal, soort, vorm)-kombinasies in volgorde van eerste verskyning */
function collect(mock) {
  const seen = new Set();
  const out = [];
  const add = (entry) => {
    const key = JSON.stringify(entry);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(entry);
  };
  mock.calls.forEach((c) => add({ channel: `rpc:${c.name}`, kind: c.body && c.body.p ? c.body.p.kind ?? null : null, shape: shape(c.body) }));
  mock.ntfy.forEach((n) => add({ channel: "ntfy", kind: null, shape: shape(n) }));
  return out;
}

test("sinkronisering-payload-vorms bly onveranderd (standaard-sessie)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");

  const btn = page.locator(".start-block").first();
  await btn.click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start afgelewer" });
  await runUntil(page, async () => mock.byKind("heartbeat").length >= 2, { label: "2 hartkloppe" });

  /* Een keer minimiseer: tab weg vir 20 s → waarskuwing */
  await hideTab(page);
  await page.clock.runFor(20000);
  await showTab(page);
  await runUntil(page, async () => mock.byKind("warn").length === 1, { label: "waarskuwing afgelewer" });

  await page.clock.runFor(60000);
  await page.locator("#end-session").click();
  await runUntil(page, async () => mock.byKind("end").length === 1, { label: "einde afgelewer" });
  await page.clock.runFor(5000);
  expectNoLeaks(mock);

  const current = {
    scenario: "v1-bediener: begin → hartklop → minimiseer (20 s) → waarskuwing → einde",
    entries: collect(mock)
  };
  const kinds = new Set(current.entries.map((e) => e.kind));
  ["start", "heartbeat", "warn", "end"].forEach((k) => expect(kinds.has(k), `soort ${k} vasgevang`).toBe(true));

  if (process.env.RECORD_BASELINE === "1" || !fs.existsSync(FIXTURE)) {
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, JSON.stringify(current, null, 2) + "\n");
    return;
  }
  const baseline = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  expect(current).toEqual(baseline);
});
