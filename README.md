# Jared Lomeli — Portfolio

Personal portfolio and project showcase site, built to support IT Support, Network/NOC,
and SOC Analyst internship and part-time applications. Live at
**[jared-lomeli-portfolio.vercel.app](https://jared-lomeli-portfolio.vercel.app)**.

## What's on it

Eight highlight cards, ordered by strength rather than chronologically — the CompTIA
Security+ credential and the interactive Security+ study guide lead, followed by a
Grafana SOC dashboard, a Kali/Metasploitable/Wazuh SIEM lab series, a segmented
enterprise network built in Cisco Packet Tracer, a multi-agent AI helpdesk triage
system, a small cybersecurity Python toolkit, and a physics engine-comparison project.
Each card links out to its real source repo, a live demo, or a verification page where
one exists, and shows a full, uncropped screenshot rather than a cropped thumbnail.

The hero includes a downloadable resume, direct links to LinkedIn/GitHub/email, and a
compact skills strip. A footer carries education, GPA, honors, and credential details
without duplicating the full resume.

## Stack

Vanilla HTML/CSS/JS — no framework, no build step, no bundler. Content lives in
`data/highlights.json`; `app.js` renders it into cards client-side. Deployed to Vercel
via the Vercel CLI.

## Running locally

```bash
python -m http.server 8000
# or any other static file server
```

No dependencies to install for the site itself. `@playwright/test` is a devDependency
used only for local visual verification during development, not part of the deployed
site. A small smoke suite lives in `tests/smoke.spec.js`:

```bash
npm install
npm run test:e2e
```

## Deploying

```bash
vercel deploy --prod
```
