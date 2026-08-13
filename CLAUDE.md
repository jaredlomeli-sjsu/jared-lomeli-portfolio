# jared-lomeli-portfolio

Static portfolio/coursework showcase site for IT Support / Network-NOC / SOC Analyst
internship and part-time applications. Vanilla HTML/CSS/JS, no framework, deployed to
Vercel. Lives on D:, not C: — see `[[d-drive-ntfs-and-claude-junctions]]` in Claude's
memory for why. No local C: backup mirror — Jared backs up D: to a different computer.

Sibling project, different purpose: `comptia-secplus-study-guide` is a study/practice
tool, not a resume showcase — don't fold its content into this repo, cross-link instead.

## Data model

- `data/highlights.json` — featured case-study cards. Each entry:
  `id, title, category, date, semester, course, summary, metrics[], tags[], media, links, featured`.
  Top-level `lastUpdated` (YYYY-MM-DD) drives the footer's "Last updated" text — bump it
  alongside content changes instead of hand-editing the footer.
- `category` is rendered through a fixed order in `app.js` (`CATEGORY_ORDER` /
  `CATEGORY_LABELS`): `Credential` → `Project` → `Lab` → `Coursework`. Only `Credential`
  and `Project` have real entries as of 2026-08-12; `Lab` and `Coursework` are reserved
  for future content (e.g. individual SJSU coursework artifacts) and will render
  correctly the moment a card uses them — no code changes needed to add a category that's
  already in the list. `data/coursework.json` (the old per-semester document archive) was
  deleted 2026-08-12 — dead since the Coursework Vault feature was removed 2026-08-09,
  nothing referenced it.

## Component architecture

| Component        | Responsibility            | Implementation                                                                             |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| `HeroView`       | Recruiter hook            | `<header>`, no CTA buttons (removed 2026-08-09)                                            |
| `HighlightGrid`  | Render highlight cards    | CSS Grid `repeat(auto-fit, minmax(320px, 1fr))`, lazy `<img>`                              |
| `LightboxModal`  | Full-screen image preview | `<dialog id="lightbox">`, backdrop-click close                                             |
| `PdfViewerModal` | In-browser PDF preview    | `<dialog id="pdf-viewer">`, `<iframe loading="lazy">`, wired to a card's `links.pdfReport` |

**Removed 2026-08-09: `ExplorerModal` (Coursework Vault) and both hero CTA buttons**
("View Projects", "Browse Coursework") at Jared's request — see Status below.

`app.js` holds a single `appState` object (`openPdf`, `highlights`) and does in-memory
filtering (`filter()`/`reduce()`) into a `DocumentFragment`. Full ARIA/keyboard support
required: Esc closes modals, backdrop click closes, focus returns to the trigger element.

A highlight card's `media` field supports three shapes: `null` (no image, text-only
card), `{"type": "image", "localSourcePath", "altText"}` (real image, shown full-width
at its natural aspect ratio — not cropped — opens in the lightbox), or
`{"type": "placeholder", "label"}` (dashed-border placeholder box with a caption text,
for cards awaiting a real screenshot — not clickable).

## Content ingestion pipeline (future work, not yet built)

For adding new semesters: scan a local source folder → convert `.docx`→`.pdf` (pandoc /
libreoffice --headless) → **privacy-scan for student IDs (`\b\d{9}\b`), API keys
(`sk-[a-zA-Z0-9]{32,}`), and addresses — strip or confirm with the operator before
deploy** → copy into `public/documents/[semester]/[course]/` and `public/images/`
(compress anything over 2MB) → update both JSON manifests → `git add` + commit + push.

## Curated content list (locked 2026-08-08, build in this order)

1. **Cybersecurity Fundamentals Python Toolkit** — source:
   `D:\School Backup\Personal - Jared Lomeli\Extra curricular\Cybersecurity fundamentals\Python Code`.
   ⚠️ Fix before ingesting: hardcoded OneDrive paths in two scripts, and the test
   password `"Aliciacarlyle123!"` in `Password Strength Checker.py` — genericize it.
2. **Segmented Enterprise Network Lab (Packet Tracer)** — source:
   `D:\Projects\GitHub\packet-tracer-security-plus-lab` (has `topology.png`).
3. **Kali/Metasploitable/Wazuh SIEM Lab Series** — source: `D:\Projects\GitHub\linux-learning`
   (hands-on-labs sub-project).
