const { test, expect } = require("@playwright/test");

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

test.describe("smoke", () => {
  test("loads with no console errors and renders highlight cards", async ({
    page,
  }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto("/");
    expect(response.status()).toBeLessThan(400);

    const cards = page.locator(".highlight-card");
    await expect(cards.first()).toBeVisible();

    expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
  });

  for (const viewport of VIEWPORTS) {
    test(`renders without overflow at ${viewport.name} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(scrollWidth, "horizontal overflow detected").toBeLessThanOrEqual(
        clientWidth + 1,
      );
      await page.screenshot({
        path: `test-results/screenshots/${viewport.name}.png`,
        fullPage: true,
      });
    });
  }
});

test.describe("lightbox modal", () => {
  test("opens on card image click and closes on Escape", async ({ page }) => {
    await page.goto("/");
    const cardImage = page.locator(".highlight-card-media img").first();
    if ((await cardImage.count()) === 0)
      test.skip(true, "no highlight card images present yet");

    await cardImage.click();
    const lightbox = page.locator("#lightbox");
    await expect(lightbox).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();
  });

  test("closes on backdrop click", async ({ page }) => {
    await page.goto("/");
    const cardImage = page.locator(".highlight-card-media img").first();
    if ((await cardImage.count()) === 0)
      test.skip(true, "no highlight card images present yet");

    await cardImage.click();
    const lightbox = page.locator("#lightbox");
    await expect(lightbox).toBeVisible();

    await lightbox.click({ position: { x: 5, y: 5 } });
    await expect(lightbox).toBeHidden();
  });
});

test.describe("nav links", () => {
  test("all internal links resolve without 4xx/5xx", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const hrefs = await page.$$eval("a[href]", (as) =>
      as
        .map((a) => a.getAttribute("href"))
        .filter(
          (h) =>
            h &&
            !h.startsWith("#") &&
            !h.startsWith("mailto:") &&
            !h.startsWith("tel:"),
        ),
    );

    const broken = [];
    for (const href of [...new Set(hrefs)]) {
      if (/^https?:\/\//.test(href)) continue; // external links: skip network check here
      try {
        const res = await request.get(href, { failOnStatusCode: false });
        if (res.status() >= 400) broken.push(`${href} -> ${res.status()}`);
      } catch (e) {
        broken.push(`${href} -> ${e.message}`);
      }
    }
    expect(broken, broken.join("\n")).toEqual([]);
  });
});
