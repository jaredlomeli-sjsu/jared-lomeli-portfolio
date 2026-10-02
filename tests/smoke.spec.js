const { test, expect } = require("@playwright/test");

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

// Grid pages: leaf pages that render highlight cards + Date/Sort filters.
const GRID_PAGES = [
  { slug: "credentials", nav: "Credentials" },
  { slug: "projects", nav: "Projects" },
  {
    slug: "educational-extra",
    nav: "Extra Curricular",
    subnav: "Educational",
    subsubnav: "Extra",
  },
  {
    slug: "educational-nets",
    nav: "Extra Curricular",
    subnav: "Educational",
    subsubnav: "NETS",
  },
  { slug: "forfun", nav: "Extra Curricular", subnav: "For Fun" },
  {
    slug: "semester-2-technical-assignments",
    nav: "Coursework",
    subnav: "Semester 2",
    subsubnav: "Technical",
    subsubsubnav: "Assignments",
    courses: { count: 4, pick: "PHYS 2A", expectTitles: 1 },
  },
  {
    slug: "semester-3-technical-labs",
    nav: "Coursework",
    subnav: "Semester 3",
    subsubnav: "Technical",
    subsubsubnav: "Labs",
    courses: { count: 6, pick: "TECH 60", expectTitles: 2 },
  },
  {
    slug: "semester-3-technical-assignments",
    nav: "Coursework",
    subnav: "Semester 3",
    subsubnav: "Technical",
    subsubsubnav: "Assignments",
    courses: { count: 6, pick: "TECH 30", expectTitles: 1 },
  },
  {
    slug: "resumes-past",
    nav: "Professional Documents",
    subnav: "Resumes",
    subsubnav: "Past",
  },
  {
    slug: "resumes-current",
    nav: "Professional Documents",
    subnav: "Resumes",
    subsubnav: "Current",
  },
  {
    slug: "coverletters",
    nav: "Professional Documents",
    subnav: "Cover Letters",
  },
  {
    slug: "otherdocuments",
    nav: "Professional Documents",
    subnav: "Other Documents",
  },
];

// Chooser pages: no grid, just a label-only tile per child node (no preview
// image, no placeholder thumbnail, no "Coming soon" text). `allEmpty` = none of
// the children have content yet, so no tile shows a count.
const CHOOSER_PAGES = [
  { slug: "coursework", nav: "Coursework", tiles: 8 },
  { slug: "extracurricular", nav: "Extra Curricular", tiles: 2, allFull: true },
  { slug: "educational", nav: "Extra Curricular", tiles: 2, allFull: true },
  { slug: "semester-2", nav: "Coursework", tiles: 2, allFull: true },
  { slug: "semester-3", nav: "Coursework", tiles: 2 },
  { slug: "semester-1", nav: "Coursework", tiles: 2 },
  { slug: "semester-3-technical", nav: "Coursework", tiles: 2, allFull: true },
  { slug: "semester-2-technical", nav: "Coursework", tiles: 2, allFull: true },
  { slug: "semester-1-technical", nav: "Coursework", tiles: 2, allEmpty: true },
  {
    slug: "professionaldocuments",
    nav: "Professional Documents",
    tiles: 3,
    allFull: true,
  },
  {
    slug: "resumes",
    nav: "Professional Documents",
    tiles: 2,
    allFull: true,
  },
];

// Placeholder pages: a leaf that exists but has no entries yet.
const EMPTY_PAGES = [
  {
    slug: "semester-1-technical-labs",
    subnav: "Semester 1",
    subsubnav: "Technical",
    subsubsubnav: "Labs",
  },
];

function collectErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("landing page", () => {
  test("loads with no console errors and renders one tile per populated category", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const response = await page.goto("/");
    expect(response.status()).toBeLessThan(400);

    const buttons = page.locator(".section-button");
    await expect(buttons).toHaveCount(5);

    const hrefs = await buttons.evaluateAll((els) =>
      els.map((e) => e.getAttribute("href")),
    );
    expect(hrefs).toEqual([
      "/credentials",
      "/projects",
      "/coursework",
      "/extracurricular",
      "/professionaldocuments",
    ]);

    for (const btn of await buttons.all()) {
      await expect(btn.locator(".section-button-count")).toContainText(
        /item|Coming soon/i,
      );
    }

    await expect(page.locator("#section-nav")).toHaveCount(0);
    await expect(page.locator(".highlight-card")).toHaveCount(0);
    await expect(page.locator("#filter-bar")).toHaveCount(0);

    expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("footer 'last updated' text is rendered from data", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#footer-updated")).toHaveText(
      /Last updated \w+ \d{4}/,
    );
  });

  for (const viewport of VIEWPORTS) {
    test(`no horizontal overflow at ${viewport.name} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, "horizontal overflow detected").toBeLessThanOrEqual(
        clientWidth + 1,
      );
      await page.screenshot({
        path: `test-results/screenshots/landing-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }
});

for (const {
  slug,
  nav,
  subnav,
  subsubnav,
  subsubsubnav,
  courses,
} of GRID_PAGES) {
  test.describe(`grid page: /${slug}`, () => {
    test("loads with no console errors and renders cards", async ({ page }) => {
      const errors = collectErrors(page);
      const response = await page.goto(`/${slug}`);
      expect(response.status()).toBeLessThan(400);

      await expect(page.locator(".highlight-card").first()).toBeVisible();
      await expect(page.locator(".highlight-section-heading")).toHaveCount(0);

      expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
    });

    test("nav marks the current section and there is no Type filter", async ({
      page,
    }) => {
      await page.goto(`/${slug}`);
      await expect(
        page.locator("#section-nav .section-nav-link--active"),
      ).toHaveText(nav);
      if (subnav) {
        await expect(
          page.locator("#section-subnav .section-nav-link--active"),
        ).toHaveText(subnav);
      }
      if (subsubnav) {
        await expect(
          page.locator("#section-subsubnav .section-nav-link--active"),
        ).toHaveText(subsubnav);
      }
      if (subsubsubnav) {
        await expect(
          page.locator("#section-subsubsubnav .section-nav-link--active"),
        ).toHaveText(subsubsubnav);
      }
      await expect(page.locator("#filter-type-options")).toHaveCount(0);
    });

    test("filter panel toggles open and closed", async ({ page }) => {
      await page.goto(`/${slug}`);
      const toggle = page.locator("#filter-toggle");
      const panel = page.locator("#filter-panel");

      await expect(panel).toBeHidden();
      await toggle.click();
      await expect(panel).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await toggle.click();
      await expect(panel).toBeVisible();
      await page.mouse.click(5, 5);
      await expect(panel).toBeHidden();
    });

    test("sort reorders the cards by date", async ({ page }) => {
      await page.goto(`/${slug}`);

      test.skip(
        (await page
          .locator(".highlight-card:not(.highlight-card--collection)")
          .count()) < 2,
        "needs at least 2 dated (non-collection) cards to observe reordering",
      );

      // extract each card's ISO date from its meta line. Pinned "collection"
      // cards (e.g. the Packet Tracer archive) always lead the grid and carry no
      // date, so they're excluded from the ordering assertion.
      const dates = () =>
        page
          .locator(
            ".highlight-card:not(.highlight-card--collection) .highlight-card-meta",
          )
          .evaluateAll((els) =>
            els.map(
              (e) => (e.textContent.match(/\d{4}-\d{2}-\d{2}/) || [""])[0],
            ),
          );

      await page.locator("#filter-toggle").click();
      await page.locator("#filter-sort").selectOption("asc");
      const asc = await dates();
      await page.locator("#filter-sort").selectOption("desc");
      const desc = await dates();

      // asc is non-decreasing, desc is non-increasing (tie-tolerant), and the
      // two orderings differ
      expect([...asc].sort()).toEqual(asc);
      expect([...desc].sort().reverse()).toEqual(desc);
      expect(asc).not.toEqual(desc);
    });

    test("an impossible date range shows the empty state, and Clear restores", async ({
      page,
    }) => {
      await page.goto(`/${slug}`);
      const fullCount = await page.locator(".highlight-card").count();

      await page.locator("#filter-toggle").click();
      const from = page.locator("#filter-date-from");
      const to = page.locator("#filter-date-to");
      await from.fill("2000-01-01");
      await from.dispatchEvent("change");
      await to.fill("2000-01-02");
      await to.dispatchEvent("change");

      await expect(page.locator(".highlight-grid-empty")).toHaveText(
        "No entries match the selected filters.",
      );
      await expect(page.locator("#filter-count")).toHaveText("2");

      await page.locator("#filter-clear").click();
      await expect(page.locator("#filter-count")).toBeHidden();
      await expect(page.locator(".highlight-card")).toHaveCount(fullCount);
    });

    if (courses) {
      test("Course checkboxes narrow the grid and Clear resets", async ({
        page,
      }) => {
        await page.goto(`/${slug}`);
        const fullCount = await page.locator(".highlight-card").count();

        await page.locator("#filter-toggle").click();
        const opts = page.locator(
          "#filter-course-options input[type=checkbox]",
        );
        await expect(opts).toHaveCount(courses.count);

        await page
          .locator(`#filter-course-options input[value="${courses.pick}"]`)
          .check();
        await expect(page.locator(".highlight-card")).toHaveCount(
          courses.expectTitles,
        );
        await expect(page.locator("#filter-count")).toHaveText("1");

        await page.locator("#filter-clear").click();
        await expect(page.locator("#filter-count")).toBeHidden();
        await expect(page.locator(".highlight-card")).toHaveCount(fullCount);
      });
    }
  });
}

