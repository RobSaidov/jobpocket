import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BLOCKER_PATTERNS = [
  "will not sponsor",
  "no sponsorship",
  "sponsorship not available",
  "u.s. citizen",
  "us citizen required",
  "security clearance",
  "u.s. person",
  "must be authorized",
  "master's degree",
  "masters degree",
  "phd required",
  "ph.d required",
]

function detectBlockers(jdText: string): string[] {
  const lower = jdText.toLowerCase()
  const found: string[] = []

  if (lower.includes("will not sponsor") || lower.includes("no sponsorship") || lower.includes("sponsorship not available")) {
    found.push("Sponsorship not offered")
  }
  if (lower.includes("u.s. citizen") || lower.includes("us citizen")) {
    found.push("U.S. Citizenship required")
  }
  if (lower.includes("security clearance")) {
    found.push("Security clearance required")
  }
  if (lower.includes("u.s. person")) {
    found.push("U.S. Person requirement")
  }
  if (lower.includes("must be authorized") && !lower.includes("opt") && !lower.includes("cpt")) {
    found.push("Work authorization required (no OPT/CPT mentioned)")
  }
  if ((lower.includes("master's degree") || lower.includes("masters degree")) && !lower.includes("preferred")) {
    found.push("Master's degree required")
  }
  if ((lower.includes("phd required") || lower.includes("ph.d required") || lower.includes("ph.d. required")) && !lower.includes("preferred")) {
    found.push("PhD required")
  }

  return found
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jdText } = await req.json() as { resumeText: string; jdText: string }

    const blockers = detectBlockers(jdText)

    const prompt = `You are a resume tailoring assistant. Analyze this resume against the job description and return structured JSON.

Resume:
${resumeText || "Not provided"}

Job Description:
${jdText || "Not provided"}

Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "tailoredBullets": [
    "Rewritten resume bullet 1 using JD keywords",
    "Rewritten resume bullet 2 using JD keywords",
    "Rewritten resume bullet 3 using JD keywords",
    "Rewritten resume bullet 4 using JD keywords",
    "Rewritten resume bullet 5 using JD keywords"
  ],
  "keywordsToAdd": [
    "keyword1",
    "keyword2",
    "keyword3",
    "keyword4",
    "keyword5",
    "keyword6"
  ],
  "gapAnalysis": [
    "Gap or missing skill 1",
    "Gap or missing skill 2",
    "Gap or missing skill 3"
  ]
}

Rules:
- tailoredBullets: rewrite 5 of the strongest resume bullets to incorporate JD language and keywords. Use action verbs. Be specific and quantified where possible.
- keywordsToAdd: list 5-8 technical skills, tools, or phrases from the JD that are missing or underrepresented in the resume.
- gapAnalysis: identify 2-4 requirements in the JD that the resume doesn't clearly address.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}"
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const aiResult = JSON.parse(cleaned) as {
      tailoredBullets: string[]
      keywordsToAdd: string[]
      gapAnalysis: string[]
    }

    return NextResponse.json({
      tailoredBullets: aiResult.tailoredBullets ?? [],
      keywordsToAdd: aiResult.keywordsToAdd ?? [],
      gapAnalysis: aiResult.gapAnalysis ?? [],
      blockers,
    })
  } catch (err) {
    console.error("tailor-resume error:", err)
    return NextResponse.json({ error: "Failed to tailor resume" }, { status: 500 })
  }
}
