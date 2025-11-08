import { type NextRequest, NextResponse } from "next/server"

const SYNDICA_RPC_URL =
  "https://solana-mainnet.api.syndica.io/api-key/3jYbtdrZaCmGbJjTruQKQsd7Uq5EkM184Lv51J3CR1kh9SHcF6bNBFeKqf1qHvng869qRCpJEZm5Zwph9iBJkVxAcvReYcuaipP"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward the RPC request to Syndica
    const response = await fetch(SYNDICA_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("RPC proxy error:", error)
    return NextResponse.json({ error: "Failed to process RPC request" }, { status: 500 })
  }
}
