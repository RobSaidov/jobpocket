import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TIER_GUIDANCE: Record<string, string> = {
  Hot: "This is a friend or former coworker. The goal is to ask for a referral directly — keep it casual, short, and assume familiarity. Don't over-explain. Reference the specific role.",
  Warm: "This is an alumni connection or 2nd-degree contact. The goal is to ask 1-2 quick questions about their experience at the company — not to ask for a referral directly. Be genuine, mention the shared connection.",
  Cold: "This is a stranger. The goal is to ask 1-2 quick questions — mention you recently applied or are interested in the role. Keep it humble and low-pressure.",
}

export async function POST(req: NextRequest) {
  try {
    const { tier, userBackground, contactName, contactTitle, company, role } = await req.json() as {
      tier: "Hot" | "Warm" | "Cold"
      userBackground: string
      contactName: string
      contactTitle: string
      company: string
      role: string
    }

    const prompt = `You are writing a LinkedIn outreach message for a job seeker.

Tier: ${tier}
Tier guidance: ${TIER_GUIDANCE[tier] ?? TIER_GUIDANCE.Cold}

Contact: ${contactName || "the contact"}${contactTitle ? `, ${contactTitle}` : ""} at ${company || "the company"}
Role being targeted: ${role || "a position"} at ${company || "the company"}
User background: ${userBackground || "Not provided"}

Write ONE short outreach message following the tier guidance above. Rules:
- Under 100 words — count carefully
- Natural and human — never salesy, never generic
- Do not start with "Hi, I'm [name]" — vary the opening
- Personalize using the user's background and contact's role where it makes sense
- End with something low-pressure ("Thanks either way" or similar)
- Write only the message — no subject line, no explanation, no quotes around it`

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    })

    const message = response.content[0].type === "text" ? response.content[0].text.trim() : ""

    return NextResponse.json({ message })
  } catch (err) {
    console.error("generate-outreach error:", err)
    return NextResponse.json({ error: "Failed to generate outreach message" }, { status: 500 })
  }
}
