import { Application, Warmth } from "./types"

const APPS_KEY = "jobpocket_applications"

export function getApplications(): Application[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(APPS_KEY) ?? "[]") as Application[]
  } catch {
    return []
  }
}

export function saveApplications(apps: Application[]): void {
  localStorage.setItem(APPS_KEY, JSON.stringify(apps))
}

export function computeNextAction(app: Application): string {
  if (app.referralStatus === "Asked") return "Check if referral submitted"
  if (app.status === "To Apply" && app.warmth === "Hot") return "Get referral first"
  if (app.status === "To Apply" && app.warmth === "Warm") return "Send outreach first"
  if (app.status === "To Apply" && app.warmth === "Cold") return "Apply, then outreach"
  if (app.outreachStatus === "Sent" && !app.gotReply && app.followUpDate) {
    if (new Date(app.followUpDate) <= new Date()) return "Follow up now"
  }
  if (app.status === "Applied") {
    const days = Math.floor((Date.now() - new Date(app.dateAdded).getTime()) / 86400000)
    if (days >= 14) return "Follow up with recruiter"
  }
  return "—"
}

export function autoFollowUpDate(warmth: Warmth, from = new Date()): string {
  const days = warmth === "Cold" ? 5 : 3
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}
