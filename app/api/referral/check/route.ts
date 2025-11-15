import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has a profile with referral code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, referral_code, points, nickname")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        status: "error",
        message: "Profile not found",
        error: profileError,
      })
    }

    // Check how many users this user has referred
    const { count: referralsMade, error: referralsMadeError } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)

    // Check if this user was referred by someone
    const { data: wasReferred, error: wasReferredError } = await supabase
      .from("referrals")
      .select("referrer_id")
      .eq("referred_user_id", user.id)
      .maybeSingle()

    return NextResponse.json({
      status: "ok",
      user: {
        id: user.id,
        nickname: profile.nickname,
        referralCode: profile.referral_code,
        points: profile.points,
      },
      referrals: {
        made: referralsMade || 0,
        wasReferred: !!wasReferred,
        referrerId: wasReferred?.referrer_id || null,
      },
      errors: {
        profileError: profileError?.message || null,
        referralsMadeError: referralsMadeError?.message || null,
        wasReferredError: wasReferredError?.message || null,
      },
    })
  } catch (error) {
    console.error("Referral check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
