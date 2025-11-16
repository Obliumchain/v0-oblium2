import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { signature, userId, amount, tokens } = await request.json()

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Process the purchase
    const { data, error } = await supabase.rpc("process_presale_purchase", {
      p_user_id: userId,
      p_amount_sol: amount,
      p_tokens_received: tokens,
      p_token_price: 0.02,
      p_wallet_tx_hash: signature,
    })

    if (error) {
      console.error("[v0] Presale processing error:", error)
      return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error("[v0] Presale API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
