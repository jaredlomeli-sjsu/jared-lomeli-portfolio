// Regenerates every page in the Coursework subtree from the taxonomy in
// categories.js:
//
//   coursework.html                       (chooser: one tile per semester)
//   semester-<n>.html                     (chooser: Technical / Non-technical)
//   semester-<n>-technical.html           (grid)
//   semester-<n>-nontechnical.html        (grid)
//
// A node with `subcategories` renders as a chooser page; a leaf renders as a
// grid page. Run from the repo root:  node scripts/gen-coursework.js
//
// Edit the Coursework subtree in categories.js, then rerun this.

const fs = require("fs");
const path = require("path");
const { SITE_CATEGORIES, CATEGORY_FIELDS } = require("../categories.js");

const ROOT = path.resolve(__dirname, "..");
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23d97706'/%3E%3Ctext x='32' y='43' font-family='Georgia,serif' font-size='30' font-weight='700' fill='%23ffffff' text-anchor='middle'%3EJL%3C/text%3E%3C/svg%3E";
const BASE = "https://jared-lomeli-portfolio.vercel.app";

const ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
];
const ordinal = (n) => ORDINALS[n - 1] || `${n}th`;
const semesterNum = (node) =>
  parseInt(String(node.value).replace(/\D/g, ""), 10);

// --- per-node copy ---------------------------------------------------------

function dekFor(node, path) {
  if (node.dek) return node.dek;
  const depth = path.length - 1;
  const n = path[1] ? ordinal(semesterNum(path[1])) : "";
  if (depth === 1) {
    // a semester chooser
    return `Labs and projects from my ${n} semester of university. Pick a class type.`;
  }
  if (depth === 2) {
    // a class-type chooser (Technical / Non-technical)
    return `${node.label} classes from my ${n} semester. Pick labs or assignments.`;
  }
  if (depth === 3) {
    // a Labs / Assignments grid
    return `${node.label} from my ${n} semester ${path[2].label.toLowerCase()} classes.`;
  }
  return "";
}

function descriptionFor(node, path) {
  const depth = path.length - 1;
  if (depth === 0) {
    return "University coursework by Jared Lomeli, organized by semester and class type.";
  }
  const n = path[1] ? ordinal(semesterNum(path[1])) : "";
  if (depth === 1) {
    return `Coursework from Jared Lomeli's ${n} semester of university.`;
  }
  const crumbs = path
    .slice(2)
    .map((p) => p.label)
    .join(" ");
  return `${crumbs} from Jared Lomeli's ${n} semester of university.`;
}

function titleFor(node, path) {
  const crumbs = path.map((p) => p.label);
  return `${crumbs.join(" · ")} — Jared Lomeli`;
}

function backFor(path) {
  if (path.length === 1) return { href: "/", label: "Back to Portfolio" };
  const parent = path[path.length - 2];
  return { href: "/" + parent.slug, label: parent.label };
}

function eyebrowFor(path) {
  return path.length === 1 ? "Section" : path[path.length - 2].label;
}

// --- HTML pieces ---------------------------------------------------------

const head = (node, path) => `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="theme.js"></script>
    <title>${titleFor(node, path)}</title>
    <meta name="description" content="${descriptionFor(node, path)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${titleFor(node, path)}" />
    <meta property="og:description" content="${descriptionFor(node, path)}" />
    <meta property="og:url" content="${BASE}/${node.slug}" />
    <meta property="og:image" content="${BASE}/public/images/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${BASE}/${node.slug}" />
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="style.css" />
  </head>`;

const hero = (node, path) => {
  const back = backFor(path);
  const strips = [
    `      <nav
        id="section-nav"
        class="section-nav"
        data-current="${path[0].slug}"
        aria-label="Portfolio sections"
      ></nav>`,
  ];
  // one nested strip per level below the top: #section-subnav, #section-subsubnav, ...
  for (let d = 1; d < path.length; d++) {
    strips.push(`      <nav
        id="section-${"sub".repeat(d)}nav"
        class="section-nav section-subnav"
        data-parent="${path[d - 1].slug}"
        data-current="${path[d].slug}"
        aria-label="${path[d - 1].label} sections"
      ></nav>`);
  }
  return `    <div class="category-hero">
      <div class="category-head">
        <a class="category-back" href="${back.href}">&larr; ${back.label}</a>
        <p class="category-eyebrow">${eyebrowFor(path)}</p>
        <h1 class="category-title">${node.label}</h1>
        <p class="category-dek">${dekFor(node, path)}</p>
      </div>

${strips.join("\n")}
    </div>`;
};

