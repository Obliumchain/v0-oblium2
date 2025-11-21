"use client"

import { useState, useEffect } from "react"
import { Flame, Clock, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function PresaleCountdown() {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isPresaleLive, setIsPresaleLive] = useState(false)

  useEffect(() => {
    const targetDate = new Date("2025-11-21T11:00:00Z").getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setIsPresaleLive(true)
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

  if (isPresaleLive) {
    return (
      <div
        onClick={() => router.push("/presale")}
        className="relative overflow-hidden glass-border-animated rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20 group"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-cyan-500/10 animate-pulse" />

        <div className="relative glass-inner p-6 md:p-8">
          {/* Header with sparkles icon */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30 mb-4 animate-pulse">
              <Sparkles className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold text-sm font-display uppercase tracking-wider">
                PRESALE IS LIVE
              </span>
            </div>

            <h2 className="font-display font-black text-2xl md:text-3xl mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              🚀 OBLM Presale Now Live!
            </h2>

            {/* Call to action */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-foreground/80 text-base font-medium">Click here to participate in the presale</p>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30 group-hover:border-green-400/50 transition-all">
                <Sparkles className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-400 font-bold">Early participants get exclusive bonuses!</p>
              </div>

              <div className="mt-2 px-4 py-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <p className="text-xs text-cyan-400 font-medium">Tap anywhere on this card to join the presale</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