// Collection-card documents that the browser can render (PDF, images) open
// in-page — the in-page PDF viewer or the lightbox — never as a raw
// download. These helpers click a `.download-item--view` button and assert
// the right modal opened with the right, live (200) source.
async function expectViewItemOpensPdf(page, button, pathPattern) {
  await button.click();
  const dialog = page.locator("#pdf-viewer");
  await expect(dialog).toBeVisible();
  const src = await page.locator("#pdf-viewer-frame").getAttribute("src");
  expect(src).toMatch(pathPattern);
  const res = await page.request.get(src, { failOnStatusCode: false });
  expect(res.status(), `${src}`).toBe(200);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

async function expectViewItemOpensImage(page, button, pathPattern) {
  await button.click();
  const dialog = page.locator("#lightbox");
  await expect(dialog).toBeVisible();
  const src = await page.locator("#lightbox-image").getAttribute("src");
  expect(src).toMatch(pathPattern);
  const res = await page.request.get(src, { failOnStatusCode: false });
  expect(res.status(), `${src}`).toBe(200);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

test.describe("Wireshark labs collection (/semester-3-technical-labs)", () => {
  test("one pinned collection card holds every Wireshark lab report, embedded in-page", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-labs");

    // three pinned collections float ahead of the dated lab cards
    await expect(page.locator(".highlight-card").nth(0)).toHaveClass(
      /highlight-card--collection/,
    );
    await expect(page.locator(".highlight-card").nth(1)).toHaveClass(
      /highlight-card--collection/,
    );
    await expect(page.locator(".highlight-card").nth(2)).toHaveClass(
      /highlight-card--collection/,
    );
    await expect(page.locator(".highlight-card--collection")).toHaveCount(3);

    const ws = page.locator("#hl-hl-tech65-wireshark-labs");
    await expect(ws.locator(".highlight-card-collection-badge")).toHaveText(
      "Ongoing collection",
    );
    // labs 3.7.10 and 7.1.6 live in this card — no standalone Wireshark lab cards remain
    const dl = ws.locator("button.download-item--view");
    await expect(dl).toHaveCount(2);
    const all = await dl.all();
    for (const btn of all) {
      await expectViewItemOpensPdf(
        page,
        btn,
        /^\/public\/documents\/tech-65\/wireshark\/\d+\.\d+\.\d+-.+\.pdf$/,
      );
    }
    await expect(page.locator("#hl-hl-2026-tech65-lab4")).toHaveCount(0);
  });
});

test.describe("Switch configuration labs collection (/semester-3-technical-labs)", () => {
  test("one pinned collection card holds every switch-configuration lab, embedded in-page", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-labs");

    const sc = page.locator("#hl-hl-tech65-switch-config-labs");
    await expect(sc).toHaveClass(/highlight-card--collection/);
    await expect(sc.locator(".highlight-card-collection-badge")).toHaveText(
      "Ongoing collection",
    );
    // Lab 2, 7.2.7, and 7.3.7 live in this card — no standalone Lab 2 card remains
    const dl = sc.locator(".download-item");
    await expect(dl).toHaveCount(3);
    await expect(sc.locator("a.download-item")).toHaveCount(0);
    await expect(sc.locator("button.download-item--view")).toHaveCount(3);

    const pdfBtns = sc.locator("button.download-item--view", {
      hasText: "PDF",
    });
    for (const btn of await pdfBtns.all()) {
      await expectViewItemOpensPdf(
        page,
        btn,
        /^\/public\/documents\/tech-65\/switch-config\/.+\.pdf$/,
      );
    }
    const imgBtn = sc.locator("button.download-item--view", {
      hasText: "Screenshot",
    });
    await expect(imgBtn).toHaveCount(1);
    await expectViewItemOpensImage(
      page,
      imgBtn,
      /^\/public\/documents\/tech-65\/switch-config\/.+\.png$/,
    );

    await expect(page.locator("#hl-hl-2026-tech65-lab2")).toHaveCount(0);
  });
});

