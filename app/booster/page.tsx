"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { BackgroundAnimation } from "@/components/background-animation"
import { BoosterShop } from "@/components/booster-shop"
import { LiquidCard } from "@/components/ui/liquid-card"
import { useLanguage } from "@/lib/language-context"

export default function ShopPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadUser = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      setUserId(user.id)
    } catch (error) {
      console.error("[v0] Error loading user:", error)
      router.push("/auth")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handlePurchaseSuccess = () => {
    console.log("[v0] Purchase successful, refreshing shop...")
    setRefreshKey((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <div className="text-primary text-lg">Loading shop...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-display font-bold text-primary mb-4" style={{ fontSize: 'var(--text-xl)' }}>
            {t("boosterShop")}
          </h1>
          <p className="text-foreground/60" style={{ fontSize: 'var(--text-base)' }}>
            Enhance your mining rewards with powerful boosters. Choose from various multipliers and durations.
          </p>
        </div>

        <div className="glass-card p-8 mb-8 animate-fade-in-up stagger-1">
          <div className="mb-6">
            <h2 className="font-display font-bold text-primary mb-2" style={{ fontSize: 'var(--text-lg)' }}>Available Boosters</h2>
            <p className="text-foreground/60" style={{ fontSize: 'var(--text-sm)' }}>
              Purchase boosters to increase your mining rewards. All payments are processed securely through Solana.
            </p>
          </div>

          <BoosterShop
            userId={userId || undefined}
            onPurchaseSuccess={handlePurchaseSuccess}
            key={refreshKey}
          />
        </div>

        <div className="glass-card p-6 bg-primary/5 border-primary/20 animate-fade-in-up stagger-2">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-display font-bold text-foreground mb-2">How Boosters Work</h3>
              <ul className="text-sm text-foreground/70 space-y-2">
                <li>• <strong>Multipliers:</strong> Increase your mining rewards by 2x, 5x, or 10x</li>
                <li>• <strong>Auto-Claim:</strong> Automatically collect rewards every 4 hours</li>
                <li>• <strong>Combo Boosters:</strong> Get both multiplier and auto-claim benefits</li>
                <li>• <strong>Duration:</strong> Boosters are active for 1 to 30 days depending on your choice</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
