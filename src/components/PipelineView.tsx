"use client"

import { Application } from "@/lib/types"

const STATUSES: Application["status"][] = [
  "To Apply", "Applied", "OA", "Interview", "Offer", "Rejected",
]

const warmthCls: Record<string, string> = {
  Hot:  "text-[#16a34a] border-[#16a34a]",
  Warm: "text-[#f59e0b] border-[#f59e0b]",
  Cold: "text-[#9ca3af] border-[#9ca3af]",
}

interface Props {
  apps: Application[]
  onEdit: (app: Application) => void
}

export default function PipelineView({ apps, onEdit }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[900px] border border-[#e5e5e5]">
        {STATUSES.map((status, i) => {
          const col = apps.filter((a) => a.status === status)
          return (
            <div
              key={status}
              className={`flex-1 flex flex-col min-w-[150px] ${i > 0 ? "border-l border-[#e5e5e5]" : ""}`}
            >
              <div className="px-3 py-3 border-b border-[#e5e5e5] flex items-center justify-between">
                <span className="text-xs tracking-widest uppercase text-[#888]">{status}</span>
                <span className="text-xs text-[#ccc]">{col.length}</span>
              </div>
              <div className="p-2 space-y-2 flex-1">
                {col.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onEdit(app)}
                    className="p-3 border border-[#e5e5e5] cursor-pointer hover:bg-[#fafafa] transition-colors"
                  >
                    <p className="text-xs font-bold leading-snug">{app.company}</p>
                    <p className="text-xs text-[#555] truncate mt-0.5">{app.role}</p>
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      <span className={`text-xs border px-1.5 py-0.5 ${warmthCls[app.warmth] ?? ""}`}>
                        {app.warmth}
                      </span>
                      <span className="text-xs border border-[#e5e5e5] text-[#888] px-1.5 py-0.5">
                        {app.priority}
                      </span>
                    </div>
                  </div>
                ))}
                {col.length === 0 && (
                  <p className="text-xs text-[#ddd] p-2 text-center">—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
