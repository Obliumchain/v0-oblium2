"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { BackgroundAnimation } from "@/components/background-animation"
import { GlowButton } from "@/components/ui/glow-button"
import { CubeLoader } from "@/components/ui/cube-loader"
import { redirectToPaymentApp } from "@/lib/payment-redirect"

const TOKEN_PRICE = 0.02 // $0.02 per OBLM token
const MIN_PURCHASE_USD = 7 // $7 minimum

export default function PresalePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [usdAmount, setUsdAmount] = useState<string>("7")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push("/auth")
        return
      }

      setUserId(user.id)

      // Load current token balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("oblm_token_balance")
        .eq("id", user.id)
        .single()

      if (profile) {
        setTokenBalance(profile.oblm_token_balance || 0)
      }

      setIsLoading(false)
    }

    loadUserData()
  }, [router])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('status')
    const paymentError = urlParams.get('error')
    const tokensReceived = urlParams.get('tokens')

    if (paymentStatus === 'success' && tokensReceived) {
      setSuccess(`Successfully purchased ${parseFloat(tokensReceived).toLocaleString()} OBLM tokens!`)
      // Reload balance
      const supabase = createClient()
      supabase
        .from("profiles")
        .select("oblm_token_balance")
        .eq("id", userId)
        .single()
        .then(({ data }) => {
          if (data) setTokenBalance(data.oblm_token_balance || 0)
        })
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'failed' && paymentError) {
      setError(decodeURIComponent(paymentError))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [userId])

  const calculateTokens = (usd: number): number => {
    return usd / TOKEN_PRICE
  }

  const handlePurchase = async () => {
    if (!userId) {
      setError("Please log in first")
      return
    }

    const usd = parseFloat(usdAmount)
    
    if (isNaN(usd) || usd < MIN_PURCHASE_USD) {
      setError(`Minimum purchase is $${MIN_PURCHASE_USD}`)
      return
    }

    setIsPurchasing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("[v0] Redirecting to payment app for presale...")
      
      const tokensToReceive = calculateTokens(usd)
      
      // Redirect to external payment application
      redirectToPaymentApp({
        userId,
        boosterId: 'presale',
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

  const tokensToReceive = calculateTokens(parseFloat(usdAmount) || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 space-y-8">
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
              <p className="text-foreground/50 text-xs mt-1">Enter any amount $7 or more</p>
            </div>

            {/* Simplified calculation display */}
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">You pay:</span>
                <span className="font-display font-bold text-foreground text-xl">
                  ${parseFloat(usdAmount || "0").toFixed(2)}
                </span>
              </div>
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
              disabled={isPurchasing || parseFloat(usdAmount) < MIN_PURCHASE_USD}
              className="w-full"
              variant="primary"
            >
              {isPurchasing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Loading Secure Payment Gateway...
                </span>
              ) : (
                `Buy ${tokensToReceive.toLocaleString()} OBLM Tokens for $${parseFloat(usdAmount || "0").toFixed(2)}`
              )}
            </GlowButton>

            {/* Info */}
            <div className="text-center text-xs text-foreground/50 space-y-1">
              <p>Tokens will be added to your profile after successful payment</p>
              <p>Minimum purchase: ${MIN_PURCHASE_USD}</p>
              <p>Presale price: ${TOKEN_PRICE} per OBLM token</p>
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
            <h3 className="font-display font-bold text-foreground mb-2">Presale Price</h3>
            <p className="text-foreground/60 text-sm">Get tokens at exclusive early price</p>
          </div>
        </div>
      </div>
    </div>
  )
}
