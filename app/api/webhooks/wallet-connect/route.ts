import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function POST(request: NextRequest) {
  const errorId = generateErrorId()

  try {
    console.log(`[v0] [${errorId}] Wallet connect webhook received`)

    const signature = request.headers.get("x-webhook-signature")
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error(`[v0] [${errorId}] WEBHOOK_SECRET not configured`)
      return NextResponse.json({ error: "Server configuration error", errorId }, { status: 500 })
    }

    const body = await request.text()
    console.log(`[v0] [${errorId}] Raw webhook body:`, body)

    const payload = JSON.parse(body)

    if (signature) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

      if (signature !== expectedSignature) {
        console.error(`[v0] [${errorId}] Invalid webhook signature`, {
          received: signature,
          expected: expectedSignature,
        })
        return NextResponse.json({ error: "Invalid signature", errorId }, { status: 401 })
      }
      console.log(`[v0] [${errorId}] Signature verified successfully`)
    } else {
      console.warn(`[v0] [${errorId}] No signature provided, skipping verification (DEV MODE)`)
    }

    console.log(`[v0] [${errorId}] Wallet connect webhook payload:`, payload)

    const userId = payload.userId || payload.user_id
    const walletAddress = payload.walletAddress || payload.wallet_address || payload.address
    const walletType = payload.walletType || payload.wallet_type || "solana"

    if (!userId || !walletAddress) {
      console.error(`[v0] [${errorId}] Missing required fields:`, {
        userId,
        walletAddress,
        receivedFields: Object.keys(payload),
      })
      return NextResponse.json(
        {
          error: "Missing required fields",
          errorId,
          required: ["userId or user_id", "walletAddress or wallet_address or address"],
          received: Object.keys(payload),
        },
        { status: 400 },
      )
    }

    console.log(`[v0] [${errorId}] Attempting to update wallet for user:`, userId)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[v0] [${errorId}] Supabase configuration missing`)
      return NextResponse.json({ error: "Server configuration error", errorId }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, nickname, wallet_address, oblm_token_balance, wallet_bonus_claimed")
      .eq("id", userId)
      .single()

    if (fetchError || !existingProfile) {
      console.error(`[v0] [${errorId}] User not found:`, { userId, error: fetchError })
      return NextResponse.json(
        {
          error: "User not found",
          errorId,
          details: fetchError?.message,
        },
        { status: 404 },
      )
    }

    console.log(`[v0] [${errorId}] Found user profile:`, existingProfile)

    const isFirstConnection = !existingProfile.wallet_address && !existingProfile.wallet_bonus_claimed
    const currentBalance = existingProfile.oblm_token_balance || 0
    const bonusAmount = isFirstConnection ? 150 : 0
    const newBalance = currentBalance + bonusAmount

    console.log(`[v0] [${errorId}] Wallet connection bonus:`, {
      isFirstConnection,
      hasWalletAddress: !!existingProfile.wallet_address,
      bonusAlreadyClaimed: existingProfile.wallet_bonus_claimed,
      currentBalance,
      bonusAmount,
      newBalance,
    })

    const { data, error } = await supabase
      .from("profiles")
      .update({
        wallet_address: walletAddress,
        wallet_connected_at: new Date().toISOString(),
        wallet_type: walletType,
        oblm_token_balance: newBalance,
        wallet_bonus_claimed: existingProfile.wallet_bonus_claimed || isFirstConnection, // Set flag to true if bonus was awarded
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error(`[v0] [${errorId}] Error updating wallet:`, {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          error: "Database error",
          errorId,
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    if (!data) {
      console.error(`[v0] [${errorId}] No data returned after update`)
      return NextResponse.json(
        {
          error: "Update failed - no data returned",
          errorId,
        },
        { status: 500 },
      )
    }

    console.log(`[v0] [${errorId}] Wallet connected successfully:`, {
      userId: data.id,
      walletAddress: data.wallet_address,
      walletType: data.wallet_type,
      bonusAwarded: bonusAmount,
      newBalance: data.oblm_token_balance,
    })

    return NextResponse.json({
      success: true,
      message: isFirstConnection
        ? "Wallet connected successfully! You received 150 OBLM tokens as a bonus."
        : "Wallet reconnected successfully",
      walletAddress,
      userId,
      bonusAwarded: bonusAmount,
      newBalance: data.oblm_token_balance,
    })
  } catch (error) {
    console.error(`[v0] [${errorId}] Wallet connect webhook error:`, {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: "Internal server error",
        errorId,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
