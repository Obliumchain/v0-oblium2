import { NextResponse } from "next/server"
import { getSolanaPrice } from "@/lib/solana-price"

// API endpoint to get current SOL price
export async function GET() {
  try {
    const solPrice = await getSolanaPrice()

    return NextResponse.json({
      price: solPrice,
      currency: "USD",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Price API error:", error)
    return NextResponse.json({ error: "Failed to fetch SOL price" }, { status: 500 })
  }
}
