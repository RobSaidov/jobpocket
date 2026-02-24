"use client"

import { useEffect, useState } from "react"
import { Application, Source, Priority, Warmth, AppStatus, OutreachStatus, ReferralStatus } from "@/lib/types"
import { autoFollowUpDate } from "@/lib/storage"

type FormData = Omit<Application, "id" | "dateAdded">

const empty: FormData = {
  company: "", role: "", location: "", postingUrl: "",
  source: "LinkedIn", priority: "P1", warmth: "Warm",
  status: "To Apply", outreachStatus: "Not Started",
  gotReply: false, applied: false, referralStatus: "None",
  contactName: "", contactTitle: "", notes: "",
  datePosted: "", followUpDate: "", nextAction: "",
}

const inputCls = "w-full border border-[#e5e5e5] bg-white text-[#0a0a0a] text-xs p-2.5 focus:outline-none focus:border-[#0a0a0a] transition-colors"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#888] tracking-widest uppercase mb-1">{label}</p>
      {children}
    </div>
  )
}

function Sel<T extends string>({ value, opts, onChange }: { value: T; opts: T[]; onChange: (v: T) => void }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  )
}

interface Props {
  editing: Application | null
  prefill?: Partial<FormData>
  onSave: (app: Application) => void
  onDelete?: () => void
  onClose: () => void
}

export default function ApplicationModal({ editing, prefill, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<FormData>(
    editing ? { ...editing } : prefill ? { ...empty, ...prefill } : { ...empty }
  )
  const [err, setErr] = useState("")

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [k]: v }
      // Checking "Applied" checkbox promotes status from "To Apply" → "Applied"
      if (k === "applied" && v === true && prev.status === "To Apply") {
        next.status = "Applied"
      }
      // Auto-set follow up date when outreach marked as sent
      if (k === "outreachStatus" && v === "Sent" && !prev.followUpDate) {
        next.followUpDate = autoFollowUpDate(prev.warmth as Warmth)
      }
      return next
    })
  }

  function save() {
    if (!form.company.trim() || !form.role.trim()) {
      setErr("Company and role are required.")
      return
    }
    onSave({
      ...form,
      id: editing?.id ?? crypto.randomUUID(),
      dateAdded: editing?.dateAdded ?? new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#e5e5e5] w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="border-b border-[#e5e5e5] px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-xs font-bold tracking-widest uppercase">
            {editing ? "Edit Application" : "Add Application"}
          </p>
          <button onClick={onClose} className="text-xs text-[#888] hover:text-[#0a0a0a] transition-colors">
            ✕ <span className="text-[#ccc]">esc</span>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company *">
              <input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="Role *">
              <input className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)} />
            </Field>
            <Field label="Location">
              <input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label="Source">
              <Sel value={form.source} opts={["LinkedIn", "Handshake", "Company Site", "Referral", "Other"] as Source[]} onChange={(v) => set("source", v)} />
            </Field>
            <Field label="Priority">
              <Sel value={form.priority} opts={["P0", "P1", "P2"] as Priority[]} onChange={(v) => set("priority", v)} />
            </Field>
            <Field label="Warmth">
              <Sel value={form.warmth} opts={["Hot", "Warm", "Cold"] as Warmth[]} onChange={(v) => set("warmth", v)} />
            </Field>
            <Field label="Status">
              <Sel value={form.status} opts={["To Apply", "Applied", "OA", "Interview", "Offer", "Rejected"] as AppStatus[]} onChange={(v) => set("status", v)} />
            </Field>
            <Field label="Outreach Status">
              <Sel value={form.outreachStatus} opts={["Not Started", "Sent", "Replied"] as OutreachStatus[]} onChange={(v) => set("outreachStatus", v)} />
            </Field>
            <Field label="Referral Status">
              <Sel value={form.referralStatus} opts={["None", "Asked", "Submitted", "Got It"] as ReferralStatus[]} onChange={(v) => set("referralStatus", v)} />
            </Field>
            <div className="flex items-center gap-6 pt-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.applied} onChange={(e) => set("applied", e.target.checked)} />
                Applied
                {form.applied && form.status === "Applied" && (
                  <span className="text-[#888]">→ status set to Applied</span>
                )}
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.gotReply} onChange={(e) => set("gotReply", e.target.checked)} />
                Got Reply
              </label>
            </div>
            <Field label="Contact Name">
              <input className={inputCls} value={form.contactName ?? ""} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label="Contact Title">
              <input className={inputCls} value={form.contactTitle ?? ""} onChange={(e) => set("contactTitle", e.target.value)} />
            </Field>
            <Field label="Date Posted">
              <input type="date" className={inputCls} value={form.datePosted ?? ""} onChange={(e) => set("datePosted", e.target.value)} />
            </Field>
            <Field label="Follow Up Date">
              <input type="date" className={inputCls} value={form.followUpDate ?? ""} onChange={(e) => set("followUpDate", e.target.value)} />
            </Field>
          </div>

          <Field label="Posting URL">
            <input className={inputCls} value={form.postingUrl} onChange={(e) => set("postingUrl", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Next Action">
            <input className={inputCls} value={form.nextAction ?? ""} onChange={(e) => set("nextAction", e.target.value)} placeholder="Auto-calculated if left blank" />
          </Field>
          <Field label="Notes">
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>

          {err && <p className="text-xs text-red-500 tracking-wide">{err}</p>}
        </div>

        <div className="border-t border-[#e5e5e5] px-6 py-4 flex items-center justify-between shrink-0">
          {onDelete ? (
            <button onClick={onDelete} className="text-xs tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-xs tracking-widest uppercase text-[#888] border border-[#e5e5e5] px-4 py-2 hover:border-[#0a0a0a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="text-xs tracking-widest uppercase font-bold bg-amber-400 border border-amber-400 px-4 py-2 hover:bg-amber-500 hover:border-amber-500 transition-colors"
            >
              Save
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
