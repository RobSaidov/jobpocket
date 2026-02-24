import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "JobPocket — Warm It Up Before You Serve It",
  description: "Automate the warm approach to job applications. Blocker checking, connection finding, tiered outreach, and follow-up tracking.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
