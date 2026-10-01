// Shared card-grid engine for the category pages (/credentials, /projects,
// /coursework) and the Extra Curricular sub-pages (/educational, /forfun).
// Each page has one <section id="highlight-grid" data-category="..."
// [data-subcategory="..."]> and includes this script; the grid renders only
// that (sub)category's cards. Course (semester leaf pages), Date-range, and
// Sort filters behave the same on every page; there is no Type/category filter
// here (the page IS the category).
//
// Ordering: cards are always date-sorted. The default is newest first; the Sort
// control switches to oldest first. Undated items sort to the end.

const DEFAULT_SORT = "desc"; // newest first

const appState = {
  openPdf: null,
  highlights: [],
  lastUpdated: null,
  // taxonomy values for this page, deepest last — read from the
  // data-category / data-subcategory / ... attributes in init()
  path: [],
  filters: {
    courses: new Set(), // selected courseCode values (semester leaf pages only)
    dateFrom: null,
    dateTo: null,
    sort: DEFAULT_SORT, // "asc" | "desc"
  },
};

async function loadData() {
  const res = await fetch("data/highlights.json");
  const data = await res.json();
  appState.highlights = data.highlights;
  appState.lastUpdated = data.lastUpdated || null;
}

function renderFooterUpdated() {
  if (!appState.lastUpdated) return;
  const el = document.getElementById("footer-updated");
  if (!el) return;
  const date = new Date(appState.lastUpdated + "T00:00:00");
  el.textContent =
    "Last updated " +
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// --- Tag accenting (site-wide, computed across every category) ---

const PINNED_TAGS = new Set([
  "Data Engineering",
  "Linux",
  "Cisco Packet Tracer",
]);

function computeCommonTags(highlights) {
  const counts = {};
  highlights.forEach((item) => {
    (item.tags || []).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  const threshold = Math.max(2, Math.ceil(highlights.length * 0.22));
  const common = new Set(
    Object.keys(counts).filter((tag) => counts[tag] >= threshold),
  );
  PINNED_TAGS.forEach((tag) => common.add(tag));
  return common;
}

// --- Filtering & ordering ---

function getPageHighlights() {
  return appState.highlights.filter((item) =>
    appState.path.every((value, i) => item[CATEGORY_FIELDS[i]] === value),
  );
}

function getFilteredHighlights() {
  const { courses, dateFrom, dateTo } = appState.filters;
  return getPageHighlights().filter((item) => {
    if (courses.size > 0 && !courses.has(item.courseCode)) return false;
    if (dateFrom && (!item.date || item.date < dateFrom)) return false;
    if (dateTo && (!item.date || item.date > dateTo)) return false;
    return true;
  });
}

function sortHighlightsByDate(items, direction) {
  const withDate = items.filter((item) => item.date);
  const withoutDate = items.filter((item) => !item.date);
  withDate.sort((a, b) =>
    direction === "asc"
      ? a.date.localeCompare(b.date)
      : b.date.localeCompare(a.date),
  );
  return [...withDate, ...withoutDate];
}

function renderGrid() {
  const container = document.getElementById("highlight-grid");
  const commonTags = computeCommonTags(appState.highlights);
  const fragment = document.createDocumentFragment();

  let items = sortHighlightsByDate(
    getFilteredHighlights(),
    appState.filters.sort || DEFAULT_SORT,
  );

  // Pinned cards (e.g. the TECH 65 Packet Tracer file collection) always lead
  // the grid, ahead of the date-sorted entries and regardless of sort direction.
  const pinned = items.filter((it) => it.pinned);
  if (pinned.length) {
    items = [...pinned, ...items.filter((it) => !it.pinned)];
  }

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "highlight-grid-empty";
    const notes = typeof COURSE_NOTES !== "undefined" ? COURSE_NOTES : {};
    const picked = [...appState.filters.courses];
    if (picked.length === 1 && notes[picked[0]]) {
      // A single course with no archived digital work is selected.
      empty.textContent = notes[picked[0]];
    } else {
      empty.textContent =
        getPageHighlights().length > 0
          ? "No entries match the selected filters."
          : "Nothing here yet — check back soon.";
    }
    fragment.appendChild(empty);
    container.replaceChildren(fragment);
    return;
  }

  items.forEach((item) => {
    fragment.appendChild(buildCard(item, commonTags));
  });
  container.replaceChildren(fragment);
}

function buildCard(item, commonTags) {
  const card = document.createElement("article");
  // Uniform card sizing on category pages — starred items keep the star badge
  // below but no longer span the full grid width.
  card.className = "highlight-card";
  // A "collection" card (e.g. the Packet Tracer file archive) is styled to stand
  // out from the normal coursework cards and carries a downloads list instead of
  // a single Report link.
  if (item.kind === "collection") {
    card.classList.add("highlight-card--collection");
  }
  // Anchor target for deep links from site search (search.js): /page#hl-<id>
  if (item.id) card.id = "hl-" + item.id;

  if (item.kind === "collection") {
    const badge = document.createElement("p");
    badge.className = "highlight-card-collection-badge";
    badge.textContent = "Ongoing collection";
    card.appendChild(badge);
  }

  if (item.starred) {
    const star = document.createElement("div");
    star.className = "highlight-card-star";
    star.title = "Featured — best and most comprehensive project";
    star.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5l2.95 6.28 6.93.74-5.17 4.75 1.44 6.86L12 17.6l-6.15 3.53 1.44-6.86-5.17-4.75 6.93-.74L12 2.5z" fill="currentColor"/></svg>';
    card.appendChild(star);
  }

  const metaRest = [item.date, item.course].filter(Boolean).join(" · ");
  const header = document.createElement("div");
  header.className = "highlight-card-header";
  header.innerHTML = `
    <p class="highlight-card-meta">
      <span class="highlight-card-cat">${escapeHtml(item.category)}</span>${
        metaRest
          ? ' <span class="highlight-card-meta-sep">·</span> ' +
            escapeHtml(metaRest)
          : ""
      }
    </p>
    <h3 class="highlight-card-title">${escapeHtml(item.title)}</h3>
  `;
  card.appendChild(header);

  if (item.media && item.media.type === "placeholder") {
    const mediaEl = document.createElement("div");
    mediaEl.className =
      "highlight-card-media highlight-card-media--placeholder";
    mediaEl.textContent = item.media.label || "Screenshot coming soon";
    card.appendChild(mediaEl);
  } else if (item.media) {
    const mediaEl = document.createElement("div");
    mediaEl.className = "highlight-card-media";
    const img = document.createElement("img");
    img.src = item.media.localSourcePath;
    img.alt = item.media.altText || "";
    img.loading = "lazy";
    if (item.media.width && item.media.height) {
      img.width = item.media.width;
      img.height = item.media.height;
    }
    img.tabIndex = 0;
    const openThisLightbox = () =>
      openLightbox(item.media.localSourcePath, item.media.altText || "");
    img.addEventListener("click", openThisLightbox);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openThisLightbox();
      }
    });
    mediaEl.appendChild(img);
    card.appendChild(mediaEl);
  }

  const content = document.createElement("div");
  content.className = "highlight-card-content";
  content.innerHTML = `
    <p class="highlight-card-summary">${escapeHtml(item.summary)}</p>
  `;

  if (item.metrics && item.metrics.length) {
    const metricsList = document.createElement("ul");
    metricsList.className = "highlight-card-metrics";
    item.metrics.forEach((metric) => {
      const li = document.createElement("li");
      li.textContent = metric;
      metricsList.appendChild(li);
    });
    content.appendChild(metricsList);
  }

  if (item.tags && item.tags.length) {
    const tagsEl = document.createElement("div");
    tagsEl.className = "highlight-card-tags";
    item.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag" + (commonTags.has(tag) ? " tag--common" : "");
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
    content.appendChild(tagsEl);
  }

  if (item.downloads && item.downloads.length) {
    const dlWrap = document.createElement("div");
    dlWrap.className = "highlight-card-downloads";

    const dlHead = document.createElement("p");
    dlHead.className = "highlight-card-downloads-head";
    dlHead.textContent =
      item.downloads.length +
      (item.downloads.length === 1 ? " file" : " files");
    dlWrap.appendChild(dlHead);

    item.downloads.forEach((dl) => {
      // Anything the browser can render (PDF, images, plain-text source)
      // opens in-page — PDF viewer / lightbox / code viewer — never as a raw
      // download. Only formats that genuinely can't be embedded (Packet
      // Tracer .pka/.pkt) fall back to a real <a download>.
      const ext = (dl.path.split(".").pop() || "").toLowerCase();
      const isPdf = ext === "pdf";
      const isImage = ext === "png" || ext === "jpg" || ext === "jpeg";
      const isCode = ext === "py";
      const embeddable = isPdf || isImage || isCode;

      const el = document.createElement(embeddable ? "button" : "a");
      el.className =
        "download-item" + (embeddable ? " download-item--view" : "");
      if (embeddable) el.type = "button";
      const meta = [dl.type, dl.size, dl.source && "from " + dl.source]
        .filter(Boolean)
        .join(" · ");
      el.innerHTML =
        '<span class="download-item-name">' +
        escapeHtml(dl.label) +
        "</span>" +
        (meta
          ? '<span class="download-item-meta">' + escapeHtml(meta) + "</span>"
          : "");

      if (isPdf) {
        el.addEventListener("click", () => openPdfViewer(dl.path, dl.label));
      } else if (isImage) {
        el.addEventListener("click", () => openLightbox(dl.path, dl.label));
      } else if (isCode) {
        el.addEventListener("click", () => openCodeViewer(dl.path, dl.label));
      } else {
        el.href = dl.path;
        el.setAttribute("download", "");
      }

      dlWrap.appendChild(el);
    });

    content.appendChild(dlWrap);
  }

  const links = item.links || {};
  if (
    links.related ||
    links.github ||
    links.liveDemo ||
    links.pdfReport ||
    links.verify ||
    links.video ||
    links.caseStudy ||
    links.writeup
  ) {
    const linksEl = document.createElement("div");
    linksEl.className = "highlight-card-links";

    // Internal pointer to another card/page (e.g. a lab card linking to the
    // Packet Tracer file collection). Same tab, uses the search.js deep-link
    // form /page#hl-<id> so the target card flashes on arrival.
    if (links.related)
      linksEl.appendChild(
        createInternalLink(links.relatedLabel || "Related", links.related),
      );
    if (links.github)
      linksEl.appendChild(createExternalLink("GitHub", links.github));
    if (links.video)
      linksEl.appendChild(
        createVideoButton("Watch Video", links.video, item.title),
      );
    if (links.liveDemo)
      linksEl.appendChild(createExternalLink("Live Demo", links.liveDemo));
    if (links.writeup)
      linksEl.appendChild(createExternalLink("Full Write-Up", links.writeup));
    if (links.caseStudy)
      linksEl.appendChild(
        createExternalLink("Read the Write-Up", links.caseStudy),
      );
    if (links.verify)
      linksEl.appendChild(
        createExternalLink("Verify Credential", links.verify),
      );
    if (links.pdfReport) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-link";
      btn.textContent = "Report";
      btn.addEventListener("click", () =>
        openPdfViewer(links.pdfReport, item.title),
      );
      linksEl.appendChild(btn);
    }
    // Lead link gets the filled accent treatment so each card has one clear CTA.
    if (linksEl.firstElementChild) {
      linksEl.firstElementChild.classList.add("btn-accent");
    }
    content.appendChild(linksEl);
  }

  card.appendChild(content);
  return card;
}

