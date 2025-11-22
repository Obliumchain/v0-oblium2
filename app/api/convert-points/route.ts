import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateErrorId } from "@/lib/validation"

const CONVERSION_RATE = { points: 10000, oblm: 250 }
const GAS_FEE = 50
const MIN_OBLM_BALANCE = 350

export async function POST(request: Request) {
  const errorId = generateErrorId()
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("points, oblm_token_balance")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error(`[${errorId}] Failed to fetch profile:`, profileError)
      return NextResponse.json({ error: "Failed to fetch user profile", errorId }, { status: 500 })
    }

    const currentOblmBalance = Number(profile.oblm_token_balance) || 0
    if (currentOblmBalance < MIN_OBLM_BALANCE) {
      return NextResponse.json(
        {
          error: `Insufficient OBLM balance. You need at least ${MIN_OBLM_BALANCE} OBLM tokens to convert points.`,
          errorId,
        },
        { status: 400 },
      )
    }

    const currentPoints = Number(profile.points) || 0
    if (currentPoints < CONVERSION_RATE.points) {
      return NextResponse.json(
        {
          error: `Insufficient points. You need at least ${CONVERSION_RATE.points} points to convert.`,
          errorId,
        },
        { status: 400 },
      )
    }

    const conversionsAvailable = Math.floor(currentPoints / CONVERSION_RATE.points)
    const pointsToConvert = conversionsAvailable * CONVERSION_RATE.points
    const oblmToReceive = conversionsAvailable * CONVERSION_RATE.oblm

    const newPoints = currentPoints - pointsToConvert
    const oblmAfterConversion = currentOblmBalance + oblmToReceive
    const finalOblmBalance = oblmAfterConversion - GAS_FEE

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        points: newPoints,
        oblm_token_balance: finalOblmBalance,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error(`[${errorId}] Failed to update profile:`, updateError)
      return NextResponse.json({ error: "Failed to process conversion", errorId }, { status: 500 })
    }

    const { error: historyError } = await supabase.from("conversion_history").insert({
      user_id: user.id,
      points_converted: pointsToConvert,
      obl_tokens_received: oblmToReceive,
      conversion_rate: CONVERSION_RATE.oblm / CONVERSION_RATE.points,
      status: "completed",
    })

    if (historyError) {
      console.error(`[${errorId}] Failed to record conversion history:`, historyError)
      // Don't rollback - conversion is complete, just log the error
    }

    return NextResponse.json({
      success: true,
      pointsConverted: pointsToConvert,
      oblmReceived: oblmToReceive,
      gasFee: GAS_FEE,
      newPoints,
      newOblmBalance: finalOblmBalance,
    })
  } catch (error) {
    console.error(`[${errorId}] Conversion error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
