"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { BackgroundAnimation } from "@/components/background-animation"
import { ConversionCountdown } from "@/components/conversion-countdown"
import { PresaleCountdown } from "@/components/presale-countdown"
import { useLanguage } from "@/lib/language-context" // Fixed import path for useLanguage hook

interface UserProfile {
  id: string
  wallet_address: string | null
  points: number
  mining_started_at: string | null
  last_claim_at: string | null
  has_auto_claim: boolean
  referral_code: string
  task_completion_bonus_awarded: boolean
  oblm_token_balance: number
}

interface ActiveBooster {
  id: string
  name: string
  type: string
  expires_at: string
  multiplier_value: number | null
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage() // Use the declared useLanguage variable here
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [nextClaim, setNextClaim] = useState<Date | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [oblm, setOblm] = useState(0)
  const [activeBoosters, setActiveBoosters] = useState<ActiveBooster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)
  const [referralLinkCopied, setReferralLinkCopied] = useState(false)
  const [showWalletNotification, setShowWalletNotification] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  const loadUserData = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profile) return

      setUserProfile(profile)
      setOblm(profile.oblm_token_balance || 0)

      const cachedCount = sessionStorage.getItem(`referral_count_${user.id}`)
      if (cachedCount) {
        setReferralCount(Number.parseInt(cachedCount))
      } else {
        const { count } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referrer_id", user.id)
        const refCount = count || 0
        setReferralCount(refCount)
        sessionStorage.setItem(`referral_count_${user.id}`, refCount.toString())
      }

      if (profile.mining_started_at) {
        const miningStart = new Date(profile.mining_started_at)
        const fourHoursLater = new Date(miningStart.getTime() + 4 * 60 * 60 * 1000)
        const now = new Date()

        setNextClaim(fourHoursLater)
        setCanClaim(now >= fourHoursLater)
      } else {
        const now = new Date()
        const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000)
        setNextClaim(fourHoursLater)
        setCanClaim(false)

        supabase.from("profiles").update({ mining_started_at: now.toISOString() }).eq("id", user.id).then()
      }

      supabase
        .from("user_boosters")
        .select("id, booster_id, expires_at, boosters(name, type, multiplier_value)")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .then(({ data: boosters }) => {
          if (boosters) {
            setActiveBoosters(
              boosters.map((b: any) => ({
                id: b.id,
                name: b.boosters?.name || "Unknown",
                type: b.boosters?.type || "unknown",
                expires_at: b.expires_at,
                multiplier_value: b.boosters?.multiplier_value,
              })),
            )

            const hasAutoClaim = boosters.some(
              (b: any) => b.boosters?.type === "auto_claim" || b.boosters?.type === "combo",
            )
            if (hasAutoClaim !== profile.has_auto_claim) {
              supabase.from("profiles").update({ has_auto_claim: hasAutoClaim }).eq("id", user.id).then()
              setUserProfile((prev) => (prev ? { ...prev, has_auto_claim: hasAutoClaim } : null))
            }
          }
        })

      if (!profile.task_completion_bonus_awarded && profile.points === 0) {
        const hasSeenWelcome = localStorage.getItem(`welcome_shown_${user.id}`)
        if (!hasSeenWelcome) {
          setShowWelcomeModal(true)
          localStorage.setItem(`welcome_shown_${user.id}`, "true")
        }
      }
    } catch (error) {
      console.error("[v0] Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadUserData()

    console.log("[v0] Dashboard URL params:", {
      status: searchParams.get("status"),
      wallet: searchParams.get("wallet"),
      error: searchParams.get("error"),
      allParams: Object.fromEntries(searchParams.entries()),
    })

    const paymentStatus = searchParams.get("status")
    const walletStatus = searchParams.get("wallet")

    if (walletStatus === "connected") {
      console.log("[v0] Wallet connection success detected")
      setShowWalletNotification(true)

      setTimeout(async () => {
        await loadUserData()
        setShowWalletNotification(false)
        router.replace("/dashboard")
      }, 2000)
    } else if (paymentStatus === "success") {
      console.log("[v0] Payment success detected, refreshing booster data in 2 seconds...")
      setShowPaymentSuccess(true)

      setTimeout(async () => {
        await loadUserData()
        setShowPaymentSuccess(false)
        router.replace("/dashboard")
      }, 2000)
    } else if (paymentStatus === "failed") {
      console.log("[v0] Payment failed:", searchParams.get("error"))
    }
  }, [loadUserData, searchParams, router])

  useEffect(() => {
    if (!userProfile || !canClaim || !userProfile.has_auto_claim) return

    const autoClaimPoints = async () => {
      await handleClaim()
    }

    autoClaimPoints()
  }, [canClaim, userProfile])

  const handleClaim = async () => {
    if (!userProfile || !canClaim || isClaiming) return

    setIsClaiming(true)
    try {
      const supabase = createClient()

      let basePoints = 4000

      const multiplierBooster = activeBoosters
        .filter((b) => {
          // Only consider multiplier or combo boosters
          const isMultiplierType = b.type === "multiplier" || b.type === "combo"
          // Must have a valid multiplier value greater than 1
          const hasValidMultiplier = b.multiplier_value && b.multiplier_value > 1
          // Must not be expired
          const notExpired = new Date(b.expires_at) > new Date()

          return isMultiplierType && hasValidMultiplier && notExpired
        })
        .reduce(
          (highest, current) => {
            const currentMultiplier = current.multiplier_value || 1
            const highestMultiplier = highest?.multiplier_value || 1
            return currentMultiplier > highestMultiplier ? current : highest
          },
          null as ActiveBooster | null,
        )

      // Only apply multiplier if user actually has a valid booster
      if (multiplierBooster && multiplierBooster.multiplier_value) {
        basePoints *= multiplierBooster.multiplier_value
      }

      console.log("[v0] Claiming points:", {
        basePoints: 4000,
        multiplier: multiplierBooster?.multiplier_value || 1,
        totalPoints: basePoints,
        boosterName: multiplierBooster?.name || "None",
        hasActiveBooster: !!multiplierBooster,
      })

      const newPoints = userProfile.points + basePoints
      const now = new Date()

      setUserProfile({ ...userProfile, points: newPoints })
      setOblm(userProfile.oblm_token_balance || 0)
      const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000)
      setNextClaim(fourHoursLater)
      setCanClaim(false)

      const { error } = await supabase
        .from("profiles")
        .update({
          points: newPoints,
          mining_started_at: now.toISOString(),
          last_claim_at: now.toISOString(),
        })
        .eq("id", userProfile.id)

      if (error) {
        console.error("[v0] Error updating points:", error)
        setUserProfile(userProfile)
        setOblm(userProfile.oblm_token_balance || 0)
        setCanClaim(true)
      }
    } catch (error) {
      console.error("[v0] Error claiming points:", error)
      setCanClaim(true)
    } finally {
      setIsClaiming(false)
    }
  }

  const handleRefreshBoosters = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: boosters } = await supabase
        .from("user_boosters")
        .select("id, booster_id, expires_at, boosters(name, type, multiplier_value)")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())

      if (boosters) {
        setActiveBoosters(
          boosters.map((b: any) => ({
            id: b.id,
            name: b.boosters?.name || "Unknown",
            type: b.boosters?.type || "unknown",
            expires_at: b.expires_at,
            multiplier_value: b.boosters?.multiplier_value,
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Error refreshing boosters:", error)
    }
  }

  const copyReferral = () => {
    if (userProfile?.referral_code) {
      navigator.clipboard.writeText(userProfile.referral_code)
      setReferralCopied(true)
      setTimeout(() => setReferralCopied(false), 2000)
    }
  }

  const copyReferralLink = () => {
    if (userProfile?.referral_code && typeof window !== "undefined") {
      const referralLink = `${window.location.origin}/?ref=${userProfile.referral_code}`
      navigator.clipboard.writeText(referralLink)
      setReferralLinkCopied(true)
      setTimeout(() => setReferralLinkCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <div className="text-center animate-scale-in">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <div className="text-primary text-lg font-display">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      {showPaymentSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="glass-card p-4 border-success/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-foreground font-bold text-sm mb-1">Payment Successful!</p>
                <p className="text-foreground/70 text-xs">Your booster is now active. Refreshing data...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <LiquidCard className="max-w-lg w-full p-8 text-center border-2 border-primary animate-in zoom-in-95">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-3xl font-display font-bold text-primary mb-4">Welcome to Oblium!</h2>
            <p className="text-lg text-foreground/80 mb-6">
              Complete <span className="font-bold text-accent">ALL tasks</span> to unlock a massive
              <span className="block text-4xl font-display font-bold text-primary my-4">10,000 POINT BONUS!</span>
            </p>
            <p className="text-sm text-foreground/60 mb-6">
              Head to the Tasks page and complete every task to claim your reward. Don't miss out!
            </p>
            <GlowButton onClick={() => setShowWelcomeModal(false)} className="w-full">
              Let's Get Started! 🚀
            </GlowButton>
          </LiquidCard>
        </div>
      )}

      {showWalletNotification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="glass-card p-4 border-success/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <p className="text-foreground font-bold text-sm mb-1">Wallet Connected!</p>
                <p className="text-foreground/70 text-xs">Your wallet has been successfully linked to your account.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in-up">{/* NewsCarousel component would go here */}</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Points */}
          <div className="sm:col-span-2 glass-card p-6 text-center animate-fade-in-up stagger-1 hover:scale-105 transition-transform duration-300">
            <div className="text-foreground/60 text-sm mb-2 font-display" style={{ fontSize: "var(--text-sm)" }}>
              {t("totalPoints")}
            </div>
            <div
              className="font-display font-black text-primary mb-2 animate-float"
              style={{ fontSize: "var(--text-xl)" }}
            >
              {userProfile?.points.toLocaleString() || 0}
            </div>
            <div className="h-1 bg-gradient-to-r from-primary to-accent rounded-full mt-4" />
          </div>

          {/* OBLM Tokens */}
          <div className="glass-card p-6 text-center animate-fade-in-up stagger-2 hover:scale-105 transition-transform duration-300">
            <div className="text-foreground/60 text-sm mb-2 font-display" style={{ fontSize: "var(--text-sm)" }}>
              {t("oblmTokens")}
            </div>
            <div className="font-display font-bold text-accent animate-float" style={{ fontSize: "var(--text-xl)" }}>
              {oblm}
            </div>
            <div className="h-1 bg-gradient-to-r from-accent to-primary rounded-full mt-4" />
          </div>

          {/* Boosters */}
          <div
            className="glass-card p-6 text-center animate-fade-in-up stagger-3 hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => router.push("/booster")}
          >
            <div className="text-foreground/60 text-sm mb-2 font-display" style={{ fontSize: "var(--text-sm)" }}>
              Boosters Available
            </div>
            <div className="font-display font-black text-secondary mb-2" style={{ fontSize: "var(--text-lg)" }}>
              Starting at
            </div>
            <div className="font-display font-bold text-primary" style={{ fontSize: "var(--text-lg)" }}>
              0.035 SOL
            </div>
            <div className="h-1 bg-gradient-to-r from-secondary to-primary rounded-full mt-4" />
            <div className="mt-4 text-xs text-foreground/60">Click to browse all boosters</div>
          </div>

          {/* Wallet Connect Tile */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-panel-strong p-8 animate-fade-in-up stagger-5">
            <h2 className="font-display font-bold text-primary mb-6" style={{ fontSize: "var(--text-lg)" }}>
              {t("miningPanel")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-foreground/60 text-sm mb-4">{canClaim ? t("readyToClaim") : t("nextClaimIn")}</div>
                {nextClaim && !canClaim && <CountdownTimer targetTime={nextClaim} />}
                {canClaim && (
                  <div className="text-3xl font-display font-bold text-success animate-pulse">{t("ready")} ⚡</div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <GlowButton onClick={handleClaim} className="w-full" disabled={!canClaim || isClaiming}>
                {isClaiming ? t("claiming") : canClaim ? `⚡ ${t("claimPoints")}` : `⏱ ${t("miningInProgress")}`}
              </GlowButton>
              {userProfile?.has_auto_claim && (
                <p className="text-xs text-center text-success mt-2">{t("autoClaimEnabled")}</p>
              )}
            </div>
          </div>

          <div className="glass-panel-strong p-8 animate-fade-in-up stagger-6">
            <h2 className="font-display font-bold text-success mb-6" style={{ fontSize: "var(--text-base)" }}>
              ⚡ {t("activeBoosters")}
            </h2>

            {activeBoosters.length > 0 ? (
              <div className="space-y-3">
                {activeBoosters.map((booster) => (
                  <div key={booster.id} className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground font-bold text-sm">{booster.name}</span>
                      {booster.multiplier_value && booster.multiplier_value > 1 && (
                        <span className="px-2 py-1 bg-success text-background text-xs font-bold rounded">
                          {booster.multiplier_value}x
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground/60">
                      Expires: {new Date(booster.expires_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-success font-bold mt-1">✓ ACTIVE</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💤</div>
                <p className="text-foreground/60 text-sm mb-4">{t("noActiveBoosters")}</p>
                <p className="text-xs text-foreground/40">Visit the Booster page to purchase boosters!</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="animate-fade-in-up stagger-7">
            <PresaleCountdown />
          </div>

          <div className="animate-fade-in-up stagger-8">
            <ConversionCountdown />
          </div>
        </div>

        {/* Referral Section */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/30 backdrop-blur-sm shadow-xl">
          <h2 className="font-display font-bold text-accent mb-6" style={{ fontSize: "var(--text-base)" }}>
            {t("referFriends")}
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <p className="text-foreground/60 text-sm mb-4">{t("referFriendsDesc")}</p>
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="text-xs text-foreground/60 mb-2">{t("yourReferralCode")}</div>
                <div className="text-2xl font-display font-bold text-accent">
                  {userProfile?.referral_code || "Loading..."}
                </div>
                <div className="text-xs text-foreground/60 mt-2">Earn 500 points per referral!</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
              <GlowButton onClick={copyReferral} className="w-full md:w-auto" variant="accent">
                {referralCopied ? `✓ ${t("copied")}` : t("copyCode")}
              </GlowButton>
              <GlowButton onClick={copyReferralLink} className="w-full md:w-auto" variant="secondary">
                {referralLinkCopied ? "✓ Link Copied!" : "📎 Copy Link"}
              </GlowButton>
            </div>
          </div>
          <p className="text-xs text-foreground/50 mt-4 text-center">
            Share your referral link with friends - it's easier than entering codes!
          </p>
        </div>
      </div>
    </div>
  )
}
