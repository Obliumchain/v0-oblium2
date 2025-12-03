"use client"

import { useState, useEffect } from "react"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface WalletConnectTileTimedProps {
  userId: string
  walletAddress: string | null
  onWalletUpdate?: () => void
}

export function WalletConnectTileTimed({ userId, walletAddress, onWalletUpdate }: WalletConnectTileTimedProps) {
  const router = useRouter()
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [canConnect, setCanConnect] = useState(false)

  const getUnlockTime = () => {
    const envUnlockTime = process.env.NEXT_PUBLIC_WALLET_UNLOCK_TIME
    if (!envUnlockTime) {
      return 0 // No restriction if env var not set
    }

    // Try parsing as ISO date first, then as Unix timestamp
    const parsed = Date.parse(envUnlockTime)
    if (!isNaN(parsed)) {
      return parsed
    }

    // Try as Unix timestamp in milliseconds
    const timestamp = Number.parseInt(envUnlockTime, 10)
    if (!isNaN(timestamp)) {
      return timestamp
    }

    return 0 // Default to no restriction if parsing fails
  }

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const unlockTime = getUnlockTime()
      const now = Date.now()
      const remaining = unlockTime - now

      if (remaining <= 0) {
        setCanConnect(true)
        setTimeRemaining(0)
      } else {
        setCanConnect(false)
        setTimeRemaining(Math.ceil(remaining / 1000)) // Convert to seconds
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const handleConnect = () => {
    if (!canConnect && !walletAddress) {
      return
    }

    const walletConnectUrl = process.env.NEXT_PUBLIC_WALLET_CONNECT_APP_URL || "https://connect.obliumtoken.com"
    const returnUrl = `${window.location.origin}${window.location.pathname}?wallet=connected`
    const connectUrl = `${walletConnectUrl}/wallet-connect?userId=${userId}&redirectUrl=${encodeURIComponent(returnUrl)}`
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
            {walletAddress
              ? "Connected"
              : canConnect
                ? "Connect to receive 150 OBLM bonus"
                : "Wallet connection opens soon"}
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
      ) : canConnect ? (
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
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-500"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-display font-bold text-orange-500">Wallet Connection Opens Soon</span>
            </div>
            <p className="text-foreground/60 text-sm mb-3">Wallet connections will be available for all users in:</p>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-orange-500 animate-pulse">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-foreground/60 mt-2">
                Connect your wallet when available to receive 150 OBLM bonus!
              </div>
            </div>
          </div>
          <GlowButton onClick={() => {}} className="w-full" variant="accent" disabled>
            Wallet Connection Locked
          </GlowButton>
        </div>
      )}
    </LiquidCard>
  )
}
