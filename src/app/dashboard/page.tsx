"use client"

import { Space_Mono } from "next/font/google"
import { useEffect, useState } from "react"
import { Application, Source } from "@/lib/types"
import { getApplications, saveApplications, autoFollowUpDate } from "@/lib/storage"
import Nav from "@/components/Nav"
import ApplicationTable from "@/components/ApplicationTable"
import ApplicationModal from "@/components/ApplicationModal"
import PipelineView from "@/components/PipelineView"
import CompanyView from "@/components/CompanyView"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })

type Tab = "Apply Queue" | "Waiting Referral" | "Pipeline" | "All Applications" | "Active by Company"
type QuickFilter = "toApply" | "sent" | "waitingReply" | "interview" | null

const TABS: Tab[] = ["Apply Queue", "Waiting Referral", "Pipeline", "All Applications", "Active by Company"]
const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2 }

function tabApps(apps: Application[], tab: Tab): Application[] {
  if (tab === "Apply Queue") {
    return apps
      .filter((a) => a.status === "To Apply")
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }
  if (tab === "Waiting Referral") {
    return apps.filter((a) => a.referralStatus === "Asked" || a.referralStatus === "Submitted")
  }
  return apps
}

function applyQuickFilter(apps: Application[], filter: QuickFilter): Application[] {
  if (filter === "toApply") return apps.filter((a) => a.status === "To Apply")
  if (filter === "sent") return apps.filter((a) => a.outreachStatus === "Sent")
  if (filter === "waitingReply") return apps.filter((a) => a.outreachStatus === "Sent" && !a.gotReply)
  if (filter === "interview") return apps.filter((a) => a.status === "Interview")
  return apps
}