test.describe("TECH 60 labs collection (/semester-3-technical-labs)", () => {
  test("one pinned collection card holds every TECH 60 lab report, embedded in-page", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-labs");

    const t60 = page.locator("#hl-hl-tech60-labs");
    await expect(t60).toHaveClass(/highlight-card--collection/);
    await expect(t60.locator(".highlight-card-collection-badge")).toHaveText(
      "Ongoing collection",
    );
    // Labs 0, 1, 2, 4, and 6 live in this card — no standalone TECH 60 lab cards remain
    const dl = t60.locator("button.download-item--view");
    await expect(dl).toHaveCount(5);
    await expect(t60.locator("a.download-item")).toHaveCount(0);
    for (const btn of await dl.all()) {
      await expectViewItemOpensPdf(
        page,
        btn,
        /^\/public\/documents\/tech-60\/lab-\d+\.pdf$/,
      );
    }

    await expect(page.locator("#hl-hl-2026-tech60-lab0")).toHaveCount(0);
    await expect(page.locator("#hl-hl-2026-tech60-lab1")).toHaveCount(0);
    await expect(page.locator("#hl-hl-2026-tech60-lab2")).toHaveCount(0);
    await expect(page.locator("#hl-hl-2026-tech60-lab4")).toHaveCount(0);
  });
});