function createExternalLink(label, href) {
  const a = document.createElement("a");
  a.className = "btn btn-link";
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = label;
  return a;
}

// Same-tab link to another page/card within the site (no target=_blank).
function createInternalLink(label, href) {
  const a = document.createElement("a");
  a.className = "btn btn-link";
  a.href = href;
  a.textContent = label;
  return a;
}

// --- LightboxModal ---

function openLightbox(src, caption) {
  document.getElementById("lightbox-image").src = src;
  document.getElementById("lightbox-image").alt = caption;
  document.getElementById("lightbox-caption").textContent = caption;
  openDialog(document.getElementById("lightbox"));
}

// --- PdfViewerModal ---

function openPdfViewer(path, title) {
  clearViewerMedia();
  appState.openPdf = path;
  document.getElementById("pdf-viewer-title").textContent = title;
  document.getElementById("pdf-viewer-frame").src = path;
  openDialog(document.getElementById("pdf-viewer"));
}

// --- In-page media (video, source code) — reuses the #pdf-viewer dialog ---

const VIEWER_MEDIA_ID = "pdf-viewer-media";

// Removes any injected video/code element (stops playback) and shows the PDF
// iframe again. Runs before every open and whenever the dialog closes.
function clearViewerMedia() {
  const media = document.getElementById(VIEWER_MEDIA_ID);
  if (media) {
    media.querySelectorAll("video").forEach((v) => v.pause());
    media.remove();
  }
  const frame = document.getElementById("pdf-viewer-frame");
  if (frame) frame.hidden = false;
}

