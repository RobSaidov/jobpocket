"use client"

import { Space_Mono } from "next/font/google"
import { useEffect, useState } from "react"
import Nav from "@/components/Nav"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })

type Tier = "Hot" | "Warm" | "Cold"

const TIER_META: Record<Tier, { label: string; sub: string }> = {
  Hot:  { label: "Hot 🔥",  sub: "Friend / former coworker — ask for referral" },
  Warm: { label: "Warm 🌤", sub: "Alumni / 2nd degree — ask 1-2 questions" },
  Cold: { label: "Cold 🧊", sub: "Stranger — low-pressure intro" },
}

export default function OutreachPage() {
  const [tier, setTier] = useState<Tier>("Warm")
  const [contactName, setContactName] = useState("")
  const [contactTitle, setContactTitle] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [background, setBackground] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jobpocket_resume")
      if (stored) {
        const parsed = JSON.parse(stored) as { text: string }
        if (parsed.text) setBackground(parsed.text)
      }
    } catch {
      // no stored resume
    }
  }, [])

  async function generate() {
    if (!contactName.trim() || !company.trim() || !role.trim()) {
      setError("Contact name, company, and role are required.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, userBackground: background, contactName, contactTitle, company, role }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json() as { message: string }
      setMessage(data.message)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    if (!message) return
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputCls = "w-full border border-[#e5e5e5] bg-white text-[#0a0a0a] text-xs p-3 focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder-[#bbb]"
  const wordCount = message.trim() ? message.trim().split(/\s+/).length : 0

  return (
    <div className={`${spaceMono.className} bg-white text-[#0a0a0a] min-h-screen`}>
      <Nav active="outreach" />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-8 pt-12 pb-8">
        <p className="text-xs text-[#888] tracking-[0.2em] uppercase mb-2">AI Outreach Generator</p>
        <h1 className="text-2xl font-bold tracking-tight">Generate Outreach</h1>
        <p className="text-xs text-[#555] mt-2">Warm, personal messages in under 100 words. Pick a tier, fill in the details.</p>
      </div>

      {/* Two-panel layout */}
      <div className="max-w-6xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#e5e5e5]">

          {/* LEFT — Inputs */}
          <div className="p-8 lg:border-r border-[#e5e5e5]">
            <p className="text-xs tracking-[0.2em] uppercase text-[#888] mb-6">Message Settings</p>

            {/* Tier selector */}
            <div className="mb-6">
              <p className="text-xs text-[#888] tracking-widest uppercase mb-3">Tier</p>
              <div className="flex gap-0 border border-[#e5e5e5]">
                {(["Hot", "Warm", "Cold"] as Tier[]).map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`flex-1 px-3 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${
                      i > 0 ? "border-l border-[#e5e5e5]" : ""
                    } ${
                      tier === t
                        ? "bg-amber-400 border-amber-400 text-[#0a0a0a]"
                        : "bg-white text-[#888] hover:text-[#0a0a0a]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#888] mt-2">{TIER_META[tier].sub}</p>
            </div>

            {/* Contact fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-[#888] tracking-widest uppercase mb-1">Contact Name *</label>
                <input className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Sarah Chen" />
              </div>
              <div>
                <label className="block text-xs text-[#888] tracking-widest uppercase mb-1">Contact Title</label>
                <input className={inputCls} value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#888] tracking-widest uppercase mb-1">Company *</label>
                  <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Stripe" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] tracking-widest uppercase mb-1">Role *</label>
                  <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. ML Engineer" />
                </div>
              </div>
            </div>

            {/* Background */}
            <div className="mb-6">
              <label className="block text-xs text-[#888] tracking-widest uppercase mb-1">
                Your Background
                <span className="ml-2 font-normal normal-case tracking-normal text-[#bbb]">(used to personalize)</span>
              </label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={6}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Paste your resume or a short bio — or we'll use what's stored..."
              />
            </div>

            {error && <p className="text-xs text-red-500 mb-4 tracking-wide">{error}</p>}

            <button
              onClick={generate}
              disabled={loading}
              className="w-full bg-amber-400 border border-amber-400 text-[#0a0a0a] text-xs font-bold tracking-widest uppercase py-4 hover:bg-amber-500 hover:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Message →"}
            </button>
          </div>

          {/* RIGHT — Output */}
          <div className="p-8 border-t lg:border-t-0 border-[#e5e5e5] flex flex-col">
            <p className="text-xs tracking-[0.2em] uppercase text-[#888] mb-6">Generated Message</p>

            {message ? (
              <>
                <div className="flex-1 border border-[#e5e5e5] p-5 mb-4">
                  <p className="text-xs leading-relaxed text-[#0a0a0a] whitespace-pre-wrap">{message}</p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs tracking-widest ${wordCount > 100 ? "text-red-500" : "text-[#888]"}`}>
                    {wordCount} / 100 words
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={generate}
                      disabled={loading}
                      className="text-xs tracking-widest uppercase text-[#888] border border-[#e5e5e5] px-4 py-2 hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-colors disabled:opacity-40"
                    >
                      {loading ? "..." : "Regenerate"}
                    </button>
                    <button
                      onClick={copy}
                      className="text-xs tracking-widest uppercase font-bold bg-amber-400 border border-amber-400 px-4 py-2 hover:bg-amber-500 hover:border-amber-500 transition-colors"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#e5e5e5] pt-4">
                  <p className="text-xs text-[#888] tracking-widest uppercase mb-1">Tier used</p>
                  <p className="text-xs text-[#0a0a0a]">{TIER_META[tier].label} — {TIER_META[tier].sub}</p>
                </div>
              </>
            ) : (
              <div className="flex-1 border border-dashed border-[#e5e5e5] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#ccc] mb-1">No message yet</p>
                  <p className="text-xs text-[#ccc]">Fill in the form and hit Generate</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <footer className="border-t border-[#e5e5e5] px-8 py-6 text-center">
        <span className="text-xs text-[#aaa] tracking-widest uppercase">
          JobPocket — warm it up before you serve it.
        </span>
      </footer>
    </div>
  )
}
