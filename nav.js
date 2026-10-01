// Shared nav strips, filled from categories.js. Any of these on a page:
//
//   <nav id="section-nav" data-current="<slug|empty>">
//       -> one link per top-level category
//   <nav id="section-subnav" | "section-subsubnav" | "section-subsubsubnav" | ...
//        data-parent="<node value>" data-current="<slug>">
//       -> one link per child of the named node
//
// Every node is always shown; empty ones lead to a placeholder page.
(function () {
  if (typeof SITE_CATEGORIES === "undefined") return;

  function linkStrip(el, items, current) {
    el.innerHTML = items
      .map((it) => {
        const active = it.slug === current;
        return (
          `<a href="/${it.slug}" class="section-nav-link` +
          (active ? " section-nav-link--active" : "") +
          `"${active ? ' aria-current="page"' : ""}>${it.label}</a>`
        );
      })
      .join('<span class="section-nav-sep" aria-hidden="true">&middot;</span>');
  }

  const mainEl = document.getElementById("section-nav");
  if (mainEl) {
    linkStrip(mainEl, SITE_CATEGORIES, mainEl.dataset.current || "");
  }

  // any number of nested strips: #section-subnav, #section-subsubnav, ...
  // data-parent is the parent node's slug (unique; node values are not).
  document.querySelectorAll('nav[id^="section-sub"]').forEach((el) => {
    const parent = findCategoryNodeBySlug(el.dataset.parent || "");
    const subs = (parent && parent.subcategories) || [];
    linkStrip(el, subs, el.dataset.current || "");
  });
})();
