import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/recommend
// Generates AI Smart Card suggestions based on person's preference profile
// Triggered when item thresholds are met (see CLAUDE.md → AI Integration)
export async function POST(_req: NextRequest) {
  // TODO: implement
  // 1. Authenticate user (Supabase session)
  // 2. Check subscription tier and monthly usage limit
  // 3. Load person's items for the given category
  // 4. Build prompt from preference profile
  // 5. Call Claude Haiku (claude-haiku-4-5), max 1500 input / 400 output tokens
  // 6. Save response to ai_recommendations table
  // 7. Return suggestions JSON

  return NextResponse.json({ message: 'Not implemented' }, { status: 501 })
}