// `courses` (optional): course codes to offer as a checkbox filter group.
function filterBar(courses) {
  const courseGroup =
    courses && courses.length
      ? `          <div class="filter-group">
            <p class="filter-group-label">Course</p>
            <div id="filter-course-options" class="filter-checkboxes">
${courses
  .map(
    (c) =>
      `              <label class="filter-checkbox"><input type="checkbox" value="${c}" /> ${c}</label>`,
  )
  .join("\n")}
            </div>
          </div>
`
      : "";
  return `      <section id="filter-bar" class="filter-bar" aria-label="Filter entries">
        <button
          type="button"
          id="filter-toggle"
          class="btn btn-outline filter-toggle"
          aria-expanded="false"
          aria-controls="filter-panel"
        >
          Filters
          <span id="filter-count" class="filter-count" hidden>0</span>
          <svg class="filter-chevron" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M2 5l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div id="filter-panel" class="filter-panel" hidden>
${courseGroup}          <div class="filter-group">
            <p class="filter-group-label">Date range</p>
            <div class="filter-date-range">
              <label>From <input type="date" id="filter-date-from" /></label>
              <label>To <input type="date" id="filter-date-to" /></label>
            </div>
          </div>
          <div class="filter-group">
            <p class="filter-group-label">Sort</p>
            <select id="filter-sort" class="filter-sort-select">
              <option value="desc" selected>Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
          <div class="filter-actions">
            <button type="button" id="filter-clear" class="btn btn-link">Clear filters</button>
          </div>
        </div>
      </section>`;
}

const DIALOGS = `    <dialog id="lightbox" class="lightbox-dialog" aria-label="Image preview">
      <button class="dialog-close" data-close="lightbox" type="button" aria-label="Close image preview">✕</button>
      <img id="lightbox-image" src="" alt="" />
      <p id="lightbox-caption" class="lightbox-caption"></p>
    </dialog>

    <dialog id="pdf-viewer" class="pdf-viewer-dialog" aria-label="Document preview">
      <div class="pdf-viewer-header">
        <h2 id="pdf-viewer-title"></h2>
        <button class="dialog-close" data-close="pdf-viewer" type="button" aria-label="Close document preview">✕</button>
      </div>
      <iframe id="pdf-viewer-frame" loading="lazy" title="Document preview" src="about:blank"></iframe>
    </dialog>`;

function chooserPage(node, path) {
  const back = backFor(path);
  return `<!doctype html>
<html lang="en">
${head(node, path)}
  <body class="category-page">
    <button type="button" class="btn theme-toggle-fixed" data-theme-toggle>
      Dark Mode
    </button>

${hero(node, path)}

    <main>
      <section
        id="section-buttons"
        class="section-buttons"
        data-parent="${node.slug}"
        aria-label="${node.label} sections"
      >
        <!-- one tile per child, rendered by home.js -->
      </section>
    </main>

    <footer class="category-footer">
      <a class="category-back" href="${back.href}">&larr; ${back.label}</a>
    </footer>

    <script src="categories.js"></script>
    <script src="home.js"></script>
    <script src="nav.js"></script>
    <script src="/search.js"></script>
  </body>
</html>
`;
}

function gridPage(node, path) {
  const back = backFor(path);
  const dataAttrs = path
    .map((p, i) => `        data-${CATEGORY_FIELDS[i]}="${p.value}"`)
    .join("\n");
  // The course filter is defined on the semester node (path[1]) and shows on
  // both of its track pages.
  const courses = (path[1] && path[1].courses) || [];
  return `<!doctype html>
<html lang="en">
${head(node, path)}
  <body class="category-page">
    <button type="button" class="btn theme-toggle-fixed" data-theme-toggle>
      Dark Mode
    </button>

${hero(node, path)}

    <main>
${filterBar(courses)}

      <section
        id="highlight-grid"
        class="highlight-grid"
${dataAttrs}
        aria-label="${node.label}"
      >
        <!-- cards rendered by grid.js -->
      </section>
    </main>

    <footer class="category-footer">
      <a class="category-back" href="${back.href}">&larr; ${back.label}</a>
    </footer>

${DIALOGS}

    <script src="categories.js"></script>
    <script src="grid.js"></script>
    <script src="nav.js"></script>
    <script src="/search.js"></script>
  </body>
</html>
`;
}

// --- walk & write ------------------------------------------------------------

// The class-type nodes share a `value` ("Technical Classes") across semesters,
// so the path can't be looked up by value — it's threaded through the recursion.
function emit(node, parentPath) {
  const nodePath = (parentPath || []).concat(node);
  const html = node.subcategories
    ? chooserPage(node, nodePath)
    : gridPage(node, nodePath);
  const file = path.join(ROOT, node.slug + ".html");
  fs.writeFileSync(file, html);
  console.log("wrote", path.relative(ROOT, file));
  (node.subcategories || []).forEach((child) => emit(child, nodePath));
}

const root = SITE_CATEGORIES.find((c) => c.value === "Coursework");
if (!root) {
  console.error("No Coursework category in categories.js");
  process.exit(1);
}
emit(root, []);
console.log("done");
