"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelector } from "@/components/language-selector"

function AuthPageContent() {
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
        console.log(`[v0] Referral code detected: ${refCode}`)
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
    setIsLoading(true)
    setError(null)
    setReferralMessage(null)
    setReferralSuccess(false)

    const supabase = createClient()

    try {
      if (isSignUp) {
        if (password !== repeatPassword) {
          throw new Error("Passwords do not match")
        }

        if (!nickname.trim()) {
          throw new Error("Nickname is required")
        }

        const trimmedRefCode = referralCode.trim().toUpperCase()
        if (trimmedRefCode && trimmedRefCode.length !== 5) {
          throw new Error("Invalid referral code format. Code should be 5 characters.")
        }

        const { error: signUpError, data } = await retryWithBackoff(() =>
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                nickname: nickname.trim(),
                referral_code: trimmedRefCode || null,
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

        if (data.user && trimmedRefCode) {
          console.log("[v0] Waiting 3 seconds for profile creation before processing referral...")
          await new Promise((resolve) => setTimeout(resolve, 3000))

          try {
            console.log("[v0] Calling referral API...")
            const response = await fetch("/api/referral/process", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                referralCode: trimmedRefCode,
                userId: data.user.id, // Include user ID for new signups
              }),
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
          trimmedRefCode ? 2000 : 500,
        )
      } else {
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

      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <LiquidCard className="p-8">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="Oblium Logo" width={64} height={64} className="mx-auto mb-4 drop-shadow-lg" />
            <h1 className="text-3xl font-display font-bold text-primary mb-2">OBLIUM</h1>
            <p className="text-foreground/60">{isSignUp ? t("createAccount") : t("enterMiningNetwork")}</p>
            {referralCode && isSignUp && (
              <div className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-sm text-accent font-bold">🎉 You've been invited! Sign up to earn bonus points!</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground/80 mb-2">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full px-4 py-3 bg-background/50 border border-primary/30 rounded-lg text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">{t("nickname")}</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t("nicknamePlaceholder")}
                  className="w-full px-4 py-3 bg-background/50 border border-primary/30 rounded-lg text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-foreground/80 mb-2">{t("password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-4 py-3 bg-background/50 border border-primary/30 rounded-lg text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">{t("repeatPassword")}</label>
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="w-full px-4 py-3 bg-background/50 border border-primary/30 rounded-lg text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/20 transition-all duration-300"
                  required
                />
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">{t("referralCodeOptional")}</label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="XXXXX"
                  maxLength={5}
                  className="w-full px-4 py-3 bg-background/50 border border-accent/30 rounded-lg text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent focus:shadow-lg focus:shadow-accent/20 transition-all duration-300 uppercase tracking-wider text-center text-lg font-mono"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Enter a friend's 5-character referral code to earn 500 bonus points!
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {referralMessage && (
              <div
                className={`p-3 border rounded-lg ${
                  referralSuccess ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
                }`}
              >
                <p className={`text-sm ${referralSuccess ? "text-green-400" : "text-yellow-400"}`}>
                  {referralSuccess ? "✓ " : "⚠️ "}
                  {referralMessage}
                </p>
              </div>
            )}

            <GlowButton type="submit" disabled={isLoading} className="w-full">
              {isLoading
                ? isSignUp
                  ? t("creatingAccount")
                  : t("connecting")
                : isSignUp
                  ? t("createAccount")
                  : t("startMining")}
            </GlowButton>
          </form>

          <div className="text-center text-sm text-foreground/60 mt-6">
            {isSignUp ? t("alreadyHaveAccount") : t("newToOblium")}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setReferralMessage(null)
                setReferralSuccess(false)
              }}
              className="text-primary hover:underline font-bold"
            >
              {isSignUp ? t("signIn") : t("createAccount")}
            </button>
          </div>
        </LiquidCard>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return <AuthPageContent />
}
