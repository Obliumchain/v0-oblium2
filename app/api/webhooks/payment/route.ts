import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isValidUUID, generateErrorId } from "@/lib/validation"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()

  try {
    // Verify webhook signature for security
    const signature = request.headers.get("x-webhook-signature")
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error(`[${errorId}] WEBHOOK_SECRET not configured`)
      return NextResponse.json({ error: "Webhook not configured", errorId }, { status: 500 })
    }

    const body = await request.text()
    const payload = JSON.parse(body)

    // Verify signature to ensure request is from authorized payment app
    if (signature) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

      if (signature !== expectedSignature) {
        console.error(`[${errorId}] Invalid webhook signature`)
        return NextResponse.json({ error: "Invalid signature", errorId }, { status: 401 })
      }
    }

    console.log(`[${errorId}] Webhook received:`, payload)

    // Extract payment details from webhook payload
    const { userId, boosterId, paymentId, amountSol, status, transactionHash } = payload

    // Validate required fields
    if (!userId || !boosterId || !paymentId || !amountSol) {
      return NextResponse.json({ error: "Missing required fields", errorId }, { status: 400 })
    }

    // Only process successful payments
    if (status !== "completed" && status !== "success") {
      console.log(`[${errorId}] Payment not completed, status: ${status}`)
      return NextResponse.json({ message: "Payment not completed", errorId }, { status: 200 })
    }

    // Validate UUIDs
    if (!isValidUUID(userId) || !isValidUUID(boosterId)) {
      return NextResponse.json({ error: "Invalid ID format", errorId }, { status: 400 })
    }

    // Validate amount
    if (typeof amountSol !== "number" || amountSol <= 0 || amountSol > 1000) {
      return NextResponse.json({ error: "Invalid amount", errorId }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = await createClient()

    // Check if payment already processed (idempotency)
    const { data: existingTx } = await supabase
      .from("booster_transactions")
      .select("id")
      .eq("wallet_tx_hash", transactionHash || paymentId)
      .single()

    if (existingTx) {
      console.log(`[${errorId}] Transaction already processed: ${paymentId}`)
      return NextResponse.json({ message: "Transaction already processed", errorId }, { status: 200 })
    }

    // Verify booster exists and is active
    const { data: booster, error: boosterError } = await supabase
      .from("boosters")
      .select("*")
      .eq("id", boosterId)
      .eq("active", true)
      .single()

    if (boosterError || !booster) {
      console.error(`[${errorId}] Booster not found:`, boosterError)
      return NextResponse.json({ error: "Booster not found or inactive", errorId }, { status: 404 })
    }

    // Verify payment amount matches booster price
    if (Math.abs(Number(amountSol) - Number(booster.price_sol)) > 0.001) {
      console.error(`[${errorId}] Payment amount mismatch: expected ${booster.price_sol}, got ${amountSol}`)
      return NextResponse.json({ error: "Payment amount mismatch", errorId }, { status: 400 })
    }

    // Record transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("booster_transactions")
      .insert({
        user_id: userId,
        booster_id: boosterId,
        amount_sol: amountSol,
        wallet_tx_hash: transactionHash || paymentId,
        status: "completed",
      })
      .select()
      .single()

    if (transactionError) {
      console.error(`[${errorId}] Failed to record transaction:`, transactionError)
      return NextResponse.json({ error: "Failed to record transaction", errorId }, { status: 500 })
    }

    // Activate booster for user
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

    console.log(`[${errorId}] Booster activated successfully for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Booster activated successfully",
      transaction: {
        id: transaction.id,
        boosterId: booster.id,
        userId,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error(`[${errorId}] Webhook processing error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
