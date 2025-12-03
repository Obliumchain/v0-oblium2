"use client"

import { X } from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"

export function NewsBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const dismissed = localStorage.getItem("news-banner-dismissed-dec3-2024")
    if (dismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("news-banner-dismissed-dec3-2024", "true")
  }

  if (!isVisible) return null

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/30 rounded-lg p-4 mb-6 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />

      <div className="relative flex items-start gap-3">
        <div className="text-2xl">📢</div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-foreground mb-1 flex items-center gap-2">
            {t("New Tasks Available!")}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">
              {t("NEW")}
            </span>
          </h3>
          <p className="text-sm text-foreground/80 mb-2">
            {t("Complete our latest social media tasks and earn 1,000 points each! Head to the Tasks page now.")}
          </p>
          <a
            href="/tasks"
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t("View Tasks")} →
          </a>
        </div>
        <button
          onClick={handleDismiss}
          className="text-foreground/50 hover:text-foreground/80 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
