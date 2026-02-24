console.log("Background script loaded")
const APP_BASE = "https://jobpocket.vercel.app"
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Message received:", message.type)
  if (message.type === "GENERATE_OUTREACH") {
    console.log("Fetching API, payload:", JSON.stringify(message.payload))
    fetch(`${APP_BASE}/api/generate-outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload),
    })
      .then((r) => {
        console.log("Response status:", r.status)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        console.log("Success:", JSON.stringify(data))
        sendResponse({ success: true, message: data.message || "" })
      })
      .catch((err) => {
        console.error("Fetch failed:", err.message)
        sendResponse({ success: false, error: err.message })
      })
    return true
  }
  if (message.type === "ADD_TO_JOBPOCKET") {
    const { role, company, url, warmth } = message.payload
    const params = new URLSearchParams()
    params.set("add", "true")
    if (role) params.set("role", role)
    if (company) params.set("company", company)
    if (url) params.set("url", url)
    if (warmth) params.set("warmth", warmth)
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
