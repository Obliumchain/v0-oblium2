"use client"

import { useState } from "react"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface WalletConnectTileProps {
  userId: string
  walletAddress: string | null
  onWalletUpdate?: () => void
}

export function WalletConnectTile({ userId, walletAddress, onWalletUpdate }: WalletConnectTileProps) {
  const router = useRouter()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleConnect = () => {
    const walletConnectUrl = process.env.NEXT_PUBLIC_WALLET_CONNECT_APP_URL || "https://connect.obliumtoken.com"
    const baseUrl = window.location.origin
    const returnUrl = `${baseUrl}/ghjkloiuyt?wallet=connected`
    const connectUrl = `${walletConnectUrl}/wallet-connect?userId=${userId}&redirectUrl=${encodeURIComponent(returnUrl)}`
    console.log("[v0] Redirecting to wallet connect:", connectUrl)
    window.location.href = connectUrl
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("profiles")
        .update({ wallet_address: null, wallet_connected_at: null, wallet_type: null })
        .eq("id", userId)

      if (error) {
        console.error("[v0] Error disconnecting wallet:", error)
        return
      }

      if (onWalletUpdate) {
        onWalletUpdate()
      }

      router.refresh()
    } catch (error) {
      console.error("[v0] Error disconnecting wallet:", error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <LiquidCard className="p-6 hover:scale-105 transition-transform duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-foreground text-lg">Wallet Connection</h3>
          <p className="text-foreground/60 text-sm">
            {walletAddress ? "Connected" : "Connect to receive 150 OBLM bonus"}
          </p>
        </div>
      </div>

      {walletAddress ? (
        <div className="space-y-3">
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-foreground/60">Wallet Address</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-xs text-success">Connected</span>
              </div>
            </div>
            <div className="font-mono text-sm text-foreground break-all">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <GlowButton onClick={handleConnect} className="w-full" variant="accent">
              Reconnect
            </GlowButton>
            <GlowButton onClick={handleDisconnect} className="w-full" variant="destructive" disabled={isDisconnecting}>
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </GlowButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎁</span>
              <span className="font-display font-bold text-primary">First Connection Bonus</span>
            </div>
            <p className="text-foreground/60 text-sm">
              Connect your wallet now and receive <span className="font-bold text-primary">150 OBLM tokens</span>{" "}
              instantly!
            </p>
          </div>
          <GlowButton onClick={handleConnect} className="w-full" variant="accent">
            Connect Wallet & Claim 150 OBLM
          </GlowButton>
        </div>
      )}
    </LiquidCard>
  )
}
