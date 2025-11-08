import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeInput, generateErrorId } from "@/lib/validation"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { referralCode } = await request.json()

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json({ error: "Referral code is required", errorId }, { status: 400 })
    }

    const sanitizedCode = sanitizeInput(referralCode, 50)

    if (sanitizedCode.length < 3) {
      return NextResponse.json({ error: "Invalid referral code format", errorId }, { status: 400 })
    }

    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle()

    if (existingReferral) {
      return NextResponse.json({ error: "You have already used a referral code", errorId }, { status: 400 })
    }

    // Call the database function to process referral
    const { data, error } = await supabase.rpc("process_referral_reward", {
      p_referrer_code: sanitizedCode,
      p_new_user_id: user.id,
    })

    if (error) {
      console.error(`[${errorId}] Referral processing error:`, error)
      return NextResponse.json({ error: "Failed to process referral", errorId }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Invalid referral code", errorId }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Referral processed successfully" })
  } catch (error) {
    console.error(`[${errorId}] Referral API error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
