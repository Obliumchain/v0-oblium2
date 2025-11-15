"use client"

import { useState } from "react"
import { selectAvatar } from "@/app/actions/avatar-actions"
import { LiquidCard } from "@/components/ui/liquid-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AvatarSelectorProps {
  currentAvatarUrl?: string | null
  userId: string
  nickname: string
  onAvatarUpdated?: (avatarUrl: string, pointsAwarded: number) => void
}

const PRESET_AVATARS = [
  "/avatars/avatar-1.jpg",
  "/avatars/avatar-2.jpg",
  "/avatars/avatar-3.jpg",
  "/avatars/avatar-4.jpg",
  "/avatars/avatar-5.jpg",
  "/avatars/avatar-6.jpg",
  "/avatars/avatar-7.jpg",
  "/avatars/avatar-8.jpg",
  "/avatars/avatar-9.jpg",
  "/avatars/avatar-10.jpg",
]

export function AvatarSelector({ currentAvatarUrl, userId, nickname, onAvatarUpdated }: AvatarSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleAvatarSelect = async (avatarUrl: string) => {
    setError(null)
    setSuccessMessage(null)
    setIsUpdating(true)

    try {
      console.log("[v0] Selecting avatar:", avatarUrl)
      
      const result = await selectAvatar(avatarUrl)

      if (!result.success) {
        throw new Error(result.error || "Failed to update avatar")
      }

      console.log("[v0] Avatar updated successfully")
      setSelectedAvatar(result.avatarUrl)

      if (result.pointsAwarded > 0) {
        setSuccessMessage(`🎉 Avatar set! You earned ${result.pointsAwarded.toLocaleString()} points!`)
      } else {
        setSuccessMessage("✓ Avatar updated successfully!")
      }

      if (onAvatarUpdated) {
        onAvatarUpdated(result.avatarUrl, result.pointsAwarded)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("[v0] Avatar selection error:", err)
      setError(err instanceof Error ? err.message : "Failed to update avatar")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <LiquidCard className="p-4 sm:p-6">
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="flex justify-center">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/20">
            {selectedAvatar ? (
              <AvatarImage src={selectedAvatar || "/placeholder.svg"} alt="Avatar" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-background text-3xl sm:text-4xl font-display font-bold">
                {nickname?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div>
          <h3 className="font-display font-bold text-foreground mb-2 text-sm sm:text-base" style={{ fontSize: 'var(--text-base)' }}>
            {currentAvatarUrl ? "Update Your Avatar" : "Choose Your Avatar"}
          </h3>
          {!currentAvatarUrl && (
            <p className="text-xs sm:text-sm text-success font-bold mb-2">
              🎁 Earn 1,000 points for selecting your first avatar!
            </p>
          )}
          <p className="text-xs text-foreground/60">
            Select from 10 preset avatars
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {PRESET_AVATARS.map((avatarUrl, index) => (
            <button
              key={index}
              onClick={() => handleAvatarSelect(avatarUrl)}
              disabled={isUpdating}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedAvatar === avatarUrl 
                  ? "border-primary shadow-lg shadow-primary/50 scale-105" 
                  : "border-foreground/20 hover:border-primary/50"
              }`}
            >
              <Avatar className="w-full h-full">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={`Avatar ${index + 1}`} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-base sm:text-xl font-bold">
                  {index + 1}
                </AvatarFallback>
              </Avatar>
              {selectedAvatar === avatarUrl && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <span className="text-lg sm:text-2xl">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {successMessage && (
          <div className="text-xs sm:text-sm text-success bg-success/10 border border-success/20 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {isUpdating && (
          <div className="text-xs sm:text-sm text-primary">
            Updating avatar...
          </div>
        )}
      </div>
    </LiquidCard>
  )
}