test.describe("collection cards (/semester-3-technical-assignments)", () => {
  test("collection cards lead the grid, each with a badge and a downloads list", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-assignments");

    // the pinned "collection" cards float ahead of any dated cards
    const cards = page.locator(".highlight-card");
    await expect(cards.nth(0)).toHaveClass(/highlight-card--collection/);
    await expect(cards.nth(1)).toHaveClass(/highlight-card--collection/);
    await expect(cards.nth(2)).toHaveClass(/highlight-card--collection/);
    await expect(page.locator(".highlight-card--collection")).toHaveCount(3);

    // --- TECH 65 Packet Tracer file collection ---
    const pt = page.locator("#hl-hl-tech65-packet-tracer-collection");
    await expect(pt.locator(".highlight-card-collection-badge")).toHaveText(
      "Ongoing collection",
    );
    const ptDl = pt.locator("a.download-item");
    await expect(ptDl).toHaveCount(21);
    for (const a of await ptDl.all()) {
      await expect(a).toHaveAttribute("download", "");
      const href = await a.getAttribute("href");
      expect(href).toMatch(
        /^\/public\/documents\/tech-65\/packet-tracer\/.+\.(pka|pkt)$/,
      );
      const res = await page.request.get(href, { failOnStatusCode: false });
      expect(res.status(), `${href}`).toBe(200);
    }

    // --- TECH 30 Python activities collection ---
    const py = page.locator("#hl-hl-2026-tech30-python-activities");
    await expect(py).toHaveClass(/highlight-card--collection/);
    const pyDl = py.locator("button.download-item--view");
    await expect(pyDl).toHaveCount(5);
    await expect(py.locator("a.download-item")).toHaveCount(0);
    for (const btn of await pyDl.all()) {
      await btn.click();
      const dialog = page.locator("#pdf-viewer");
      await expect(dialog).toBeVisible();
      await expect(page.locator("#pdf-viewer-frame")).toBeHidden();
      const code = page.locator("#pdf-viewer-media code");
      await expect(code).not.toHaveText(/Loading|Couldn't load/);
      expect((await code.innerText()).length).toBeGreaterThan(50);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(page.locator("#pdf-viewer-media")).toHaveCount(0);
    }

    // --- TECH 15 career-assignments collection (PDFs open in-page) ---
    const t15 = page.locator("#hl-hl-2026-tech15-assignments");
    await expect(t15).toHaveClass(/highlight-card--collection/);
    const t15Dl = t15.locator("button.download-item--view");
    await expect(t15Dl).toHaveCount(6);
    await expect(t15.locator("a.download-item")).toHaveCount(0);
    for (const btn of await t15Dl.all()) {
      await expectViewItemOpensPdf(
        page,
        btn,
        /^\/public\/documents\/tech-15\/assignment-[12346]-.+\.pdf$/,
      );
    }
  });

  test("Watch Video plays in-page (local mp4 and YouTube) instead of leaving the site", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-labs");
    const final = page.locator("#hl-hl-2026-tech60-final-simon-says");
    await final.getByRole("button", { name: "Watch Video" }).click();
    const video = page.locator("#pdf-viewer-media video");
    await expect(video).toBeVisible();
    const src = await video.getAttribute("src");
    expect(src).toMatch(/^\/public\/videos\/.+\.mp4$/);
    expect((await page.request.get(src)).status()).toBe(200);
    await page.keyboard.press("Escape");
    await expect(page.locator("#pdf-viewer")).toBeHidden();
    await expect(page.locator("#pdf-viewer-media")).toHaveCount(0);

    await page.goto("/semester-2-technical-assignments");
    await page
      .locator(".highlight-card")
      .getByRole("button", { name: "Watch Video" })
      .first()
      .click();
    await expect(page.locator("#pdf-viewer-media iframe")).toHaveAttribute(
      "src",
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/1qZuOk2-g6U/,
    );
  });

  test("filtering by the TECH 65 course keeps only its collection card", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-assignments");
    await page.locator("#filter-toggle").click();
    await page.locator('#filter-course-options input[value="TECH 65"]').check();
    await expect(page.locator(".highlight-card--collection")).toHaveCount(1);
    await expect(
      page.locator("#hl-hl-tech65-packet-tracer-collection"),
    ).toBeVisible();
  });

  test("the TECH 65 Lab 1 card links through to the collection", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-labs");
    const lab1 = page.locator("#hl-hl-2026-tech65-lab1");
    await expect(lab1).toBeVisible();

    const link = lab1.locator(".highlight-card-links a", {
      hasText: "Download the Packet Tracer files",
    });
    await expect(link).toHaveAttribute(
      "href",
      "/semester-3-technical-assignments#hl-hl-tech65-packet-tracer-collection",
    );

    await link.click();
    await expect(page).toHaveURL(/#hl-hl-tech65-packet-tracer-collection$/);
    await expect(
      page.locator("#hl-hl-tech65-packet-tracer-collection"),
    ).toBeVisible();
  });
});

const ASSIGNMENT_COLLECTION_PAGES = [
  {
    slug: "semester-1-nontechnical-assignments",
    cards: {
      "hl-bus3-12-assignments": 3,
      "hl-comm-20-assignments": 6,
      "hl-engl-1a-assignments": 10,
    },
  },
  {
    slug: "semester-2-nontechnical-assignments",
    cards: {
      "hl-engl-2-assignments": 5,
      "hl-hist-15-assignments": 5,
    },
  },
];

