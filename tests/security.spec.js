const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const vercel = JSON.parse(read("vercel.json"));

// Same path-to-regexp -> RegExp conversion dev-server.js uses.
const rules = vercel.headers.map((r) => ({
  source: r.source,
  re: new RegExp("^" + r.source.replace(/\/:[A-Za-z]+/g, "/[^/]+") + "$"),
  headers: Object.fromEntries(r.headers.map((h) => [h.key, h.value])),
}));
const cspRulesFor = (p) =>
  rules.filter((r) => r.re.test(p) && r.headers["Content-Security-Policy"]);

const rootHtml = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));

test.describe("security headers config (vercel.json)", () => {
  test("every path gets the baseline hardening headers", () => {
    const base = rules.find((r) => r.source === "/(.*)");
    expect(base).toBeTruthy();
    expect(base.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(base.headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(base.headers["Referrer-Policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(base.headers["Permissions-Policy"]).toContain("camera=()");
    expect(base.headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(base.headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
  });

  test("exactly one CSP applies to every HTML-ish path, none to binaries", () => {
    const html = [
      "/",
      "/credentials",
      "/security",
      "/semester-2-technical-assignments",
      "/data/highlights.json",
      "/grid.js",
      "/public/resume",
      "/public/resume.html",
      "/public/contact",
      "/public/case-studies/soc-dashboard",
      "/public/artifacts/linux-security-architecture",
      "/public/artifacts/linux-security-architecture/index.html",
      "/demo/simon-says-wiring",
      "/public/documents/kali-metasploitable-wazuh-linux/Portfolio.html",
      "/public/documents/self-study/cisco-linux-unhatched/course-report",
    ];
    for (const p of html) {
      expect(cspRulesFor(p).length, `CSP rules matching ${p}`).toBe(1);
    }
    const binary = [
      "/public/Jared-Lomeli-Resume.pdf",
      "/public/documents/tech-60/lab-0.pdf",
      "/public/images/og-image.png",
      "/public/videos/tech60-final-simon-says-demo.mp4",
      "/public/documents/tech-30/activity-1.py",
    ];
    for (const p of binary) {
      expect(cspRulesFor(p).length, `CSP rules matching ${p}`).toBe(0);
    }
  });

  test("main-site CSP is strict: no unsafe-inline/eval, no wildcards", () => {
    const csp = cspRulesFor("/")[0].headers["Content-Security-Policy"];
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/(^|\s)\*(\s|;|$)/);
    expect(csp).not.toMatch(/https?:\/\/\*/);
    for (const d of [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ]) {
      expect(csp).toContain(d);
    }
  });

  test("no CSP allows unsafe-eval", () => {
    for (const r of rules) {
      const v = r.headers["Content-Security-Policy"];
      if (v) expect(v, r.source).not.toContain("unsafe-eval");
    }
  });
});

test.describe("headers as actually served (dev server mirrors vercel.json)", () => {
  test("main page and a PDF", async ({ request }) => {
    const home = await request.get("/");
    expect(home.headers()["content-security-policy"]).toContain(
      "script-src 'self'",
    );
    expect(home.headers()["x-content-type-options"]).toBe("nosniff");
    const pdf = await request.get("/public/Jared-Lomeli-Resume.pdf");
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-security-policy"]).toBeUndefined();
    expect(pdf.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("security.txt is valid and not expired", async ({ request }) => {
    const res = await request.get("/.well-known/security.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^Contact: mailto:\S+@\S+$/m);
    const exp = body.match(/^Expires: (\S+)$/m);
    expect(exp).toBeTruthy();
    expect(new Date(exp[1]).getTime()).toBeGreaterThan(Date.now());
    expect(body).toMatch(/^Canonical: https:\/\//m);
  });
});

test.describe("CSP-compatible source (main pages)", () => {
  for (const f of rootHtml) {
    test(`${f}: no inline script/handler/style, safe links`, () => {
      const s = read(f);
      const inlineScripts = [...s.matchAll(/<script([^>]*)>/g)].filter(
        (m) => !/\bsrc=/.test(m[1]) && !/application\/ld\+json/.test(m[1]),
      );
      expect(inlineScripts.length, "inline <script>").toBe(0);
      expect(s.match(/\son[a-z]+\s*=/gi) || [], "inline handlers").toEqual([]);
      expect(s).not.toMatch(/<style[\s>]/i);
      expect(s).not.toMatch(/\sstyle\s*=/i);
      expect(s).not.toMatch(/javascript:/i);
      for (const m of s.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
        expect(m[0], "target=_blank needs rel=noopener").toMatch(/noopener/);
      }
    });
  }

  test("every local script/stylesheet target exists", () => {
    for (const f of rootHtml) {
      const s = read(f);
      for (const m of s.matchAll(
        /<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g,
      )) {
        const u = m[1];
        if (/^(https?:|data:|#|mailto:)/.test(u)) continue;
        if (u.startsWith("/") && !path.extname(u)) continue; // clean-URL page link
        const file = path.join(ROOT, u.replace(/^\//, ""));
        expect(fs.existsSync(file), `${f} -> ${u}`).toBe(true);
      }
    }
  });
});

test.describe("published content hygiene", () => {
  const data = JSON.parse(read("data/highlights.json"));
  const refs = new Set(
    [...read("data/highlights.json").matchAll(/"(\/public\/[^"]+)"/g)].map(
      (m) => m[1],
    ),
  );

  test("every file referenced by highlights.json exists", () => {
    for (const r of refs) {
      expect(fs.existsSync(path.join(ROOT, r)), r).toBe(true);
    }
  });

  test("the removed personal-reflection file stays removed", () => {
    expect(
      fs.existsSync(
        path.join(ROOT, "public/documents/bus3-12/personal-wellness-plan.pdf"),
      ),
    ).toBe(false);
    expect(read("data/highlights.json")).not.toContain(
      "personal-wellness-plan",
    );
  });

  test("only intended email addresses appear in site text/data", () => {
    const allowed = new Set([
      "jared.lomeli@sjsu.edu",
      "jaredlomelicnsm@gmail.com",
    ]);
    const files = [
      ...rootHtml,
      "data/highlights.json",
      "grid.js",
      "home.js",
      "nav.js",
      "search.js",
      "categories.js",
      ".well-known/security.txt",
      "public/contact.html",
      "public/resume.html",
      "public/transcript.html",
    ];
    for (const f of files) {
      const found =
        read(f).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
      for (const e of found)
        expect(allowed.has(e.toLowerCase()), `${f}: ${e}`).toBe(true);
    }
  });

  test("no 9-digit ID-like numbers or secret-looking strings in site text/data", () => {
    const files = [...rootHtml, "data/highlights.json", "public/contact.html"];
    for (const f of files) {
      const s = read(f).replace(/[0-9a-f]{32}/gi, ""); // strip public verify hashes
      expect(s.match(/(?<![\d.])\d{9}(?![\d.])/g) || [], f).toEqual([]);
      expect(s).not.toMatch(
        /sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}/,
      );
    }
  });

  test("peer-review PDFs no longer carry classmate names in their filenames/cards", () => {
    const names =
      /\b(Ritu|Charlie|Ethan|Chisom|Kristie|Michelle|Lansom|Lamson)\b/;
    expect(JSON.stringify(data)).not.toMatch(names);
  });
});

test.describe("runtime under the enforced CSP", () => {
  const PAGES = [
    "/",
    "/credentials",
    "/projects",
    "/educational-extra",
    "/semester-2-technical-assignments",
    "/professionaldocuments",
    "/security",
  ];

  for (const p of PAGES) {
    test(`${p}: zero CSP violations and zero console errors`, async ({
      page,
    }) => {
      const problems = [];
      page.on("console", (m) => {
        if (m.type() === "error") problems.push("console: " + m.text());
      });
      page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
      await page.addInitScript(() => {
        window.__csp = [];
        document.addEventListener("securitypolicyviolation", (e) =>
          window.__csp.push(e.violatedDirective + " " + e.blockedURI),
        );
      });
      await page.goto(p);
      await page.waitForLoadState("networkidle");
      const v = await page.evaluate(() => window.__csp);
      expect(v, "CSP violations").toEqual([]);
      expect(problems).toEqual([]);
    });
  }

  test("search dialog, PDF viewer and lightbox work under CSP", async ({
    page,
  }) => {
    const problems = [];
    await page.addInitScript(() => {
      window.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) =>
        window.__csp.push(e.violatedDirective + " " + e.blockedURI),
      );
    });
    page.on("pageerror", (e) => problems.push(e.message));
    await page.goto("/semester-1-nontechnical-assignments");
    await page.waitForSelector(".highlight-card");
    // PDF viewer (must exist on this page, so the check is not vacuous)
    const pdfBtn = page.locator(".download-item--view").first();
    await expect(pdfBtn).toBeVisible();
    await pdfBtn.click();
    await expect(page.locator("#pdf-viewer")).toBeVisible();
    await page.keyboard.press("Escape");
    // Search dialog returns results
    await page.getByRole("button", { name: "Search this site" }).click();
    await page.keyboard.type("packet");
    await expect(page.locator(".search-result").first()).toBeVisible();
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("injected markup in card data is rendered inert", async ({ page }) => {
    const payload = `<img src=x onerror="window.__pwned=1">"'<script>window.__pwned=2</script>`;
    await page.route("**/data/highlights.json", async (route) => {
      const res = await route.fetch();
      const json = await res.json();
      const h = json.highlights.find((x) => x.category === "Credential");
      h.title = payload;
      h.summary = payload;
      h.course = payload;
      h.metrics = [payload];
      h.tags = [payload];
      await route.fulfill({ response: res, json });
    });
    await page.goto("/credentials");
    await page.waitForSelector(".highlight-card");
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
    expect(await page.locator(".highlight-card img[src='x']").count()).toBe(0);
    expect(await page.locator(".highlight-card script").count()).toBe(0);
    // the payload is visible as literal text
    await expect(page.locator(".highlight-card-title").first()).toContainText(
      "<img src=x",
    );
  });

  test("positive control: the CSP really blocks an injected inline script", async ({
    page,
  }) => {
    await page.goto("/credentials");
    const result = await page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener("securitypolicyviolation", (e) =>
            resolve("violation:" + e.violatedDirective),
          );
          const s = document.createElement("script");
          s.textContent = "window.__ranInline = true";
          document.body.appendChild(s);
          setTimeout(() => resolve("no-violation"), 1000);
        }),
    );
    expect(result).toContain("violation:script-src");
    expect(await page.evaluate(() => window.__ranInline)).toBeUndefined();
  });

  test("escapeHtml escapes quotes as well as angle brackets", async ({
    page,
  }) => {
    await page.goto("/credentials");
    const out = await page.evaluate(() =>
      escapeHtml(`<a href="x" onclick='y'>&`),
    );
    expect(out).toBe("&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;");
  });
});

// Looser, per-path policies for the demo apps and standalone documents: they must
// still run cleanly under exactly the policy production serves for them. The
// artifact pages load libraries/fonts from CDNs, so set OFFLINE=1 to skip those.
test.describe("demo and document pages under their own CSP", () => {
  const PAGES = [
    "/public/resume.html",
    "/public/contact.html",
    "/public/transcript.html",
    "/public/case-studies/soc-dashboard.html",
    "/public/case-studies/python-toolkit.html",
    "/public/case-studies/packet-tracer-network-lab.html",
    "/public/documents/kali-metasploitable-wazuh-linux/Portfolio.html",
    "/public/documents/self-study/cisco-linux-unhatched/course-report.html",
    "/public/documents/self-study/cisco-linux-unhatched/command-cheat-sheet.html",
    "/public/artifacts/beginner-cybersecurity-curriculum/index.html",
    "/public/artifacts/cybersec-practice-terminal/index.html",
    "/public/artifacts/inspiron-15-internals/index.html",
    "/public/artifacts/linux-security-architecture/index.html",
    "/public/artifacts/simon-says-wiring/index.html",
    "/public/artifacts/us-markets-30yr-explorer/index.html",
  ];
  for (const p of PAGES) {
    test(p, async ({ page }) => {
      test.skip(
        !!process.env.OFFLINE && p.includes("/artifacts/"),
        "artifact demos need CDN access",
      );
      const errs = [];
      page.on("pageerror", (e) => errs.push(e.message));
      await page.addInitScript(() => {
        window.__csp = [];
        document.addEventListener("securitypolicyviolation", (e) =>
          window.__csp.push(e.violatedDirective + " " + e.blockedURI),
        );
      });
      await page.goto(p);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => window.__csp), "CSP violations").toEqual(
        [],
      );
      expect(errs).toEqual([]);
    });
  }
});
