// ── Blocker keyword detection ──────────────────────────────────────────────
// Only flag when "required", "must have", "must possess", or minimum qualification.
// "Preferred" or "plus" do NOT trigger a blocker.
function detectBlockers(text) {
  const lower = text.toLowerCase()
  const found = []

  if (/will not sponsor|no sponsorship|sponsorship not available/.test(lower)) {
    found.push("Sponsorship not offered")
  }
  if (/u\.s\.?\s*citizen|us citizen required/i.test(text)) {
    found.push("U.S. Citizenship required")
  }
  if (/security clearance/i.test(text)) {
    found.push("Security clearance required")
  }
  if (/u\.s\.?\s*person/i.test(text)) {
    found.push("U.S. Person requirement")
  }
  if (/must be authorized/i.test(text) && !/\b(opt|cpt)\b/i.test(text)) {
    found.push("Work authorization required (OPT/CPT not mentioned)")
  }

  // PhD / Masters: line-by-line. Flag only if degree on line, NO "bachelor" on same line (bachelors/masters/phd = any degree accepted), in quals section or pursuing/working towards, and no "preferred".
  // "masters or phd" with no bachelors → flag BOTH.
  const lines = text.split(/\r?\n/)
  let inQualsSection = false
  let phdBlocked = false
  let mastersBlocked = false

  const phdOnLine = (line) => /ph\.?d\.?|phd|doctorate/i.test(line)
  const mastersOnLine = (line) => /master'?s|masters|m\.s\.|ms\s+degree/i.test(line)
  const hasBachelorOnLine = (line) => /bachelor'?s?/i.test(line)  // bachelors, bachelor's = "any degree" → not a blocker
  const preferredOnLine = (line) => /preferred|or equivalent/i.test(line)
  const triggerOnLine = (line) => /required|working towards|pursuing|enrolled|candidate|student|obtaining|in the process of obtaining|degree\s+required/i.test(line)

  for (const line of lines) {
    const l = line.trim()
    if (!l) continue

    if (/basic qualifications|minimum qualifications|required qualifications/i.test(l)) {
      inQualsSection = true
    }
    if (/preferred qualifications|nice to have/i.test(l)) {
      inQualsSection = false
    }

    // RULE 1: Line with both bachelors and masters/phd = accepts any degree → do not flag
    if (hasBachelorOnLine(l)) continue

    if (preferredOnLine(l)) continue

    const inSectionOrTrigger = inQualsSection || triggerOnLine(l)

    if (phdOnLine(l) && inSectionOrTrigger && !phdBlocked) {
      found.push("PhD required")
      phdBlocked = true
    }

    if (mastersOnLine(l) && inSectionOrTrigger && !mastersBlocked) {
      found.push("Master's degree required")
      mastersBlocked = true
    }
  }

  // Bachelor's + 4 or 5+ years experience (may exceed student level)
  const bachelorsRequired = /(?:bachelor'?s|b\.?s\.?|b\.?a\.?)\s+(?:required|must have|must possess|degree\s+required)/i.test(text)
  const yearsHigh = /(?:4|5)\+?\s*years?|five\+?\s*years?|(?:4|5)\s*\+?\s*years?\s+experience/i.test(text)
  const bachelorsPreferredOrPlus = /(?:bachelor'?s|b\.?s\.?|b\.?a\.?).{0,30}(?:preferred|\bplus\b)/i.test(text)
  if (bachelorsRequired && yearsHigh && !bachelorsPreferredOrPlus) {
    found.push("4+ years experience required (may exceed student level)")
  }

  return found
}

// ── Extract job data from LinkedIn DOM ────────────────────────────────────
function extractText(selectors) {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel)
      if (el && el.textContent.trim()) return el.textContent.trim()
    } catch (e) {}
  }
  return ""
}

function extractJobData() {
  const title = extractText([
    "h1.job-details-jobs-unified-top-card__job-title",
    ".job-details-jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title h1",
    "h1.t-24.t-bold",
    ".topcard__title",
    "h1.top-card-layout__title",
    "h1",
  ])

  const company = extractText([
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name a",
    ".topcard__org-name-link",
    ".top-card-layout__card-partition a",
    "a[data-tracking-control-name=\"public_jobs_topcard-org-name\"]",
    ".job-details-jobs-unified-top-card__primary-description-without-tagline a",
  ])

  const postingUrl = window.location.href

  // Location — first result that looks like a location (city/state or Remote)
  function looksLikeLocation(str) {
    const s = str.trim()
    if (!s) return false
    if (/remote/i.test(s)) return true
    // city, state or city · state or similar
    if (/,/.test(s) || /\s+·\s+/.test(s) || /\s+-\s+/.test(s)) return true
    if (/^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(s)) return true
    return false
  }
  const locationSelectors = [
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
    ".tvm__text",
  ]
  let location = ""
  for (const sel of locationSelectors) {
    const el = document.querySelector(sel)
    if (el && el.textContent.trim()) {
      const candidate = el.textContent.trim()
      if (looksLikeLocation(candidate)) {
        location = candidate
        break
      }
    }
  }

  // Date posted — try time[datetime] first, then class selectors
  let datePosted = ""
  const timeEl = document.querySelector("time[datetime]")
  if (timeEl) {
    const dt = timeEl.getAttribute("datetime")
    if (dt) datePosted = dt
    else if (timeEl.textContent.trim()) datePosted = timeEl.textContent.trim()
  }
  if (!datePosted) {
    const dateSelectors = [
      ".job-details-jobs-unified-top-card__posted-date",
      ".jobs-unified-top-card__posted-date",
    ]
    for (const sel of dateSelectors) {
      const el = document.querySelector(sel)
      if (el && el.textContent.trim()) {
        datePosted = el.textContent.trim()
        break
      }
    }
  }

  // Always scan full page text for blockers (regardless of whether title/company found)
  const fullPageText = document.body ? (document.body.innerText || "").slice(0, 10000) : ""
  const blockers = detectBlockers(fullPageText)

  // Job description snippet for optional use
  const descSelectors = [
    ".jobs-description__content",
    ".job-details-jobs-unified-top-card__job-insight",
    ".jobs-description",
    "#job-details",
    ".jobs-box__html-content",
  ]
  let descText = ""
  for (const sel of descSelectors) {
    const el = document.querySelector(sel)
    if (el) {
      descText = (el.innerText || "").slice(0, 3000)
      break
    }
  }
  if (!descText) descText = fullPageText.slice(0, 3000)

  return { title, company, text: descText, blockers, postingUrl, location, datePosted }
}

// ── Message listener ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(extractJobData())
  }
  return true // keep channel open for async
})