function showViewerMedia(title, node) {
  clearViewerMedia();
  const frame = document.getElementById("pdf-viewer-frame");
  frame.hidden = true;
  node.id = VIEWER_MEDIA_ID;
  frame.after(node);
  document.getElementById("pdf-viewer-title").textContent = title;
  openDialog(document.getElementById("pdf-viewer"));
}

function getYouTubeId(url) {
  const m = String(url).match(
    /^https?:\/\/(?:youtu\.be\/|(?:www\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

function openVideoViewer(src, title) {
  const wrap = document.createElement("div");
  wrap.className = "viewer-media viewer-media--video";
  const yt = getYouTubeId(src);
  if (yt) {
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + yt + "?rel=0";
    iframe.title = title;
    iframe.allow =
      "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    wrap.appendChild(iframe);
  } else {
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = src;
    video.setAttribute("aria-label", title);
    wrap.appendChild(video);
  }
  showViewerMedia(title, wrap);
}

// Local files and YouTube play in-page; any other host stays a normal link.
function createVideoButton(label, href, title) {
  if (!getYouTubeId(href) && /^https?:\/\//i.test(href)) {
    return createExternalLink(label, href);
  }
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-link";
  btn.textContent = label;
  btn.addEventListener("click", () => openVideoViewer(href, title));
  return btn;
}

async function openCodeViewer(path, title) {
  const pre = document.createElement("pre");
  pre.className = "viewer-media viewer-media--code";
  pre.tabIndex = 0;
  const code = document.createElement("code");
  code.textContent = "Loading…";
  pre.appendChild(code);
  showViewerMedia(title, pre);
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    code.textContent = await res.text();
  } catch (err) {
    code.textContent = "Couldn't load this file.";
  }
}

// --- Dialog helpers (shared by both modals) ---

function openDialog(dialog) {
  dialog._returnFocusTo = document.activeElement;
  dialog.showModal();
}

function initDialogFocusReturn() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      if (dialog._returnFocusTo) dialog._returnFocusTo.focus();
    });
  });
}

