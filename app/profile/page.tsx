"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { CubeLoader } from "@/components/ui/cube-loader"
import { ConversionCountdown } from "@/components/conversion-countdown"
import { useLanguage } from "@/lib/language-context"
import { AvatarSelector } from "@/components/avatar-selector"

interface UserProfile {
  nickname: string
  created_at: string
  wallet_address: string | null
  referral_code: string
  points: number
  task_completion_bonus_awarded: boolean
  avatar_url?: string
}

interface UserStats {
  totalPoints: number
  oblTokens: number
  referralCount: number
  rank: number
  totalUsers: number
}

interface ConversionRecord {
  id: string
  points_converted: number
  obl_tokens_received: number
  status: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [conversions, setConversions] = useState<ConversionRecord[]>([])
  const [referralCopied, setReferralCopied] = useState(false)
  const [referralLinkCopied, setReferralLinkCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  const [showPointsNotification, setShowPointsNotification] = useState(false)
  const [pointsAwarded, setPointsAwarded] = useState(0)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()

      try {
        console.log("[v0] Loading profile data...")

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("[v0] Auth error:", userError)
          setError(`Auth error: ${userError.message}`)
          router.push("/auth")
          return
        }

        if (!user) {
          console.log("[v0] No user found, redirecting to auth")
          setError("No user found")
          router.push("/auth")
          return
        }

        console.log("[v0] User authenticated:", user.id)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nickname, created_at, wallet_address, referral_code, points, task_completion_bonus_awarded, avatar_url")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("[v0] Profile query error:", profileError)
          setError(`Profile error: ${profileError.message}`)
          setIsLoading(false)
          return
        }

        if (!profileData) {
          console.error("[v0] No profile data returned")
          setError("No profile data found for user")
          setIsLoading(false)
          return
        }

        console.log("[v0] Profile data loaded:", profileData)

