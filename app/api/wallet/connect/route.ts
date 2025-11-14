import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isValidSolanaAddress, generateErrorId } from "@/lib/validation"

export async function POST(request: Request) {
  const errorId = generateErrorId()
  
  console.log(`[${errorId}] Wallet connect request received`)
  
  try {
    const { wallet_address, wallet_type } = await request.json()

    if (!wallet_address || typeof wallet_address !== "string") {
      console.log(`[${errorId}] Invalid wallet address provided`)
      return NextResponse.json({ error: "Wallet address required", errorId }, { status: 400 })
    }

    if (!isValidSolanaAddress(wallet_address)) {
      console.log(`[${errorId}] Invalid Solana address format: ${wallet_address}`)
      return NextResponse.json({ error: "Invalid Solana wallet address format", errorId }, { status: 400 })
    }

    const supabase = await createClient()

    console.log(`[${errorId}] Checking user authentication...`)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error(`[${errorId}] Supabase auth error:`, {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      })
      return NextResponse.json(
        {
          error: "Authentication failed. Please refresh the page and try logging in again.",
          errorId,
          details: authError.message,
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.error(`[${errorId}] No user session found`)
      return NextResponse.json(
        {
          error: "No active session found. Please refresh the page and log in again.",
          errorId,
        },
        { status: 401 },
      )
    }

    console.log(`[${errorId}] User authenticated successfully:`, user.id, "connecting wallet:", wallet_address)

    const { data: existingWallet } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", wallet_address)
      .neq("id", user.id)
      .single()

    if (existingWallet) {
      return NextResponse.json(
        { error: "Wallet address already connected to another account", errorId },
        { status: 400 },
      )
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address, points")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found", errorId }, { status: 404 })
    }

    const isFirstConnection = !profile.wallet_address
    const bonusPoints = isFirstConnection ? 500 : 0
    const newPoints = profile.points + bonusPoints

    const { error } = await supabase
      .from("profiles")
      .update({
        wallet_address,
        wallet_type: wallet_type || "unknown",
        wallet_connected_at: isFirstConnection ? new Date().toISOString() : undefined,
        points: newPoints,
      })
      .eq("id", user.id)

    if (error) {
      console.error(`[${errorId}] Error updating wallet:`, error)
      return NextResponse.json({ error: "Failed to connect wallet", errorId }, { status: 500 })
    }

    console.log(`[${errorId}] Wallet connected successfully for user:`, user.id)

    return NextResponse.json({
      success: true,
      wallet_address,
      wallet_type: wallet_type || "unknown",
      bonus_awarded: bonusPoints,
      new_points: newPoints,
    })
  } catch (error) {
    console.error(`[${errorId}] Unexpected error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
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
