import Link from "next/link"

interface NavProps {
  active?: "dashboard" | "outreach" | "resume"
}

export default function Nav({ active }: NavProps) {
  const links = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/outreach", label: "Outreach", key: "outreach" },
    { href: "/resume", label: "Resume", key: "resume" },
  ]

  return (
    <nav className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between">
      <Link
        href="/"
        className="text-xs tracking-[0.2em] uppercase font-bold hover:text-amber-500 transition-colors"
      >
        JobPocket
      </Link>
      <div className="flex items-center gap-6">
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`text-xs tracking-widest uppercase transition-colors ${
              active === link.key
                ? "text-amber-500"
                : "text-[#888] hover:text-[#0a0a0a]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
