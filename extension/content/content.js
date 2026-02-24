// ── Blocker keyword detection ──────────────────────────────────────────────
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
  if (/master'?s degree required|master'?s required/i.test(text) && !/preferred/i.test(text)) {
    found.push("Master's degree required")
  }
  if (/ph\.?d\.? required/i.test(text) && !/preferred/i.test(text)) {
    found.push("PhD required")
  }

  return found
}

// ── Extract job data from LinkedIn DOM ────────────────────────────────────
function extractJobData() {
  // Title
  const titleSelectors = [
    ".job-details-jobs-unified-top-card__job-title h1",
    "h1.t-24",
    "h1",
  ]
  let title = ""
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel)
    if (el && el.textContent.trim()) {
      title = el.textContent.trim()
      break
    }
  }

  // Company name
  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    "a.ember-view.t-black.t-normal",
  ]
  let company = ""
  for (const sel of companySelectors) {
    const el = document.querySelector(sel)
    if (el && el.textContent.trim()) {
      company = el.textContent.trim()
      break
    }
  }

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

  // Job description text for blocker scanning
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
      descText = el.innerText || ""
      break
    }
  }

  // Fallback: grab all visible text if desc not found
  if (!descText) {
    descText = document.body.innerText.slice(0, 5000)
  }

  const blockers = detectBlockers(descText)

  return { title, company, text: descText.slice(0, 3000), blockers, postingUrl, location, datePosted }
}

// ── Message listener ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(extractJobData())
  }
  return true // keep channel open for async
})
