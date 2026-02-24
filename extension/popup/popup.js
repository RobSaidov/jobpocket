const APP_BASE = "https://jobpocket.vercel.app"

// ── State ──────────────────────────────────────────────────────────────────
let state = {
  view: "empty",       // "empty" | "job" | "outreach"
  jobTitle: "",
  jobCompany: "",
  jobUrl: "",
  jobText: "",
  blockers: [],
  tier: "Warm",
  contactName: "",
  contactTitle: "",
  message: "",
  loading: false,
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const sections = {
  empty:    document.getElementById("section-empty"),
  job:      document.getElementById("section-job"),
  outreach: document.getElementById("section-outreach"),
}

const $ = (id) => document.getElementById(id)

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  Object.values(sections).forEach((s) => s.classList.add("hidden"))
  sections[state.view]?.classList.remove("hidden")

  if (state.view === "job") {
    $("job-title").textContent   = state.jobTitle   || "Unknown Role"
    $("job-company").textContent = state.jobCompany || "Unknown Company"

    const box = $("blocker-status")
    if (state.blockers.length > 0) {
      box.className = "status-box blocked"
      box.innerHTML = "&#10007; BLOCKED<br/>" +
        state.blockers.map((b) => `<span class="blocker-item">&#9888; ${b}</span>`).join("")
    } else {
      box.className = "status-box safe"
      box.textContent = "\u2713 No blockers detected \u2014 safe to apply"
    }

    document.querySelectorAll(".tier-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tier === state.tier)
    })

    $("contact-name").value  = state.contactName
    $("contact-title").value = state.contactTitle

    const genBtn = $("btn-generate")
    genBtn.disabled = state.loading
    genBtn.textContent = state.loading ? "Generating..." : "Generate Outreach \u2192"
  }

  if (state.view === "outreach") {
    $("outreach-message").textContent = state.message
    const words = state.message.trim() ? state.message.trim().split(/\s+/).length : 0
    const wc = $("word-count")
    wc.textContent = `${words} / 100 words`
    wc.className = words > 100 ? "word-count over" : "word-count"
  }
}

// ── Init: query active tab ─────────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0]
  if (!tab || !tab.url || !tab.url.includes("linkedin.com/jobs")) {
    state.view = "empty"
    render()
    return
  }

  state.jobUrl = tab.url

  chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ["content/content.js"] },
        () => {
          if (chrome.runtime.lastError) {
            state.view = "empty"
            render()
            return
          }
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" }, (res) => {
              if (chrome.runtime.lastError) {
                state.view = "empty"
                render()
                return
              }
              handleJobData(res)
            })
          }, 500)
        }
      )
      return
    }
    handleJobData(response)
  })
})

function handleJobData(data) {
  if (!data) {
    state.view = "empty"
    render()
    return
  }
  state.view       = "job"
  state.jobTitle   = data.title      || ""
  state.jobCompany = data.company    || ""
  state.jobText    = data.text       || ""
  state.blockers   = data.blockers   || []
  state.jobUrl     = data.postingUrl || state.jobUrl
  render()
}

// ── Tier buttons ───────────────────────────────────────────────────────────
document.querySelectorAll(".tier-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.tier = btn.dataset.tier
    render()
  })
})

// ── Contact inputs ─────────────────────────────────────────────────────────
$("contact-name").addEventListener("input",  (e) => { state.contactName  = e.target.value })
$("contact-title").addEventListener("input", (e) => { state.contactTitle = e.target.value })

// ── Generate outreach ──────────────────────────────────────────────────────
$("btn-generate").addEventListener("click", () => {
  if (!state.contactName.trim()) {
    $("contact-name").focus()
    $("contact-name").style.borderColor = "#dc2626"
    setTimeout(() => { $("contact-name").style.borderColor = "" }, 2000)
    return
  }

  state.loading = true
  render()

  chrome.storage.local.get("jobpocket_resume", (result) => {
    const stored = result.jobpocket_resume || ""
    const userBackground = typeof stored === "string" ? stored :
      (stored && stored.text ? stored.text : "")

    chrome.runtime.sendMessage(
      {
        type: "GENERATE_OUTREACH",
        payload: {
          tier:         state.tier,
          userBackground,
          contactName:  state.contactName,
          contactTitle: state.contactTitle,
          company:      state.jobCompany,
          role:         state.jobTitle,
        },
      },
      (response) => {
        state.loading = false

        if (chrome.runtime.lastError) {
          state.message = "Connection error. Please try again."
          state.view    = "outreach"
          render()
          return
        }
        if (response && response.success) {
          state.message = response.message || ""
          state.view    = "outreach"
        } else {
          state.message = "Failed to generate message. Please try again."
          state.view    = "outreach"
        }
        render()
      }
    )
  })
})

// ── Copy ───────────────────────────────────────────────────────────────────
$("btn-copy").addEventListener("click", () => {
  navigator.clipboard.writeText(state.message).then(() => {
    const btn = $("btn-copy")
    btn.textContent = "Copied \u2713"
    setTimeout(() => { btn.textContent = "Copy" }, 2000)
  })
})

// ── Back ───────────────────────────────────────────────────────────────────
$("btn-back").addEventListener("click", () => {
  state.view = "job"
  render()
})

// ── Add to JobPocket ───────────────────────────────────────────────────────
function addToJobPocket() {
  const url = `${APP_BASE}/dashboard?add=true&company=${encodeURIComponent(state.jobCompany)}&role=${encodeURIComponent(state.jobTitle)}&url=${encodeURIComponent(state.jobUrl)}&source=LinkedIn&warmth=${encodeURIComponent(state.tier)}`

  chrome.tabs.create({ url })

  // Show confirmation in the button that was clicked
  const btn = document.activeElement
  if (btn && btn.classList.contains("btn")) {
    btn.textContent = "\u2713 Opening JobPocket..."
    btn.disabled = true
  }
}

$("btn-add").addEventListener("click", addToJobPocket)
$("btn-add-from-outreach").addEventListener("click", addToJobPocket)
