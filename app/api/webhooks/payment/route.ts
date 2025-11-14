import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isValidUUID, generateErrorId } from "@/lib/validation"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()
  
  console.log(`[v0] [${errorId}] ====== WEBHOOK RECEIVED ======`)
  console.log(`[v0] [${errorId}] Timestamp: ${new Date().toISOString()}`)
  console.log(`[v0] [${errorId}] Headers:`, Object.fromEntries(request.headers.entries()))

  try {
    // Verify webhook signature for security
    const signature = request.headers.get("x-webhook-signature")
    const webhookSecret = process.env.WEBHOOK_SECRET

    console.log(`[v0] [${errorId}] Webhook secret configured: ${!!webhookSecret}`)
    console.log(`[v0] [${errorId}] Signature provided: ${!!signature}`)

    if (!webhookSecret) {
      console.error(`[v0] [${errorId}] WEBHOOK_SECRET not configured`)
      return NextResponse.json({ error: "Webhook not configured", errorId }, { status: 500 })
    }

    const body = await request.text()
    console.log(`[v0] [${errorId}] Request body:`, body)
    
    const payload = JSON.parse(body)
    console.log(`[v0] [${errorId}] Parsed payload:`, payload)

    // Verify signature to ensure request is from authorized payment app
    if (signature) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")
      console.log(`[v0] [${errorId}] Signature match: ${signature === expectedSignature}`)

      if (signature !== expectedSignature) {
        console.error(`[v0] [${errorId}] Invalid webhook signature`)
        console.error(`[v0] [${errorId}] Expected: ${expectedSignature}`)
        console.error(`[v0] [${errorId}] Received: ${signature}`)
        return NextResponse.json({ error: "Invalid signature", errorId }, { status: 401 })
      }
    } else {
      console.warn(`[v0] [${errorId}] No signature provided - accepting request anyway`)
    }

    console.log(`[v0] [${errorId}] Webhook received:`, payload)

    // Extract payment details from webhook payload
    const { userId, boosterId, paymentId, amountSol, status, transactionHash } = payload

    console.log(`[v0] [${errorId}] Payment details:`, {
      userId,
      boosterId,
      paymentId,
      amountSol,
      status,
      transactionHash,
    })

    // Validate required fields
    if (!userId || !boosterId || !paymentId || !amountSol) {
      return NextResponse.json({ error: "Missing required fields", errorId }, { status: 400 })
    }

    // Only process successful payments
    if (status !== "completed" && status !== "success") {
      console.log(`[v0] [${errorId}] Payment not completed, status: ${status}`)
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
      console.log(`[v0] [${errorId}] Transaction already processed: ${paymentId}`)
      return NextResponse.json({ message: "Transaction already processed", errorId }, { status: 200 })
    }

    console.log(`[v0] [${errorId}] Fetching booster details...`)
    
    // Verify booster exists and is active
    const { data: booster, error: boosterError } = await supabase
      .from("boosters")
      .select("*")
      .eq("id", boosterId)
      .eq("active", true)
      .single()

    if (boosterError || !booster) {
      console.error(`[v0] [${errorId}] Booster not found:`, boosterError)
      return NextResponse.json({ error: "Booster not found or inactive", errorId }, { status: 404 })
    }

    console.log(`[v0] [${errorId}] Booster found:`, booster)

    // Verify payment amount matches booster price
    if (Math.abs(Number(amountSol) - Number(booster.price_sol)) > 0.001) {
      console.error(`[v0] [${errorId}] Payment amount mismatch: expected ${booster.price_sol}, got ${amountSol}`)
      return NextResponse.json({ error: "Payment amount mismatch", errorId }, { status: 400 })
    }

    console.log(`[v0] [${errorId}] Recording transaction...`)
    
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
      console.error(`[v0] [${errorId}] Failed to record transaction:`, transactionError)
      return NextResponse.json({ error: "Failed to record transaction", errorId }, { status: 500 })
    }

    console.log(`[v0] [${errorId}] Transaction recorded:`, transaction)
    console.log(`[v0] [${errorId}] Activating booster for user...`)

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
      console.error(`[v0] [${errorId}] Failed to activate booster:`, userBoosterError)
      return NextResponse.json({ error: "Failed to activate booster", errorId }, { status: 500 })
    }

    console.log(`[v0] [${errorId}] ====== BOOSTER ACTIVATED SUCCESSFULLY ======`)
    console.log(`[v0] [${errorId}] User: ${userId}`)
    console.log(`[v0] [${errorId}] Booster: ${booster.name}`)
    console.log(`[v0] [${errorId}] Expires: ${expiresAt.toISOString()}`)

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
    console.error(`[v0] [${errorId}] ====== WEBHOOK ERROR ======`)
    console.error(`[v0] [${errorId}] Error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
