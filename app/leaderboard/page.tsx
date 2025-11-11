"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { BackgroundAnimation } from "@/components/background-animation"
import { useLanguage } from "@/lib/language-context"
import { Trophy, Medal, Award } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  id: string
  nickname: string
  points: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const supabase = createClient()

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
          .select("id, nickname, points")
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
            }
          })

          setLeaderboard(leaderboardData)
          sessionStorage.setItem("leaderboard_cache", JSON.stringify(leaderboardData))
          sessionStorage.setItem("leaderboard_cache_time", Date.now().toString())
        } else {
          setLeaderboard([])
        }
      } catch (error) {
        console.error("Error loading leaderboard:", error)
        setLeaderboard([])
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500" />
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-400" />
    if (rank === 3) return <Award className="w-8 h-8 text-orange-500" />
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <div className="text-primary text-lg">{t("loadingLeaderboard")}</div>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const remaining = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-28">
      <BackgroundAnimation />
      <Navigation />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-display font-bold text-primary mb-2">{t("leaderboardTitle")}</h1>
        </div>

        {top3.length >= 3 && (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center" style={{ width: "30%" }}>
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center border-4 border-background shadow-lg">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-background">
                      {top3[1].nickname[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-400 text-background text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-background">
                    2
                  </div>
                </div>
                <div className="text-sm font-bold text-foreground text-center truncate w-full">{top3[1].nickname}</div>
                <div className="text-xs text-primary font-bold">{top3[1].points} pts</div>
              </div>

              {/* 1st Place - Elevated */}
              <div className="flex flex-col items-center" style={{ width: "35%" }}>
                <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-background shadow-2xl shadow-yellow-500/50">
                    <div className="w-18 h-18 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-background">
                      {top3[0].nickname[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-500 text-background text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-background">
                    1
                  </div>
                </div>
                <div className="text-base font-bold text-foreground text-center truncate w-full">
                  {top3[0].nickname}
                </div>
                <div className="text-sm text-primary font-bold">{top3[0].points} pts</div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center" style={{ width: "30%" }}>
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-4 border-background shadow-lg">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-background">
                      {top3[2].nickname[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-orange-500 text-background text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-background">
                    3
                  </div>
                </div>
                <div className="text-sm font-bold text-foreground text-center truncate w-full">{top3[2].nickname}</div>
                <div className="text-xs text-primary font-bold">{top3[2].points} pts</div>
              </div>
            </div>
          </div>
        )}

        {remaining.length > 0 && (
          <div className="space-y-3">
            {remaining.map((entry) => (
              <div
                key={entry.id}
                className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:border-primary/30 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  {/* Rank number */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-lg font-bold text-foreground/80">{entry.rank}</span>
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-background shadow-lg shadow-primary/30">
                      {entry.nickname[0].toUpperCase()}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-base truncate">{entry.nickname}</div>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <div className="font-display font-bold text-primary text-lg">
                      {entry.points >= 1000 ? `${(entry.points / 1000).toFixed(1)}K` : entry.points}
                    </div>
                    <div className="text-xs text-foreground/60">pts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground/60">{t("noMinersYet")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
