import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/chat
// Free-form AI chat — Pro users only
// Context includes the full preference profile of the selected person
export async function POST(_req: NextRequest) {
  // TODO: implement
  // 1. Authenticate user (Supabase session)
  // 2. Check subscription tier — return 403 if not Pro
  // 3. Load full person preference profile
  // 4. Forward message + context to Claude Haiku
  // 5. Stream or return response

  return NextResponse.json({ message: 'Not implemented' }, { status: 501 })
}
