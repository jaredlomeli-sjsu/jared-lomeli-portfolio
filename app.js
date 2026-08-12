// Reactive Event Engine — state container, data loading, and component rendering.

const appState = {
  openPdf: null,
  highlights: [],
};

async function loadData() {
  const highlightsRes = await fetch("data/highlights.json");
  const highlightsData = await highlightsRes.json();
  appState.highlights = highlightsData.highlights;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// --- HighlightGrid ---

// Tags always highlighted regardless of how many cards they appear on —
// skills worth calling out even where they only show up once.
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
  const common = new Set(Object.keys(counts).filter((tag) => counts[tag] >= 2));
  PINNED_TAGS.forEach((tag) => common.add(tag));
  return common;
}

function renderHighlightGrid() {
  const container = document.getElementById("highlight-grid");
  const commonTags = computeCommonTags(appState.highlights);
  const fragment = document.createDocumentFragment();
  let lastCategory = null;
  appState.highlights.forEach((item) => {
    if (item.category !== lastCategory) {
      const heading = document.createElement("h2");
      heading.className = "highlight-section-heading";
      heading.textContent =
        item.category === "Credential" ? "Credentials" : "Projects";
      fragment.appendChild(heading);
      lastCategory = item.category;
    }
    fragment.appendChild(buildHighlightCard(item, commonTags));
  });
  container.replaceChildren(fragment);
}

function buildHighlightCard(item, commonTags) {
  const card = document.createElement("article");
  card.className = "highlight-card";

  if (item.starred) {
    const star = document.createElement("div");
    star.className = "highlight-card-star";
    star.title = "Featured — best and most comprehensive project";
    star.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5l2.95 6.28 6.93.74-5.17 4.75 1.44 6.86L12 17.6l-6.15 3.53 1.44-6.86-5.17-4.75 6.93-.74L12 2.5z" fill="currentColor"/></svg>';
    card.appendChild(star);
  }

  const metaLine = [item.category, item.date, item.course]
    .filter(Boolean)
    .join(" · ");
  const header = document.createElement("div");
  header.className = "highlight-card-header";
  header.innerHTML = `
    <p class="highlight-card-meta">${escapeHtml(metaLine)}</p>
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

  const links = item.links || {};
  if (links.github || links.liveDemo || links.pdfReport || links.verify) {
    const linksEl = document.createElement("div");
    linksEl.className = "highlight-card-links";

    if (links.github)
      linksEl.appendChild(createExternalLink("GitHub", links.github));
    if (links.liveDemo)
      linksEl.appendChild(createExternalLink("Live Demo", links.liveDemo));
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

// --- LightboxModal ---

function openLightbox(src, caption) {
  document.getElementById("lightbox-image").src = src;
  document.getElementById("lightbox-image").alt = caption;
  document.getElementById("lightbox-caption").textContent = caption;
  openDialog(document.getElementById("lightbox"));
}

// --- PdfViewerModal ---

function openPdfViewer(path, title) {
  appState.openPdf = path;
  document.getElementById("pdf-viewer-title").textContent = title;
  document.getElementById("pdf-viewer-frame").src = path;
  openDialog(document.getElementById("pdf-viewer"));
}

// --- Dialog helpers (shared by all three modals) ---

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

async function init() {
  await loadData();
  renderHighlightGrid();
  initDialogFocusReturn();
  initDialogCloseButtons();
  initBackdropClose();
}

document.addEventListener("DOMContentLoaded", init);