        if (profileData) {
          setProfile(profileData as UserProfile)

          const oblTokens = profileData.task_completion_bonus_awarded ? 200 : 0

          const { count: referralCount, error: referralError } = await supabase
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("referrer_id", user.id)

          if (referralError) {
            console.error("[v0] Referral count error:", referralError)
          }

          console.log("[v0] Referral count:", referralCount)

          const { data: allUsers, error: usersError } = await supabase
            .from("profiles")
            .select("id, points")
            .order("points", { ascending: false })

          if (usersError) {
            console.error("[v0] Users query error:", usersError)
          }

          let userRank = 0
          const totalUsers = allUsers?.length || 0

          if (allUsers) {
            userRank = allUsers.findIndex((u) => u.id === user.id) + 1
          }

          console.log("[v0] User rank:", userRank, "of", totalUsers)

          setStats({
            totalPoints: profileData.points || 0,
            oblTokens,
            referralCount: referralCount || 0,
            rank: userRank,
            totalUsers,
          })

          const { data: conversionData, error: conversionError } = await supabase
            .from("conversion_history")
            .select("id, points_converted, obl_tokens_received, status, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)

          if (conversionError) {
            console.error("[v0] Conversion history error:", conversionError)
          }

          setConversions(conversionData || [])
        }
      } catch (error) {
        console.error("[v0] Unexpected error loading profile:", error)
        setError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const copyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code)
      setReferralCopied(true)
      setTimeout(() => setReferralCopied(false), 2000)
    }
  }

  const copyReferralLink = () => {
    if (profile?.referral_code && typeof window !== "undefined") {
      const referralLink = `${window.location.origin}/?ref=${profile.referral_code}`
      navigator.clipboard.writeText(referralLink)
      setReferralLinkCopied(true)
      setTimeout(() => setReferralLinkCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/welcome")
  }

  const handleAvatarUpdated = (avatarUrl: string, points: number) => {
    // Update local profile state
    if (profile) {
      setProfile({ ...profile, avatar_url: avatarUrl } as any)
    }

    // Show points notification if points were awarded
    if (points > 0) {
      setPointsAwarded(points)
      setShowPointsNotification(true)
      setTimeout(() => setShowPointsNotification(false), 5000)

      // Update stats
      if (stats) {
        setStats({ ...stats, totalPoints: stats.totalPoints + points })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <CubeLoader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
        <BackgroundAnimation />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
          <LiquidCard className="p-8 text-center">
            <h2 className="text-2xl font-display font-bold text-destructive mb-4">Error Loading Profile</h2>
            <p className="text-foreground/80 mb-4">{error}</p>
            <p className="text-sm text-foreground/60 mb-6">
              Please check the browser console for more details or try refreshing the page.
            </p>
            <GlowButton onClick={() => router.push("/dashboard")} variant="primary">
              Go to Dashboard
            </GlowButton>
          </LiquidCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      {showPointsNotification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="glass-card p-4 flex items-center gap-3 shadow-xl border-2 border-success">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-display font-bold text-success">
                +{pointsAwarded.toLocaleString()} Points!
              </div>
              <div className="text-xs text-foreground/60">Avatar selected successfully</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-8 space-y-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-display font-bold text-primary mb-2" style={{ fontSize: 'var(--text-xl)' }}>{t("profileTitle")}</h1>
          <p className="text-foreground/60" style={{ fontSize: 'var(--text-sm)' }}>{t("profileSubtitle")}</p>
        </div>

        <ConversionCountdown />

        <div className="glass-card p-8 text-center animate-fade-in-up stagger-1">
          <AvatarSelector
            currentAvatarUrl={(profile as any)?.avatar_url}
            userId={profile?.id || ""}
            nickname={profile?.nickname || "User"}
            onAvatarUpdated={handleAvatarUpdated}
          />

          <h2 className="text-3xl font-display font-bold text-foreground mb-3">{profile?.nickname || "Miner"}</h2>
          {profile?.created_at && (
            <p className="text-foreground/60">
              {t("joined")}{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          <div className="mt-6">
            <GlowButton onClick={handleLogout} className="w-full max-w-xs mx-auto" variant="destructive">
              Logout
            </GlowButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up stagger-2">
          <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-foreground/60 text-sm mb-2" style={{ fontSize: 'var(--text-sm)' }}>{t("totalPointsLabel")}</div>
            <div className="font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontSize: 'var(--text-lg)' }}>
              {stats?.totalPoints.toLocaleString() || "0"}
            </div>
          </div>

          <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-foreground/60 text-sm mb-2" style={{ fontSize: 'var(--text-sm)' }}>{t("oblmTokensLabel")}</div>
            <div className="font-display font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent" style={{ fontSize: 'var(--text-lg)' }}>
              {stats?.oblTokens || "0"}
            </div>
          </div>

          <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-foreground/60 text-sm mb-2" style={{ fontSize: 'var(--text-sm)' }}>{t("referralsLabel")}</div>
            <div className="font-display font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent" style={{ fontSize: 'var(--text-lg)' }}>
              {stats?.referralCount || "0"}
            </div>
          </div>

          <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-foreground/60 text-sm mb-2" style={{ fontSize: 'var(--text-sm)' }}>{t("rankLabel")}</div>
            <div className="font-display font-bold bg-gradient-to-r from-success to-accent bg-clip-text text-transparent" style={{ fontSize: 'var(--text-lg)' }}>
              #{stats?.rank || "0"}
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="glass-card p-8 max-w-2xl mx-auto animate-fade-in-up stagger-3">
          <h3 className="text-xl font-display font-bold text-accent mb-6">{t("yourReferralCodeTitle")}</h3>
          <div className="p-4 bg-background/50 border border-accent/30 rounded-lg mb-4">
            <div className="text-xs text-foreground/60 mb-2">{t("shareCodeDesc")}</div>
            <div className="text-lg font-display font-bold text-accent">{profile?.referral_code || "Loading..."}</div>
          </div>

          <div className="space-y-3">
            <GlowButton onClick={copyReferral} className="w-full" variant="accent">
              {referralCopied ? `✓ ${t("copied")}` : t("copyCode")}
            </GlowButton>
            <GlowButton onClick={copyReferralLink} className="w-full" variant="secondary">
              {referralLinkCopied ? "✓ Link Copied!" : "📎 Copy Referral Link"}
            </GlowButton>
          </div>

          <p className="text-xs text-foreground/50 mt-3 text-center">
            Share your link and both of you earn 500 points!
          </p>
        </div>

        <div className="glass-card p-8 animate-fade-in-up stagger-4">
          <h3 className="text-xl font-display font-bold text-success mb-6">{t("conversionHistoryTitle")}</h3>

          {conversions.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              <p>{t("noConversionsYet")}</p>
              <p className="text-sm mt-2">{t("autoConvertInfo")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversions.map((conversion) => (
                <div
                  key={conversion.id}
                  className="flex items-center justify-between p-4 bg-success/5 border border-success/20 rounded-lg hover:border-success/40 transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="font-bold text-foreground">
                      {new Date(conversion.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-sm text-foreground/60">
                      {conversion.points_converted.toLocaleString()} {t("points")} → {conversion.obl_tokens_received}{" "}
                      OBLM
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg font-bold text-sm ${
                      conversion.status === "completed"
                        ? "bg-success/20 text-success"
                        : conversion.status === "pending"
                          ? "bg-foreground/5 text-foreground/60"
                          : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {conversion.status === "completed"
                      ? t("completed")
                      : conversion.status === "pending"
                        ? t("pending")
                        : t("failed")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
