"use client"

import { Application } from "@/lib/types"
import { computeNextAction } from "@/lib/storage"

const warmthCls: Record<string, string> = {
  Hot:  "text-[#16a34a] border-[#16a34a]",
  Warm: "text-[#f59e0b] border-[#f59e0b]",
  Cold: "text-[#9ca3af] border-[#9ca3af]",
}

const priorityCls: Record<string, string> = {
  P0: "text-[#dc2626] border-[#dc2626]",
  P1: "text-[#f59e0b] border-[#f59e0b]",
  P2: "text-[#9ca3af] border-[#9ca3af]",
}

interface Props {
  apps: Application[]
  onEdit: (app: Application) => void
  onAdd?: () => void
}

export default function CompanyView({ apps, onEdit, onAdd }: Props) {
  const companies = [...new Set(apps.map((a) => a.company))].sort()

  if (companies.length === 0) {
    return (
      <div className="border border-[#e5e5e5] py-20 text-center">
        <p className="text-xs text-[#888] tracking-widest uppercase mb-4">No applications yet</p>
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

  return (
    <div className="border border-[#e5e5e5]">
      {companies.map((company, ci) => {
        const group = apps.filter((a) => a.company === company)
        return (
          <div key={company} className={ci > 0 ? "border-t border-[#e5e5e5]" : ""}>
            <div className="px-6 py-3 bg-[#fafafa] flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest uppercase">{company}</span>
              <span className="text-xs text-[#888]">
                {group.length} role{group.length !== 1 ? "s" : ""}
              </span>
            </div>
            {group.map((app) => (
              <div
                key={app.id}
                onClick={() => onEdit(app)}
                className="border-t border-[#e5e5e5] px-6 py-3 flex items-center gap-4 cursor-pointer hover:bg-[#fafafa] transition-colors"
              >
                <span className="text-xs text-[#0a0a0a] flex-1 truncate">{app.role}</span>
                <span className={`text-xs border px-1.5 py-0.5 ${warmthCls[app.warmth] ?? ""}`}>
                  {app.warmth}
                </span>
                <span className={`text-xs border px-1.5 py-0.5 ${priorityCls[app.priority] ?? ""}`}>
                  {app.priority}
                </span>
                <span className="text-xs text-[#888] w-24 shrink-0">{app.status}</span>
                <span className="text-xs text-[#555] w-40 shrink-0 truncate">
                  {app.nextAction || computeNextAction(app)}
                </span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