4. **SOC Dashboard (Grafana + Postgres)** — source: `D:\Projects\Portfolio\soc-dashboard-grafana`
   (moved from `D:\Projects\GitHub\` 2026-08-08 — local only, not pushed to GitHub).
   Needs a dashboard screenshot captured before use as media.
5. **Cisco Linux Unhatched — Command Report** — same repo as #3 (course-report sub-project).
6. **Physics 2A "ICE vs EV Mechanics" Final Project** — source:
   `D:\School Backup\Semester 2\Phys 2A - West Valley CC\Final Project`. Video is 115MB —
   compress or use an unlisted embed.
7. **Nexus Technologies IT Helpdesk Triage Agent + Google/Kaggle AI Agents Intensive
   badge** (paired entry) — source: `D:\Projects\GitHub\google-kaggle-5day-intensive\Final Project`.
8. **CompTIA Security+ (SY0-701)** — credential only, no local artifact.

Honorable mentions and explicitly-dropped items (VTRACKER — leaked API key,
Grades/Portfolio Tracker Project 2, and CISCO Data Analytic Essentials — no completed
deliverable exists) are tracked in Claude's `student-portfolio-site` memory, not
repeated here to avoid drift between the two.

## Status

As of 2026-08-08: repo scaffolding complete, all 7 curated content items ingested into
`data/highlights.json` (7 entries) and `data/coursework.json` (1 self-study entry,
3 documents), and all five components (`HeroView`, `HighlightGrid`, `LightboxModal`,
`ExplorerModal`, `PdfViewerModal`) built out in `index.html`/`style.css`/`app.js`. **Live
on Vercel** at https://jared-lomeli-portfolio.vercel.app (deployed via Vercel CLI, not
GitHub — nothing has been pushed to GitHub). Repo now lives at
`D:\Projects\Portfolio\jared-lomeli-portfolio\` (moved from `D:\Projects\GitHub\`
2026-08-08 since it isn't a GitHub-pushed repo).

**Build verified 2026-08-08** via a local static server (`python -m http.server`) plus a
headless jsdom smoke test (fetch polyfilled, `<dialog>` stubbed): all 7 cards render with
correct media/no-media layout, the explorer opens and lists the right semester/document
counts, clicking a document opens the PDF viewer with the right title/iframe src, and
clicking a card image opens the lightbox — zero runtime errors. Test script and its
temporary `node_modules` were removed after; not part of the repo.

**Real browser QA done 2026-08-08** via Playwright (`@playwright/test`, Chromium,
installed as a local devDependency — see `playwright.config.js` and
`tests/smoke.spec.js`; run with `npm run test:e2e`). Suite covers console errors, 3
responsive breakpoints (375/768/1440px, no horizontal overflow), lightbox open/close
(Escape + backdrop click), explorer Tab-focus trap, PDF viewer open/title, and internal
link health. Found and fixed 2 real bugs:

1. **No JS Tab-focus trap in the explorer modal** — native `<dialog>` only makes
   background content inert; it doesn't wrap Tab from the last focusable element back
   to the first. Tabbing off the last document row landed on `<body>` with no visible
   focus indicator before wrapping back in. Fixed with an explicit `keydown` trap
   (`initExplorerFocusTrap` in `app.js`) that cycles focus within `#vault-explorer`.
2. **`.explorer-dialog` and `.pdf-viewer-dialog` set `display: flex` unconditionally**
   in `style.css`, overriding the browser's default `dialog:not([open]) { display: none }`.
   Both dialogs stayed laid out (just scrolled off-screen) after closing instead of
   actually being hidden. Fixed by scoping those rules to `[open]`.

All 9 tests pass, confirmed stable across 3 repeats. `.lightbox-dialog` didn't have this
bug (never overrides `display`).

**Deployed to Vercel 2026-08-08** via the Vercel CLI (`vercel deploy` / `--prod`), at
Jared's explicit request to push to Vercel only, not GitHub. First deploy 404'd on `/` —
Vercel's zero-config default treats a `public/` folder as the output directory when one
exists, silently excluding the real site root from the deployment. Fixed by pinning
`"outputDirectory": "."` in `vercel.json`. Also fixed the long-standing repo-name
mismatch: the Kali/Metasploitable/Wazuh card's `github` link now points to
`linux-learning/tree/main/kali-metasploitable-wazuh-linux` (verified via `gh api`)
instead of the bare `linux-learning` repo root.

**Packaging done alongside ingestion:**

- Cybersecurity Python Toolkit → new local-only repo `D:\Projects\Portfolio\cybersecurity-python-toolkit`
  (moved from `D:\Projects\GitHub\` 2026-08-08; README + 3 privacy-fixed scripts + sample
  log). Not pushed to GitHub — hold until told.
- `soc-dashboard-grafana` had no git repo — initialized locally (`git init`, branch `main`,
  nothing committed). Not pushed. Now at `D:\Projects\Portfolio\soc-dashboard-grafana`.
- Packet Tracer's `topology.png` copied into `public/images/`.
- Cisco Linux Unhatched's 3 HTML pages copied into
  `public/documents/self-study/cisco-linux-unhatched/`.

**Known gaps / follow-ups, not yet resolved:**

- No image `media` for 5 of 7 highlight cards (toolkit, Kali/Wazuh labs, SOC dashboard,
  Physics 2A, Nexus agent) — each needs a real screenshot captured. SOC dashboard's
  needs the CIC-IDS2017 dataset downloaded and the stack actually running first; no
  CSVs found locally yet.
- The `linux-learning` repo is what's actually pushed to GitHub, but Jared's resume
  cites the Kali/Wazuh labs under a different repo name
  (`kali-metasploitable-wazuh-linux`) that doesn't exist as its own remote — the site
  currently links to the real `linux-learning` repo. Worth reconciling with Jared.
- No local asset exists for the Google/Kaggle AI Agents Intensive badge — it's
  represented via a tag on the Nexus entry, not a real image.
- `Password Strength Checker.py`'s test string and both scripts' hardcoded personal
  paths were already fixed in place at the original `School Backup` source before
  this repo was created (see [[student-portfolio-site]] memory).

**2026-08-09 — removed both hero CTA buttons and the Coursework Vault feature
entirely**, at Jared's explicit request. Removed from `index.html`: the `.hero-actions`
div (both buttons) and the entire `#vault-explorer` dialog markup. Removed from
`app.js`: `openExplorer`, `renderExplorerSidebar`, `renderExplorerMobileSelect`,
`selectSemester`, `renderExplorerDocuments`, `buildExplorerDocRow`,
`initExplorerArrowNav`, `initExplorerFocusTrap`, `initExplorerSearch`,
`initHeroActions`, and the `activeSemester`/`searchQuery`/`selectedCourse`/`coursework`
fields on `appState`; `loadData()` no longer fetches `data/coursework.json` (the file
itself is untouched on disk, just unused). Removed the matching `.explorer-*`,
`.hero-actions`, `.btn-primary`, and `.btn-secondary` rules from `style.css`. Removed
the "explorer modal (coursework vault)" Playwright describe block (2 tests) from
`tests/smoke.spec.js` — suite is now 7 tests, all passing. `PdfViewerModal` and
`LightboxModal` were kept — the PDF viewer is still wired to a highlight card's
`links.pdfReport` (`openPdfViewer`), it just no longer has the explorer as a second
caller.

**2026-08-09 — expanded the Cybersecurity Python Toolkit highlight card.** Verified
the source repo (`D:\Projects\Portfolio\cybersecurity-python-toolkit`) is still clean —
grepped for OneDrive paths, personal identifiers, and secrets, found none; the sample
`False_Auth.Log` only contains fictional private-range IPs. Ran all three scripts for
real to get accurate numbers instead of generic claims: the SSH brute-force parser
flags 2 of 4 source IPs (192.168.1.10 at 23 attempts, 10.0.0.5 at 13) as attackers
against the 41-line sample log at threshold 10. Rewrote `summary` in
`data/highlights.json` to describe each of the 3 tools individually instead of one
generic sentence, and replaced the generic `metrics` with the real numbers above.
Jared doesn't have a screenshot yet, so added a new `media.type: "placeholder"` shape
(dashed-border box with a caption, not clickable — see Component architecture above)
instead of leaving `media: null`; swap it for a real `type: "image"` entry once he
provides one. No image capture tooling (browser/OS screenshot) was available this
session — a synthetic rendered "terminal output" graphic was offered as an alternative
but Jared preferred the placeholder and a real screenshot later.
