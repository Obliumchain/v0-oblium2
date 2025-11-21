"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { BackgroundAnimation } from "@/components/background-animation"
import { useLanguage } from "@/lib/language-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  id: string
  nickname: string
  points: number
  avatar_url?: string | null // Add avatar_url field
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()

  const abbreviateNumber = (num: number, isMobile = false): string => {
    return num.toLocaleString()
  }

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

        const cachedData = sessionStorage.getItem("leaderboard_cache")
        const cacheTime = sessionStorage.getItem("leaderboard_cache_time")

        if (cachedData && cacheTime) {
          const age = Date.now() - Number.parseInt(cacheTime)
          if (age < 30000) {
            setLeaderboard(JSON.parse(cachedData))
            setIsLoading(false)
            return
          }
        }

        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, nickname, points, avatar_url")
          .order("points", { ascending: false })
          .limit(10)

        if (error) throw error

        if (profiles && profiles.length > 0) {
          const leaderboardData = profiles.map((profile, index) => {
            const displayName =
              profile.nickname && profile.nickname.trim() ? profile.nickname : `Miner-${profile.id.substring(0, 6)}`

            return {
              rank: index + 1,
              id: profile.id,
              nickname: displayName,
              points: profile.points || 0,
              avatar_url: profile.avatar_url, // Include avatar_url
            }
          })

          setLeaderboard(leaderboardData)
          sessionStorage.setItem("leaderboard_cache", JSON.stringify(leaderboardData))
          sessionStorage.setItem("leaderboard_cache_time", Date.now().toString())
        } else {
          setLeaderboard([])
        }
      } catch (error) {
        console.error("[v0] Error loading leaderboard:", error)
        setLeaderboard([])
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600"
    if (rank === 2) return "from-gray-300 to-gray-500"
    if (rank === 3) return "from-orange-400 to-orange-600"
    return ""
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <div className="text-primary text-lg font-display">{t("loadingLeaderboard")}</div>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12 text-center animate-fade-in-up">
          <h1 className="font-display font-bold text-primary mb-2" style={{ fontSize: "var(--text-xl)" }}>
            {t("leaderboardTitle")}
          </h1>
          <p className="text-foreground/60" style={{ fontSize: "var(--text-sm)" }}>
            {t("leaderboardSubtitle")}
          </p>
        </div>

        {top3.length >= 3 && (
          <div className="mb-12 animate-fade-in-up stagger-1">
            {/* Mobile Pyramid Layout */}
            <div className="md:hidden flex flex-col items-center gap-4 mb-8">
              {/* First Place - Elevated at top center */}
              <div className="animate-fade-in-up stagger-1 w-full max-w-[280px]">
                <div className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300 border-2 border-primary/30">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-28 h-28 border-4 border-yellow-400 shadow-xl shadow-yellow-400/30">
                      {top3[0]?.avatar_url ? (
                        <AvatarImage src={top3[0].avatar_url || "/placeholder.svg"} alt={top3[0].nickname} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-background text-3xl font-display font-bold">
                          {top3[0]?.nickname[0]?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -top-2 -right-2">
                      <Crown className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-float" />
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${getRankBadgeColor(1)} text-background font-display font-bold mb-3 shadow-lg`}
                  >
                    1
                  </div>

                  <h3 className="font-display font-bold text-primary mb-2" style={{ fontSize: "var(--text-lg)" }}>
                    {top3[0]?.nickname}
                  </h3>

                  <div className="flex items-center justify-center gap-2 text-success">
                    <span className="text-2xl">✨</span>
                    <span className="font-display font-bold" style={{ fontSize: "var(--text-lg)" }}>
                      {abbreviateNumber(top3[0]?.points, true)} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Second and Third Place - Side by side below */}
              <div className="flex gap-4 w-full justify-center">
                {/* Second Place */}
                <div className="animate-fade-in-up stagger-2 flex-1 max-w-[160px]">
                  <div className="glass-card p-4 text-center hover:scale-105 transition-transform duration-300">
                    <div className="relative inline-block mb-3">
                      <Avatar className="w-20 h-20 border-4 border-silver shadow-lg">
                        {top3[1]?.avatar_url ? (
                          <AvatarImage src={top3[1].avatar_url || "/placeholder.svg"} alt={top3[1].nickname} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-500 text-background text-xl font-display font-bold">
                            {top3[1]?.nickname[0]?.toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>

                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${getRankBadgeColor(2)} text-background font-display font-bold mb-2`}
                    >
                      2
                    </div>

                    <h3
                      className="font-display font-bold text-foreground mb-1 truncate"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {top3[1]?.nickname}
                    </h3>

                    <div className="flex flex-col items-center gap-0.5 text-success">
                      <span className="text-base">✨</span>
                      <span className="font-display font-bold" style={{ fontSize: "var(--text-xs)" }}>
                        {abbreviateNumber(top3[1]?.points, true)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Third Place */}
                <div className="animate-fade-in-up stagger-3 flex-1 max-w-[160px]">
                  <div className="glass-card p-4 text-center hover:scale-105 transition-transform duration-300">
                    <div className="relative inline-block mb-3">
                      <Avatar className="w-20 h-20 border-4 border-orange-400 shadow-lg">
                        {top3[2]?.avatar_url ? (
                          <AvatarImage src={top3[2].avatar_url || "/placeholder.svg"} alt={top3[2].nickname} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-background text-xl font-display font-bold">
                            {top3[2]?.nickname[0]?.toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>

                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${getRankBadgeColor(3)} text-background font-display font-bold mb-2`}
                    >
                      3
                    </div>

                    <h3
                      className="font-display font-bold text-foreground mb-1 truncate"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {top3[2]?.nickname}
                    </h3>

                    <div className="flex flex-col items-center gap-0.5 text-success">
                      <span className="text-base">✨</span>
                      <span className="font-display font-bold" style={{ fontSize: "var(--text-xs)" }}>
                        {abbreviateNumber(top3[2]?.points, true)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Podium arrangement */}
            <div className="hidden md:grid grid-cols-3 gap-6 items-end mb-8">
              {/* Second Place */}
              <div className="order-1 animate-fade-in-up stagger-2">
                <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-24 h-24 border-4 border-silver shadow-lg">
                      {top3[1]?.avatar_url ? (
                        <AvatarImage src={top3[1].avatar_url || "/placeholder.svg"} alt={top3[1].nickname} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-500 text-background text-2xl font-display font-bold">
                          {top3[1]?.nickname[0]?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>

                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${getRankBadgeColor(2)} text-background font-display font-bold mb-2`}
                  >
                    2
                  </div>

                  <h3 className="font-display font-bold text-foreground mb-1" style={{ fontSize: "var(--text-base)" }}>
                    {top3[1]?.nickname}
                  </h3>

                  <div className="flex items-center justify-center gap-1 text-success">
                    <span className="text-lg">✨</span>
                    <span className="font-display font-bold" style={{ fontSize: "var(--text-base)" }}>
                      {top3[1]?.points.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* First Place - Larger on desktop */}
              <div className="order-2 animate-fade-in-up stagger-1">
                <div className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300 border-2 border-primary/30">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-32 h-32 border-4 border-yellow-400 shadow-xl shadow-yellow-400/30">
                      {top3[0]?.avatar_url ? (
                        <AvatarImage src={top3[0].avatar_url || "/placeholder.svg"} alt={top3[0].nickname} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-background text-3xl font-display font-bold">
                          {top3[0]?.nickname[0]?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -top-2 -right-2">
                      <Crown className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-float" />
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${getRankBadgeColor(1)} text-background font-display font-bold mb-3 shadow-lg`}
                  >
                    1
                  </div>

                  <h3 className="font-display font-bold text-primary mb-2" style={{ fontSize: "var(--text-lg)" }}>
                    {top3[0]?.nickname}
                  </h3>

                  <div className="flex items-center justify-center gap-2 text-success">
                    <span className="text-2xl">✨</span>
                    <span className="font-display font-bold" style={{ fontSize: "var(--text-lg)" }}>
                      {top3[0]?.points.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Third Place */}
              <div className="order-3 animate-fade-in-up stagger-3">
                <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-24 h-24 border-4 border-orange-400 shadow-lg">
                      {top3[2]?.avatar_url ? (
                        <AvatarImage src={top3[2].avatar_url || "/placeholder.svg"} alt={top3[2].nickname} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-background text-2xl font-display font-bold">
                          {top3[2]?.nickname[0]?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>

                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${getRankBadgeColor(3)} text-background font-display font-bold mb-2`}
                  >
                    3
                  </div>

                  <h3 className="font-display font-bold text-foreground mb-1" style={{ fontSize: "var(--text-base)" }}>
                    {top3[2]?.nickname}
                  </h3>

                  <div className="flex items-center justify-center gap-1 text-success">
                    <span className="text-lg">✨</span>
                    <span className="font-display font-bold" style={{ fontSize: "var(--text-base)" }}>
                      {top3[2]?.points.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="space-y-3 animate-fade-in-up stagger-4">
            {rest.map((entry, index) => {
              const isCurrentUser = entry.id === currentUserId
              return (
                <div
                  key={entry.id}
                  className={`glass-card p-4 transition-all duration-300 hover:scale-[1.02] ${
                    isCurrentUser ? "border-2 border-success bg-success/5" : ""
                  }`}
                  style={{ animationDelay: `${(index + 4) * 0.1}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 text-center">
                        <span
                          className="font-display font-bold text-foreground/60"
                          style={{ fontSize: "var(--text-base)" }}
                        >
                          {entry.rank}
                        </span>
                      </div>

                      <Avatar className="w-12 h-12 border-2 border-foreground/20">
                        {entry.avatar_url ? (
                          <AvatarImage src={entry.avatar_url || "/placeholder.svg"} alt={entry.nickname} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-display font-bold">
                            {entry.nickname[0]?.toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-display font-bold text-foreground truncate"
                          style={{ fontSize: "var(--text-base)" }}
                        >
                          {isCurrentUser ? t("you") || "You" : entry.nickname}
                        </h4>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span
                        className={`font-display font-bold ${isCurrentUser ? "text-success" : "text-primary"}`}
                        style={{ fontSize: "var(--text-base)" }}
                      >
                        {entry.points.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {leaderboard.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-foreground/60 font-display">{t("noMinersYet")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
