"use client"

import { useState, useEffect } from "react"

export function PresaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const targetDate = new Date('2025-11-21T00:00:00Z').getTime()

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
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="glass-panel-strong p-4 min-w-[70px] text-center mb-2">
        <div className="font-display font-bold text-2xl md:text-3xl text-primary">
          {value.toString().padStart(2, '0')}
        </div>
      </div>
      <div className="text-xs text-foreground/60 uppercase tracking-wider font-display">
        {label}
      </div>
    </div>
  )

  return (
    <div className="glass-border-animated">
      <div className="glass-inner p-6">
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-2">
            🔥 OBLM Presale Countdown
          </h2>
          <p className="text-foreground/70 text-sm">
            Presale starts November 21, 2025
          </p>
        </div>

        <div className="flex justify-center gap-3 md:gap-6">
          <TimeUnit value={timeLeft.days} label="Days" />
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Mins" />
          <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-foreground/50">
            Be ready for the launch! Early participants get exclusive bonuses.
          </p>
        </div>
      </div>
    </div>
  )
}
