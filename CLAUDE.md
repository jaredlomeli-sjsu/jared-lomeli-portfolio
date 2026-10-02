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
- **`date` = the date of the underlying work itself** — when the lab / project /
  assignment was actually done or submitted (from the file's own date), **not** the day
  the card was added to this site. All grids are date-sorted, **newest first by default**
  (the Sort control only switches to oldest-first); there is no "curated array order"
  view any more, so `date` must be accurate.
- **Collection cards** (added 2026-09-09): a card with `"kind": "collection"` renders
  with a standout full-width copper frame + "Ongoing collection" badge, and shows a
  `downloads: [{label, type, size, date, source, path}]` list instead of a single
  `pdfReport` button. `"pinned": true` floats it to the top of its grid ahead of the
  date-sorted cards.
  - **GLOBAL RULE (Jared, 2026-09-21): documents the browser can render open in-page,
    never as a raw download.** `grid.js` picks behavior per entry from `path`'s
    extension: `.pdf` → opens in the existing in-page PDF viewer (same modal as
    `links.pdfReport`, via `openPdfViewer(path, label)`); `.png`/`.jpg`/`.jpeg` → opens
    in the lightbox (`openLightbox`). Both render as a `<button class="download-item
download-item--view">`, not an `<a>`, and never carry the `download` attribute.
    `.py` source opens in an in-page code viewer (`openCodeViewer`, fetched as text into the
    shared `#pdf-viewer` dialog). `links.video` plays in-page too (`openVideoViewer`: local
    `.mp4` in a `<video>`, YouTube via a youtube-nocookie iframe; other hosts stay links). Only
    formats the browser genuinely can't render fall back to a real `<a download>` —
    currently just Cisco Packet Tracer's `.pka`/`.pkt` (2026-09-29). Don't add a new non-`.pdf`/image download type without checking
    whether it can be embedded first.
  - Used for the TECH 65 Packet Tracer file archive (`.pka`/`.pkt`, the deliberate
    download exception) — one collection card per class holds every Packet Tracer file
    for that class; individual lab cards stay normal and reference it. Files under
    `public/documents/<course>/packet-tracer/`. See `[[portfolio-packet-tracer-files]]`.
    The same collection pattern (now embedded, not download) also holds TECH 65's
    Wireshark labs, TECH 65's switch-configuration labs, TECH 60's circuit-analysis
    labs, and each class's Assignments set.
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
   password `[redacted]` in `Password Strength Checker.py` — genericize it.
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

**2026-09-07 — large session: filters, three new pages, three new Lab entries, dark
mode, and bio-text updates.** Purpose of the project was clarified this session: it's
an active documentation project for Jared's entire undergrad career (through expected
graduation June 2029), covering all coursework/projects/extracurriculars, big and
small — but the site's recruiter-facing resume framing (see top of this file) stays
intentional, not a mismatch to fix. "Personal use only" means no one else will likely
view the live site, not that the tone should change.

- **`HighlightGrid` filtering** — new `#filter-bar`/`#filter-panel` dropdown in
  `index.html`, driven by `appState.filters` in `app.js` (`getFilteredHighlights`,
  `sortHighlightsByDate`, rewritten `renderHighlightGrid`). Three combinable filters:
  Type (multi-select checkboxes, one per category via `getAllFilterableCategories` —
  includes categories with zero entries so far, e.g. Assignment), a date range
  (native `<input type="date">` From/To), and a chronological/reverse-chronological
  sort. Category headings stay grouped whenever the Type filter is active (or when no
  filter at all is active — the original curated view); with Type inactive, a
  date-range and/or sort selection instead flattens into one ungrouped, date-sorted
  list. Added a new `Assignment` category (`CATEGORY_ORDER`/`CATEGORY_LABELS`) even
  though no entries use it yet, so it's ready in the Type filter.
