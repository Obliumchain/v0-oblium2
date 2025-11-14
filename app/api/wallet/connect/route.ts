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
      data: { user, session },
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
          error: "Session expired. Please refresh the page and log in again.",
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
          error: "No active session. Please refresh and log in.",
          errorId,
        },
        { status: 401 },
      )
    }

    console.log(`[${errorId}] User authenticated: ${user.id}`)
    console.log(`[${errorId}] Connecting wallet: ${wallet_address} (${wallet_type})`)

    const { data: existingWallet } = await supabase
      .from("profiles")
      .select("id, wallet_address")
      .eq("wallet_address", wallet_address)
      .neq("id", user.id)
      .maybeSingle()

    if (existingWallet) {
      console.log(`[${errorId}] Wallet already connected to user: ${existingWallet.id}`)
      return NextResponse.json(
        { error: "Wallet address already connected to another account", errorId },
        { status: 400 },
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("wallet_address, points")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error(`[${errorId}] Profile not found:`, profileError)
      return NextResponse.json({ error: "Profile not found", errorId }, { status: 404 })
    }

    const isFirstConnection = !profile.wallet_address
    const bonusPoints = isFirstConnection ? 500 : 0
    const newPoints = profile.points + bonusPoints

    console.log(`[${errorId}] Updating profile - First connection: ${isFirstConnection}, Bonus: ${bonusPoints}`)
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        wallet_address,
        wallet_type: wallet_type || "Phantom",
        wallet_connected_at: isFirstConnection ? new Date().toISOString() : undefined,
        points: newPoints,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error(`[${errorId}] Error updating wallet:`, updateError)
      return NextResponse.json({ error: "Failed to connect wallet", errorId, details: updateError.message }, { status: 500 })
    }

    console.log(`[${errorId}] Wallet connected successfully!`)

    return NextResponse.json({
      success: true,
      wallet_address,
      wallet_type: wallet_type || "Phantom",
      bonus_awarded: bonusPoints,
      new_points: newPoints,
    })
  } catch (error) {
    console.error(`[${errorId}] Unexpected error:`, error)
    return NextResponse.json(
      {
        error: "Connection failed. Please try again.",
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
