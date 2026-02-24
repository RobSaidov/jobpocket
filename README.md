# JobPocket

**Stop spraying. Start connecting.**

JobPocket automates the warm approach to job hunting — blocker detection, connection outreach, resume tailoring, and application tracking. Built for the IEEE & SFBU ThinkNext Hackathon 2026.

---

## The Problem

Cold applications have a 2–5% response rate. Warm outreach gets 30–40%. Referrals push that to 70%. Students know networking matters — but doing it manually takes hours per application. So they spray and pray instead.

JobPocket automates the system that actually works.

---

## What It Does

### Chrome Extension
- **Instant blocker scan** — detects sponsorship requirements, U.S. citizenship, security clearance, PhD/Masters requirements, and more the moment you open a LinkedIn job
- **Smart outreach generator** — paste any contact info (name, title, LinkedIn snippet), select Hot/Warm/Cold tier, get a personalized sub-100 word message in seconds
- **One-click tracking** — adds the job directly to your dashboard with company, role, warmth, and posting URL pre-filled

### Web App
- **Application dashboard** — 5 views: Apply Queue, Waiting Referral, Pipeline, All Applications, Active by Company
- **Automated next actions** — tells you exactly what to do next based on warmth tier and current status
- **Follow-up tracking** — auto-calculates follow-up dates by tier (Hot: Day 3/7/14, Warm: Day 3/10/17, Cold: Day 5/12)
- **Outreach generator** — standalone message generator for Hot, Warm, and Cold contacts
- **Resume tailor** — paste a job description, get blockers flagged, keywords to add, and AI-rewritten bullet points matched to the JD

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + Space Mono font
- **Claude claude-sonnet-4-5** via Anthropic API
- **Chrome Extension** (Manifest V3)
- **localStorage** (no database — works out of the box)
- **Vercel** deployment

---

## Getting Started

### Web App

```bash
git clone https://github.com/RobSaidov/jobpocket.git
cd jobpocket
npm install
```

Create a `.env.local` file:
```
ANTHROPIC_API_KEY=your_api_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `/extension` folder from this repo
5. Open any LinkedIn job page and click the JobPocket icon

> The extension connects to the deployed Vercel API by default. To use your own deployment, update `APP_BASE` in `extension/popup/popup.js` and `extension/background/background.js`.

---

## Warmth Tier System

| Tier | Who | Strategy | Follow-up Cadence |
|------|-----|----------|-------------------|
| 🔥 Hot | Friends, former coworkers | Ask for referral first, then apply | Day 3, 7, 14 |
| 🌤 Warm | Alumni, 2nd-degree connections | Outreach first, apply within 48h | Day 3, 10, 17 |
| 🧊 Cold | Strangers | Apply first, outreach after | Day 5, 12 |

---

## Blocker Detection

The extension scans job descriptions for:

- Sponsorship not offered
- U.S. Citizenship / U.S. Person requirements
- Security clearance
- Work authorization restrictions
- PhD required (including "working towards a PhD")
- Master's degree required
- 4+ years experience (may exceed student level)

---

## Project Structure

```
jobpocket/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/page.tsx    # Application tracker
│   │   ├── outreach/page.tsx     # Outreach generator
│   │   ├── resume/page.tsx       # Resume tailor
│   │   └── api/
│   │       ├── generate-outreach/route.ts
│   │       └── tailor-resume/route.ts
│   ├── components/
│   │   ├── ApplicationTable.tsx
│   │   ├── ApplicationModal.tsx
│   │   ├── PipelineView.tsx
│   │   └── CompanyView.tsx
│   └── lib/
│       ├── types.ts
│       └── storage.ts
├── extension/
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   ├── content/
│   │   └── content.js
│   └── background/
│       └── background.js
├── CLAUDE.md                     # Full product spec
└── vercel.json
```

---

## Live Demo

[jobpocket.vercel.app](https://jobpocket.vercel.app)

---

## The Numbers

- Cold applications: **2–5%** response rate
- Warm outreach first: **30–40%** response rate
- With referral: **up to 70%** response rate
- 85% of jobs are filled through networking

20 warm applications beats 200 cold ones every time.

---

## Built By

Rob Saidov — CS student at SFBU, ML research with Dr. Bandari (former NASA scientist), ML intern at a stealth AI startup.

Built in one week for the IEEE & SFBU ThinkNext Hackathon 2026.
