# JobPocket — CLAUDE.md

## What We're Building
JobPocket is an automated job hunt command center that replaces manual Notion tracking with AI automation. It implements the "warm approach" system — blocker checking, connection finding, tiered outreach generation, and follow-up tracking.

**Core insight:** Warm applications convert 10x better than cold ones. This system automates everything that makes an application warm.

---

## Product Overview

### Two Parts

**1. Web App** — Command center (Next.js)
- Application tracker with multiple views
- AI-powered outreach message generator
- Resume manager + JD-based tailoring
- Follow-up cadence automation

**2. Chrome Extension** — LinkedIn job page assistant
- One-click blocker scan (sponsorship, degree, clearance)
- Shows connections at that company from uploaded CSV
- Generates tailored outreach message instantly
- Logs job to web app tracker with one click

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, src/ directory, TypeScript)
- **Styling:** Tailwind CSS — no external UI libs except where noted
- **Font:** Space Mono (Google Fonts) — used everywhere
- **AI:** Claude API via @anthropic-ai/sdk — all AI features
- **Storage:** localStorage for MVP (no database)
- **Deployment:** Vercel

---

## File Structure

```
src/
  app/
    page.tsx                    # Landing page (done)
    dashboard/page.tsx          # Main tracker
    outreach/page.tsx           # Message generator
    resume/page.tsx             # Resume manager
    api/
      parse-jd/route.ts         # Extract info from JD URL or text
      check-blockers/route.ts   # Scan for sponsorship/degree blockers
      generate-outreach/route.ts # Generate tiered outreach message
      tailor-resume/route.ts    # Match resume to JD keywords
  components/
    Nav.tsx                     # Shared navigation
    ApplicationTable.tsx        # Main tracker table
    ApplicationModal.tsx        # Add/edit application
    OutreachGenerator.tsx       # Message generator component
  lib/
    storage.ts                  # localStorage helpers
    types.ts                    # All TypeScript types
```

---

## Data Model

### Application (stored in localStorage as `jobpocket_applications`)

```typescript
type Application = {
  id: string
  company: string
  role: string
  location: string
  postingUrl: string
  source: "LinkedIn" | "Handshake" | "Company Site" | "Referral" | "Other"
  priority: "P0" | "P1" | "P2"
  warmth: "Hot" | "Warm" | "Cold"
  status: "To Apply" | "Applied" | "OA" | "Interview" | "Offer" | "Rejected"
  outreachStatus: "Not Started" | "Sent" | "Replied"
  gotReply: boolean
  applied: boolean
  referralStatus: "None" | "Asked" | "Submitted" | "Got It"
  contactName?: string
  contactTitle?: string
  notes?: string
  dateAdded: string       // ISO string
  datePosted?: string     // ISO string
  followUpDate?: string   // ISO string — auto-set by warmth tier
  nextAction?: string     // Auto-calculated based on status
}
```

### Resume (stored as `jobpocket_resume`)
```typescript
type ResumeData = {
  text: string      // extracted text from PDF
  filename: string
  uploadedAt: string
}
```

### Connections (stored as `jobpocket_connections`)
```typescript
type Connection = {
  firstName: string
  lastName: string
  company: string
  title: string
  connectedOn: string
}
```

---

## Dashboard Views

Five tabs at the top of /dashboard:

| View | Filter |
|------|--------|
| Apply Queue | status = "To Apply", sorted by priority (P0 first) |
| Waiting Referral | referralStatus = "Asked" or "Submitted" |
| Pipeline | Kanban board grouped by status |
| All Applications | Full table, all records |
| Active by Company | Grouped by company name |

---

## Warmth Tier System

This is the core logic of the product. Everything is tiered:

| Tier | Who | Action | Follow-up Cadence |
|------|-----|--------|-------------------|
| Hot 🔥 | Close friends, former coworkers | Referral FIRST, then apply | Day 3, Day 7, Day 14 |
| Warm 🌤 | Alumni, 2nd degree, acquaintances | Outreach FIRST, apply in 48h | Day 3, Day 10, Day 17 |
| Cold 🧊 | Strangers | Apply first, outreach after | Day 5, Day 12 |

Follow-up dates auto-set based on warmth tier when outreach is marked as sent.

---

## Blocker Keywords (for /api/check-blockers)

