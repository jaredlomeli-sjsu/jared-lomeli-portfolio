// Local static server that mirrors this site's Vercel config (cleanUrls: true) —
// a request for /credentials serves credentials.html, and / serves index.html.
// Used by the Playwright test runner (see playwright.config.js) and handy for
// manual preview:  node dev-server.js . 8000
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(process.argv[2] || process.cwd());
const PORT = Number(process.argv[3]) || 8000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pka": "application/octet-stream",
  ".pkt": "application/octet-stream",
  ".py": "text/x-python; charset=utf-8",
  ".mp4": "video/mp4",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath.endsWith("/")) urlPath += "index.html";
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) return send(res, 403, "forbidden");

  fs.readFile(file, (err, data) => {
    if (!err) {
      return send(res, 200, data, TYPES[path.extname(file).toLowerCase()]);
    }
    if (!path.extname(file)) {
      fs.readFile(file + ".html", (e2, d2) => {
        if (!e2) return send(res, 200, d2, TYPES[".html"]);
        send(res, 404, "404 Not Found: " + urlPath);
      });
    } else {
      send(res, 404, "404 Not Found: " + urlPath);
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`dev server: http://127.0.0.1:${PORT}  (root: ${ROOT})`);
});
