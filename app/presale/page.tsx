"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { BackgroundAnimation } from "@/components/background-animation"
import { GlowButton } from "@/components/ui/glow-button"
import { CubeLoader } from "@/components/ui/cube-loader"
import { redirectToPaymentApp } from "@/lib/payment-redirect"
import { Clock } from "lucide-react"

const PresaleEndedOverlay = () => {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-background/98 backdrop-blur-2xl flex items-center justify-center p-4"
      style={{ pointerEvents: "all", touchAction: "none" }}
    >
      <div className="max-w-2xl w-full space-y-8 animate-fade-in-up">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
            <span className="text-4xl">⏰</span>
            <span className="text-purple-400 font-bold text-base md:text-lg font-display uppercase tracking-wider">
              PRESALE ENDED
            </span>
          </div>

          <h1 className="font-display font-black text-4xl md:text-6xl bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
            Presale V1 Complete
          </h1>

          <p className="text-foreground/70 text-base md:text-lg font-display">Thank you for your participation!</p>
        </div>

        <div className="glass-card p-8 md:p-12 border-2 border-purple-500/30">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
              <span className="text-purple-400 text-5xl">🚀</span>
              <div className="text-left">
                <p className="text-lg font-display font-bold text-foreground mb-1">Coming Soon</p>
                <p className="text-2xl md:text-3xl font-display font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Presale V2
                </p>
              </div>
            </div>

            <p className="text-foreground/60 text-base font-display max-w-md mx-auto">
              The first presale phase has concluded. Stay tuned for announcements about Presale V2 with exciting new
              opportunities!
            </p>

            <div className="pt-4">
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent rounded-lg font-display font-bold hover:scale-105 transition-transform"
              >
                Return to Dashboard
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PresaleCountdownOverlay = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isBeforeStart, setIsBeforeStart] = useState(true)
  const [hasEnded, setHasEnded] = useState(false)

  useEffect(() => {
    const startDate = new Date("2025-11-21T11:00:00Z").getTime()
    const endDate = startDate + 15 * 24 * 60 * 60 * 1000 // 15 days after start

    const updateCountdown = () => {
      const now = new Date().getTime()

      // Check if presale hasn't started yet
      if (now < startDate) {
        const distance = startDate - now
        setIsBeforeStart(true)
        setHasEnded(false)

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
      // Check if presale has ended
      else if (now >= endDate) {
        setIsBeforeStart(false)
        setHasEnded(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
      // Presale is active - show time remaining
      else {
        const distance = endDate - now
        setIsBeforeStart(false)
        setHasEnded(false)

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  // Show ended overlay if presale has concluded
  if (hasEnded) {
    return <PresaleEndedOverlay />
  }

  // Don't show overlay if presale is active
  if (!isBeforeStart) {
    return null
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl blur-xl" />
        <div className="relative glass-panel-strong p-4 md:p-8 min-w-[80px] md:min-w-[120px] text-center border-2 border-cyan-500/30 rounded-2xl">
          <div className="font-display font-black text-3xl md:text-6xl bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            {value.toString().padStart(2, "0")}
          </div>
        </div>
      </div>
      <div className="text-xs md:text-base text-foreground/60 uppercase tracking-widest font-display mt-3 font-bold">
        {label}
      </div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background/98 backdrop-blur-2xl flex items-center justify-center p-4"
      style={{ pointerEvents: "all", touchAction: "none" }}
    >
      <div className="max-w-3xl w-full space-y-8 animate-fade-in-up">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30">
            <span className="text-4xl animate-pulse">🔥</span>
            <span className="text-orange-400 font-bold text-base md:text-lg font-display uppercase tracking-wider">
              PRESALE COMING SOON
            </span>
          </div>

          <h1 className="font-display font-black text-4xl md:text-6xl bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            OBLM Presale Countdown
          </h1>

          <p className="text-foreground/70 text-base md:text-lg flex items-center justify-center gap-2 font-display">
            <Clock className="w-5 h-5" />
            Presale starts November 21, 2025 at 11:00 UTC
          </p>
        </div>

        <div className="glass-card p-8 md:p-12 border-2 border-cyan-500/30">
          <div className="flex justify-center gap-4 md:gap-8 mb-8">
            <TimeUnit value={timeLeft.days} label="Days" />
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <TimeUnit value={timeLeft.seconds} label="Secs" />
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full border border-cyan-500/20">
              <span className="text-cyan-400 text-xl">⚡</span>
              <p className="text-sm md:text-base text-foreground/70 font-medium font-display">
                Be ready for launch! Early participants get exclusive bonuses.
              </p>
            </div>

            <p className="text-foreground/50 text-sm font-display">
              The presale will be accessible once the countdown reaches zero
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const PresaleTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const startDate = new Date("2025-11-21T11:00:00Z").getTime()
    const endDate = startDate + 15 * 24 * 60 * 60 * 1000 // 15 days after start

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = now >= startDate ? endDate - now : startDate - now

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
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl blur-xl" />
        <div className="relative glass-panel-strong p-4 md:p-8 min-w-[80px] md:min-w-[120px] text-center border-2 border-cyan-500/30 rounded-2xl">
          <div className="font-display font-black text-3xl md:text-6xl bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            {value.toString().padStart(2, "0")}
          </div>
        </div>
      </div>
      <div className="text-xs md:text-base text-foreground/60 uppercase tracking-widest font-display mt-3 font-bold">
        {label}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-4">
      <div className="glass-card p-8 md:p-12 border-2 border-cyan-500/30">
        <div className="flex justify-center gap-4 md:gap-8 mb-8">
          <TimeUnit value={timeLeft.days} label="Days" />
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Mins" />
          <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full border border-cyan-500/20">
            <span className="text-cyan-400 text-xl">⚡</span>
            <p className="text-sm md:text-base text-foreground/70 font-medium font-display">
              {timeLeft.days > 0 ? "Presale is active" : "Presale starts soon"}
            </p>
          </div>

          {timeLeft.days > 0 ? (
            <p className="text-foreground/50 text-sm font-display">Time remaining until Presale V2 starts</p>
          ) : (
            <p className="text-foreground/50 text-sm font-display">Presale starts November 21, 2025 at 11:00 UTC</p>
          )}
        </div>
      </div>
    </div>
  )
}

const TOKEN_PRICE = 0.02 // $0.02 per OBLM token
const MIN_PURCHASE_USD = 4 // $4 minimum

export default function PresalePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [usdAmount, setUsdAmount] = useState<string>("4")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [solPrice, setSolPrice] = useState<number | null>(null)
  const [presalePool, setPresalePool] = useState<{
    total_tokens: number
    tokens_sold: number
    tokens_remaining: number
    current_price: number
  } | null>(null)

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch("/api/solana-price")
        const data = await response.json()
        if (data.price) {
          setSolPrice(data.price)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch SOL price:", error)
      }
    }

    fetchSolPrice()
    const interval = setInterval(fetchSolPrice, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/auth")
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase.from("profiles").select("oblm_token_balance").eq("id", user.id).single()

      if (profile) {
        setTokenBalance(profile.oblm_token_balance || 0)
      }

      const { data: pool } = await supabase.from("presale_pool").select("*").single()

      if (pool) {
        setPresalePool(pool)
      }

      setIsLoading(false)
    }

    loadUserData()
  }, [router])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get("status")
    const paymentError = urlParams.get("error")
    const tokensReceived = urlParams.get("tokens")

    if (paymentStatus === "success" && tokensReceived) {
      setSuccess(`Successfully purchased ${Number.parseFloat(tokensReceived).toLocaleString()} OBLM tokens!`)
      const supabase = createClient()
      supabase
        .from("profiles")
        .select("oblm_token_balance")
        .eq("id", userId)
        .single()
        .then(({ data }) => {
          if (data) setTokenBalance(data.oblm_token_balance || 0)
        })
      supabase
        .from("presale_pool")
        .select("*")
        .single()
        .then(({ data }) => {
          if (data) setPresalePool(data)
        })
      window.history.replaceState({}, "", window.location.pathname)
    } else if (paymentStatus === "failed" && paymentError) {
      setError(decodeURIComponent(paymentError))
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [userId])

  const calculateTokens = (usd: number): number => {
    return usd / TOKEN_PRICE
  }

  const calculateSolAmount = (usd: number): number => {
    if (!solPrice) return 0
    return usd / solPrice
  }

  const handlePurchase = async () => {
    if (!userId) {
      setError("Please log in first")
      return
    }

    const usd = Number.parseFloat(usdAmount)

    if (isNaN(usd) || usd < MIN_PURCHASE_USD) {
      setError(`Minimum purchase is $${MIN_PURCHASE_USD}`)
      return
    }

    const tokensToReceive = calculateTokens(usd)

    if (presalePool && tokensToReceive > presalePool.tokens_remaining) {
      setError(`Not enough tokens available. Only ${presalePool.tokens_remaining.toLocaleString()} tokens remaining.`)
      return
    }

    setIsPurchasing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("[v0] Redirecting to payment app for presale...")

      redirectToPaymentApp({
        userId,
        boosterId: "presale",
        amount: usd,
        boosterName: `${tokensToReceive.toLocaleString()} OBLM Tokens`,
        isPresale: true,
        tokensAmount: tokensToReceive,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to redirect to payment"
      console.error("[v0] Redirect error:", err)
      setError(message)
      setIsPurchasing(false)
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

  const tokensToReceive = calculateTokens(Number.parseFloat(usdAmount) || 0)
  const solAmount = calculateSolAmount(Number.parseFloat(usdAmount) || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      <PresaleCountdownOverlay />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-4">
        <PresaleTimer />
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-full">
            <span className="text-primary font-display font-bold text-sm">🔥 PRESALE ACTIVE</span>
          </div>
          <h1 className="font-display font-bold text-5xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4">
            OBLM Token Presale
          </h1>
          <p className="text-foreground/60 text-lg">
            Get OBLM tokens directly at presale price: ${TOKEN_PRICE} per token
          </p>
          {solPrice && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-full">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-success text-sm font-medium">Live SOL Price: ${solPrice.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Early Bird Bonus Card */}
        <div className="glass-card p-8 border-2 border-accent/50 shadow-[0_0_30px_rgba(0,240,255,0.3)] animate-fade-in-up bg-gradient-to-br from-accent/5 via-primary/5 to-background">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl animate-pulse"></div>
                <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center">
                  <span className="text-4xl md:text-5xl">🎁</span>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                  <h3 className="font-display font-bold text-2xl md:text-3xl text-foreground">Early Bird Bonus</h3>
                  <span className="px-4 py-1.5 bg-gradient-to-r from-accent to-primary border-2 border-accent/60 rounded-full text-sm font-bold text-background shadow-lg">
                    FIRST 500 USERS ONLY
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-foreground/90 text-lg leading-relaxed">
                  Purchase <span className="font-bold text-accent text-xl">$20+</span> worth of OBLM tokens in the
                  presale and receive an additional
                </p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/40 rounded-xl">
                  <span className="font-display font-black text-3xl md:text-4xl bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent animate-shimmer">
                    300 OBLM
                  </span>
                  <span className="text-foreground/80 text-lg ml-2">TOKENS FREE!</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-foreground/70 bg-background/30 px-4 py-2 rounded-lg border border-border/30">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Only first 500 participants qualify</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/70 bg-background/30 px-4 py-2 rounded-lg border border-border/30">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Bonus awarded November 24th</span>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <span className="text-accent font-display font-medium">Limited spots remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* TGE Unlock Information Banner */}
        <div className="glass-card p-6 border-2 border-success/50 shadow-[0_0_20px_rgba(34,197,94,0.2)] animate-fade-in-up stagger-1 bg-gradient-to-br from-success/5 via-emerald-500/5 to-background">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-success/30 rounded-full blur-lg"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-display font-bold text-xl text-foreground">100% Unlocked at TGE</h3>
                <span className="px-3 py-1 bg-success/20 border border-success/40 rounded-full text-xs font-bold text-success">
                  NO VESTING
                </span>
              </div>
              <p className="text-foreground/70 text-sm leading-relaxed">
                All presale tokens are immediately accessible at Token Generation Event. No lock-up period, no vesting
                schedule – your tokens, your control from day one.
              </p>
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className="glass-card p-8 text-center animate-fade-in-up stagger-1">
          <div className="text-foreground/60 text-sm mb-2">Your OBLM Token Balance</div>
          <div className="font-display font-bold text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {tokenBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} OBLM
          </div>
        </div>

        {/* Purchase Card */}
        <div className="glass-card p-8 animate-fade-in-up stagger-2">
          <h2 className="font-display font-bold text-2xl text-foreground mb-6">Buy OBLM Tokens</h2>

          <div className="space-y-6">
            {/* USD Input */}
            <div>
              <label className="block text-foreground/70 text-sm mb-2">
                Amount in USD (Minimum: ${MIN_PURCHASE_USD})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/60 font-display">$</span>
                <input
                  type="number"
                  step="0.01"
                  min={MIN_PURCHASE_USD}
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-background/50 border border-primary/30 rounded-lg text-foreground font-display text-lg focus:outline-none focus:border-primary transition-colors"
                  placeholder={`${MIN_PURCHASE_USD}.00`}
                />
              </div>
              <p className="text-foreground/50 text-xs mt-1">Enter any amount $4 or more</p>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">You pay (USD):</span>
                <span className="font-display font-bold text-foreground text-xl">
                  ${Number.parseFloat(usdAmount || "0").toFixed(2)}
                </span>
              </div>
              {solPrice && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/60">You pay (SOL):</span>
                    <span className="font-display font-bold text-accent text-lg">◎ {solAmount.toFixed(6)} SOL</span>
                  </div>
                  <div className="text-xs text-foreground/40 text-right">@ ${solPrice.toFixed(2)} per SOL</div>
                </>
              )}
              <div className="h-px bg-border/50"></div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">You receive:</span>
                <span className="font-display font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {tokensToReceive.toLocaleString(undefined, { maximumFractionDigits: 2 })} OBLM
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-foreground/40">Token price:</span>
                <span className="text-foreground/60">${TOKEN_PRICE} per OBLM</span>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <p className="text-success text-sm">{success}</p>
              </div>
            )}

            {/* Purchase Button */}
            <GlowButton
              onClick={handlePurchase}
              disabled={isPurchasing || Number.parseFloat(usdAmount) < MIN_PURCHASE_USD}
              className="w-full"
              variant="primary"
            >
              {isPurchasing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Loading Secure Payment Gateway...
                </span>
              ) : (
                `Buy ${tokensToReceive.toLocaleString()} OBLM Tokens for $${Number.parseFloat(usdAmount || "0").toFixed(2)}`
              )}
            </GlowButton>

            <div className="text-center text-xs text-foreground/50 space-y-1">
              <p>Tokens will be added to your profile after successful payment</p>
              <p>Minimum purchase: ${MIN_PURCHASE_USD}</p>
              <p>Presale price: ${TOKEN_PRICE} per OBLM token</p>
              <p className="text-success/70">✓ SOL price updates every 30 seconds for fair pricing</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 animate-fade-in-up stagger-3">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-display font-bold text-foreground mb-2">Instant Delivery</h3>
            <p className="text-foreground/60 text-sm">Tokens added to your profile after payment</p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-display font-bold text-foreground mb-2">Secure Payment</h3>
            <p className="text-foreground/60 text-sm">Powered by secure payment gateway</p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-3">💎</div>
            <h3 className="font-display font-bold text-foreground mb-2">Fair Pricing</h3>
            <p className="text-foreground/60 text-sm">Real-time SOL price ensures fair conversion</p>
          </div>
        </div>
      </div>
    </div>
  )
}