function initDialogCloseButtons() {
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.close).close();
    });
  });
}

function initBackdropClose() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  });
}

// --- Filters (Course [semester leaf pages] + Date range + Sort) ---

function updateFilterCount() {
  const { courses, dateFrom, dateTo, sort } = appState.filters;
  const count =
    courses.size +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (sort && sort !== DEFAULT_SORT ? 1 : 0);
  const badge = document.getElementById("filter-count");
  if (!badge) return;
  badge.hidden = count === 0;
  badge.textContent = String(count);
}

function initFilters() {
  const toggle = document.getElementById("filter-toggle");
  const panel = document.getElementById("filter-panel");
  if (!toggle || !panel) return;

  const courseContainer = document.getElementById("filter-course-options");
  const dateFromInput = document.getElementById("filter-date-from");
  const dateToInput = document.getElementById("filter-date-to");
  const sortSelect = document.getElementById("filter-sort");
  const clearBtn = document.getElementById("filter-clear");

  sortSelect.value = appState.filters.sort; // keep the control in sync with state

  function setFilterPanelOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  }

  if (courseContainer) {
    courseContainer.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) appState.filters.courses.add(cb.value);
        else appState.filters.courses.delete(cb.value);
        cb.closest(".filter-checkbox").classList.toggle(
          "filter-checkbox--active",
          cb.checked,
        );
        renderGrid();
        updateFilterCount();
      });
    });
  }

  dateFromInput.addEventListener("change", () => {
    appState.filters.dateFrom = dateFromInput.value || null;
    renderGrid();
    updateFilterCount();
  });

  dateToInput.addEventListener("change", () => {
    appState.filters.dateTo = dateToInput.value || null;
    renderGrid();
    updateFilterCount();
  });

  sortSelect.addEventListener("change", () => {
    appState.filters.sort = sortSelect.value || DEFAULT_SORT;
    renderGrid();
    updateFilterCount();
  });

  clearBtn.addEventListener("click", () => {
    appState.filters.courses.clear();
    appState.filters.dateFrom = null;
    appState.filters.dateTo = null;
    appState.filters.sort = DEFAULT_SORT;
    sortSelect.value = DEFAULT_SORT;
    if (courseContainer) {
      courseContainer.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        cb.checked = false;
        cb.closest(".filter-checkbox").classList.remove(
          "filter-checkbox--active",
        );
      });
    }
    dateFromInput.value = "";
    dateToInput.value = "";
    renderGrid();
    updateFilterCount();
  });

  toggle.addEventListener("click", () => {
    setFilterPanelOpen(panel.hidden);
  });

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (
      !panel.contains(e.target) &&
      e.target !== toggle &&
      !toggle.contains(e.target)
    ) {
      setFilterPanelOpen(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      setFilterPanelOpen(false);
      toggle.focus();
    }
  });
}

// Scroll to and briefly flash the card named by location.hash (#hl-<id>),
// used when arriving from a site-search result (search.js).
function flashHashCard() {
  const id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.remove("highlight-card--flash");
  void el.offsetWidth; // restart the animation if the class was just removed
  el.classList.add("highlight-card--flash");
  window.setTimeout(() => el.classList.remove("highlight-card--flash"), 2600);
}

async function init() {
  const grid = document.getElementById("highlight-grid");
  appState.path = grid
    ? CATEGORY_FIELDS.map((f) => grid.dataset[f]).filter(Boolean)
    : [];
  await loadData();
  renderGrid();
  renderFooterUpdated();
  initFilters();
  initDialogFocusReturn();
  initDialogCloseButtons();
  initBackdropClose();
  const viewer = document.getElementById("pdf-viewer");
  if (viewer) viewer.addEventListener("close", clearViewerMedia);
  flashHashCard();
  window.addEventListener("hashchange", flashHashCard);
}

document.addEventListener("DOMContentLoaded", init);
