"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { useRouter } from "next/navigation"

interface NewTaskNotificationProps {
  onClose: () => void
}

export function NewTaskNotification({ onClose }: NewTaskNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const handleGoToTasks = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
      router.push("/tasks")
    }, 300)
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <LiquidCard
        className={`max-w-md w-full p-8 text-center border-2 border-accent relative transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="text-7xl mb-4 animate-bounce">🔥</div>

        {/* Title */}
        <h2 className="text-3xl font-display font-bold text-accent mb-4">New Task Available!</h2>

        {/* Description */}
        <p className="text-lg text-foreground/80 mb-2">A brand new task is waiting for you!</p>
        <p className="text-xl font-display font-bold text-primary mb-6">Earn up to 2,000 Points! 💎</p>

        {/* Task preview */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔥</span>
            <div className="text-left">
              <p className="font-bold text-foreground">Repost Presale Announcement</p>
              <p className="text-sm text-foreground/60">Share the presale with the world!</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-display font-bold text-accent">+2,000 pts</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <GlowButton onClick={handleGoToTasks} className="w-full" variant="accent">
            View Task Now! 🚀
          </GlowButton>
          <button onClick={handleClose} className="text-sm text-foreground/60 hover:text-foreground transition-colors">
            Maybe Later
          </button>
        </div>
      </LiquidCard>
    </div>
  )
}
