"use client"

import { useState, useEffect } from "react"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { useLanguage } from "@/lib/language-context"

interface WalletVerificationWarningProps {
  userId: string
  accountCreatedAt: string
  hasWallet: boolean
  onConnectClick: () => void
}

export function WalletVerificationWarning({
  userId,
  accountCreatedAt,
  hasWallet,
  onConnectClick,
}: WalletVerificationWarningProps) {
  const { t } = useLanguage()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const createdAt = new Date(accountCreatedAt).getTime()
      const expiryTime = createdAt + 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      const now = Date.now()
      const remaining = expiryTime - now

      if (remaining <= 0) {
        setIsExpired(true)
        setTimeRemaining(0)
      } else {
        setIsExpired(false)
        setTimeRemaining(Math.ceil(remaining / 1000)) // Convert to seconds
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [accountCreatedAt])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  // Don't show if user already has a wallet connected
  if (hasWallet) {
    return null
  }

  return (
    <LiquidCard className="p-6 border-2 border-red-500/50 bg-red-500/5 hover:scale-105 transition-transform duration-300 animate-pulse-slow">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-display font-black text-red-500 text-xl mb-2">
            {isExpired ? "⚠️ ACCOUNT VERIFICATION EXPIRED" : "⚠️ URGENT: VERIFY YOUR ACCOUNT"}
          </h3>

          {isExpired ? (
            <div className="space-y-3">
              <p className="text-foreground/80 text-sm font-semibold">
                Your 24-hour verification period has expired. Your account may be subject to deletion.
              </p>
              <p className="text-foreground/60 text-sm">
                Connect your Phantom wallet immediately to verify your account and prevent deletion.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-foreground/80 text-sm font-semibold">
                This is our human verification system. You MUST connect your Phantom wallet within 24 hours or your
                account will be permanently deleted.
              </p>

              <div className="p-4 bg-black/40 border border-red-500/30 rounded-lg">
                <div className="text-xs text-foreground/60 mb-2 text-center">Time Remaining Before Deletion</div>
                <div className="text-center">
                  <div className="text-3xl font-display font-black text-red-500 animate-pulse">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">💡</span>
                  <div>
                    <p className="text-sm font-bold text-orange-400 mb-1">How to verify:</p>
                    <ol className="text-xs text-foreground/70 space-y-1 list-decimal list-inside">
                      <li>Download Phantom wallet from your app store</li>
                      <li>Create or import your Solana wallet</li>
                      <li>Click "Connect Wallet" below using Phantom browser</li>
                      <li>Receive 10,000 points + 150 OBLM bonus instantly!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          <GlowButton onClick={onConnectClick} className="w-full mt-4" variant="destructive">
            🔗 Connect Phantom Wallet NOW to Verify
          </GlowButton>
        </div>
      </div>
    </LiquidCard>
  )
}
