"use client"

import { useState } from "react"
import { Application } from "@/lib/types"
import { computeNextAction } from "@/lib/storage"

const warmthBar: Record<string, string> = {
  Hot:  "bg-[#16a34a]",
  Warm: "bg-[#f59e0b]",
  Cold: "bg-[#9ca3af]",
}

const priorityCls: Record<string, string> = {
  P0: "text-[#dc2626] border-[#dc2626]",
  P1: "text-[#f59e0b] border-[#f59e0b]",
  P2: "text-[#9ca3af] border-[#9ca3af]",
}

function Badge({ text, cls }: { text: string; cls: string }) {
  return <span className={`text-xs border px-1.5 py-0.5 ${cls}`}>{text}</span>
}

function isUrgent(action: string): boolean {
  return action === "Follow up now" || action === "Follow up with recruiter"
}

type SortKey = "company" | "role" | "priority" | "status" | "outreach" | "referral" | "nextAction" | "followUp"
type SortDir = "asc" | "desc"

const PRIORITY_ORD: Record<string, number> = { P0: 0, P1: 1, P2: 2 }
const STATUS_ORD: Record<string, number> = { "To Apply": 0, Applied: 1, OA: 2, Interview: 3, Offer: 4, Rejected: 5 }

function getSortValue(app: Application, key: SortKey): string | number {
  switch (key) {
    case "company":    return app.company.toLowerCase()
    case "role":       return app.role.toLowerCase()
    case "priority":   return PRIORITY_ORD[app.priority] ?? 9
    case "status":     return STATUS_ORD[app.status] ?? 9
    case "outreach":   return app.outreachStatus
    case "referral":   return app.referralStatus
    case "nextAction": return app.nextAction || computeNextAction(app)
    case "followUp":   return app.followUpDate ?? "9999"
  }
}

function sortApps(apps: Application[], key: SortKey, dir: SortDir): Application[] {
  return [...apps].sort((a, b) => {
    const av = getSortValue(a, key)
    const bv = getSortValue(b, key)
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === "asc" ? cmp : -cmp
  })
}

interface Column { label: string; key: SortKey }

const COLS: Column[] = [
  { label: "Company",     key: "company" },
  { label: "Role",        key: "role" },
  { label: "Priority",    key: "priority" },
  { label: "Status",      key: "status" },
  { label: "Outreach",    key: "outreach" },
  { label: "Referral",    key: "referral" },
  { label: "Next Action", key: "nextAction" },
  { label: "Follow Up",   key: "followUp" },
]

interface Props {
  apps: Application[]
  onEdit: (app: Application) => void
  onMarkSent?: (app: Application) => void
  onAdd?: () => void
}

export default function ApplicationTable({ apps, onEdit, onMarkSent, onAdd }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("company")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (apps.length === 0) {
    return (
      <div className="border border-[#e5e5e5] py-20 text-center">
        <p className="text-xs text-[#888] tracking-widest uppercase mb-4">No applications here yet</p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="text-xs font-bold tracking-widest uppercase bg-amber-400 border border-amber-400 px-5 py-3 hover:bg-amber-500 hover:border-amber-500 transition-colors"
          >
            + Add Your First Application
          </button>
        )}
      </div>
    )
  }

  const sorted = sortApps(apps, sortKey, sortDir)

  return (
    <div className="overflow-x-auto border border-[#e5e5e5]">
      <table className="w-full text-xs min-w-[960px]">
        <thead>
          <tr className="border-b border-[#e5e5e5]">
            <th className="w-1 p-0" />
            {COLS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="text-left px-4 py-3 text-[#888] tracking-widest uppercase font-normal whitespace-nowrap cursor-pointer hover:text-[#0a0a0a] transition-colors select-none"
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1 text-[#bbb]">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                )}
              </th>
            ))}
            {onMarkSent && <th className="px-4 py-3 text-[#888] tracking-widest uppercase font-normal text-right">Action</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => {
            const nextAction = app.nextAction || computeNextAction(app)
            const urgent = isUrgent(nextAction)
            return (
              <tr
                key={app.id}
                onClick={() => onEdit(app)}
                className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] cursor-pointer transition-colors group"
              >
                <td className={`w-1 p-0 ${warmthBar[app.warmth] ?? "bg-[#e5e5e5]"}`} />

                <td className="px-4 py-3 font-bold whitespace-nowrap">{app.company}</td>
                <td className="px-4 py-3 text-[#555] max-w-[180px] truncate">{app.role}</td>
                <td className="px-4 py-3">
                  <Badge text={app.priority} cls={priorityCls[app.priority] ?? ""} />
                </td>
                <td className="px-4 py-3 text-[#555] whitespace-nowrap">{app.status}</td>
                <td className="px-4 py-3 text-[#555] whitespace-nowrap">{app.outreachStatus}</td>
                <td className="px-4 py-3 text-[#555] whitespace-nowrap">{app.referralStatus}</td>
                <td className={`px-4 py-3 max-w-[200px] truncate whitespace-nowrap font-medium ${urgent ? "text-red-500" : "text-[#888]"}`}>
                  {nextAction}
                </td>
                <td className="px-4 py-3 text-[#888] whitespace-nowrap">{app.followUpDate ?? "\u2014"}</td>

                {onMarkSent && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onMarkSent(app)}
                      className="text-xs tracking-widest uppercase border border-[#e5e5e5] px-3 py-1.5 hover:border-amber-400 hover:text-amber-600 transition-colors whitespace-nowrap"
                    >
                      Mark Sent →
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
