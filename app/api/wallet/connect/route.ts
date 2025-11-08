import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isValidSolanaAddress, generateErrorId } from "@/lib/validation"

export async function POST(request: Request) {
  const errorId = generateErrorId()
  try {
    const { wallet_address } = await request.json()

    if (!wallet_address || typeof wallet_address !== "string") {
      return NextResponse.json({ error: "Wallet address required", errorId }, { status: 400 })
    }

    if (!isValidSolanaAddress(wallet_address)) {
      return NextResponse.json({ error: "Invalid Solana wallet address format", errorId }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
        wallet_connected_at: isFirstConnection ? new Date().toISOString() : undefined,
        points: newPoints,
      })
      .eq("id", user.id)

    if (error) {
      console.error(`[${errorId}] Error updating wallet:`, error)
      return NextResponse.json({ error: "Failed to connect wallet", errorId }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      wallet_address,
      bonus_awarded: bonusPoints,
      new_points: newPoints,
    })
  } catch (error) {
    console.error(`[${errorId}] Wallet connection error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
