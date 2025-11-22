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
  const [isConverting, setIsConverting] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        setIsExpired(true)
        if (!isConverting && !conversionComplete) {
          triggerAutomaticConversion()
        }
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
  }, [isConverting, conversionComplete])

  const triggerAutomaticConversion = async () => {
    if (isConverting || conversionComplete) return

    setIsConverting(true)
    setConversionError(null)

    try {
      const response = await fetch("/api/convert-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        // Don't show error for insufficient balance/points - it's expected
        if (data.error?.includes("Insufficient")) {
          console.log("[v0] User does not meet conversion criteria:", data.error)
          setConversionComplete(true)
          return
        }
        throw new Error(data.error || "Conversion failed")
      }

      console.log("[v0] Automatic conversion successful:", data)
      setConversionComplete(true)

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Conversion error:", error)
      setConversionError(error.message)
    } finally {
      setIsConverting(false)
    }
  }

  if (isExpired) {
    return (
      <LiquidCard className="p-6 bg-gradient-to-br from-success/20 to-accent/20 border-success">
        <div className="text-center">
          {isConverting ? (
            <>
              <div className="text-4xl mb-2">⏳</div>
              <h3 className="text-xl font-display font-bold text-primary mb-2">Processing Conversion...</h3>
              <p className="text-sm text-foreground/80">Please wait while we convert your points</p>
            </>
          ) : conversionComplete ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-display font-bold text-success mb-2">Conversion Complete!</h3>
              <p className="text-sm text-foreground/80">Your points have been converted to OBLM tokens!</p>
              <p className="text-xs text-foreground/60 mt-2">Page will refresh shortly...</p>
            </>
          ) : conversionError ? (
            <>
              <div className="text-4xl mb-2">❌</div>
              <h3 className="text-xl font-display font-bold text-red-400 mb-2">Conversion Failed</h3>
              <p className="text-sm text-red-300">{conversionError}</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-display font-bold text-success mb-2">Conversion Day!</h3>
              <p className="text-sm text-foreground/80">Checking eligibility...</p>
            </>
          )}
        </div>
      </LiquidCard>
    )
  }

  return (
    <LiquidCard className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/50">
      <div className="text-center mb-4">
        <h3 className="text-lg font-display font-bold text-primary mb-1">Next Token Conversion</h3>
        <p className="text-xs text-foreground/60">December 9, 2025</p>
        <div className="mt-3 space-y-2">
          <div className="inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm font-bold text-accent">10,000 Points = 250 OBLM</p>
          </div>
          <div className="text-xs text-orange-400 font-semibold bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/30 inline-block">
            ⚠️ Minimum 350 OBLM balance required to convert
          </div>
          <div className="text-xs text-muted-foreground">Gas fee: 50 OBLM tokens deducted after conversion</div>
        </div>
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
