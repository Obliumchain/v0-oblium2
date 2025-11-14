"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { BackgroundAnimation } from "@/components/background-animation"
import { ConversionCountdown } from "@/components/conversion-countdown"
import { useLanguage } from "@/lib/language-context"

interface UserProfile {
  id: string
  wallet_address: string | null
  points: number
  mining_started_at: string | null
  last_claim_at: string | null
  has_auto_claim: boolean
  referral_code: string
  task_completion_bonus_awarded: boolean
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
  const { t } = useLanguage()
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
      setOblm(profile.task_completion_bonus_awarded ? 200 : 0)

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
    
    const paymentStatus = searchParams.get('status')
    if (paymentStatus === 'success') {
      console.log('[v0] Payment success detected, refreshing booster data in 2 seconds...')
      setShowPaymentSuccess(true)
      
      setTimeout(async () => {
        await loadUserData() // Full reload including boosters
        setShowPaymentSuccess(false)
        router.replace('/dashboard')
      }, 2000)
    } else if (paymentStatus === 'failed') {
      console.log('[v0] Payment failed:', searchParams.get('error'))
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
        .filter((b) => b.type === "multiplier" || b.type === "combo")
        .reduce(
          (highest, current) => {
            const currentMultiplier = current.multiplier_value || 1
            const highestMultiplier = highest?.multiplier_value || 1
            return currentMultiplier > highestMultiplier ? current : highest
          },
          null as ActiveBooster | null,
        )

      if (multiplierBooster && multiplierBooster.multiplier_value) {
        basePoints *= multiplierBooster.multiplier_value
      }

      console.log("[v0] Claiming points:", {
        basePoints: 4000,
        multiplier: multiplierBooster?.multiplier_value || 1,
        totalPoints: basePoints,
        boosterName: multiplierBooster?.name || "None",
      })

      const newPoints = userProfile.points + basePoints
      const now = new Date()

      setUserProfile({ ...userProfile, points: newPoints })
      setOblm(userProfile.task_completion_bonus_awarded ? 200 : 0)
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
        setOblm(userProfile.task_completion_bonus_awarded ? 200 : 0)
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

  const handleWalletConnect = async (wallet: any) => {
    const supabase = createClient()
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userProfile?.id).single()

    if (profile) {
      setUserProfile(profile)
      setOblm(profile.task_completion_bonus_awarded ? 200 : 0)
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
        <div className="text-primary text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      {showPaymentSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <LiquidCard className="p-4 bg-success/20 border-success/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-foreground font-bold text-sm mb-1">Payment Successful!</p>
                <p className="text-foreground/70 text-xs">Your booster is now active. Refreshing data...</p>
              </div>
            </div>
          </LiquidCard>
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <LiquidCard className="p-4 bg-yellow-500/20 border-yellow-500/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-foreground font-bold text-sm mb-1">{t("walletRequired")}</p>
                <p className="text-foreground/70 text-xs">{t("walletRequiredDesc")}</p>
              </div>
            </div>
          </LiquidCard>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <LiquidCard className="p-8 text-center">
            <div className="text-foreground/60 text-sm mb-2">{t("totalPoints")}</div>
            <div className="text-5xl font-display font-black text-primary mb-2">
              {userProfile?.points.toLocaleString() || 0}
            </div>
            <div className="h-1 bg-gradient-to-r from-primary to-accent rounded-full mt-4" />
          </LiquidCard>

          <LiquidCard className="p-8 text-center">
            <div className="text-foreground/60 text-sm mb-2">{t("oblmTokens")}</div>
            <div className="text-5xl font-display font-bold text-accent">{oblm}</div>
            <div className="h-1 bg-gradient-to-r from-accent to-primary rounded-full mt-4" />
          </LiquidCard>

          <LiquidCard className="p-8 text-center">
            <div className="text-foreground/60 text-sm mb-2">{t("conversionStatus")}</div>
            <div className="text-lg font-display font-bold text-success mb-4">{t("active")}</div>
            <div className="text-xs text-foreground/60">{t("autoConvert")}</div>
          </LiquidCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <LiquidCard className="lg:col-span-2 p-8">
            <h2 className="text-2xl font-display font-bold text-primary mb-6">{t("miningPanel")}</h2>

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
          </LiquidCard>

          <LiquidCard className="p-8">
            <h2 className="text-xl font-display font-bold text-success mb-6">⚡ {t("activeBoosters")}</h2>

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
          </LiquidCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <LiquidCard 
            className="p-8 text-center cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => router.push('/booster')}
          >
            <div className="text-foreground/60 text-sm mb-2">Boosters Available</div>
            <div className="text-5xl font-display font-black text-secondary mb-2">
              Starting at
            </div>
            <div className="text-3xl font-display font-bold text-primary">0.035 SOL</div>
            <div className="h-1 bg-gradient-to-r from-secondary to-primary rounded-full mt-4" />
            <div className="mt-4 text-xs text-foreground/60">
              Click to browse all boosters
            </div>
          </LiquidCard>

          <LiquidCard className="p-8 text-center md:col-span-2">
            <div className="text-foreground/60 text-sm mb-2">{t("conversionStatus")}</div>
            <div className="text-lg font-display font-bold text-success mb-4">{t("active")}</div>
            <div className="text-xs text-foreground/60">{t("autoConvert")}</div>
          </LiquidCard>
        </div>

        <div className="mb-8">
          <ConversionCountdown />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiquidCard className="p-8">
            <h2 className="text-xl font-display font-bold text-accent mb-6">{t("referFriends")}</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <p className="text-foreground/60 text-sm mb-4">{t("referFriendsDesc")}</p>
                <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                  <div className="text-xs text-foreground/60 mb-2">{t("yourReferralCode")}</div>
                  <div className="text-2xl font-display font-bold text-accent">
                    {userProfile?.referral_code || "Loading..."}
                  </div>
                  <div className="text-xs text-foreground/60 mt-2">
                    {referralCount} {referralCount === 1 ? "friend" : "friends"} referred · Earn 500 points per referral!
                  </div>
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
          </LiquidCard>
        </div>
      </div>
    </div>
  )
}
