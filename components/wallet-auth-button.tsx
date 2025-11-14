"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { GlowButton } from "@/components/ui/glow-button"
import { useRouter } from 'next/navigation'
import bs58 from "bs58"

interface WalletAuthButtonProps {
  mode?: "auth" | "link"
  onSuccess?: () => void
}

export function WalletAuthButton({ mode = "auth", onSuccess }: WalletAuthButtonProps) {
  const { publicKey, signMessage, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleWalletAuth = async () => {
    try {
      setError(null)
      setSuccess(false)
      setIsLoading(true)

      if (!connected || !publicKey) {
        // Open wallet modal to connect
        setVisible(true)
        setIsLoading(false)
        return
      }

      if (!signMessage) {
        throw new Error("Wallet does not support message signing")
      }

      // Create message to sign
      const message = `Sign this message to ${mode === "link" ? "link your wallet to" : "authenticate with"} Oblium.\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`
      const messageBytes = new TextEncoder().encode(message)

      console.log("[v0] Requesting signature from wallet...")

      // Request signature from wallet
      const signature = await signMessage(messageBytes)
      const signatureBase58 = bs58.encode(signature)

      console.log("[v0] Signature received, authenticating...")

      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature: signatureBase58,
          message,
          mode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      console.log("[v0] Authentication successful:", data)

      if (mode === "link") {
        setSuccess(true)
        if (onSuccess) {
          onSuccess()
        }
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        // Auth mode - redirect to dashboard
        if (data.isNewUser) {
          console.log("[v0] New user created, redirecting to dashboard")
        } else {
          console.log("[v0] Existing user signed in, redirecting to dashboard")
        }
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error("[v0] Wallet auth error:", err)
      if (err.message?.includes("User rejected")) {
        setError("Signature request was rejected. Please try again.")
      } else {
        setError(err.message || `Failed to ${mode === "link" ? "link wallet" : "authenticate"}`)
      }
      // Disconnect on error so user can try again
      disconnect()
    } finally {
      setIsLoading(false)
    }
  }

  if (success && mode === "link") {
    return (
      <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-center">
        <div className="text-success text-xl mb-2">✓</div>
        <p className="text-sm font-bold text-success mb-1">Wallet Linked Successfully!</p>
        <p className="text-xs text-foreground/60">
          You can now sign in using your Solana wallet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <GlowButton onClick={handleWalletAuth} disabled={isLoading} className="w-full">
        {isLoading 
          ? (mode === "link" ? "Linking Wallet..." : "Authenticating...") 
          : connected 
            ? "Sign & Continue" 
            : (mode === "link" ? "Connect & Link Wallet" : "Connect Wallet")}
      </GlowButton>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <p className="text-xs text-center text-foreground/50">
        {mode === "link" 
          ? "Connect your wallet and sign a message to enable wallet-based login."
          : "Sign a message with your wallet to create an account or log in. No password needed!"}
      </p>
    </div>
  )
}
