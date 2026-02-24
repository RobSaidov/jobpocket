const APP_BASE = "https://jobpocket-7rgkohcd1-robsaidov-5198s-projects.vercel.app"

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === "GENERATE_OUTREACH") {
    fetch(`${APP_BASE}/api/generate-outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => sendResponse({ success: true, message: data.message || "" }))
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (message.type === "ADD_TO_JOBPOCKET") {
    const { role, company, url, warmth } = message.payload

    const params = new URLSearchParams()
    params.set("add", "true")
    if (role)    params.set("role",    role)
    if (company) params.set("company", company)
    if (url)     params.set("url",     url)
    if (warmth)  params.set("warmth",  warmth)
    params.set("source", "LinkedIn")

    const dashboardUrl = `${APP_BASE}/dashboard?${params.toString()}`

    chrome.tabs.query({ url: `${APP_BASE}/*` }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true, url: dashboardUrl })
        chrome.windows.update(tabs[0].windowId, { focused: true })
      } else {
        chrome.tabs.create({ url: dashboardUrl })
      }
    })
    sendResponse({ ok: true })
  }

  return true
})