export default function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [tab, setTab] = useState<Tab>("All Applications")
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null)
  const [editing, setEditing] = useState<Application | null>(null)
  const [prefillData, setPrefillData] = useState<Partial<Application> | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => { setApps(getApplications()) }, [])

  // Auto-add + open modal when navigated from Chrome extension (?add=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("add") !== "true") return

    const warmthParam = params.get("warmth")
    const validWarmth = warmthParam === "Hot" || warmthParam === "Warm" || warmthParam === "Cold"

    const newApp: Application = {
      id:             crypto.randomUUID(),
      company:        params.get("company")       ?? "",
      role:           params.get("role")          ?? "",
      location:       "",
      postingUrl:     params.get("url")           ?? "",
      source:         (params.get("source") ?? "LinkedIn") as Source,
      priority:       "P1",
      warmth:         validWarmth ? warmthParam : "Warm",
      status:         "To Apply",
      outreachStatus: "Not Started",
      gotReply:       false,
      applied:        false,
      referralStatus: "None",
      contactName:    params.get("contactName")  ?? undefined,
      contactTitle:   params.get("contactTitle") ?? undefined,
      dateAdded:      new Date().toISOString(),
      datePosted:      params.get("datePosted")   ?? undefined,
    }

    // Read directly from storage to avoid race with the other useEffect
    const current = getApplications()
    const updated = [...current, newApp]
    saveApplications(updated)
    setApps(updated)

    // Open modal in edit mode so user can complete the details
    setEditing(newApp)
    setPrefillData(undefined)
    setModalOpen(true)

    window.history.replaceState({}, "", "/dashboard")
  }, [])

  function persist(updated: Application[]) {
    setApps(updated)
    saveApplications(updated)
  }

  function handleSave(app: Application) {
    persist(editing
      ? apps.map((a) => (a.id === app.id ? app : a))
      : [...apps, app]
    )
    closeModal()
  }

  function handleDelete() {
    if (!editing) return
    persist(apps.filter((a) => a.id !== editing.id))
    closeModal()
  }

  function handleMarkSent(app: Application) {
    const updated = apps.map((a) =>
      a.id === app.id
        ? { ...a, outreachStatus: "Sent" as const, followUpDate: a.followUpDate || autoFollowUpDate(a.warmth) }
        : a
    )
    persist(updated)
  }

  function openEdit(app: Application) { setEditing(app); setPrefillData(undefined); setModalOpen(true) }
  function openAdd() { setEditing(null); setPrefillData(undefined); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(null); setPrefillData(undefined) }

  function activateQuickFilter(f: QuickFilter) {
    setQuickFilter((prev) => prev === f ? null : f)
    setTab("All Applications")
  }

  const displayApps = quickFilter ? applyQuickFilter(apps, quickFilter) : tabApps(apps, tab)
  const counts = Object.fromEntries(TABS.map((t) => [t, tabApps(apps, t).length])) as Record<Tab, number>

  const summaryStats: { label: string; count: number; filter: QuickFilter }[] = [
    { label: "to apply",       count: apps.filter((a) => a.status === "To Apply").length,                          filter: "toApply" },
    { label: "outreach sent",  count: apps.filter((a) => a.outreachStatus === "Sent").length,                      filter: "sent" },
    { label: "waiting reply",  count: apps.filter((a) => a.outreachStatus === "Sent" && !a.gotReply).length,       filter: "waitingReply" },
    { label: "interviews",     count: apps.filter((a) => a.status === "Interview").length,                         filter: "interview" },
  ]

  return (
    <div className={`${spaceMono.className} bg-white text-[#0a0a0a] min-h-screen`}>
      <Nav active="dashboard" />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 pt-12 pb-6 flex items-end justify-between">
        <div>
          <p className="text-xs text-[#888] tracking-[0.2em] uppercase mb-2">Command Center</p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#888] mt-1">{apps.length} application{apps.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <button
          onClick={openAdd}
          className="text-xs font-bold tracking-widest uppercase bg-amber-400 border border-amber-400 px-5 py-3 hover:bg-amber-500 hover:border-amber-500 transition-colors"
        >
          + Add Application
        </button>
      </div>

      {/* Summary bar */}
      <div className="max-w-7xl mx-auto px-8 mb-0">
        <div className="grid grid-cols-4 border border-[#e5e5e5] border-b-0">
          {summaryStats.map(({ label, count, filter }, i) => {
            const active = quickFilter === filter
            return (
              <button
                key={filter}
                onClick={() => activateQuickFilter(filter)}
                className={`px-6 py-4 text-left transition-colors ${i > 0 ? "border-l border-[#e5e5e5]" : ""} ${
                  active ? "bg-amber-400" : "hover:bg-[#fafafa]"
                }`}
              >
                <div className={`text-2xl font-bold mb-0.5 ${active ? "text-[#0a0a0a]" : count > 0 ? "text-[#0a0a0a]" : "text-[#ccc]"}`}>
                  {count}
                </div>
                <div className={`text-xs tracking-widest uppercase ${active ? "text-[#0a0a0a]" : "text-[#888]"}`}>
                  {label}
                </div>
              </button>
            )
          })}
        </div>
        {quickFilter && (
          <div className="border border-[#e5e5e5] border-t border-b-0 px-4 py-2 flex items-center justify-between bg-[#fafafa]">
            <span className="text-xs text-[#888] tracking-widest uppercase">
              Filtered: {summaryStats.find((s) => s.filter === quickFilter)?.label}
            </span>
            <button onClick={() => setQuickFilter(null)} className="text-xs text-[#888] hover:text-[#0a0a0a] transition-colors">
              ✕ Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-8 border-b border-[#e5e5e5]">
        <div className="flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setQuickFilter(null) }}
              className={`text-xs tracking-widest uppercase px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                tab === t && !quickFilter
                  ? "border-amber-400 text-[#0a0a0a]"
                  : "border-transparent text-[#888] hover:text-[#0a0a0a]"
              }`}
            >
              {t}
              <span className="ml-1.5 text-[#bbb]">({counts[t]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-6 pb-24">
        {!quickFilter && tab === "Pipeline" ? (
          <PipelineView apps={apps} onEdit={openEdit} onAdd={openAdd} />
        ) : !quickFilter && tab === "Active by Company" ? (
          <CompanyView apps={apps} onEdit={openEdit} onAdd={openAdd} />
        ) : (
          <ApplicationTable
            apps={displayApps}
            onEdit={openEdit}
            onAdd={openAdd}
            onMarkSent={!quickFilter && tab === "Apply Queue" ? handleMarkSent : undefined}
          />
        )}
      </div>

      <footer className="border-t border-[#e5e5e5] px-8 py-6 text-center">
        <span className="text-xs text-[#aaa] tracking-widest uppercase">
          JobPocket — warm it up before you serve it.
        </span>
      </footer>

      {modalOpen && (
        <ApplicationModal
          editing={editing}
          prefill={prefillData}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