- **New `Lab` category populated for the first time** — 3 entries added to
  `data/highlights.json`: TECH 60 Lab 0 (resistor color codes, DMM verification),
  TECH 60 Lab 1 (LED circuit, Kirchhoff's Voltage Law), and TECH 65 Lab 2 (configuring
  a Cisco switch via console). Source docs copied into
  `public/documents/tech-60/lab-{0,1}.pdf` and
  `public/documents/tech-65/lab-2-switch-console.docx`. The TECH 65 entry uses a real
  screenshot from Jared's actual submission (extracted from the source .docx's
  embedded media, confirmed with Jared which images were his real terminal output vs.
  the assignment template's stock diagrams) at
  `public/images/tech65-lab2-switch-config.png`; the two TECH 60 entries still use
  `media.type: "placeholder"` — real photos exist in their source PDFs but weren't
  extracted this session. TECH 65 Lab 1 intentionally not added yet (TBD per Jared).
- **Résumé flow changed** — `public/Jared-Lomeli-Resume.pdf` replaced with
  `Jared_Lomeli_CNSM_v6.pdf`. The hero's Résumé button no longer downloads directly;
  it now opens new `public/resume.html` (inline PDF preview via `<iframe>` +
  "Download PDF" button), matching the site's existing "internal document link opens
  in a new tab" convention used elsewhere for write-ups/case studies.
- **New `public/contact.html`** — hero's Email button now opens this page instead of
  a direct `mailto:`. Lists two addresses, School (`jared.lomeli@sjsu.edu`) and
  Professional (`jaredlomelicnsm@gmail.com`), each with its own `mailto:` button.
