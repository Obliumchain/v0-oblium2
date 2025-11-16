import crypto from "crypto"

interface PresaleWebhookPayload {
  userId: string
  amountUsd: number
  tokensAmount: number
  paymentId: string
  status: "completed" | "success"
  amountSol: number
  transactionHash?: string
  timestamp?: string
}

export class PresaleWebhookClient {
  private webhookUrl: string
  private webhookSecret: string

  constructor(webhookUrl: string, webhookSecret: string) {
    this.webhookUrl = webhookUrl
    this.webhookSecret = webhookSecret
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string): string {
    return crypto.createHmac("sha256", this.webhookSecret).update(payload).digest("hex")
  }

  /**
   * Send presale purchase webhook to Oblium
   */
  async notifyPresalePurchase(payload: PresaleWebhookPayload): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate payload
      if (!payload.userId || !payload.paymentId) {
        throw new Error("Missing required fields: userId and paymentId are required")
      }

      if (payload.amountUsd < 7) {
        throw new Error("Amount must be at least $7")
      }

      // Calculate tokens if not provided
      if (!payload.tokensAmount) {
        payload.tokensAmount = Math.floor(payload.amountUsd / 0.02)
      }

      // Add timestamp if not provided
      if (!payload.timestamp) {
        payload.timestamp = new Date().toISOString()
      }

      const body = JSON.stringify(payload)
      const signature = this.generateSignature(body)

      console.log("[Presale Webhook] Sending to:", this.webhookUrl)
      console.log("[Presale Webhook] Payload:", payload)

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": signature,
        },
        body,
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[Presale Webhook] Failed:", result)
        return { success: false, error: result.error || "Webhook failed" }
      }

      console.log("[Presale Webhook] Success:", result)
      return { success: true }
    } catch (error) {
      console.error("[Presale Webhook] Error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}

// Usage example for payment app:
// const client = new PresaleWebhookClient(
//   process.env.OBLIUM_WEBHOOK_URL || 'https://obliumtoken.com/api/webhooks/presale',
//   process.env.WEBHOOK_SECRET!
// );
//
// await client.notifyPresalePurchase({
//   userId: 'user-uuid',
//   amountUsd: 50,
//   tokensAmount: 2500,
//   paymentId: 'presale_20250116_123456',
//   status: 'completed',
//   amountSol: 0.15,
//   transactionHash: 'solana-tx-hash'
// });