for (const { slug, cards } of ASSIGNMENT_COLLECTION_PAGES) {
  test.describe(`assignment collection cards (/${slug})`, () => {
    test("one collection card per class, each listing its assignment PDFs", async ({
      page,
    }) => {
      await page.goto(`/${slug}`);

      const n = Object.keys(cards).length;
      await expect(page.locator(".highlight-card--collection")).toHaveCount(n);
      await expect(page.locator(".highlight-card")).toHaveCount(n);

      for (const [id, count] of Object.entries(cards)) {
        const card = page.locator(`#hl-${id}`);
        await expect(card).toHaveClass(/highlight-card--collection/);
        await expect(
          card.locator(".highlight-card-collection-badge"),
        ).toHaveText("Ongoing collection");

        const dl = card.locator("button.download-item--view");
        await expect(dl).toHaveCount(count);
        await expect(card.locator("a.download-item")).toHaveCount(0);
        for (const btn of await dl.all()) {
          await expectViewItemOpensPdf(
            page,
            btn,
            /^\/public\/documents\/[a-z0-9-]+\/.+\.pdf$/,
          );
        }
      }
    });
  });
}

test.describe("empty-course note", () => {
  test("selecting a no-digital-work course shows its note, not the generic empty text", async ({
    page,
  }) => {
    await page.goto("/semester-1-nontechnical-assignments");
    await page.locator("#filter-toggle").click();
    await page.locator('#filter-course-options input[value="MATH 70"]').check();
    await expect(page.locator(".highlight-card")).toHaveCount(0);
    await expect(page.locator(".highlight-grid-empty")).toContainText(
      "No digital work from this class",
    );

    await page.locator("#filter-clear").click();
    await expect(page.locator(".highlight-card")).not.toHaveCount(0);
  });

  test("a current course with nothing archived yet shows its 'yet' note", async ({
    page,
  }) => {
    await page.goto("/semester-3-technical-assignments");
    await page.locator("#filter-toggle").click();
    await page.locator('#filter-course-options input[value="BUS2 90"]').check();
    await expect(page.locator(".highlight-card")).toHaveCount(0);
    await expect(page.locator(".highlight-grid-empty")).toContainText(
      "No digital work archived from this class yet",
    );
  });
});

for (const {
  slug,
  nav,
  tiles: tileCount,
  allEmpty,
  allFull,
} of CHOOSER_PAGES) {
  test.describe(`chooser page: /${slug}`, () => {
    test("shows tiles instead of a grid, with placeholders for empty groups", async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const res = await page.goto(`/${slug}`);
      expect(res.status()).toBeLessThan(400);

      await expect(page.locator("#filter-bar")).toHaveCount(0);
      await expect(page.locator(".highlight-card")).toHaveCount(0);

      // one tile per child node declared in categories.js
      await expect(page.locator(".section-button")).toHaveCount(tileCount);

      // sub-chooser tiles are label-only: no thumbnails, no "Coming soon"
      await expect(page.locator(".section-button-media")).toHaveCount(0);
      await expect(page.locator(".section-button-count--empty")).toHaveCount(0);

      // only populated groups carry a count
      const realCounts = page.locator(".section-button-count");
      if (allEmpty) {
        await expect(realCounts).toHaveCount(0);
      } else if (allFull) {
        await expect(realCounts).toHaveCount(tileCount);
      } else {
        const n = await realCounts.count();
        expect(n).toBeGreaterThan(0);
        expect(n).toBeLessThan(tileCount);
      }

      // Coursework chooser tiles are measured in classes, Professional
      // Documents tiles in documents, everything else in items (rendered text
      // is upper-cased by CSS, so match case-insensitively)
      if (!allEmpty) {
        const countText = (await realCounts.allInnerTexts()).join(" ");
        if (nav === "Coursework") {
          expect(countText).toMatch(/\bclass(es)?\b/i);
          expect(countText).not.toMatch(/\bitems?\b/i);
          expect(countText).not.toMatch(/\bdocuments?\b/i);
        } else if (nav === "Professional Documents") {
          expect(countText).toMatch(/\bdocuments?\b/i);
          expect(countText).not.toMatch(/\bitems?\b/i);
          expect(countText).not.toMatch(/\bclass(es)?\b/i);
        } else {
          expect(countText).toMatch(/\bitems?\b/i);
          expect(countText).not.toMatch(/\bclass(es)?\b/i);
          expect(countText).not.toMatch(/\bdocuments?\b/i);
        }
      }

      await expect(
        page.locator("#section-nav .section-nav-link--active"),
      ).toHaveText(nav);

      expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
    });
  });
}

