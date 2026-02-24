import { Space_Mono } from "next/font/google"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })

export default function Home() {
  return (
    <div className={`${spaceMono.className} bg-white text-[#0a0a0a] min-h-screen`}>

      {/* Nav */}
      <nav className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] uppercase font-bold">
          JobPocket
        </span>
        <a
          href="/dashboard"
          className="text-xs tracking-widest uppercase hover:text-amber-500 transition-colors"
        >
          Dashboard →
        </a>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-24 pb-20 max-w-5xl mx-auto">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
          You've sent 50 applications.
          <br />
          Got 2 responses.
        </h1>
        <p className="text-sm text-[#555] max-w-lg mb-10 leading-relaxed">
          The problem isn't your resume. It's that you're cold.
          <br />
          JobPocket automates the warm approach — blocker check,
          <br />
          connections, outreach — in under 5 minutes.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-amber-400 text-[#0a0a0a] text-xs font-bold tracking-widest uppercase px-7 py-4 border border-amber-400 hover:bg-amber-500 hover:border-amber-500 transition-colors"
        >
          Warm Up Your First Job →
        </a>
      </section>

      {/* Stats row */}
      <section className="border-t border-b border-[#e5e5e5] max-w-5xl mx-auto">
        <div className="grid grid-cols-3">
          <div className="px-8 py-10">
            <div className="text-4xl font-bold mb-2">2–5%</div>
            <div className="text-xs text-[#888] tracking-widest uppercase">cold application response rate</div>
          </div>
          <div className="px-8 py-10 border-l border-[#e5e5e5]">
            <div className="text-4xl font-bold mb-2">10×</div>
            <div className="text-xs text-[#888] tracking-widest uppercase">better conversion when warm</div>
          </div>
          <div className="px-8 py-10 border-l border-[#e5e5e5]">
            <div className="text-4xl font-bold mb-2">5 min</div>
            <div className="text-xs text-[#888] tracking-widest uppercase">per application with JobPocket</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-8 pt-20 pb-24">
        <p className="text-xs tracking-[0.2em] uppercase text-[#888] mb-12">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#e5e5e5]">
          <div className="p-8 sm:border-r border-[#e5e5e5]">
            <div className="text-xs text-[#888] mb-4 tracking-widest">01 —</div>
            <div className="text-sm font-bold uppercase tracking-widest mb-3">Paste any job description</div>
            <div className="text-xs text-[#666] leading-relaxed">Drop a URL or paste the JD text. We extract company, role, and requirements instantly.</div>
          </div>
          <div className="p-8 border-t sm:border-t-0 sm:border-r border-[#e5e5e5]">
            <div className="text-xs text-[#888] mb-4 tracking-widest">02 —</div>
            <div className="text-sm font-bold uppercase tracking-widest mb-3">Instant blocker scan</div>
            <div className="text-xs text-[#666] leading-relaxed">We flag sponsorship blockers, degree requirements, and clearance needs before you waste time applying.</div>
          </div>
          <div className="p-8 border-t lg:border-t-0 lg:border-r border-[#e5e5e5]">
            <div className="text-xs text-[#888] mb-4 tracking-widest">03 —</div>
            <div className="text-sm font-bold uppercase tracking-widest mb-3">Find your warm path in</div>
            <div className="text-xs text-[#666] leading-relaxed">Upload your LinkedIn connections CSV. We surface alumni, 2nd-degree, and mutual ties at the company.</div>
          </div>
          <div className="p-8 border-t lg:border-t-0 border-[#e5e5e5]">
            <div className="text-xs text-[#888] mb-4 tracking-widest">04 —</div>
            <div className="text-sm font-bold uppercase tracking-widest mb-3">Send tailored outreach in one click</div>
            <div className="text-xs text-[#666] leading-relaxed">AI writes a warm, personal message for each contact — Hot, Warm, or Cold tier — under 100 words.</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] px-8 py-6 text-center">
        <span className="text-xs text-[#aaa] tracking-widest uppercase">
          JobPocket — warm it up before you serve it.
        </span>
      </footer>

    </div>
  )
}
