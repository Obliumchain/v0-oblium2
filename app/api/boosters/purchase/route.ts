// API route to handle booster purchase completion and database updates
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isValidUUID, generateErrorId } from "@/lib/validation"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", errorId }, { status: 401 })
    }

    const { userId, boosterId, walletTxHash, amountSol } = await request.json()

    if (!userId || !boosterId || !walletTxHash || !amountSol) {
      return NextResponse.json({ error: "Missing required fields", errorId }, { status: 400 })
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden: Cannot purchase for another user", errorId }, { status: 403 })
    }

    if (!isValidUUID(userId) || !isValidUUID(boosterId)) {
      return NextResponse.json({ error: "Invalid ID format", errorId }, { status: 400 })
    }

    if (typeof amountSol !== "number" || amountSol <= 0 || amountSol > 1000) {
      return NextResponse.json({ error: "Invalid amount", errorId }, { status: 400 })
    }

    const { data: existingTx } = await supabase
      .from("booster_transactions")
      .select("id")
      .eq("wallet_tx_hash", walletTxHash)
      .single()

    if (existingTx) {
      return NextResponse.json({ error: "Transaction already processed", errorId }, { status: 400 })
    }

    const { data: booster, error: boosterError } = await supabase
      .from("boosters")
      .select("*")
      .eq("id", boosterId)
      .eq("active", true)
      .single()

    if (boosterError || !booster) {
      return NextResponse.json({ error: "Booster not found or inactive", errorId }, { status: 404 })
    }

    if (Math.abs(Number(amountSol) - Number(booster.price_sol)) > 0.001) {
      return NextResponse.json({ error: "Payment amount mismatch", errorId }, { status: 400 })
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("booster_transactions")
      .insert({
        user_id: userId,
        booster_id: boosterId,
        amount_sol: amountSol,
        wallet_tx_hash: walletTxHash,
        status: "completed",
      })
      .select()
      .single()

    if (transactionError) {
      console.error(`[${errorId}] Failed to record transaction:`, transactionError)
      return NextResponse.json({ error: "Failed to record transaction", errorId }, { status: 500 })
    }

    const expiresAt = new Date(Date.now() + booster.duration_hours * 60 * 60 * 1000)
    const { data: userBooster, error: userBoosterError } = await supabase
      .from("user_boosters")
      .insert({
        user_id: userId,
        booster_id: boosterId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (userBoosterError) {
      console.error(`[${errorId}] Failed to activate booster:`, userBoosterError)
      return NextResponse.json({ error: "Failed to activate booster", errorId }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transaction,
      userBooster,
      message: `Booster activated for ${booster.duration_hours} hours!`,
    })
  } catch (error) {
    console.error(`[${errorId}] Booster purchase error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
