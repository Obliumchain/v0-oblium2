"use client"

import { useState } from "react"
import { selectAvatar } from "@/app/actions/avatar-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface AvatarSelectorProps {
  currentAvatarUrl?: string | null
  nickname: string
  onAvatarUpdated?: (avatarUrl: string) => void
}

const PRESET_AVATARS = [
  "/avatars/avatar-1.jpg",
  "/avatars/avatar-2.jpg",
  "/avatars/avatar-3.jpg",
  "/avatars/avatar-4.jpg",
  "/avatars/avatar-5.jpg",
]

export function AvatarSelector({ currentAvatarUrl, nickname, onAvatarUpdated }: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl || null)
  const [error, setError] = useState<string | null>(null)

  const handleAvatarSelect = async (avatarUrl: string) => {
    setError(null)
    setIsUpdating(true)

    try {
      const result = await selectAvatar(avatarUrl)

      if (!result.success) {
        throw new Error(result.error || "Failed to update avatar")
      }

      setSelectedAvatar(result.avatarUrl)

      if (onAvatarUpdated) {
        onAvatarUpdated(result.avatarUrl)
      }

      // Close modal after successful selection
      setTimeout(() => setIsOpen(false), 500)
    } catch (err) {
      console.error("[v0] Avatar selection error:", err)
      setError(err instanceof Error ? err.message : "Failed to update avatar")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="glass-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer group w-full"
      >
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
            {selectedAvatar ? (
              <AvatarImage src={selectedAvatar || "/placeholder.svg"} alt="Avatar" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-background text-2xl font-display font-bold">
                {nickname?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 text-left">
            <h3 className="font-display font-bold text-foreground text-base" style={{ fontSize: 'var(--text-base)' }}>
              {currentAvatarUrl ? "Change Avatar" : "Choose Avatar"}
            </h3>
            <p className="text-xs text-foreground/60">
              Select from 5 preset avatars
            </p>
          </div>
          <div className="text-foreground/40 group-hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-foreground text-xl">
                Choose Your Avatar
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
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
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
                      {index + 1}
                    </AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatarUrl && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            {isUpdating && (
              <div className="text-sm text-primary text-center">
                Updating avatar...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
