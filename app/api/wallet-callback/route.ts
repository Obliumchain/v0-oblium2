import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const success = searchParams.get("success")
  const userId = searchParams.get("userId")

  console.log("[v0] Wallet callback received:", { success, userId })

  const redirectUrl = new URL("/ghjkloiuyt", request.url)
  redirectUrl.searchParams.set("wallet", success === "true" ? "connected" : "failed")

  return NextResponse.redirect(redirectUrl)
}
