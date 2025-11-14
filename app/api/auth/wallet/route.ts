import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import nacl from "tweetnacl"
import { PublicKey } from "@solana/web3.js"
import bs58 from "bs58"

export async function POST(request: Request) {
  try {
    const { walletAddress, signature, message } = await request.json()

    console.log("[v0] Wallet auth request:", { walletAddress })

    if (!walletAddress || !signature || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the signature
    try {
      const publicKey = new PublicKey(walletAddress)
      const messageBytes = new TextEncoder().encode(message)
      const signatureBytes = bs58.decode(signature)

      const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes())

      if (!verified) {
        console.log("[v0] Signature verification failed")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }

      console.log("[v0] Signature verified successfully")
    } catch (err) {
      console.error("[v0] Signature verification error:", err)
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 })
    }

    const supabase = await createClient()

    // Check if user with this wallet already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, wallet_address, nickname")
      .eq("wallet_address", walletAddress)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[v0] Profile lookup error:", profileError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    let userId: string

    if (existingProfile) {
      // User exists - sign them in
      console.log("[v0] Existing user found:", existingProfile.id)
      userId = existingProfile.id

      // Create a session for this user using admin auth
      const virtualEmail = `${walletAddress}@wallet.oblium.com`
      
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: virtualEmail,
      })

      if (sessionError) {
        console.error("[v0] Session creation error:", sessionError)
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          wallet_address: walletAddress,
          nickname: existingProfile.nickname,
        },
        isNewUser: false,
      })
    } else {
      // New user - create account
      console.log("[v0] Creating new wallet user")

      // Create auth user with virtual email
      const virtualEmail = `${walletAddress}@wallet.oblium.com`
      const randomPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: virtualEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          wallet_address: walletAddress,
          auth_type: "wallet",
        },
      })

      if (authError) {
        console.error("[v0] User creation error:", authError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      userId = authData.user.id
      console.log("[v0] Created new user:", userId)

      // Create profile with wallet
      const nickname = `Miner${walletAddress.slice(0, 6)}`

      const { error: profileInsertError } = await supabase.from("profiles").insert({
        id: userId,
        wallet_address: walletAddress,
        wallet_type: "phantom",
        wallet_connected_at: new Date().toISOString(),
        nickname,
        points: 500, // Welcome bonus
        mining_started_at: new Date().toISOString(),
      })

      if (profileInsertError) {
        console.error("[v0] Profile creation error:", profileInsertError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          wallet_address: walletAddress,
          nickname,
        },
        isNewUser: true,
      })
    }
  } catch (error) {
    console.error("[v0] Wallet auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
