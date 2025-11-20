// Solana Price Oracle - Fetches real-time SOL/USD price

export interface PriceData {
  solana: {
    usd: number
    usd_24h_change: number
  }
}

export async function getSolanaPrice(): Promise<number> {
  try {
    // Primary: CoinGecko API (Free, no API key needed)
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true",
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch SOL price from CoinGecko")
    }

    const data: PriceData = await response.json()
    return data.solana.usd
  } catch (error) {
    console.error("[v0] Error fetching SOL price:", error)

    // Fallback: Use a backup API
    try {
      const fallbackResponse = await fetch(
        "https://api.diadata.org/v1/assetQuotation/Solana/0x0000000000000000000000000000000000000000",
      )

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        return fallbackData.Price
      }
    } catch (fallbackError) {
      console.error("[v0] Fallback API also failed:", fallbackError)
    }

    // Last resort: Return a conservative estimate (but log warning)
    console.warn("[v0] Using fallback SOL price of $150 - UPDATE THIS!")
    return 150 // Conservative estimate - should be updated regularly
  }
}

export function calculateSolAmount(usdAmount: number, solPrice: number): number {
  return usdAmount / solPrice
}

export function formatSolAmount(amount: number): string {
  return amount.toFixed(6) // SOL amounts typically shown with 6 decimals
}
