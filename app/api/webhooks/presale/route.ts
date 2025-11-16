import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isValidUUID, generateErrorId } from "@/lib/validation"
import crypto from "crypto"

const TOKEN_PRICE = 0.02 // $0.02 per OBLM token
const MIN_SOL = 0.05 // 0.05 SOL minimum

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

    // Extract payment details from webhook payload
    const { userId, amountSol, tokensAmount, paymentId, status, transactionHash } = payload

    console.log(`[v0] [${errorId}] Payment details:`, {
      userId,
      amountSol,
      tokensAmount,
      paymentId,
      status,
      transactionHash,
    })

    // Validate required fields
    if (!userId || !amountSol || !tokensAmount || !paymentId) {
      console.error(`[v0] [${errorId}] Missing required fields`)
      return NextResponse.json({ error: "Missing required fields", errorId }, { status: 400 })
    }

    // Only process successful payments
    if (status !== "completed" && status !== "success") {
      console.log(`[v0] [${errorId}] Payment not completed, status: ${status}`)
      return NextResponse.json({ message: "Payment not completed", errorId }, { status: 200 })
    }

    // Validate UUID
    if (!isValidUUID(userId)) {
      console.error(`[v0] [${errorId}] Invalid UUID format`)
      return NextResponse.json({ error: "Invalid ID format", errorId }, { status: 400 })
    }

    // Validate amounts
    if (typeof amountSol !== "number" || amountSol < MIN_SOL || amountSol > 1000) {
      console.error(`[v0] [${errorId}] Invalid SOL amount: ${amountSol}`)
      return NextResponse.json({ error: "Invalid amount", errorId }, { status: 400 })
    }

    if (typeof tokensAmount !== "number" || tokensAmount <= 0) {
      console.error(`[v0] [${errorId}] Invalid tokens amount: ${tokensAmount}`)
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
      .eq("wallet_tx_hash", transactionHash || paymentId)
      .single()

    if (existingTx) {
      console.log(`[v0] [${errorId}] Transaction already processed: ${paymentId}`)
      return NextResponse.json({ message: "Transaction already processed", errorId }, { status: 200 })
    }

    console.log(`[v0] [${errorId}] Processing presale purchase...`)
    
    // Process the presale purchase using the database function
    const { data: result, error: rpcError } = await supabase.rpc("process_presale_purchase", {
      p_user_id: userId,
      p_amount_sol: amountSol,
      p_tokens_received: tokensAmount,
      p_token_price: TOKEN_PRICE,
      p_wallet_tx_hash: transactionHash || paymentId,
    })

    if (rpcError) {
      console.error(`[v0] [${errorId}] Failed to process presale:`, rpcError)
      return NextResponse.json({ 
        error: "Failed to process presale", 
        details: rpcError,
        errorId 
      }, { status: 500 })
    }

    console.log(`[v0] [${errorId}] ====== PRESALE PROCESSED SUCCESSFULLY ======`)
    console.log(`[v0] [${errorId}] User: ${userId}`)
    console.log(`[v0] [${errorId}] Tokens: ${tokensAmount}`)
    console.log(`[v0] [${errorId}] Amount: ${amountSol} SOL`)

    return NextResponse.json({
      success: true,
      message: "Presale tokens credited successfully",
      transaction: {
        userId,
        tokensAmount,
        amountSol,
      },
    })
  } catch (error) {
    console.error(`[v0] [${errorId}] ====== WEBHOOK ERROR ======`)
    console.error(`[v0] [${errorId}] Error:`, error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error",
      errorId 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