- **New `public/transcript.html` + hero "Transcript" button** — same pattern as
  `resume.html` (topbar, dek, dark-mode toggle), but the document doesn't exist yet:
  shows a dashed-border placeholder instead of an iframe. Has an inline HTML comment
  documenting exactly how to wire up the real PDF once Jared provides it (mirror
  resume.html's iframe + Download PDF button).
- **Dark mode** — new `theme.js` (repo root, sibling to `app.js`/`style.css`) applies
  a `data-theme` attribute from `localStorage` before first paint (no flash) and
  wires any `[data-theme-toggle]` button. `style.css` gained dark-mode token
  overrides both via `:root[data-theme="dark"]` (explicit toggle) and
  `@media (prefers-color-scheme: dark)` (system default when no explicit choice
  stored yet) — same variable names, so every page/case-study that already uses the
  CSS custom properties inherits it automatically. Toggle button (`.theme-toggle-fixed`
  in `style.css`, `position: fixed; top/right: 1rem`) added to `index.html`,
  `resume.html`, `contact.html`, and `transcript.html` — fixed to the top-right corner
  of the viewport on each page, stays put while scrolling, not part of the normal
  button rows. Not added to
  the pre-existing case-study pages (`public/case-studies/*.html`) this
  session — they still get dark mode for free via `prefers-color-scheme`, just no
  manual toggle control on those specific pages yet.
- **Bio text updated sitewide** (hero tagline, footer, `resume.html` dek, meta
  descriptions, JSON-LD `jobTitle`) to mention the Business Management minor, and the
  footer GPA corrected from 3.97 to 3.96. Hero's "Currently" line expanded from 2 to
  all 6 Fall 2026 classes: TECH 60 (Introduction to Electronics), TECH 30
  (Introduction to Python Programming), TECH 15 (Careers in Engineering Technology),
  TECH 65 (Introduction to Networks), BUS2 90 (Business Statistics), and POLS C1000
  at West Valley College.
- **Test suite grew from 7 to 13 tests** — added a `filters` describe block in
  `tests/smoke.spec.js` covering the toggle open/close, Type-filter narrowing,
  date-range filtering, sort ordering, the empty-results state, and Clear filters.
  Confirmed one pre-existing flaky test (`lightbox modal › opens on card image
click`, skips if `.highlight-card-media img` isn't in the DOM yet at test start) —
  not new, not caused by this session's changes, just a `count()`-vs-async-render
  race in a test that predates this session.
- **Left an HTML comment in `index.html`** (inside `#highlight-grid`) noting the idea
  Jared liked: populate the `Coursework`/`Assignment` categories with smaller
  individual class assignments going forward — both are already fully wired up, just
  need entries in `data/highlights.json`.
- Session ran entirely on the F: drive at Jared's explicit request (no edits to C:/D:/E:
  drives); a Vercel CLI device-login flow attempted in this environment failed to
  authenticate genuinely (reported false "signed in" success, `vercel whoami` kept
  returning `Not authorized`) — nothing from this session has been deployed yet.

**Ready to deploy — for the next session.** All 2026-09-07 changes above are complete
and verified locally (13/13 Playwright tests passing via `npm run test:e2e`). Nothing
is pending that blocks a deploy.

- **Deploy command:** `vercel deploy --prod`, run from this repo's root. The project
  is already linked — `.vercel/project.json` has `projectId: prj_IjBiqkGmsUfFSb4sFFazaELNiiPR`,
  `orgId: team_XxEmKd5HvgOZVe26WI9bmjvF` — so `vercel link` is not needed.
  `vercel.json` still correctly pins `"outputDirectory": "."` (needed because a
  `public/` folder exists — see the 2026-08-08 deploy note above for why).
- **Auth, if it's still broken:** this session's sandboxed environment could not
  complete a real Vercel login — `vercel login`'s device-code flow reported false
  "Congratulations! You are now signed in" success twice, but `vercel whoami`
  immediately went back to `Error: Not authorized` both times. If a fresh session
  hits the same thing, don't keep retrying the same flow. Two working alternatives:
  (a) run `vercel login` in Jared's own terminal outside Claude Code and complete it
  for real in a browser, or (b) have Jared generate a token at
  vercel.com/account/tokens and deploy non-interactively with
  `vercel deploy --prod --token=<token>`.
- **Open follow-ups, not blockers, just not forgotten:**
  - TECH 60 Lab 0/1 (`data/highlights.json`) still use `media.type: "placeholder"`.
    Real photos exist in `public/documents/tech-60/lab-{0,1}.pdf` if Jared wants one
    extracted and swapped in.
  - `public/transcript.html` is a placeholder page — Jared said he'll provide the
    actual transcript PDF later; see the inline HTML comment in that file for exactly
    what to change.
  - The two TECH 60 lab summaries publicly name Jared's lab partners (two classmates) — flagged to Jared, not yet confirmed as okay.
  - POLS C1000's full course title is still unknown — Jared said leave it as a bare
    code for now.

## Security hardening (2026-10-02)

Done per `D:\Documents\Website-Hardening-Playbook.md`. Public write-up: `/security`
(`security.html`, linked from the footer); disclosure contact: `/.well-known/security.txt`
(expires 2027-10-02 — renew it).

- **Headers live in `vercel.json`.** Baseline on `/(.*)` (nosniff, XFO SAMEORIGIN,
  Referrer-Policy, Permissions-Policy, COOP/CORP same-origin). Four **mutually exclusive**
  CSP rules (exactly one must match any HTML path — `tests/security.spec.js` enforces it):
  1. strict, everything outside `/public/` and `/demo/` (no inline script/style/handlers);
  2. `/public/*` pages (`style-src 'unsafe-inline'`);
  3. `/public/artifacts/*`, `/demo/*` (inline scripts + jsDelivr/Google Fonts/Wikimedia);
  4. `linux-security-architecture` demo (blob: + unpkg React; loosest);
  plus one for `/public/documents/*` HTML. PDFs/images/video get no CSP on purpose.
- **Rules for new work:** root pages must not contain inline `<script>`, `<style>`, `style=`
  or `on*=` (tests fail). Put JS/CSS in files. Any new third-party host needs a CSP edit and a
  test. Pin versions and add SRI for CDN scripts.
- `dev-server.js` replays `vercel.json` headers, so `npx playwright test` runs the site
  under the real CSP. `OFFLINE=1` skips the CDN-dependent demo tests.
- `escapeHtml` (grid.js) escapes quotes; `search.js` has `escapeAttr`; `nav.js` escapes labels.
- **PII audit 2026-10-02:** removed `bus3-12/personal-wellness-plan.pdf` (health/religion/
  finance disclosure); redacted classmate names in `comm-20/peer-reviews-persuasive-speech-1.pdf`
  and `engl-1a/film-essay-draft-peer-reviews.pdf` (originals kept only in a session scratchpad).
  Phone (408…) + city/ZIP on resumes/cover letters, and GPA 3.97 (PDFs) vs 3.96 (footer), left
  as is by Jared's choice — the GPA mismatch is still unresolved.
- The git repo is public and already has the old files in history (rework commit `a442d74`).
  Hardening changes are Vercel-only per the push rule.
- LinkedIn link corrected to `linkedin.com/in/jaredlomelicnsm`.