Scan JD text for these. If found → flag as blocker:
- "will not sponsor" / "no sponsorship" / "sponsorship not available"
- "U.S. Citizen" / "US Citizen required"
- "security clearance"
- "U.S. Person"
- "must be authorized" (without OPT/CPT mention)
- Requires "Master's degree" or "PhD" (not "preferred")

Return: `{ blocked: boolean, blockers: string[], safe: boolean }`

---

## Outreach Templates by Tier

### Hot (Friend/Former Coworker)
```
Hey [Name], I saw [Company] has [Role] open — would you be able to refer me? 
I can send my resume and the job link whenever. Really appreciate it either way!
```

### Warm (Alumni / 2nd Degree)
```
Hi [Name], I'm a CS student at SFBU and saw you're at [Company]. 
I'm exploring [Role] opportunities and would love to ask 1-2 quick questions 
about your experience there. Thanks either way!
```

### Cold (Stranger)
```
Hi [Name], I recently applied to the [Role] at [Company] and am trying to 
learn more about the team. Would love to ask 1-2 quick questions if you're open. 
Thanks either way!
```

AI should personalize these based on:
- User's background (from resume)
- Target person's role and company
- Any shared background (same school, similar tech stack)
- Keep under 100 words, never salesy

---

## Next Action Logic (auto-calculated)

```
if status = "To Apply" and warmth = "Hot" → "Get referral first"
if status = "To Apply" and warmth = "Warm" → "Send outreach first"
if status = "To Apply" and warmth = "Cold" → "Apply, then outreach"
if outreachStatus = "Sent" and no reply and followUpDate passed → "Follow up now"
if status = "Applied" and no OA after 14 days → "Follow up with recruiter"
if referralStatus = "Asked" → "Check if referral submitted"
```

---

## API Routes

### POST /api/parse-jd
Input: `{ url?: string, text?: string }`
Output: `{ company, role, location, requirements: string[], rawText: string }`

### POST /api/check-blockers  
Input: `{ jdText: string }`
Output: `{ blocked: boolean, blockers: string[], safe: boolean }`

### POST /api/generate-outreach
Input: `{ tier: "Hot"|"Warm"|"Cold", userBackground: string, contactName: string, contactTitle: string, company: string, role: string }`
Output: `{ message: string }`

### POST /api/tailor-resume
Input: `{ resumeText: string, jdText: string }`
Output: `{ tailoredBullets: string[], keywordsToAdd: string[], gapAnalysis: string[] }`

All routes use `process.env.ANTHROPIC_API_KEY`. Use `claude-sonnet-4-5` model. Return 500 on failure with `{ error: string }`.

---

## Design System

| Token | Value |
|-------|-------|
| Background | #ffffff |
| Text primary | #0a0a0a |
| Text secondary | #6b7280 |
| Accent (amber) | #f59e0b |
| Border | #e5e5e5 |
| Font | Space Mono (400, 700) |

**Color coding:**
- Hot = green (`#16a34a`)
- Warm = amber (`#f59e0b`)
- Cold = gray (`#9ca3af`)
- P0 = red (`#dc2626`)
- P1 = amber (`#f59e0b`)
- P2 = gray (`#9ca3af`)
- Status badges: thin border, monospace text, no fill

**Rules:**
- No shadows
- No gradients
- No rounded corners larger than 2px
- 1px solid borders only
- Generous whitespace (min padding 24px sections)
- All caps labels (`letter-spacing: 0.1em`)
- Amber used ONLY for primary actions and active states

---

## Chrome Extension Structure (build after web app)

```
extension/
  manifest.json     # MV3, permissions: activeTab, storage
  popup/
    popup.html
    popup.tsx       # React popup UI
  content/
    content.ts      # Injected into LinkedIn job pages
  background/
    background.ts   # Service worker
```

Extension flow:
1. User opens LinkedIn job page
2. Clicks JobPocket extension icon
3. Popup shows: blocker check result + connections at company + outreach generator
4. "Add to Tracker" button → sends job data to web app via localStorage or API

---

## Rules

- Never use `any` in TypeScript
- Keep components under 150 lines — split if larger
- No database for MVP — localStorage only
- Mock AI responses if API is slow during dev — use realistic data
- All dates in ISO format
- Prioritize working demo over perfect code
- Mobile responsive but desktop-first
- Never hardcode API keys — always use env vars