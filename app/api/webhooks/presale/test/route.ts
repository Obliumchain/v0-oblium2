import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST() {
  try {
    const webhookUrl = process.env.OBLIUM_WEBHOOK_URL || "http://localhost:3000/api/webhooks/presale"
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json({ error: "WEBHOOK_SECRET not configured" }, { status: 500 })
    }

    // Sample test payload
    const testPayload = {
      userId: "d1be031e-dde2-41db-b211-8f91f2c3a20d", // Use a real user ID from your database
      amountUsd: 10, // $10 test purchase
      tokens: 500, // 500 OBLM tokens (at $0.02 per token = $10)
      transactionId: `test_${Date.now()}`,
      paymentMethod: "SOL",
      status: "completed",
      timestamp: new Date().toISOString(),
    }

    const body = JSON.stringify(testPayload)
    const signature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    console.log("[v0] Test webhook payload:", testPayload)
    console.log("[v0] Webhook URL:", webhookUrl)
    console.log("[v0] Signature:", signature)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body,
    })

    const result = await response.json()

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
      testPayload,
    })
  } catch (error) {
    console.error("[v0] Test webhook error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
