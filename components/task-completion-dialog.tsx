"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlowButton } from "@/components/ui/glow-button"
import { useLanguage } from "@/lib/language-context"

interface TaskCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskName: string
  pointsAwarded: number
  isBonus?: boolean
  isDaily?: boolean
}

export function TaskCompletionDialog({
  open,
  onOpenChange,
  taskName,
  pointsAwarded,
  isBonus = false,
  isDaily = false,
}: TaskCompletionDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-[#0a0015] to-background border-2 border-primary/50 shadow-2xl shadow-primary/20">
        <div className="relative p-6">
          {/* Animated celebration icon */}
          <div className="text-center mb-6">
            <div className="inline-block animate-bounce">
              {isBonus ? (
                <div className="text-8xl mb-4">🎉</div>
              ) : isDaily ? (
                <div className="text-8xl mb-4">✅</div>
              ) : (
                <div className="text-8xl mb-4">⭐</div>
              )}
            </div>
          </div>

          {/* Title */}
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-center">
              <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
                {isBonus ? "🎊 Amazing! 🎊" : isDaily ? "Daily Check-In Complete!" : "Task Completed!"}
              </h2>
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="mt-6 space-y-4">
            <div className="text-center p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-foreground/80 mb-2">{isBonus ? "You've earned the completion bonus!" : taskName}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-display font-bold text-primary">+{pointsAwarded.toLocaleString()}</span>
                <span className="text-xl text-foreground/60">{t("pts")}</span>
              </div>
            </div>

            {isBonus && (
              <div className="text-center p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-sm text-accent font-semibold mb-1">🏆 All Tasks Completed!</p>
                <p className="text-xs text-foreground/60">
                  Congratulations on finishing all tasks! Keep mining and earn even more rewards!
                </p>
              </div>
            )}

            {isDaily && (
              <div className="text-center p-3 bg-success/10 border border-success/30 rounded-lg">
                <p className="text-xs text-success">
                  ⏰ Come back tomorrow for another {pointsAwarded.toLocaleString()} points!
                </p>
              </div>
            )}

            {/* Celebration effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" />
              <div className="absolute top-10 right-1/4 w-2 h-2 bg-accent rounded-full animate-ping animation-delay-200" />
              <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-secondary rounded-full animate-ping animation-delay-400" />
            </div>
          </div>

          {/* Action button */}
          <div className="mt-8">
            <GlowButton onClick={() => onOpenChange(false)} className="w-full">
              {isBonus ? "Awesome! 🚀" : isDaily ? "Thanks! 👍" : "Keep Going! 💪"}
            </GlowButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
