/* Voorskou-wag (assets/js/preview-guard.js).
   (a) localhost?voorskou-toets=1 simuleer 'n voorskou-gasheer: 'n volle sessie (begin → hartklop → einde) plus 'n
       sinkronisering-herprobeer stuur 0 versoeke na *.supabase.co / ntfy.sh. Getel met page.route op daardie gashere
       EN met page.on('request'). Die banier is sigbaar sonder horisontale oorloop by 1366×768 en 390×844.
   (b) Sonder die parameter op localhost: geen banier, geen omhulsels (die bestaande specs bewys die res). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, queue, shot, expectNoLeaks } = require("./helpers");

const BANIER = "VOORSKOU — niks word na die bediener gestuur nie.";
const BLOCKED = /^https?:\/\/([^/]*\.)?(supabase\.co|ntfy\.sh)(:\d+)?(\/|$)/i;

async function noOverflow(page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(o.sw, `geen horisontale oorloop (${o.sw} > ${o.iw})`).toBeLessThanOrEqual(o.iw);
}

for (const vp of [
  { name: "laptop", width: 1366, height: 768 },
  { name: "foon", width: 390, height: 844 }
]) {
  test(`voorskou (${vp.name} ${vp.width}x${vp.height}): 0 versoeke na Supabase/ntfy + banier`, async ({ page, context }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const mock = new MockBackend({ mode: "v1" });
    await mock.attach(context);
    /* page.route het voorrang bo die mock se context.route: enigiets wat tog uitglip word hier getel en afgekap */
    const routed = [];
    await page.route(BLOCKED, (route) => {
      routed.push(route.request().url());
      return route.abort("blockedbyclient");
    });
    const seen = [];
    page.on("request", (r) => {
      if (BLOCKED.test(r.url())) seen.push(r.url());
    });

    await boot(page);
    await page.goto("/index.html?voorskou-toets=1#missie");

    const banier = page.locator("#voorskou-banier");
    await expect(banier).toBeVisible();
    await expect(banier).toHaveText(BANIER);
    expect(await page.evaluate(() => window.__VOORSKOU__ && window.__VOORSKOU__.aktief)).toBe(true);

    /* Die banier versteek niks: die topbalk begin onder die banier */
    const bb = await banier.boundingBox();
    expect(bb.y).toBe(0);
    const top = await page.locator(".topbar").first().boundingBox();
    expect(top.y).toBeGreaterThanOrEqual(bb.y + bb.height - 1);
    await noOverflow(page);

    /* Normale sessie vanaf die eerste rooster-blok → hartklop → einde */
    await page.locator(".start-block").first().click();
    await runUntil(page, async () => (await page.evaluate(() => window.__VOORSKOU__.geblokkeer.length)) > 0, { label: "app het probeer stuur" });
    await page.clock.runFor(130000);
    const hbQueued = (await queue(page)).some((q) => q.kind === "heartbeat");
    expect(hbQueued, "hartklop in die plaaslike tou").toBe(true);
    await page.screenshot({ path: shot(`fase1/voorskou-${vp.name}.png`) });
    await page.locator("#end-session").click();
    await page.clock.runFor(5000);
    const q = await queue(page);
    expect(q.some((x) => x.kind === "start"), "start in die tou (niks verlore nie)").toBe(true);
    expect(q.some((x) => x.kind === "end"), "einde in die tou (niks verlore nie)").toBe(true);

    /* Sinkronisering-herprobeer: die aanwyser se klik-hanteerder (die survey-modaal ná die einde bedek die knoppie,
       dus dispatchEvent in plaas van 'n muisklik), en laat die backoff loop */
    const before = await page.evaluate(() => window.__VOORSKOU__.geblokkeer.length);
    await page.locator("#sync-pill").dispatchEvent("click");
    await page.clock.runFor(3 * 60 * 1000);
    const after = await page.evaluate(() => window.__VOORSKOU__.geblokkeer.length);
    expect(after, "herprobeer het weer probeer (en is geblokkeer)").toBeGreaterThan(before);
    await expect(banier).toBeVisible();
    await noOverflow(page);

    expect(routed, "page.route: 0 versoeke na supabase/ntfy").toEqual([]);
    expect(seen, "page.on('request'): 0 versoeke na supabase/ntfy").toEqual([]);
    expect(mock.calls, "mock-Supabase het niks ontvang nie").toEqual([]);
    expect(mock.ntfy, "mock-ntfy het niks ontvang nie").toEqual([]);
    expectNoLeaks(mock);
  });
}

test("sonder ?voorskou-toets=1 op localhost: geen banier, geen omhulsels, mock-vloei soos altyd", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");
  await expect(page.locator("#sync-pill")).toBeVisible();
  expect(await page.locator("#voorskou-banier").count()).toBe(0);
  const st = await page.evaluate(() => ({
    flag: "__VOORSKOU__" in window,
    cls: document.body.classList.contains("voorskou-aktief"),
    style: !!document.getElementById("voorskou-styl"),
    pad: getComputedStyle(document.body).paddingTop,
    fetch: /\[native code\]/.test(Function.prototype.toString.call(window.fetch)),
    open: /\[native code\]/.test(Function.prototype.toString.call(XMLHttpRequest.prototype.open)),
    send: /\[native code\]/.test(Function.prototype.toString.call(XMLHttpRequest.prototype.send)),
    beacon: /\[native code\]/.test(Function.prototype.toString.call(navigator.sendBeacon)),
    ws: /\[native code\]/.test(Function.prototype.toString.call(WebSocket))
  }));
  expect(st).toEqual({ flag: false, cls: false, style: false, pad: "0px", fetch: true, open: true, send: true, beacon: true, ws: true });

  await page.evaluate(() => WALLIE.app.startSession({ subjectSlug: "rtt", minutes: 45, task: "Sigblad-funksies" }));
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start bereik die mock" });
  expectNoLeaks(mock);
});
