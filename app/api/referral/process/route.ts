import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeInput, generateErrorId } from "@/lib/validation"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()

  try {
    console.log(`[${errorId}] Referral processing API called`)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log(`[${errorId}] No authenticated user`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[${errorId}] User authenticated: ${user.id}`)

    const { referralCode } = await request.json()

    if (!referralCode || typeof referralCode !== "string") {
      console.log(`[${errorId}] Invalid referral code format`)
      return NextResponse.json({ error: "Referral code is required", errorId }, { status: 400 })
    }

    const sanitizedCode = sanitizeInput(referralCode, 50)
    console.log(`[${errorId}] Processing referral code: ${sanitizedCode}`)

    if (sanitizedCode.length < 3) {
      console.log(`[${errorId}] Referral code too short`)
      return NextResponse.json({ error: "Invalid referral code format", errorId }, { status: 400 })
    }

    let profileCheckAttempts = 0
    let userProfile = null

    while (profileCheckAttempts < 3) {
      const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()

      if (data) {
        userProfile = data
        break
      }

      profileCheckAttempts++
      console.log(`[${errorId}] Profile not found yet, attempt ${profileCheckAttempts}/3`)

      if (profileCheckAttempts < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
      }
    }

    if (!userProfile) {
      console.log(`[${errorId}] User profile not created yet`)
      return NextResponse.json(
        {
          error: "Please try again in a moment. Your profile is being created.",
          errorId,
        },
        { status: 400 },
      )
    }

    // Check if user already used a referral code
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle()

    if (existingReferral) {
      console.log(`[${errorId}] User already used a referral code`)
      return NextResponse.json({ error: "You have already used a referral code", errorId }, { status: 400 })
    }

    // Verify referral code exists
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("id, referral_code, nickname")
      .eq("referral_code", sanitizedCode)
      .maybeSingle()

    if (!referrerProfile) {
      console.log(`[${errorId}] Invalid referral code: ${sanitizedCode}`)
      return NextResponse.json({ error: "Invalid referral code", errorId }, { status: 400 })
    }

    if (referrerProfile.id === user.id) {
      console.log(`[${errorId}] Self-referral attempt blocked`)
      return NextResponse.json({ error: "You cannot use your own referral code", errorId }, { status: 400 })
    }

    console.log(`[${errorId}] Calling database function for referrer: ${referrerProfile.id}`)

    // Call the database function to process referral
    const { data, error } = await supabase.rpc("process_referral_reward", {
      p_referrer_code: sanitizedCode,
      p_new_user_id: user.id,
    })

    if (error) {
      console.error(`[${errorId}] Database function error:`, error)
      return NextResponse.json(
        {
          error: "Failed to process referral. Please try again.",
          errorId,
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!data) {
      console.log(`[${errorId}] Function returned false - referral not processed`)
      return NextResponse.json(
        {
          error: "Unable to process referral code. It may have already been used.",
          errorId,
        },
        { status: 400 },
      )
    }

    console.log(`[${errorId}] Referral processed successfully!`)

    return NextResponse.json({
      success: true,
      message: "Referral success! You both earned 500 points!",
      referrerNickname: referrerProfile.nickname,
    })
  } catch (error) {
    console.error(`[${errorId}] Unexpected error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        errorId,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
