// Renders the compact section tiles into <section id="section-buttons">.
//
//  - No data-parent  -> one tile per top-level category (the home page).
//  - data-parent="X"  -> one tile per child of taxonomy node X, where X can be
//                        at any depth (a category, a semester, ...).
//
// Every child always gets a tile, and every tile links through even when its
// target page is empty.
//
//  - Home page (no data-parent): a populated tile shows a preview thumbnail of
//    the group's most recent entry with a real image; an empty group shows a
//    placeholder thumbnail and "Coming soon" instead of a count.
//  - Sub-chooser pages (data-parent set): tiles are label-only — no preview
//    image, no placeholder thumbnail, and no "Coming soon" text on empty
//    groups. Populated groups still show their "N items" count.

async function initHome() {
  const container = document.getElementById("section-buttons");
  if (!container || typeof SITE_CATEGORIES === "undefined") return;

  let data;
  try {
    const res = await fetch("data/highlights.json");
    data = await res.json();
  } catch (e) {
    return;
  }
  const highlights = data.highlights || [];
  updateFooterUpdated(data.lastUpdated);

  const parentSlug = container.dataset.parent || "";
  let groups;
  // Under the Coursework category, chooser tiles count distinct classes
  // ("N classes"); under Professional Documents, they count documents inside
  // each collection card ("N documents") — both rather than the raw number of
  // highlight cards ("N items").
  let unit = "item";
  if (parentSlug) {
    const path = findCategoryPathBySlug(parentSlug) || [];
    const parent = path[path.length - 1];
    const childField = CATEGORY_FIELDS[path.length];
    const subs = (parent && parent.subcategories) || [];
    if (path[0] && path[0].value === "Coursework") unit = "class";
    else if (path[0] && path[0].value === "Professional Documents")
      unit = "document";
    groups = subs.map((s) => ({
      slug: s.slug,
      label: s.label,
      items: highlights.filter(
        (h) => itemMatchesPath(h, path) && h[childField] === s.value,
      ),
    }));
  } else {
    groups = SITE_CATEGORIES.map((c) => ({
      slug: c.slug,
      label: c.label,
      items: highlights.filter((h) => h.category === c.value),
    }));
  }

  const isSub = Boolean(parentSlug);
  const fragment = document.createDocumentFragment();
  groups.forEach((g) => {
    fragment.appendChild(buildSectionTile(g, isSub, unit));
  });
  container.replaceChildren(fragment);
}

// `unit` is the noun the tile count is measured in: "item" everywhere except
// under Coursework, where tiles count distinct classes ("class").
function buildSectionTile({ slug, label, items }, isSub, unit = "item") {
  const a = document.createElement("a");
  a.className = "section-button";
  a.href = "/" + slug;

  // Sub-chooser tiles are label-only: no preview image and no placeholder
  // thumbnail. Only the home page's category tiles carry media.
  if (isSub) {
    a.classList.add("section-button--label-only");
  } else {
    const preview = items
      .filter(
        (h) => h.media && h.media.type === "image" && h.media.localSourcePath,
      )
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];

    const media = document.createElement("div");
    media.className = "section-button-media";
    if (preview) {
      const img = document.createElement("img");
      img.src = preview.media.localSourcePath;
      img.alt = "";
      img.loading = "lazy";
      media.appendChild(img);
    } else {
      media.classList.add("section-button-media--empty");
    }
    a.appendChild(media);
  }

  const body = document.createElement("div");
  body.className = "section-button-body";
  const labelEl = document.createElement("span");
  labelEl.className = "section-button-label";
  labelEl.textContent = label;
  body.appendChild(labelEl);

  // Tile count: distinct classes under Coursework ("N classes"), documents
  // inside each collection card under Professional Documents ("N documents"),
  // highlight cards everywhere else ("N items").
  const total =
    unit === "class"
      ? new Set(items.map((h) => h.courseCode || h.course).filter(Boolean)).size
      : unit === "document"
        ? items.reduce(
            (sum, h) => sum + (h.downloads ? h.downloads.length : 1),
            0,
          )
        : items.length;
  const plural =
    unit === "class" ? "classes" : unit === "document" ? "documents" : "items";

  // Empty sub-chooser tiles get no count text at all (no "Coming soon").
  if (!(isSub && total === 0)) {
    const count = document.createElement("span");
    count.className = "section-button-count";
    if (total === 0) {
      count.classList.add("section-button-count--empty");
      count.textContent = "Coming soon";
    } else {
      count.textContent = total + " " + (total === 1 ? unit : plural);
    }
    body.appendChild(count);
  }
  a.appendChild(body);

  const chevron = document.createElement("span");
  chevron.className = "section-button-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "›";
  a.appendChild(chevron);

  return a;
}

function updateFooterUpdated(lastUpdated) {
  if (!lastUpdated) return;
  const el = document.getElementById("footer-updated");
  if (!el) return;
  const date = new Date(lastUpdated + "T00:00:00");
  el.textContent =
    "Last updated " +
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

document.addEventListener("DOMContentLoaded", initHome);
