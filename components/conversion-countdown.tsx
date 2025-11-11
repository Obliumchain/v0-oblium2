"use client"

import { useState, useEffect } from "react"
import { LiquidCard } from "@/components/ui/liquid-card"
import { useLanguage } from "@/lib/language-context"

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function ConversionCountdown() {
  const { t } = useLanguage()
  // December 9, 2025 at 00:00:00 UTC
  const targetDate = new Date("2025-12-09T00:00:00Z")

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        setIsExpired(true)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [])

  if (isExpired) {
    return (
      <LiquidCard className="p-6 bg-gradient-to-br from-success/20 to-accent/20 border-success">
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-display font-bold text-success mb-2">Conversion Day!</h3>
          <p className="text-sm text-foreground/80">Points are being converted to OBLM tokens!</p>
        </div>
      </LiquidCard>
    )
  }

  return (
    <LiquidCard className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/50">
      <div className="text-center mb-4">
        <h3 className="text-lg font-display font-bold text-primary mb-1">Next Token Conversion</h3>
        <p className="text-xs text-foreground/60">December 9, 2025</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="bg-background/50 border border-primary/30 rounded-lg p-3 mb-2">
            <div className="text-3xl font-display font-bold text-primary">{timeRemaining.days}</div>
          </div>
          <div className="text-xs text-foreground/60 font-semibold">DAYS</div>
        </div>

        <div className="text-center">
          <div className="bg-background/50 border border-accent/30 rounded-lg p-3 mb-2">
            <div className="text-3xl font-display font-bold text-accent">{timeRemaining.hours}</div>
          </div>
          <div className="text-xs text-foreground/60 font-semibold">HOURS</div>
        </div>

        <div className="text-center">
          <div className="bg-background/50 border border-secondary/30 rounded-lg p-3 mb-2">
            <div className="text-3xl font-display font-bold text-secondary">{timeRemaining.minutes}</div>
          </div>
          <div className="text-xs text-foreground/60 font-semibold">MINS</div>
        </div>

        <div className="text-center">
          <div className="bg-background/50 border border-success/30 rounded-lg p-3 mb-2">
            <div className="text-3xl font-display font-bold text-success">{timeRemaining.seconds}</div>
          </div>
          <div className="text-xs text-foreground/60 font-semibold">SECS</div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-foreground/50">Your points will automatically convert on this date</p>
      </div>
    </LiquidCard>
  )
}
