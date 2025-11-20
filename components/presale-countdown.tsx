"use client"

import { useState, useEffect } from "react"
import { Flame, Clock } from "lucide-react"

export function PresaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const targetDate = new Date("2025-11-21T11:00:00Z").getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center relative group">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative glass-panel-strong p-4 md:p-6 min-w-[80px] md:min-w-[100px] text-center border-2 border-cyan-500/30 rounded-2xl">
          <div className="font-display font-black text-3xl md:text-5xl bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            {value.toString().padStart(2, "0")}
          </div>
        </div>
      </div>
      <div className="text-xs md:text-sm text-foreground/60 uppercase tracking-widest font-display mt-3 font-bold">
        {label}
      </div>
    </div>
  )

  return (
    <div className="relative overflow-hidden glass-border-animated rounded-3xl">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />

      <div className="relative glass-inner p-6 md:p-8">
        {/* Header with flame icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30 mb-4">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className="text-orange-400 font-bold text-sm font-display uppercase tracking-wider">
              PRESALE COMING SOON
            </span>
          </div>

          <h2 className="font-display font-black text-2xl md:text-3xl mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            🔥 OBLM Presale Countdown
          </h2>
          <p className="text-foreground/70 text-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Presale starts November 21, 2025 at 11:00 UTC
          </p>
        </div>

        {/* Countdown timer */}
        <div className="flex justify-center gap-4 md:gap-8 mb-6">
          <TimeUnit value={timeLeft.days} label="Days" />
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Mins" />
          <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>

        {/* Bottom message */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full border border-cyan-500/20">
            <span className="text-cyan-400 text-sm font-bold">⚡</span>
            <p className="text-sm text-foreground/70 font-medium">
              Be ready for launch! Early participants get exclusive bonuses.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
