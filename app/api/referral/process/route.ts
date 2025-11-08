import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeInput, generateErrorId } from "@/lib/validation"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()
  try {
    console.log(`[${errorId}] Referral processing started`)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log(`[${errorId}] Unauthorized - no user found`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[${errorId}] Processing referral for user: ${user.id}`)

    const { referralCode } = await request.json()

    if (!referralCode || typeof referralCode !== "string") {
      console.log(`[${errorId}] Invalid referral code format`)
      return NextResponse.json({ error: "Referral code is required", errorId }, { status: 400 })
    }

    const sanitizedCode = sanitizeInput(referralCode, 50)

    console.log(`[${errorId}] Sanitized code: ${sanitizedCode}`)

    if (sanitizedCode.length < 3) {
      console.log(`[${errorId}] Referral code too short`)
      return NextResponse.json({ error: "Invalid referral code format", errorId }, { status: 400 })
    }

    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle()

    if (existingReferral) {
      console.log(`[${errorId}] User already used a referral code`)
      return NextResponse.json({ error: "You have already used a referral code", errorId }, { status: 400 })
    }

    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("id, referral_code")
      .eq("referral_code", sanitizedCode)
      .maybeSingle()

    if (!referrerProfile) {
      console.log(`[${errorId}] Referral code not found: ${sanitizedCode}`)
      return NextResponse.json({ error: "Invalid referral code", errorId }, { status: 400 })
    }

    if (referrerProfile.id === user.id) {
      console.log(`[${errorId}] Self-referral attempted`)
      return NextResponse.json({ error: "You cannot use your own referral code", errorId }, { status: 400 })
    }

    console.log(`[${errorId}] Referrer found: ${referrerProfile.id}`)

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
      console.log(`[${errorId}] Referral function returned false`)
      return NextResponse.json({ error: "Invalid referral code or already used", errorId }, { status: 400 })
    }

    console.log(`[${errorId}] Referral processed successfully`)
    return NextResponse.json({
      success: true,
      message: "Referral processed! You both earned 500 points!",
    })
  } catch (error) {
    console.error(`[${errorId}] Referral API error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
