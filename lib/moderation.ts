import Anthropic from '@anthropic-ai/sdk'

interface ModerationResult {
  approved: boolean
  reason?: string
}

// Keywords that immediately signal a personal/non-community issue
const PERSONAL_KEYWORDS = [
  'i need money', 'send money', 'give me money', 'need cash', 'i am broke',
  'i haven\'t eaten', 'i have not eaten', 'i am hungry', 'no food',
  'pay my rent', 'pay my bill', 'owe me money', 'my debt', 'loan',
  'my landlord', 'my boss fired', 'my employer', 'i lost my job',
  'my husband', 'my wife', 'my girlfriend', 'my boyfriend',
  'give me', 'help me financially', 'financial help', 'i need help',
  'please send', 'donate to me', 'my personal',
]

function quickPersonalCheck(title: string, description: string): string | null {
  const combined = `${title} ${description}`.toLowerCase()
  for (const kw of PERSONAL_KEYWORDS) {
    if (combined.includes(kw)) {
      return `This looks like a personal request ("${kw}"). Grassruts is for community infrastructure issues only.`
    }
  }
  return null
}

export async function moderateIssue(
  title: string,
  description: string,
  categoryName: string,
): Promise<ModerationResult> {
  // Fast path: catch obvious personal issues without an API call
  const quickReject = quickPersonalCheck(title, description)
  if (quickReject) {
    return { approved: false, reason: quickReject }
  }

  // If no API key, skip AI check (fail-open so the app still works)
  if (!process.env.ANTHROPIC_API_KEY) {
    return { approved: true }
  }

  try {
    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are a content moderator for Grassruts, a Nigerian civic platform where citizens report community infrastructure problems.

VALID issues: broken roads, no water supply, power outages, public health hazards, damaged schools, flooding, illegal dumping, security threats — anything affecting the public in a shared area.

INVALID issues: personal financial requests, individual grievances, domestic disputes, personal hardship, begging, issues that only affect one person privately.

Classify this submission:
Category: ${categoryName}
Title: ${title}
Description: ${description}

Reply with JSON only, no other text:
{"approved": true} if it is a genuine community issue
{"approved": false, "reason": "one sentence explaining why it was rejected"} if it is personal or invalid`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const result = JSON.parse(text) as ModerationResult
    return result
  } catch {
    // If the API call fails for any reason, fail-open (don't block the user)
    return { approved: true }
  }
}
