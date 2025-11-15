"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelector } from "@/components/language-selector"

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [repeatPassword, setRepeatPassword] = useState("")
  const [referralMessage, setReferralMessage] = useState<string | null>(null)
  const [referralSuccess, setReferralSuccess] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const refCode = params.get("ref")
      if (refCode) {
        setReferralCode(refCode)
        setIsSignUp(true)
      }
    }
  }, [])

  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (err: any) {
        if (i === maxRetries - 1) throw err

        if (
          err.message?.includes("Invalid") ||
          err.message?.includes("already registered") ||
          err.message?.includes("do not match")
        ) {
          throw err
        }

        const delay = Math.min(1000 * Math.pow(2, i), 5000)
        console.log(`[v0] Retry ${i + 1}/${maxRetries} after ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Form submitted, isSignUp:", isSignUp)
    setIsLoading(true)
    setError(null)
    setReferralMessage(null)
    setReferralSuccess(false)

    const supabase = createClient()

    try {
      if (isSignUp) {
        console.log("[v0] Starting signup process...")
        if (password !== repeatPassword) {
          throw new Error("Passwords do not match")
        }

        if (!nickname.trim()) {
          throw new Error("Nickname is required")
        }

        const { error: signUpError, data } = await retryWithBackoff(() =>
          supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
              data: {
                nickname: nickname.trim(),
                referral_code: referralCode.trim() || null,
              },
            },
          }),
        )

        if (signUpError) {
          console.log("[v0] Signup error:", signUpError)

          if (signUpError.message.includes("rate limit")) {
            setError("Too many signup attempts. Please wait a few minutes and try again.")
            setIsLoading(false)
            return
          } else if (signUpError.message.includes("already registered")) {
            throw new Error("This email is already registered. Try signing in instead.")
          } else if (signUpError.message.includes("invalid email")) {
            throw new Error("Please enter a valid email address.")
          } else {
            throw signUpError
          }
        }

        console.log("[v0] Signup successful, user ID:", data.user?.id)

        if (data.user && referralCode.trim()) {
          console.log("[v0] Waiting 3 seconds for profile creation before processing referral...")
          await new Promise((resolve) => setTimeout(resolve, 3000))

          try {
            console.log("[v0] Calling referral API...")
            const response = await fetch("/api/referral/process", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ referralCode: referralCode.trim() }),
            })

            const result = await response.json()

            if (!response.ok) {
              console.log("[v0] Referral API error:", result)
              setReferralMessage(result.error || "Referral code could not be applied")
              setReferralSuccess(false)
            } else {
              console.log("[v0] Referral success:", result)
              setReferralMessage(result.message || "Referral applied successfully!")
              setReferralSuccess(true)
            }
          } catch (referralError) {
            console.log("[v0] Referral processing exception:", referralError)
            setReferralMessage("Could not process referral code")
            setReferralSuccess(false)
          }
        }

        setTimeout(
          () => {
            router.push("/dashboard")
          },
          referralCode.trim() ? 2000 : 500,
        )
      } else {
        console.log("[v0] Starting login process...")
        const { error: loginError } = await retryWithBackoff(() =>
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
        )

        if (loginError) throw loginError
        router.push("/dashboard")
      }
    } catch (err) {
      console.log("[v0] Auth error:", err)
      if (err instanceof Error) {
        if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("timeout")) {
          setError(
            "Connection issue detected. Our servers are experiencing high traffic. Please try again in a moment.",
          )
        } else {
          setError(err.message)
        }
      } else {
        setError("An error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background overflow-hidden flex items-center justify-center px-4">
      <BackgroundAnimation />

      <div className="fixed top-8 right-8 z-50">
        <LanguageSelector />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <Image 
                src="/logo.png" 
                alt="Oblium Logo" 
                fill
                className="object-contain drop-shadow-2xl drop-shadow-primary/50" 
              />
            </div>
            <h1 
              className="font-display font-bold text-primary mb-3 tracking-wide" 
              style={{ fontSize: 'var(--text-xl)' }}
            >
              OBLM
            </h1>
            <p 
              className="text-foreground/70 font-medium" 
              style={{ fontSize: 'var(--text-base)' }}
            >
              {isSignUp ? t("createAccount") : t("enterMiningNetwork")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                className="block font-display font-bold text-foreground/90 mb-2.5" 
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full px-4 py-3.5 bg-background/40 backdrop-blur-sm border border-primary/30 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:bg-background/60 focus:shadow-lg focus:shadow-primary/10 transition-all duration-300 font-medium"
                style={{ fontSize: 'var(--text-base)' }}
                required
              />
            </div>

            {isSignUp && (
              <div className="animate-fade-in-up">
                <label 
                  className="block font-display font-bold text-foreground/90 mb-2.5" 
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  {t("nickname")}
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t("nicknamePlaceholder")}
                  className="w-full px-4 py-3.5 bg-background/40 backdrop-blur-sm border border-primary/30 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:bg-background/60 focus:shadow-lg focus:shadow-primary/10 transition-all duration-300 font-medium"
                  style={{ fontSize: 'var(--text-base)' }}
                  required
                />
              </div>
            )}

            <div>
              <label 
                className="block font-display font-bold text-foreground/90 mb-2.5" 
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-4 py-3.5 bg-background/40 backdrop-blur-sm border border-primary/30 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:bg-background/60 focus:shadow-lg focus:shadow-primary/10 transition-all duration-300 font-medium"
                style={{ fontSize: 'var(--text-base)' }}
                required
              />
            </div>

            {isSignUp && (
              <div className="animate-fade-in-up">
                <label 
                  className="block font-display font-bold text-foreground/90 mb-2.5" 
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  {t("repeatPassword")}
                </label>
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="w-full px-4 py-3.5 bg-background/40 backdrop-blur-sm border border-primary/30 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:bg-background/60 focus:shadow-lg focus:shadow-primary/10 transition-all duration-300 font-medium"
                  style={{ fontSize: 'var(--text-base)' }}
                  required
                />
              </div>
            )}

            {isSignUp && (
              <div className="animate-fade-in-up">
                <label 
                  className="block font-display font-bold text-foreground/90 mb-2.5" 
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  {t("referralCodeOptional")}
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder={t("referralCodePlaceholder")}
                  className="w-full px-4 py-3.5 bg-background/40 backdrop-blur-sm border border-accent/30 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent focus:bg-background/60 focus:shadow-lg focus:shadow-accent/10 transition-all duration-300 font-medium"
                  style={{ fontSize: 'var(--text-base)' }}
                />
                <p className="text-foreground/50 mt-2" style={{ fontSize: 'var(--text-xs)' }}>
                  Enter a friend's referral code to earn 500 bonus points!
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 backdrop-blur-sm border border-destructive/30 rounded-xl animate-fade-in">
                <p className="text-destructive font-medium" style={{ fontSize: 'var(--text-sm)' }}>{error}</p>
              </div>
            )}

            {referralMessage && (
              <div
                className={`p-4 backdrop-blur-sm border rounded-xl animate-fade-in ${
                  referralSuccess ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"
                }`}
              >
                <p 
                  className={`font-medium ${referralSuccess ? "text-success" : "text-warning"}`}
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  {referralSuccess ? "✓ " : "⚠️ "}
                  {referralMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 text-lg font-display font-bold mt-6 btn-primary rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading
                ? isSignUp
                  ? t("creatingAccount")
                  : t("connecting")
                : isSignUp
                  ? t("createAccount")
                  : t("startMining")}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-foreground/60 font-medium" style={{ fontSize: 'var(--text-sm)' }}>
              {isSignUp ? t("alreadyHaveAccount") : t("newToOblium")}{" "}
              <button
                type="button"
                onClick={() => {
                  console.log("[v0] Toggling auth mode, current isSignUp:", isSignUp)
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setReferralMessage(null)
                  setReferralSuccess(false)
                }}
                className="text-primary hover:text-accent font-display font-bold transition-colors duration-300 underline decoration-primary/50 hover:decoration-accent"
              >
                {isSignUp ? t("signIn") : t("createAccount")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
