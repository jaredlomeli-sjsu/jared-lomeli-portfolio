// Single source of truth for the site's category taxonomy. Nesting is arbitrary
// depth — CATEGORY_FIELDS just needs one field name per level. Order here is
// display order in the nav strips, on the home page, and on chooser pages.
//
// A node with `subcategories` becomes a CHOOSER page (tiles for its children);
// a leaf node becomes a GRID page (highlight cards). Every node always shows in
// the nav / as a tile — empty ones lead to a "nothing here yet" placeholder.
//
// The Coursework subtree (coursework.html + semester-*.html) is generated from
// this file by scripts/gen-coursework.js — edit the taxonomy, then rerun it.

// Coursework depth 4: each track (Technical / Non-technical) splits into Labs
// and Assignments.
const TRACK_TYPES = (n, track) => [
  { value: "Labs", label: "Labs", slug: `semester-${n}-${track}-labs` },
  {
    value: "Assignments",
    label: "Assignments",
    slug: `semester-${n}-${track}-assignments`,
  },
];

const SEMESTER_TRACKS = (n) => [
  {
    value: "Technical",
    label: "Technical",
    slug: "semester-" + n + "-technical",
    subcategories: TRACK_TYPES(n, "technical"),
  },
  {
    value: "Non-technical",
    label: "Non-technical",
    slug: "semester-" + n + "-nontechnical",
    subcategories: TRACK_TYPES(n, "nontechnical"),
  },
];

// Course codes offered as a filter on each semester's leaf pages (both tracks).
// An item is matched to a course by its `courseCode` field in highlights.json.
const SEMESTER_COURSES = {
  1: ["ECON 1B", "COMM 20", "ENGL 1A", "MATH 70", "BUS3 12"],
  2: ["MATH 71", "ENGL 2", "PHYS 2A", "HIST 15"],
  3: ["TECH 15", "TECH 30", "TECH 60", "TECH 65", "BUS2 90", "POLS C1000"],
};

// Courses with no archived digital work. When one of these is the only course
// filter selected on a semester leaf page and the result is empty, grid.js
// shows this line instead of the generic "no entries" message. Keyed by course
// code; edit the wording here.
const COURSE_NOTES = {
  "MATH 70":
    "No digital work from this class — MATH 70 was paper-based (handwritten problem sets and exams).",
  "MATH 71":
    "No digital work from this class — MATH 71 was paper-based (handwritten problem sets and exams).",
  "ECON 1B":
    "No digital work from this class — nothing from ECON 1B was submitted or kept in a digital format.",
  "BUS2 90":
    "No digital work archived from this class yet — BUS2 90 is a current Fall 2026 course.",
  "POLS C1000":
    "No digital work archived from this class yet — POLS C1000 is a current Fall 2026 course.",
};

const SITE_CATEGORIES = [
  { value: "Credential", label: "Credentials", slug: "credentials" },
  { value: "Project", label: "Projects", slug: "projects" },
  {
    value: "Coursework",
    label: "Coursework",
    slug: "coursework",
    dek: "Graded labs and projects from university classes, organized by semester. Pick a term.",
    subcategories: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      value: "Semester " + n,
      label: "Semester " + n,
      slug: "semester-" + n,
      courses: SEMESTER_COURSES[n] || [],
      subcategories: SEMESTER_TRACKS(n),
    })),
  },
  {
    value: "Extra Curricular",
    label: "Extra Curricular",
    slug: "extracurricular",
    subcategories: [
      {
        value: "Educational",
        label: "Educational",
        slug: "educational",
        subcategories: [
          { value: "Extra", label: "Extra", slug: "educational-extra" },
          { value: "NETS", label: "NETS", slug: "educational-nets" },
        ],
      },
      { value: "For Fun", label: "For Fun", slug: "forfun" },
    ],
  },
  {
    value: "Professional Documents",
    label: "Professional Documents",
    slug: "professionaldocuments",
    subcategories: [
      { value: "Cover Letters", label: "Cover Letters", slug: "coverletters" },
      {
        value: "Resumes",
        label: "Resumes",
        slug: "resumes",
        subcategories: [
          { value: "Past", label: "Past", slug: "resumes-past" },
          { value: "Current", label: "Current", slug: "resumes-current" },
        ],
      },
      {
        value: "Other Documents",
        label: "Other Documents",
        slug: "otherdocuments",
      },
    ],
  },
];

// The highlight-item field checked at each taxonomy depth. Add more entries to
// go deeper; every consumer indexes this array rather than naming a level.
const CATEGORY_FIELDS = [
  "category",
  "subcategory",
  "subsubcategory",
  "subsubsubcategory",
];

// Walk the tree for a node by `value`; return the root-to-node path of nodes,
// or null. path.length - 1 is the node's depth (0 = top-level category).
function findCategoryPath(value, list, trail) {
  list = list || SITE_CATEGORIES;
  trail = trail || [];
  for (const node of list) {
    const here = trail.concat(node);
    if (node.value === value) return here;
    if (node.subcategories) {
      const found = findCategoryPath(value, node.subcategories, here);
      if (found) return found;
    }
  }
  return null;
}

function findCategoryNode(value) {
  const path = findCategoryPath(value);
  return path ? path[path.length - 1] : null;
}

// Resolve by slug — slugs are globally unique, node `value`s are not (e.g.
// "Technical" / "Labs" repeat across semesters). Nav strips and chooser tiles
// pass the parent's slug in data-parent; this returns the root-to-node path.
function findCategoryPathBySlug(slug, list, trail) {
  list = list || SITE_CATEGORIES;
  trail = trail || [];
  for (const node of list) {
    const here = trail.concat(node);
    if (node.slug === slug) return here;
    if (node.subcategories) {
      const found = findCategoryPathBySlug(slug, node.subcategories, here);
      if (found) return found;
    }
  }
  return null;
}

function findCategoryNodeBySlug(slug) {
  const path = findCategoryPathBySlug(slug);
  return path ? path[path.length - 1] : null;
}

// Does a highlight item belong under the node reached by `path`?
function itemMatchesPath(item, path) {
  for (let i = 0; i < path.length; i++) {
    if (item[CATEGORY_FIELDS[i]] !== path[i].value) return false;
  }
  return true;
}

// Node build tooling (scripts/gen-coursework.js) requires this file directly.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SITE_CATEGORIES,
    CATEGORY_FIELDS,
    findCategoryPath,
    findCategoryNode,
    findCategoryPathBySlug,
    findCategoryNodeBySlug,
    itemMatchesPath,
  };
}
