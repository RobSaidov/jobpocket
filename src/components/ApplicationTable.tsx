"use client"

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

interface Props {
  apps: Application[]
  onEdit: (app: Application) => void
  onMarkSent?: (app: Application) => void
}

export default function ApplicationTable({ apps, onEdit, onMarkSent }: Props) {
  if (apps.length === 0) {
    return (
      <div className="border border-[#e5e5e5] py-20 text-center">
        <p className="text-xs text-[#888] tracking-widest uppercase">No applications here yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-[#e5e5e5]">
      <table className="w-full text-xs min-w-[960px]">
        <thead>
          <tr className="border-b border-[#e5e5e5]">
            <th className="w-1 p-0" />
            {["Company", "Role", "Priority", "Status", "Outreach", "Referral", "Next Action", "Follow Up"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-[#888] tracking-widest uppercase font-normal whitespace-nowrap"
              >
                {h}
              </th>
            ))}
            {onMarkSent && <th className="px-4 py-3 text-[#888] tracking-widest uppercase font-normal text-right">Action</th>}
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => {
            const nextAction = app.nextAction || computeNextAction(app)
            const urgent = isUrgent(nextAction)
            return (
              <tr
                key={app.id}
                onClick={() => onEdit(app)}
                className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] cursor-pointer transition-colors group"
              >
                {/* Warmth bar */}
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
                <td className="px-4 py-3 text-[#888] whitespace-nowrap">{app.followUpDate ?? "—"}</td>

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
