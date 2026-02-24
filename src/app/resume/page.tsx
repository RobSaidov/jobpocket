"use client"

import { Space_Mono } from "next/font/google"
import { useCallback, useEffect, useRef, useState } from "react"
import Nav from "@/components/Nav"
import { ResumeData } from "@/lib/types"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })

async function extractPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "))
  }
  return pages.join("\n")
}

interface TailorResult {
  blockers: string[]
  keywordsToAdd: string[]
  tailoredBullets: string[]
  gapAnalysis: string[]
}

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [parsing, setParsing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState("")

  const [jdText, setJdText] = useState("")
  const [tailoring, setTailoring] = useState(false)
  const [tailorError, setTailorError] = useState("")
  const [result, setResult] = useState<TailorResult | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jobpocket_resume")
      if (stored) setResume(JSON.parse(stored) as ResumeData)
    } catch { /* no stored resume */ }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf")
    const isTXT = file.type === "text/plain" || file.name.endsWith(".txt")
    if (!isPDF && !isTXT) { setParseError("Only PDF or .txt files are supported."); return }
    setParseError("")
    setParsing(true)
    try {
      const text = isPDF ? await extractPDF(file) : await file.text()
      const data: ResumeData = { text, filename: file.name, uploadedAt: new Date().toISOString() }
      localStorage.setItem("jobpocket_resume", JSON.stringify(data))
      setResume(data)
    } catch {
      setParseError("Could not read file. Try a different PDF or paste text.")
    } finally {
      setParsing(false)
    }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function handleTailor() {
    if (!resume?.text) { setTailorError("Upload a resume first."); return }
    if (!jdText.trim()) { setTailorError("Paste a job description first."); return }
    setTailorError("")
    setTailoring(true)
    setResult(null)
    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resume.text, jdText }),
      })
      if (!res.ok) throw new Error()
      setResult(await res.json() as TailorResult)
    } catch {
      setTailorError("Something went wrong. Please try again.")
    } finally {
      setTailoring(false)
    }
  }

  function clearResume() {
    localStorage.removeItem("jobpocket_resume")
    setResume(null)
    setResult(null)
  }

  const sectionLabel = "text-xs tracking-[0.2em] uppercase text-[#888] mb-6"
  const fieldLabel = "block text-xs text-[#888] tracking-widest uppercase mb-1"

  return (
    <div className={`${spaceMono.className} bg-white text-[#0a0a0a] min-h-screen`}>
      <Nav active="resume" />

      <div className="max-w-5xl mx-auto px-8 pt-12 pb-6">
        <p className="text-xs text-[#888] tracking-[0.2em] uppercase mb-2">Resume Manager</p>
        <h1 className="text-2xl font-bold tracking-tight">Your Resume</h1>
        <p className="text-xs text-[#555] mt-2">Upload once, tailored everywhere. We store your resume locally and use it across the app.</p>
      </div>

      <div className="max-w-5xl mx-auto px-8 pb-24 space-y-0">

        {/* ── Section 1: Upload ── */}
        <div className="border border-[#e5e5e5] p-8">
          <p className={sectionLabel}>01 — Your Resume</p>

          {resume ? (
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#22c55e] text-sm font-bold">&#10003;</span>
                  <span className="text-sm font-bold">{resume.filename}</span>
                  <span className="text-xs border border-[#22c55e] text-[#22c55e] px-2 py-0.5">Stored</span>
                </div>
                <p className="text-xs text-[#888]">
                  Uploaded {new Date(resume.uploadedAt).toLocaleDateString()} ·{" "}
                  {resume.text.split(/\s+/).length.toLocaleString()} words extracted
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs tracking-widest uppercase border border-[#e5e5e5] px-4 py-2 hover:border-[#0a0a0a] transition-colors"
                >
                  Replace
                </button>
                <button
                  onClick={clearResume}
                  className="text-xs tracking-widest uppercase text-red-500 border border-[#e5e5e5] px-4 py-2 hover:border-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border border-dashed p-12 text-center cursor-pointer transition-colors ${
                dragOver ? "border-[#0a0a0a] bg-[#fafafa]" : "border-[#ccc] hover:border-[#888]"
              }`}
            >
              {parsing ? (
                <p className="text-xs text-[#888]">Extracting text from PDF...</p>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">Drop your resume here</p>
                  <p className="text-xs text-[#888]">PDF or .txt — or click to browse</p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {parseError && <p className="text-xs text-red-500 mt-3">{parseError}</p>}
        </div>

        {/* ── Section 2: Tailor ── */}
        <div className="border border-[#e5e5e5] border-t-0 p-8">
          <p className={sectionLabel}>02 — Tailor to Job</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className={fieldLabel}>Job Description</label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={14}
                className="w-full border border-[#e5e5e5] bg-white text-[#0a0a0a] text-xs leading-relaxed p-4 placeholder-[#bbb] focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none"
              />
              {tailorError && <p className="text-xs text-red-500 mt-2">{tailorError}</p>}
              <button
                onClick={handleTailor}
                disabled={tailoring}
                className="mt-4 w-full bg-amber-400 border border-amber-400 text-[#0a0a0a] text-xs font-bold tracking-widest uppercase py-4 hover:bg-amber-500 hover:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tailoring ? "Analyzing..." : "Analyze & Tailor →"}
              </button>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  {/* Blockers */}
                  <div>
                    <p className={fieldLabel}>Blockers</p>
                    {result.blockers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.blockers.map((b) => (
                          <span key={b} className="text-xs border border-red-400 text-red-500 px-2 py-1">
                            ⚠ {b}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs border border-[#22c55e] text-[#22c55e] px-2 py-1">
                        ✓ No blockers detected
                      </span>
                    )}
                  </div>

                  {/* Keywords */}
                  <div>
                    <p className={fieldLabel}>Keywords to Add</p>
                    <div className="flex flex-wrap gap-2">
                      {result.keywordsToAdd.map((k) => (
                        <span key={k} className="text-xs border border-amber-400 text-amber-600 px-2 py-1">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Gap analysis */}
                  <div>
                    <p className={fieldLabel}>Gap Analysis</p>
                    <ul className="space-y-1.5">
                      {result.gapAnalysis.map((g) => (
                        <li key={g} className="text-xs text-[#555] flex gap-2">
                          <span className="text-[#ccc] shrink-0">—</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tailored bullets */}
                  <div>
                    <p className={fieldLabel}>Tailored Bullets</p>
                    <ul className="space-y-3">
                      {result.tailoredBullets.map((b, i) => (
                        <li key={i} className="text-xs text-[#0a0a0a] leading-relaxed border-l-2 border-[#e5e5e5] pl-3">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-[#e5e5e5] h-full min-h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#ccc] mb-1">No analysis yet</p>
                    <p className="text-xs text-[#ccc]">Paste a JD and hit Analyze</p>
                  </div>
                </div>
              )}
            </div>
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
