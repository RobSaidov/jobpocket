export type Source = "LinkedIn" | "Handshake" | "Company Site" | "Referral" | "Other"
export type Priority = "P0" | "P1" | "P2"
export type Warmth = "Hot" | "Warm" | "Cold"
export type AppStatus = "To Apply" | "Applied" | "OA" | "Interview" | "Offer" | "Rejected"
export type OutreachStatus = "Not Started" | "Sent" | "Replied"
export type ReferralStatus = "None" | "Asked" | "Submitted" | "Got It"

export type Application = {
  id: string
  company: string
  role: string
  location: string
  postingUrl: string
  source: Source
  priority: Priority
  warmth: Warmth
  status: AppStatus
  outreachStatus: OutreachStatus
  gotReply: boolean
  applied: boolean
  referralStatus: ReferralStatus
  contactName?: string
  contactTitle?: string
  notes?: string
  dateAdded: string
  datePosted?: string
  followUpDate?: string
  nextAction?: string
}

export type ResumeData = {
  text: string
  filename: string
  uploadedAt: string
}

export type Connection = {
  firstName: string
  lastName: string
  company: string
  title: string
  connectedOn: string
}
