import crypto from "crypto"

interface WebhookPayload {
  userId: string
  boosterId: string
  paymentId: string
  transactionHash?: string
  amountSol: number
  status: "completed" | "success"
  timestamp?: string
}

export class ObliumWebhookClient {
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
   * Send payment completion webhook to Oblium
   */
  async notifyPaymentCompleted(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const body = JSON.stringify(payload)
      const signature = this.generateSignature(body)

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
        console.error("Webhook failed:", result)
        return { success: false, error: result.error || "Webhook failed" }
      }

      console.log("Webhook successful:", result)
      return { success: true }
    } catch (error) {
      console.error("Webhook error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}

// Usage example:
// const client = new ObliumWebhookClient(
//   'https://obliumtoken.com/api/webhooks/payment',
//   process.env.WEBHOOK_SECRET!
// );
//
// await client.notifyPaymentCompleted({
//   userId: 'user-uuid',
//   boosterId: 'booster-uuid',
//   paymentId: 'payment-123',
//   transactionHash: 'solana-tx-hash',
//   amountSol: 0.5,
//   status: 'completed'
// });
