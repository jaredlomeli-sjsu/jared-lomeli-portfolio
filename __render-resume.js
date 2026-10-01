const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1294 },
  });
  const abs = path.resolve(process.argv[2]).replace(/\\/g, "/");
  const pdfPath = "file:///" + abs;
  console.log("loading", pdfPath);
  await page.goto(pdfPath, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: process.argv[3] });
  console.log("screenshot saved to", process.argv[3]);
  await browser.close();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
