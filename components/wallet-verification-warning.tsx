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
    <LiquidCard className="p-4 border border-blue-500/30 bg-blue-500/5 hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
            <path d="M12 2v10" />
            <path d="m16 8-4-4-4 4" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-blue-400 text-lg mb-2">{t("claimYourRewards")}</h3>

          <div className="space-y-2">
            <p className="text-foreground/80 text-xs">{t("connectWalletToClaimDesc")}</p>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-foreground/60 mb-1 text-center">{t("timeToClaimRewards")}</div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-blue-400">{formatTime(timeRemaining)}</div>
              </div>
            </div>

            <details className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <summary className="text-xs font-semibold text-cyan-400 cursor-pointer list-none flex items-center gap-2">
                <span>🎁</span>
                <span>{t("howToClaimRewards")}</span>
              </summary>
              <ol className="text-xs text-foreground/70 space-y-0.5 list-decimal list-inside mt-2 pl-2">
                <li>{t("claimStep1")}</li>
                <li>{t("claimStep2")}</li>
                <li>{t("claimStep3")}</li>
                <li>{t("claimStep4")}</li>
              </ol>
            </details>
          </div>

          <GlowButton onClick={onConnectClick} className="w-full mt-3 py-2 text-sm">
            {t("connectWalletToClaim")}
          </GlowButton>
        </div>
      </div>
    </LiquidCard>
  )
}
