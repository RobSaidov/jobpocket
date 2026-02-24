# jobpocket

i applied to 47 jobs. got 3 responses. built this overnight.

---

you're not getting ignored because your resume is bad.  
you're getting ignored because you're cold.

jobpocket is a chrome extension + web app that automates the one thing that actually works — finding a warm path in before you apply.

---

## what it does

open any linkedin job. jobpocket instantly:

- **scans for blockers** — sponsorship, citizenship, clearance, phd requirements. know in 2 seconds if you're wasting your time
- **generates outreach** — paste anything about your contact (name, linkedin snippet, vibes), pick hot/warm/cold, get a natural sub-100 word message. not salesy. not chatgpt-sounding.
- **adds to your tracker** — one click. company, role, warmth, url. all pre-filled.

the web app tracks everything — follow-up dates, outreach status, referral status, next actions. also tailors your resume bullets to any job description on the spot.

---

## the math

| approach | response rate |
|----------|--------------|
| cold apply | 2–5% |
| warm outreach first | 30–40% |
| referral | up to 70% |

20 warm applications > 200 cold ones. always.

---

## stack

next.js 14 · tailwind · claude api · chrome extension mv3 · localstorage · vercel

no database. no auth. no bs.

---

## run it locally

```bash
git clone https://github.com/RobSaidov/jobpocket.git
cd jobpocket
npm install
echo "ANTHROPIC_API_KEY=your_key" > .env.local
npm run dev
```

**extension:** chrome → `chrome://extensions` → developer mode → load unpacked → select `/extension`

---

## live

[jobpocket.vercel.app](https://jobpocket.vercel.app)

---

built by rob saidov in one night for sfbu thinkNext hackathon 2026.  
cs student. ml researcher. chronic job applicant.