for (const { slug, subnav, subsubnav, subsubsubnav } of EMPTY_PAGES) {
  test.describe(`placeholder page: /${slug}`, () => {
    test("loads, shows the empty state, sub-nav marks the current track", async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const res = await page.goto(`/${slug}`);
      expect(res.status()).toBeLessThan(400);

      await expect(page.locator(".highlight-grid-empty")).toHaveText(
        /Nothing here yet/,
      );
      await expect(page.locator(".highlight-card")).toHaveCount(0);
      await expect(
        page.locator("#section-subnav .section-nav-link--active"),
      ).toHaveText(subnav);
      if (subsubnav) {
        await expect(
          page.locator("#section-subsubnav .section-nav-link--active"),
        ).toHaveText(subsubnav);
      }
      if (subsubsubnav) {
        await expect(
          page.locator("#section-subsubsubnav .section-nav-link--active"),
        ).toHaveText(subsubsubnav);
      }

      expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
    });
  });
}

test.describe("lightbox modal (/credentials)", () => {
  test("opens on card image click, closes on Escape and on backdrop click", async ({
    page,
  }) => {
    await page.goto("/credentials");
    const img = page.locator(".highlight-card-media img").first();
    await expect(img).toBeVisible();

    await img.click();
    const lightbox = page.locator("#lightbox");
    await expect(lightbox).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();

    await img.click();
    await expect(lightbox).toBeVisible();
    await lightbox.click({ position: { x: 5, y: 5 } });
    await expect(lightbox).toBeHidden();
  });
});

test.describe("internal links resolve", () => {
  for (const path of [
    "/",
    "/credentials",
    "/projects",
    "/coursework",
    "/extracurricular",
    "/educational",
    "/educational-extra",
    "/educational-nets",
    "/forfun",
    "/professionaldocuments",
    "/resumes-past",
    "/resumes-current",
    "/coverletters",
    "/resumes",
    "/otherdocuments",
    "/semester-1-nontechnical-assignments",
    "/semester-2-nontechnical-assignments",
    "/semester-3",
    "/semester-3-technical",
    "/semester-3-technical-labs",
    "/semester-3-technical-assignments",
  ]) {
    test(`no 4xx/5xx from ${path}`, async ({ page, request }) => {
      await page.goto(path);
      const hrefs = await page.$$eval("a[href]", (as) =>
        as
          .map((a) => a.getAttribute("href"))
          .filter(
            (h) =>
              h &&
              !h.startsWith("#") &&
              !h.startsWith("mailto:") &&
              !h.startsWith("tel:") &&
              !/^https?:\/\//.test(h),
          ),
      );

      const broken = [];
      for (const href of [...new Set(hrefs)]) {
        const res = await request.get(href, { failOnStatusCode: false });
        if (res.status() >= 400) broken.push(`${href} -> ${res.status()}`);
      }
      expect(broken, broken.join("\n")).toEqual([]);
    });
  }
});

test.describe("site search (search.js)", () => {
  test("launcher opens the palette, '/' opens it too, Escape closes", async ({
    page,
  }) => {
    await page.goto("/credentials");
    const dialog = page.locator("dialog.search-dialog");
    const input = page.locator(".search-input");

    await expect(page.locator(".search-launcher")).toBeVisible();
    await page.locator(".search-launcher").click();
    await expect(dialog).toBeVisible();
    await expect(input).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.keyboard.press("/");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("query matches a known card and Enter navigates to it, flashed", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await page.locator(".search-input").fill("Security+");

    const results = page.locator(".search-results li");
    await expect(results.first()).toBeVisible();
    const firstHref = await results
      .first()
      .locator("a.search-result")
      .getAttribute("href");
    expect(firstHref).toMatch(/^\/[a-z0-9-]+#hl-/);

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#hl-/);
    await expect(page.locator(".highlight-card--flash")).toHaveCount(1);
  });

  test("a nonsense query shows the no-matches state", async ({ page }) => {
    await page.goto("/projects");
    await page.keyboard.press("/");
    await page.locator(".search-input").fill("zzzznotathing");
    await expect(page.locator(".search-status")).toContainText("No matches");
    await expect(page.locator(".search-results li")).toHaveCount(0);
  });
});
