// search.js — site-wide keyword search over data/highlights.json.
//
// Self-contained: no dependency on categories.js / grid.js / nav.js. Include on
// every page with  <script src="/search.js"></script>  (root-absolute, so it
// also works from /public/ sub-paths). It injects a fixed launcher button
// (top-right, next to the theme toggle) that opens a <dialog> search palette
// with live results. Open with the button, the "/" key, or Ctrl/Cmd+K.
//
// Each result links to the leaf page for that card's taxonomy path, with
// #hl-<id> appended so grid.js can scroll the card into view and flash it.
//
// The index is built from data/highlights.json — the site's single content
// source of truth — so any card added there is searchable with no change here.
(function () {
  "use strict";

  var DATA_URL = "/data/highlights.json";

  var state = {
    loaded: false,
    loading: null,
    items: [], // { item, hay }
    dialog: null,
    input: null,
    list: null,
    status: null,
    results: [],
    active: -1,
  };

  // --- taxonomy value -> destination page slug --------------------------
  // Mirrors the slug rules in categories.js. Degrades to the deepest known
  // level when a card only specifies a partial path. Keep in sync with any
  // structural change to SITE_CATEGORIES.
  function slugFor(item) {
    var c = item.category,
      s = item.subcategory,
      ss = item.subsubcategory,
      sss = item.subsubsubcategory;

    if (c === "Credential") return "/credentials";
    if (c === "Project") return "/projects";

    if (c === "Extra Curricular") {
      if (s === "Educational") return "/educational";
      if (s === "For Fun") return "/forfun";
      return "/extracurricular";
    }

    if (c === "Coursework") {
      var n = s && (String(s).match(/\d+/) || [])[0];
      if (!n) return "/coursework";
      var track =
        ss === "Technical"
          ? "technical"
          : ss === "Non-technical"
            ? "nontechnical"
            : null;
      if (!track) return "/semester-" + n;
      var leaf =
        sss === "Labs" ? "labs" : sss === "Assignments" ? "assignments" : null;
      if (!leaf) return "/semester-" + n + "-" + track;
      return "/semester-" + n + "-" + track + "-" + leaf;
    }
    return "/";
  }

  function breadcrumb(item) {
    return [
      item.category,
      item.subcategory,
      item.subsubcategory,
      item.subsubsubcategory,
    ]
      .filter(Boolean)
      .join(" › ");
  }

  function hrefFor(item) {
    return slugFor(item) + "#hl-" + encodeURIComponent(item.id);
  }

  // --- index + query ---------------------------------------------------
  function haystack(item) {
    return [
      item.title,
      item.summary,
      item.course,
      item.semester,
      item.courseCode,
      breadcrumb(item),
      (item.tags || []).join(" "),
      (item.metrics || []).join(" "),
      (item.downloads || [])
        .map(function (d) {
          return d.label;
        })
        .join(" "),
    ]
      .filter(Boolean)
      .join("  ")
      .toLowerCase();
  }

  function loadData() {
    if (state.loaded) return Promise.resolve();
    if (state.loading) return state.loading;
    state.loading = fetch(DATA_URL)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        state.items = (data.highlights || []).map(function (it) {
          return { item: it, hay: haystack(it) };
        });
        state.loaded = true;
      })
      .catch(function () {
        state.items = [];
        state.loaded = true;
      });
    return state.loading;
  }

  function termsOf(q) {
    return q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  }

  function search(q) {
    var terms = termsOf(q);
    if (!terms.length) return [];
    var scored = [];
    state.items.forEach(function (rec) {
      var hay = rec.hay;
      var ok = true;
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var idx = hay.indexOf(terms[i]);
        if (idx === -1) {
          ok = false;
          break;
        }
        score += idx < 60 ? 3 : 1;
      }
      if (!ok) return;
      var title = (rec.item.title || "").toLowerCase();
      if (title.indexOf(terms[0]) !== -1) score += 10;
      if (
        (rec.item.tags || []).join(" ").toLowerCase().indexOf(terms[0]) !== -1
      )
        score += 4;
      scored.push({ item: rec.item, score: score });
    });
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.date || "").localeCompare(a.item.date || "");
    });
    return scored.slice(0, 30).map(function (s) {
      return s.item;
    });
  }

  // --- text helpers --------------------------------------------------
  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str == null ? "" : str;
    return d.innerHTML;
  }

  function mark(text, terms) {
    var safe = escapeHtml(text);
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp(
        "(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
        "ig",
      );
      safe = safe.replace(re, "<mark>$1</mark>");
    });
    return safe;
  }

  function snippet(item, terms) {
    var text = item.summary || (item.metrics || []).join(" · ") || "";
    if (text.length > 170) {
      var low = text.toLowerCase();
      var pos = -1;
      for (var i = 0; i < terms.length; i++) {
        pos = low.indexOf(terms[i]);
        if (pos !== -1) break;
      }
      var start = pos > 80 ? pos - 60 : 0;
      text = (start > 0 ? "… " : "") + text.slice(start, start + 170) + "…";
    }
    return mark(text, terms);
  }

  // --- rendering ---------------------------------------------------
  function render() {
    var q = state.input.value;
    var terms = termsOf(q);
    state.results = search(q);
    state.active = state.results.length ? 0 : -1;

    if (!terms.length) {
      state.status.textContent =
        "Search projects, labs, coursework, and credentials.";
      state.list.innerHTML = "";
      state.input.removeAttribute("aria-activedescendant");
      return;
    }
    if (!state.results.length) {
      state.status.textContent = 'No matches for "' + q.trim() + '".';
      state.list.innerHTML = "";
      state.input.removeAttribute("aria-activedescendant");
      return;
    }
    state.status.textContent =
      state.results.length +
      (state.results.length === 1 ? " result" : " results");
    state.list.innerHTML = state.results
      .map(function (item, i) {
        return (
          '<li role="option" id="search-opt-' +
          i +
          '" aria-selected="' +
          (i === state.active ? "true" : "false") +
          '">' +
          '<a class="search-result" href="' +
          hrefFor(item) +
          '" data-i="' +
          i +
          '">' +
          '<span class="search-result-title">' +
          mark(item.title || "(untitled)", terms) +
          "</span>" +
          '<span class="search-result-crumb">' +
          escapeHtml(breadcrumb(item)) +
          (item.date ? " · " + escapeHtml(item.date) : "") +
          "</span>" +
          '<span class="search-result-snip">' +
          snippet(item, terms) +
          "</span>" +
          "</a></li>"
        );
      })
      .join("");
    state.input.setAttribute("aria-activedescendant", "search-opt-0");
  }

  function setActive(next) {
    if (!state.results.length) return;
    state.active = (next + state.results.length) % state.results.length;
    Array.prototype.forEach.call(state.list.children, function (li, i) {
      li.setAttribute("aria-selected", i === state.active ? "true" : "false");
      if (i === state.active) li.scrollIntoView({ block: "nearest" });
    });
    state.input.setAttribute(
      "aria-activedescendant",
      "search-opt-" + state.active,
    );
  }

  function go(i) {
    var item = state.results[i];
    if (!item) return;
    var href = hrefFor(item);
    // Same page? close + trigger the hashchange handler in grid.js.
    if (href.split("#")[0] === window.location.pathname) {
      closeDialog();
      if (window.location.hash === "#" + href.split("#")[1]) {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      } else {
        window.location.hash = href.split("#")[1];
      }
      return;
    }
    window.location.href = href;
  }

  // --- dialog lifecycle ------------------------------------------
  function openDialog() {
    loadData().then(render);
    if (!state.dialog.open) state.dialog.showModal();
    state.input.focus();
    state.input.select();
  }

  function closeDialog() {
    if (state.dialog.open) state.dialog.close();
  }

  var SEARCH_SVG =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  function build() {
    if (document.querySelector(".search-launcher")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-launcher";
    btn.setAttribute("aria-label", "Search this site");
    btn.title = "Search (press /)";
    btn.innerHTML = SEARCH_SVG;
    document.body.appendChild(btn);

    // Push the theme toggle left so the two fixed top-right controls don't
    // overlap. No-op on pages without a toggle (e.g. case studies).
    var toggle = document.querySelector(".theme-toggle-fixed");
    if (toggle) {
      requestAnimationFrame(function () {
        var w = Math.round(btn.getBoundingClientRect().width || 40);
        toggle.style.right = "calc(1rem + " + w + "px + 0.5rem)";
      });
    }

    var dlg = document.createElement("dialog");
    dlg.className = "search-dialog";
    dlg.setAttribute("aria-label", "Site search");
    dlg.innerHTML =
      '<div class="search-box">' +
      '<span class="search-box-icon">' +
      SEARCH_SVG +
      "</span>" +
      // type="text" (not "search"): a search field's renderer-level Escape
      // handling can swallow the key before the dialog / our listener sees it.
      '<input type="text" class="search-input" ' +
      'placeholder="Search projects, labs, coursework…" ' +
      'autocomplete="off" autocapitalize="off" spellcheck="false" ' +
      'role="combobox" aria-expanded="true" aria-controls="search-results" ' +
      'aria-autocomplete="list" />' +
      '<button type="button" class="search-close btn btn-link" aria-label="Close search">Esc</button>' +
      "</div>" +
      '<p class="search-status" id="search-status" aria-live="polite"></p>' +
      '<ul class="search-results" id="search-results" role="listbox" aria-label="Search results"></ul>';
    document.body.appendChild(dlg);

    state.dialog = dlg;
    state.input = dlg.querySelector(".search-input");
    state.list = dlg.querySelector(".search-results");
    state.status = dlg.querySelector(".search-status");

    btn.addEventListener("click", openDialog);
    dlg.querySelector(".search-close").addEventListener("click", closeDialog);
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) closeDialog(); // backdrop
    });
    dlg.addEventListener("close", function () {
      state.input.value = "";
    });
    state.input.addEventListener("input", render);
    state.input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(state.active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(state.active - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        go(state.active);
      } else if (e.key === "Escape") {
        // <input type="search"> can swallow the native dialog Escape to clear
        // itself first — close explicitly so one press always dismisses.
        e.preventDefault();
        e.stopPropagation();
        closeDialog();
      }
    });
    state.list.addEventListener("click", function (e) {
      var a = e.target.closest("a.search-result");
      if (!a) return;
      e.preventDefault();
      go(parseInt(a.dataset.i, 10));
    });

    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      var typing =
        tag === "input" || tag === "textarea" || e.target.isContentEditable;
      var slash = e.key === "/" && !typing;
      var cmdK = (e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey);
      if (slash || cmdK) {
        e.preventDefault();
        openDialog();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
