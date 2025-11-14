// API route to handle booster purchase completion and database updates
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isValidUUID, generateErrorId } from "@/lib/validation"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()
  let attemptId: string | null = null
  
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

    const { userId, boosterId, walletTxHash, amountSol, walletAddress, walletType } = await request.json()

    const { data: attempt } = await supabase
      .from("purchase_attempts")
      .insert({
        user_id: user.id,
        booster_id: boosterId,
        wallet_address: walletAddress || "unknown",
        wallet_type: walletType || "unknown",
        amount_sol: amountSol,
        status: "initiated",
        wallet_tx_hash: walletTxHash,
      })
      .select()
      .single()

    attemptId = attempt?.id

    if (!userId || !boosterId || !walletTxHash || !amountSol) {
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ status: "failed", error_message: "Missing required fields", error_code: "MISSING_FIELDS" })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Missing required fields", errorId }, { status: 400 })
    }

    if (user.id !== userId) {
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ status: "failed", error_message: "User mismatch", error_code: "FORBIDDEN" })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Forbidden: Cannot purchase for another user", errorId }, { status: 403 })
    }

    if (!isValidUUID(userId) || !isValidUUID(boosterId)) {
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ status: "failed", error_message: "Invalid ID format", error_code: "INVALID_ID" })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Invalid ID format", errorId }, { status: 400 })
    }

    if (typeof amountSol !== "number" || amountSol <= 0 || amountSol > 1000) {
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ status: "failed", error_message: "Invalid amount", error_code: "INVALID_AMOUNT" })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Invalid amount", errorId }, { status: 400 })
    }

    const { data: existingTx } = await supabase
      .from("booster_transactions")
      .select("id")
      .eq("wallet_tx_hash", walletTxHash)
      .single()

    if (existingTx) {
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ status: "failed", error_message: "Transaction already processed", error_code: "DUPLICATE_TX" })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Transaction already processed", errorId }, { status: 400 })
    }

    const { data: booster, error: boosterError } = await supabase
      .from("boosters")
      .select("*")
      .eq("id", boosterId)
      .eq("active", true)
      .single()

    if (boosterError || !booster) {
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ status: "failed", error_message: "Booster not found", error_code: "BOOSTER_NOT_FOUND" })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Booster not found or inactive", errorId }, { status: 404 })
    }

    if (Math.abs(Number(amountSol) - Number(booster.price_sol)) > 0.001) {
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ status: "failed", error_message: "Payment amount mismatch", error_code: "AMOUNT_MISMATCH" })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Payment amount mismatch", errorId }, { status: 400 })
    }

    if (attemptId) {
      await supabase.from("purchase_attempts").update({ status: "pending" }).eq("id", attemptId)
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
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ 
            status: "failed", 
            error_message: transactionError.message, 
            error_code: "TRANSACTION_FAILED" 
          })
          .eq("id", attemptId)
      }
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
      if (attemptId) {
        await supabase
          .from("purchase_attempts")
          .update({ 
            status: "failed", 
            error_message: userBoosterError.message, 
            error_code: "ACTIVATION_FAILED" 
          })
          .eq("id", attemptId)
      }
      return NextResponse.json({ error: "Failed to activate booster", errorId }, { status: 500 })
    }

    if (attemptId) {
      await supabase.from("purchase_attempts").update({ status: "completed" }).eq("id", attemptId)
    }

    return NextResponse.json({
      success: true,
      transaction,
      userBooster,
      message: `Booster activated for ${booster.duration_hours} hours!`,
    })
  } catch (error) {
    console.error(`[${errorId}] Booster purchase error:`, error)
    if (attemptId) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return []
            },
            setAll() {},
          },
        }
      )
      await supabase
        .from("purchase_attempts")
        .update({ 
          status: "failed", 
          error_message: error instanceof Error ? error.message : "Unknown error",
          error_code: "INTERNAL_ERROR" 
        })
        .eq("id", attemptId)
    }
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
