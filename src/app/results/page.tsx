"use client"

import { Space_Mono } from "next/font/google"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })

interface WarmPath {
  name: string
  title: string
  company: string
  connectionType: "alumni" | "mutual" | "cold"
  warmScore: number
  sharedBackground: string
  whyReach: string
}

interface OutreachMessages {
  alumni: string
  mutual: string
  cold: string
}

interface StoredResults {
  paths: WarmPath[]
  meta: { resume: string; company: string; jobTitle: string }
}

const connectionConfig = {
  alumni: { label: "Alumni", color: "text-[#16a34a] border-[#bbf7d0] bg-[#f0fdf4]" },
  mutual: { label: "Mutual", color: "text-[#b45309] border-[#fde68a] bg-[#fffbeb]" },
  cold:   { label: "Cold",   color: "text-[#6b7280] border-[#e5e7eb] bg-[#f9fafb]" },
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full h-px bg-[#e5e5e5] relative mt-1">
      <div
        className="absolute top-0 left-0 h-px bg-[#0a0a0a] transition-all"
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="text-xs tracking-widest uppercase border border-[#e5e5e5] px-3 py-1 hover:border-[#0a0a0a] transition-colors"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  )
}

function OutreachModal({
  person,
  messages,
  loading,
  onClose,
}: {
  person: WarmPath
  messages: OutreachMessages | null
  loading: boolean
  onClose: () => void
}) {
  const tabs = [
    { key: "alumni" as const, label: "Alumni" },
    { key: "mutual" as const, label: "Mutual" },
    { key: "cold"   as const, label: "Cold" },
  ]
  const [activeTab, setActiveTab] = useState<"alumni" | "mutual" | "cold">(person.connectionType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`${spaceMono.className} bg-white border border-[#e5e5e5] w-full max-w-xl max-h-[90vh] overflow-y-auto`}>

        {/* Modal header */}
        <div className="border-b border-[#e5e5e5] px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[#888] mb-1">Outreach for</p>
            <p className="text-sm font-bold">{person.name}</p>
            <p className="text-xs text-[#555]">{person.title} · {person.company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#888] hover:text-[#0a0a0a] transition-colors mt-1 shrink-0"
          >
            ✕ Close
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e5e5e5] flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs tracking-widest uppercase transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-[#0a0a0a] text-[#0a0a0a]"
                  : "text-[#888] hover:text-[#0a0a0a]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message body */}
        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-xs text-[#888] tracking-widest uppercase">Generating messages...</p>
            </div>
          ) : messages ? (
            <div>
              <p className="text-xs text-[#0a0a0a] leading-relaxed whitespace-pre-wrap mb-4">
                {messages[activeTab]}
              </p>
              <div className="flex justify-end">
                <CopyButton text={messages[activeTab]} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-500">Failed to generate messages. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<StoredResults | null>(null)
  const [modalPerson, setModalPerson] = useState<WarmPath | null>(null)
  const [outreachMessages, setOutreachMessages] = useState<OutreachMessages | null>(null)
  const [outreachLoading, setOutreachLoading] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("jobpocket_results")
    if (!raw) {
      router.push("/apply")
      return
    }
    try {
      const parsed = JSON.parse(raw) as StoredResults
      setResults(parsed)
    } catch {
      router.push("/apply")
    }
  }, [router])

  async function openOutreach(person: WarmPath) {
    setModalPerson(person)
    setOutreachMessages(null)
    setOutreachLoading(true)
    try {
      const res = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userBackground: results?.meta?.resume ?? "",
          targetPerson: person,
          company: person.company,
          jobTitle: results?.meta?.jobTitle ?? "",
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOutreachMessages(data)
    } catch {
      setOutreachMessages(null)
    } finally {
      setOutreachLoading(false)
    }
  }

  function closeModal() {
    setModalPerson(null)
    setOutreachMessages(null)
  }

  if (!results) return null

  const { paths, meta } = results

  return (
    <div className={`${spaceMono.className} bg-white text-[#0a0a0a] min-h-screen`}>

      {/* Nav */}
      <nav className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
        <a href="/" className="text-xs tracking-[0.2em] uppercase font-bold hover:text-amber-500 transition-colors">
          JobPocket
        </a>
        <a href="/apply" className="text-xs tracking-widest uppercase hover:text-amber-500 transition-colors">
          Apply →
        </a>
      </nav>

      {/* Page header */}
      <div className="max-w-5xl mx-auto px-8 pt-16 pb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-[#888] mb-3">Step 02 — Results</p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
          Your Warm Paths In.
        </h1>
        {meta?.company && (
          <p className="text-sm text-[#555] mt-4 leading-relaxed">
            {paths.length} paths found for{" "}
            <span className="font-bold text-[#0a0a0a]">{meta.company}</span>
            {meta.jobTitle && <> · {meta.jobTitle}</>}
            {" "}— ranked by warm score.
          </p>
        )}
      </div>

      {/* Cards grid */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-[#e5e5e5]">
          {paths.map((person, i) => {
            const cfg = connectionConfig[person.connectionType] ?? connectionConfig.cold
            const isRight = i % 2 === 1
            const isBottom = i >= paths.length - (paths.length % 2 === 0 ? 2 : 1)

            return (
              <div
                key={i}
                className={`p-8 flex flex-col gap-4 ${
                  isRight ? "sm:border-l border-[#e5e5e5]" : ""
                } ${
                  i >= 2 ? "border-t border-[#e5e5e5]" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold leading-snug">{person.name}</p>
                    <p className="text-xs text-[#555] mt-0.5">{person.title}</p>
                    <p className="text-xs text-[#888]">{person.company}</p>
                  </div>
                  <span className={`text-xs border px-2 py-0.5 shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Warm score */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#888] tracking-widest uppercase">Warm Score</span>
                    <span className="text-xs font-bold">{person.warmScore}<span className="text-[#aaa] font-normal">/100</span></span>
                  </div>
                  <ScoreBar score={person.warmScore} />
                </div>

                {/* Shared background */}
                <div>
                  <p className="text-xs text-[#888] tracking-widest uppercase mb-1">Shared Background</p>
                  <p className="text-xs text-[#444] leading-relaxed">{person.sharedBackground}</p>
                </div>

                {/* Why reach */}
                <div>
                  <p className="text-xs text-[#888] tracking-widest uppercase mb-1">Why Reach Out</p>
                  <p className="text-xs text-[#444] leading-relaxed">{person.whyReach}</p>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-2">
                  <button
                    onClick={() => openOutreach(person)}
                    className="w-full bg-amber-400 text-[#0a0a0a] text-xs font-bold tracking-widest uppercase px-4 py-3 border border-amber-400 hover:bg-amber-500 hover:border-amber-500 transition-colors"
                  >
                    Generate Outreach →
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Start over */}
        <div className="mt-10 text-center">
          <a
            href="/apply"
            className="text-xs text-[#888] tracking-widest uppercase hover:text-[#0a0a0a] transition-colors"
          >
            ← Start over with a new target
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] px-8 py-6 text-center">
        <span className="text-xs text-[#aaa] tracking-widest uppercase">
          JobPocket — warm it up before you serve it.
        </span>
      </footer>

      {/* Outreach modal */}
      {modalPerson && (
        <OutreachModal
          person={modalPerson}
          messages={outreachMessages}
          loading={outreachLoading}
          onClose={closeModal}
        />
      )}

    </div>
  )
}
