import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isValidSolanaAddress, generateErrorId } from "@/lib/validation"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const errorId = generateErrorId()
  
  console.log(`[${errorId}] [v0] Wallet connection request received`)
  
  try {
    const { wallet_address } = await request.json()

    if (!wallet_address || typeof wallet_address !== "string") {
      console.log(`[${errorId}] [v0] Invalid wallet address in request`)
      return NextResponse.json({ error: "Wallet address required", errorId }, { status: 400 })
    }

    if (!isValidSolanaAddress(wallet_address)) {
      console.log(`[${errorId}] [v0] Invalid Solana address format`)
      return NextResponse.json({ error: "Invalid Solana wallet address format", errorId }, { status: 400 })
    }

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log(`[${errorId}] [v0] Available cookies:`, allCookies.map(c => c.name).join(', '))
    
    const supabase = await createClient()
    
    console.log(`[${errorId}] [v0] Supabase client created, checking auth...`)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log(`[${errorId}] [v0] Session check result:`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message,
      sessionErrorDetails: sessionError
    })

    if (sessionError || !session) {
      console.error(`[${errorId}] [v0] Auth failed - No valid session:`, {
        error: sessionError?.message,
        cookieCount: allCookies.length
      })
      return NextResponse.json({ 
        error: "No active session. Please log in again.", 
        errorId,
        details: 'Auth session missing!'
      }, { status: 401 })
    }

    const user = session.user
    console.log(`[${errorId}] [v0] User authenticated:`, user.id)

    const { data: existingWallet } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", wallet_address)
      .neq("id", user.id)
      .single()

    if (existingWallet) {
      console.log(`[${errorId}] [v0] Wallet already linked to another account`)
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
      console.log(`[${errorId}] [v0] Profile not found for user:`, user.id)
      return NextResponse.json({ error: "Profile not found", errorId }, { status: 404 })
    }

    const isFirstConnection = !profile.wallet_address
    const bonusPoints = isFirstConnection ? 500 : 0
    const newPoints = profile.points + bonusPoints

    console.log(`[${errorId}] [v0] Updating profile with wallet:`, {
      isFirstConnection,
      bonusPoints,
      newPoints
    })

    const { error } = await supabase
      .from("profiles")
      .update({
        wallet_address,
        wallet_connected_at: isFirstConnection ? new Date().toISOString() : undefined,
        points: newPoints,
      })
      .eq("id", user.id)

    if (error) {
      console.error(`[${errorId}] [v0] Database error updating wallet:`, error)
      return NextResponse.json({ error: "Failed to connect wallet", errorId }, { status: 500 })
    }

    console.log(`[${errorId}] [v0] Wallet connected successfully!`)

    return NextResponse.json({
      success: true,
      wallet_address,
      bonus_awarded: bonusPoints,
      new_points: newPoints,
    })
  } catch (error) {
    console.error(`[${errorId}] [v0] Unexpected error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
