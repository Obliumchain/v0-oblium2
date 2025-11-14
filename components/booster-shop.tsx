"use client"

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { createClient } from "@/lib/supabase/client"
import { GlowButton } from "@/components/ui/glow-button"
import { redirectToPaymentApp } from "@/lib/payment-redirect"
import { useLanguage } from "@/lib/language-context"

interface Booster {
  id: string
  name: string
  description: string
  type: string
  multiplier_value: number
  duration_hours: number
  price_sol: number
}

interface BoosterShopProps {
  walletAddress?: string | null
  userId?: string
  onPurchaseSuccess?: () => void
}

export function BoosterShop({ walletAddress, userId, onPurchaseSuccess }: BoosterShopProps) {
  const [boosters, setBoosters] = useState<Booster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()
  const { publicKey, sendTransaction, connected } = useWallet()
  const { connection } = useConnection()

  useEffect(() => {
    const loadBoosters = async () => {
      try {
        console.log("[v0] Loading boosters from database...")
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from("boosters")
          .select("*")
          .eq("active", true)
          .order("price_sol", { ascending: true })

        if (fetchError) {
          console.error("[v0] Error fetching boosters:", fetchError)
          throw fetchError
        }

        console.log("[v0] Boosters loaded:", data?.length || 0, "items")
        setBoosters(data || [])
      } catch (err) {
        console.error("[v0] Error loading boosters:", err)
        setError("Failed to load boosters")
      } finally {
        setIsLoading(false)
      }
    }

    loadBoosters()
  }, [])

  const handlePurchaseBooster = async (booster: Booster) => {
    if (!userId) {
      setError("User not authenticated")
      return
    }

    setIsRedirecting(booster.id)
    setError(null)

    try {
      console.log("[v0] Redirecting to payment app for booster:", booster.name)
      
      // Redirect to external payment application
      redirectToPaymentApp({
        userId,
        boosterId: booster.id,
        amount: booster.price_sol,
        boosterName: booster.name,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to redirect to payment"
      console.error("[v0] Redirect error:", err)
      setError(message)
      setIsRedirecting(null)
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('status')
    const paymentError = urlParams.get('error')

    if (paymentStatus === 'success') {
      console.log("[v0] Payment successful, refreshing data...")
      onPurchaseSuccess?.()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'failed' && paymentError) {
      setError(decodeURIComponent(paymentError))
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [onPurchaseSuccess])

  if (isLoading) {
    return <div className="text-foreground/60 font-display">{t("loadingBoosters")}</div>
  }

  if (boosters.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">💤</div>
        <p className="text-foreground/60 mb-4 font-display">{t("noBoostersAvailable")}</p>
        <p className="text-xs text-foreground/40">{t("boostersWillAppear")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/10 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm text-red-400 font-display">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {boosters.map((booster, index) => {
          // Create mosaic pattern - some cards span 2 columns
          const isFeatured = index % 5 === 0 && index !== 0
          const colSpan = isFeatured ? "col-span-2" : "col-span-1"
          
          return (
            <div 
              key={booster.id} 
              className={`${colSpan} glass-card p-6 flex flex-col hover:scale-105 transition-all duration-300 animate-fade-in-up stagger-${(index % 5) + 1}`}
            >
              <div className="flex-grow mb-6">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="font-display font-bold text-foreground flex-1" style={{ fontSize: 'var(--text-base)' }}>
                    {booster.name}
                  </h3>
                  {booster.multiplier_value > 1 && (
                    <span className="px-3 py-1 bg-gradient-to-r from-primary to-accent text-background text-xs font-display font-bold rounded-full shadow-lg flex-shrink-0">
                      {booster.multiplier_value}x
                    </span>
                  )}
                </div>
                <p className="text-foreground/60 mb-4" style={{ fontSize: 'var(--text-sm)' }}>
                  {booster.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">⏱</span>
                    <span className="text-foreground/70" style={{ fontSize: 'var(--text-xs)' }}>
                      {t("duration")}: {booster.duration_hours}h ({Math.round(booster.duration_hours / 24)}d)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-accent">✨</span>
                    <span className="text-foreground/70" style={{ fontSize: 'var(--text-xs)' }}>
                      {t("type")}: {booster.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-baseline justify-between">
                  <span className="text-foreground/60 font-display" style={{ fontSize: 'var(--text-sm)' }}>
                    {t("price")}
                  </span>
                  <span className="font-display font-bold text-primary" style={{ fontSize: 'var(--text-lg)' }}>
                    {booster.price_sol} SOL
                  </span>
                </div>

                <GlowButton
                  onClick={() => handlePurchaseBooster(booster)}
                  disabled={isRedirecting === booster.id}
                  className="w-full"
                >
                  {isRedirecting === booster.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Loading Secure Payment Gateway...
                    </span>
                  ) : (
                    t("buyNow")
                  )}
                </GlowButton>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
