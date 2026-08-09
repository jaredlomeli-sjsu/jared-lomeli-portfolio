// Reactive Event Engine — state container, data loading, and component rendering.

const appState = {
  activeSemester: null,
  searchQuery: "",
  selectedCourse: null,
  openPdf: null,
  highlights: [],
  coursework: [],
};

async function loadData() {
  const [highlightsRes, courseworkRes] = await Promise.all([
    fetch("data/highlights.json"),
    fetch("data/coursework.json"),
  ]);
  const highlightsData = await highlightsRes.json();
  const courseworkData = await courseworkRes.json();
  appState.highlights = highlightsData.highlights;
  appState.coursework = courseworkData.semesters;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// --- HighlightGrid ---

function renderHighlightGrid() {
  const container = document.getElementById("highlight-grid");
  const fragment = document.createDocumentFragment();
  appState.highlights.forEach((item) =>
    fragment.appendChild(buildHighlightCard(item)),
  );
  container.replaceChildren(fragment);
}

function buildHighlightCard(item) {
  const card = document.createElement("article");
  card.className =
    "highlight-card" + (item.media ? "" : " highlight-card--no-media");

  if (item.media) {
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

  const metaLine = [item.category, item.date, item.course]
    .filter(Boolean)
    .join(" · ");
  content.innerHTML = `
    <p class="highlight-card-meta">${escapeHtml(metaLine)}</p>
    <h3 class="highlight-card-title">${escapeHtml(item.title)}</h3>
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
      span.className = "tag";
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
    content.appendChild(tagsEl);
  }

  const links = item.links || {};
  if (links.github || links.liveDemo || links.pdfReport) {
    const linksEl = document.createElement("div");
    linksEl.className = "highlight-card-links";

    if (links.github)
      linksEl.appendChild(createExternalLink("GitHub", links.github));
    if (links.liveDemo)
      linksEl.appendChild(createExternalLink("Live Demo", links.liveDemo));
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

// --- ExplorerModal ---

function openExplorer() {
  if (appState.activeSemester === null && appState.coursework.length) {
    appState.activeSemester = appState.coursework[0].id;
  }
  renderExplorerSidebar();
  renderExplorerMobileSelect();
  renderExplorerDocuments();
  openDialog(document.getElementById("vault-explorer"));
  document.getElementById("explorer-search").focus();
}

function renderExplorerSidebar() {
  const sidebar = document.getElementById("explorer-sidebar");
  const fragment = document.createDocumentFragment();
  appState.coursework.forEach((semester) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "explorer-semester-btn" +
      (semester.id === appState.activeSemester ? " active" : "");
    btn.textContent = semester.name;
    btn.addEventListener("click", () => selectSemester(semester.id));
    fragment.appendChild(btn);
  });
  sidebar.replaceChildren(fragment);
}

function renderExplorerMobileSelect() {
  const select = document.getElementById("explorer-semester-mobile");
  select.replaceChildren();
  appState.coursework.forEach((semester) => {
    const option = document.createElement("option");
    option.value = semester.id;
    option.textContent = semester.name;
    option.selected = semester.id === appState.activeSemester;
    select.appendChild(option);
  });
  select.onchange = () => selectSemester(select.value);
}

function selectSemester(semesterId) {
  appState.activeSemester = semesterId;
  appState.selectedCourse = null;
  renderExplorerSidebar();
  renderExplorerMobileSelect();
  renderExplorerDocuments();
}

function renderExplorerDocuments() {
  const container = document.getElementById("explorer-documents");
  const semester = appState.coursework.find(
    (s) => s.id === appState.activeSemester,
  );
  const fragment = document.createDocumentFragment();

  if (!semester) {
    container.replaceChildren(fragment);
    return;
  }

  const query = appState.searchQuery.trim().toLowerCase();
  let anyDocs = false;

  semester.courses.forEach((course) => {
    const docs = course.documents.filter((doc) => {
      if (!query) return true;
      const haystack = [doc.title, doc.type, ...(doc.tags || [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
    if (!docs.length) return;
    anyDocs = true;

    const courseHeading = document.createElement("h3");
    courseHeading.className = "explorer-course-heading";
    courseHeading.textContent = course.title;
    fragment.appendChild(courseHeading);

    docs.forEach((doc) => fragment.appendChild(buildExplorerDocRow(doc)));
  });

  if (!anyDocs) {
    const empty = document.createElement("p");
    empty.className = "explorer-empty";
    empty.textContent = "No documents match your search.";
    fragment.appendChild(empty);
  }

  container.replaceChildren(fragment);
}

function buildExplorerDocRow(doc) {
  const row = document.createElement("div");
  row.className = "explorer-doc-row";
  row.setAttribute("role", "option");
  row.tabIndex = 0;

  const metaParts = [doc.type, doc.date, doc.formattedSize];
  if (doc.grade) metaParts.push(doc.grade);

  row.innerHTML = `
    <span class="explorer-doc-title">${escapeHtml(doc.title)}</span>
    <span class="explorer-doc-meta">${escapeHtml(metaParts.join(" · "))}</span>
  `;

  const openThisDoc = () => openPdfViewer(doc.publicPath, doc.title);
  row.addEventListener("click", openThisDoc);
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openThisDoc();
    }
  });

  return row;
}

function initExplorerArrowNav() {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    const explorer = document.getElementById("vault-explorer");
    const pdfViewer = document.getElementById("pdf-viewer");
    if (!explorer.open || pdfViewer.open) return;

    const rows = Array.from(document.querySelectorAll(".explorer-doc-row"));
    if (!rows.length) return;

    const currentIndex = rows.indexOf(document.activeElement);
    e.preventDefault();

    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = 0;
    } else if (e.key === "ArrowDown") {
      nextIndex = Math.min(currentIndex + 1, rows.length - 1);
    } else {
      nextIndex = Math.max(currentIndex - 1, 0);
    }
    rows[nextIndex].focus();
  });
}

function initExplorerFocusTrap() {
  const dialog = document.getElementById("vault-explorer");
  dialog.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;

    const focusable = Array.from(
      dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

function initExplorerSearch() {
  document.getElementById("explorer-search").addEventListener("input", (e) => {
    appState.searchQuery = e.target.value;
    renderExplorerDocuments();
  });
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

// --- HeroView ---

function initHeroActions() {
  document
    .getElementById("open-explorer-btn")
    .addEventListener("click", openExplorer);
}

async function init() {
  await loadData();
  renderHighlightGrid();
  initHeroActions();
  initDialogFocusReturn();
  initDialogCloseButtons();
  initBackdropClose();
  initExplorerSearch();
  initExplorerArrowNav();
  initExplorerFocusTrap();
}

document.addEventListener("DOMContentLoaded", init);
