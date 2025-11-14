import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import nacl from "tweetnacl"
import { PublicKey } from "@solana/web3.js"
import bs58 from "bs58"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { walletAddress, signature, message, mode = "auth" } = await request.json()

    console.log("[v0] Wallet auth request:", { walletAddress, mode })

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

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    if (mode === "link") {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("[v0] Not authenticated for linking. Error:", userError)
        return NextResponse.json({ error: "You must be logged in to link a wallet" }, { status: 401 })
      }

      console.log("[v0] User authenticated for linking:", user.id)

      // Check if wallet is already linked to another account
      const { data: existingWallet, error: walletCheckError } = await supabase
        .from("profiles")
        .select("id, nickname")
        .eq("wallet_address", walletAddress)
        .single()

      if (walletCheckError && walletCheckError.code !== "PGRST116") {
        console.error("[v0] Wallet check error:", walletCheckError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      if (existingWallet && existingWallet.id !== user.id) {
        return NextResponse.json(
          { error: "This wallet is already linked to another account" },
          { status: 400 }
        )
      }

      // Link wallet to current user's profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          wallet_address: walletAddress,
          wallet_type: "phantom",
          wallet_connected_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("[v0] Profile update error:", updateError)
        return NextResponse.json({ error: "Failed to link wallet" }, { status: 500 })
      }

      // Award bonus points if wallet wasn't already connected
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single()

      if (profile && !existingWallet) {
        await supabase
          .from("profiles")
          .update({ points: profile.points + 500 })
          .eq("id", user.id)
      }

      console.log("[v0] Wallet linked successfully to user:", user.id)

      return NextResponse.json({
        success: true,
        message: "Wallet linked successfully",
        bonusAwarded: !existingWallet,
      })
    }

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

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not found")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    let userId: string
    const virtualEmail = `${walletAddress}@wallet.oblium.com`

    if (existingProfile) {
      // User exists - sign them in
      console.log("[v0] Existing user found:", existingProfile.id)
      userId = existingProfile.id

      const { data: { properties }, error: linkError } = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`,
        {
          method: "POST",
          headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "magiclink",
            email: virtualEmail,
          }),
        }
      ).then((r) => r.json())

      if (linkError) {
        console.error("[v0] Magic link generation error:", linkError)
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
      }

      // Extract the tokens from the magic link URL
      const url = new URL(properties.action_link)
      const accessToken = url.searchParams.get("access_token")
      const refreshToken = url.searchParams.get("refresh_token")

      return NextResponse.json({
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
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

      const randomPassword = crypto.randomUUID() + crypto.randomUUID()

      const { data: authData, error: authError } = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: "POST",
          headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: virtualEmail,
            password: randomPassword,
            email_confirm: true,
            user_metadata: {
              wallet_address: walletAddress,
              auth_type: "wallet",
            },
          }),
        }
      ).then((r) => r.json())

      if (authError || !authData.user) {
        console.error("[v0] User creation error:", authError || "No user returned")
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

      const { data: { properties }, error: linkError } = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`,
        {
          method: "POST",
          headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "magiclink",
            email: virtualEmail,
          }),
        }
      ).then((r) => r.json())

      if (linkError) {
        console.error("[v0] Session creation error:", linkError)
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
      }

      const url = new URL(properties.action_link)
      const accessToken = url.searchParams.get("access_token")
      const refreshToken = url.searchParams.get("refresh_token")

      return NextResponse.json({
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
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
