import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isValidUUID, generateErrorId } from "@/lib/validation"
import crypto from "crypto"

const TOKEN_PRICE = 0.02 // $0.02 per OBLM token
const MIN_PURCHASE_USD = 2 // $2 minimum

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()

  console.log(`[v0] [${errorId}] ====== PRESALE WEBHOOK RECEIVED ======`)
  console.log(`[v0] [${errorId}] Timestamp: ${new Date().toISOString()}`)

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

    // Verify signature
    if (signature) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")
      console.log(`[v0] [${errorId}] Signature match: ${signature === expectedSignature}`)

      if (signature !== expectedSignature) {
        console.error(`[v0] [${errorId}] Invalid webhook signature`)
        return NextResponse.json({ error: "Invalid signature", errorId }, { status: 401 })
      }
    }

    const {
      userId,
      amountUsd,
      tokens,
      tokensAmount,
      transactionId,
      paymentId,
      paymentMethod,
      timestamp,
      transactionHash,
      status,
    } = payload

    const finalTokens = tokens || tokensAmount
    const finalTransactionId = transactionId || transactionHash || paymentId

    console.log(`[v0] [${errorId}] Payment details:`, {
      userId,
      amountUsd,
      tokens: finalTokens,
      transactionId: finalTransactionId,
      paymentMethod,
      status,
      timestamp,
    })

    // Validate required fields
    if (!userId || !amountUsd || !finalTokens || !finalTransactionId) {
      console.error(`[v0] [${errorId}] Missing required fields. Received:`, {
        userId,
        amountUsd,
        tokens: finalTokens,
        transactionId: finalTransactionId,
      })
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: {
            userId: !!userId,
            amountUsd: !!amountUsd,
            tokens: !!finalTokens,
            transactionId: !!finalTransactionId,
          },
          errorId,
        },
        { status: 400 },
      )
    }

    // Validate UUID
    if (!isValidUUID(userId)) {
      console.error(`[v0] [${errorId}] Invalid UUID format`)
      return NextResponse.json({ error: "Invalid ID format", errorId }, { status: 400 })
    }

    if (typeof amountUsd !== "number" || amountUsd < MIN_PURCHASE_USD || amountUsd > 100000) {
      console.error(`[v0] [${errorId}] Invalid USD amount: ${amountUsd}`)
      return NextResponse.json({ error: "Invalid amount", errorId }, { status: 400 })
    }

    if (typeof finalTokens !== "number" || finalTokens <= 0) {
      console.error(`[v0] [${errorId}] Invalid tokens amount: ${finalTokens}`)
      return NextResponse.json({ error: "Invalid tokens amount", errorId }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[v0] [${errorId}] Supabase configuration missing`)
      return NextResponse.json({ error: "Server configuration error", errorId }, { status: 500 })
    }

    console.log(`[v0] [${errorId}] Creating Supabase admin client...`)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if payment already processed (idempotency)
    console.log(`[v0] [${errorId}] Checking for duplicate transaction...`)
    const { data: existingTx } = await supabase
      .from("presale_transactions")
      .select("id")
      .eq("wallet_tx_hash", finalTransactionId)
      .single()

    if (existingTx) {
      console.log(`[v0] [${errorId}] Transaction already processed: ${finalTransactionId}`)
      return NextResponse.json({ message: "Transaction already processed", errorId }, { status: 200 })
    }

    console.log(`[v0] [${errorId}] Starting database transaction...`)

    // 1. Create presale transaction record
    const { data: transaction, error: txError } = await supabase
      .from("presale_transactions")
      .insert({
        user_id: userId,
        amount_sol: amountUsd, // Storing USD amount in amount_sol field
        tokens_received: finalTokens,
        token_price: TOKEN_PRICE,
        wallet_tx_hash: finalTransactionId,
        status: "completed",
      })
      .select()
      .single()

    if (txError) {
      console.error(`[v0] [${errorId}] Failed to create transaction:`, txError)
      return NextResponse.json(
        {
          error: "Failed to record transaction",
          details: txError.message,
          errorId,
        },
        { status: 500 },
      )
    }

    console.log(`[v0] [${errorId}] Transaction record created:`, transaction.id)

    // 2. Update user's OBLM token balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("oblm_token_balance")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error(`[v0] [${errorId}] Failed to fetch user profile:`, profileError)
      return NextResponse.json(
        {
          error: "User not found",
          details: profileError.message,
          errorId,
        },
        { status: 404 },
      )
    }

    const currentBalance = Number(profile.oblm_token_balance || 0)
    const newBalance = currentBalance + finalTokens

    console.log(`[v0] [${errorId}] Updating OBLM balance: ${currentBalance} + ${finalTokens} = ${newBalance}`)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        oblm_token_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error(`[v0] [${errorId}] Failed to update balance:`, updateError)
      return NextResponse.json(
        {
          error: "Failed to update balance",
          details: updateError.message,
          errorId,
        },
        { status: 500 },
      )
    }

    console.log(`[v0] [${errorId}] ====== PRESALE PROCESSED SUCCESSFULLY ======`)
    console.log(`[v0] [${errorId}] User: ${userId}`)
    console.log(`[v0] [${errorId}] Tokens: ${finalTokens}`)
    console.log(`[v0] [${errorId}] Amount: $${amountUsd}`)
    console.log(`[v0] [${errorId}] New Balance: ${newBalance}`)

    return NextResponse.json({
      success: true,
      message: "Presale tokens credited successfully",
      transaction: {
        userId,
        tokensAmount: finalTokens,
        amountUsd,
        newBalance,
        transactionId: transaction.id,
      },
    })
  } catch (error) {
    console.error(`[v0] [${errorId}] ====== WEBHOOK ERROR ======`)
    console.error(`[v0] [${errorId}] Error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        errorId,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
