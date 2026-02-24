import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { resume, background, company, jobTitle, jobDescription } = await req.json()
    const userBackground = resume ?? background ?? ""

    const prompt = `You are generating mock warm path data for a job search tool called JobPocket.

The user wants to work at ${company}${jobTitle ? ` as a ${jobTitle}` : ""}.

User background:
${userBackground || "Not provided"}

${jobDescription ? `Job description:\n${jobDescription}` : ""}

Generate exactly 4 warm paths — realistic people who could connect this user to ${company}. Follow these rules strictly:

1. connectionType distribution: exactly 1 "alumni", 1 "mutual", 2 "cold"
2. warmScore ranges: alumni = 75–95, mutual = 50–74, cold = 20–49
3. Make names, titles, and sharedBackground feel realistic and specific to ${company}
4. sharedBackground: 1–2 sentences on why there's a connection (shared school, bootcamp, open source project, community, etc.)
5. whyReach: 1 sentence on why reaching out to this person specifically makes sense

Return ONLY a valid JSON array with no extra text, no markdown, no code fences. Each object has these exact keys:
- name (string)
- title (string)
- company (string, always "${company}")
- connectionType ("alumni" | "mutual" | "cold")
- warmScore (number)
- sharedBackground (string)
- whyReach (string)`

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]"
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const paths = JSON.parse(cleaned)

    return NextResponse.json(paths)
  } catch (err) {
    console.error("generate-paths error:", err)
    return NextResponse.json({ error: "Failed to generate warm paths" }, { status: 500 })
  }
}
