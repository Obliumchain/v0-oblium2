"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

export function PresaleTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const startDate = new Date("2025-11-21T11:00:00Z").getTime()
    const endDate = startDate + 15 * 24 * 60 * 60 * 1000 // 15 days

    const updateTimer = () => {
      const now = new Date().getTime()

      // Only show timer if presale is active
      if (now >= startDate && now < endDate) {
        const distance = endDate - now
        setIsActive(true)

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      } else {
        setIsActive(false)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isActive) return null

  return (
    <div className="glass-card p-6 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-fade-in-up bg-gradient-to-br from-red-500/5 via-orange-500/5 to-background">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/30 rounded-full blur-lg animate-pulse"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">Time remaining until Presale V1 ends</h3>
            <p className="text-foreground/60 text-sm">Limited time to participate</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="text-center">
            <div className="bg-background/50 border border-red-500/30 rounded-lg px-4 py-2 min-w-[60px]">
              <div className="font-display font-black text-2xl bg-gradient-to-br from-red-400 to-orange-400 bg-clip-text text-transparent">
                {timeLeft.days.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="text-xs text-foreground/50 mt-1 font-display">DAYS</div>
          </div>
          <div className="text-center">
            <div className="bg-background/50 border border-red-500/30 rounded-lg px-4 py-2 min-w-[60px]">
              <div className="font-display font-black text-2xl bg-gradient-to-br from-red-400 to-orange-400 bg-clip-text text-transparent">
                {timeLeft.hours.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="text-xs text-foreground/50 mt-1 font-display">HRS</div>
          </div>
          <div className="text-center">
            <div className="bg-background/50 border border-red-500/30 rounded-lg px-4 py-2 min-w-[60px]">
              <div className="font-display font-black text-2xl bg-gradient-to-br from-red-400 to-orange-400 bg-clip-text text-transparent">
                {timeLeft.minutes.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="text-xs text-foreground/50 mt-1 font-display">MIN</div>
          </div>
          <div className="text-center">
            <div className="bg-background/50 border border-red-500/30 rounded-lg px-4 py-2 min-w-[60px]">
              <div className="font-display font-black text-2xl bg-gradient-to-br from-red-400 to-orange-400 bg-clip-text text-transparent">
                {timeLeft.seconds.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="text-xs text-foreground/50 mt-1 font-display">SEC</div>
          </div>
        </div>
      </div>
    </div>
  )
}
