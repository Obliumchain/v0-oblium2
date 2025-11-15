"use client"

import Link from "next/link"
import Image from "next/image"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelector } from "@/components/language-selector"

export default function WelcomePage() {
  const { t } = useLanguage()

  const miningSteps = [
    { icon: "✅", text: "Install Phantom Wallet" },
    { icon: "🌐", text: "Open Oblium website using the Phantom browser" },
    { icon: "🪪", text: "Create your account & verify your email" },
    { icon: "🔐", text: "Log in to your dashboard" },
    { icon: "💎", text: "Start earning Oblium Points" },
    { icon: "🔗", text: "Connect your wallet" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background overflow-hidden">
      <BackgroundAnimation />

      <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
        <div className="glass-card p-2">
          <LanguageSelector />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="text-center max-w-6xl mx-auto">
          <div className="mb-8 animate-scale-in stagger-1">
            <div className="glass-card p-8 inline-block mb-6">
              <div className="flex items-center justify-center gap-3">
                <Image src="/logo.png" alt="Oblium Logo" width={80} height={80} className="drop-shadow-2xl animate-float" />
              </div>
            </div>
            <h1 
              className="font-display font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
              style={{ fontSize: 'var(--text-2xl)' }}
            >
              OBLIUM
            </h1>
          </div>

          <div className="mb-12 animate-fade-in-up stagger-2">
            <h2 
              className="font-display mb-4 text-foreground/80"
              style={{ fontSize: 'var(--text-xl)' }}
            >
              {t("welcomeTagline")}
            </h2>
            <p 
              className="text-foreground/60 max-w-2xl mx-auto leading-relaxed"
              style={{ fontSize: 'var(--text-base)' }}
            >
              {t("welcomeDesc")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3 mb-16">
            <Link href="/auth">
              <GlowButton className="px-8 py-4 text-lg">
                {t("startMining")}
              </GlowButton>
            </Link>
            <Link href="https://learnmore.obliumtoken.com/" target="_blank" rel="noopener noreferrer">
              <button className="glass-card px-8 py-4 font-display font-bold border border-primary/30 text-primary hover:border-primary/60 hover:scale-105 transition-all duration-300" style={{ fontSize: 'var(--text-base)' }}>
                {t("learnMore")}
              </button>
            </Link>
          </div>

          <div className="mb-16 max-w-3xl mx-auto animate-fade-in-up stagger-4">
            <div className="glass-panel-strong p-8 rounded-3xl">
              <h3 
                className="font-display font-bold text-primary mb-8 flex items-center justify-center gap-2"
                style={{ fontSize: 'var(--text-lg)' }}
              >
                How to Start Mining
              </h3>
              <div className="space-y-3">
                {miningSteps.map((step, index) => (
                  <div
                    key={index}
                    className="glass-card flex items-start gap-4 p-5 hover:scale-[1.02] transition-all duration-300 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform border border-primary/30">
                      {step.icon}
                    </div>
                    <p 
                      className="text-foreground/90 text-left font-medium pt-3"
                      style={{ fontSize: 'var(--text-base)' }}
                    >
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-in-up stagger-5">
            {[
              { icon: "⛏️", title: t("minePoints"), desc: t("minePointsDesc") },
              { icon: "🎯", title: t("earnRewards"), desc: t("earnRewardsDesc") },
              { icon: "✨", title: t("convertToOBLM"), desc: t("convertToOBLMDesc") },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-8 group hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4 animate-float">{feature.icon}</div>
                <h3 
                  className="font-display font-bold text-foreground mb-3"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-foreground/60"
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
