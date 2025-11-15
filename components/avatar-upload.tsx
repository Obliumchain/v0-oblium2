"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlowButton } from "@/components/ui/glow-button"
import { LiquidCard } from "@/components/ui/liquid-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { upload } from "@vercel/blob/client"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  nickname: string
  onAvatarUpdated?: (avatarUrl: string, pointsAwarded: number) => void
}

export function AvatarUpload({ currentAvatarUrl, userId, nickname, onAvatarUpdated }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB")
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      console.log("[v0] Uploading avatar...")

      // Upload to Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/avatar/upload",
      })

      console.log("[v0] Avatar uploaded:", blob.url)

      // Update preview
      setPreviewUrl(blob.url)

      // Update database and check for task completion
      const supabase = createClient()

      // Check if user already has an avatar
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single()

      const isFirstAvatar = !currentProfile?.avatar_url

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: blob.url })
        .eq("id", userId)

      if (updateError) throw updateError

      console.log("[v0] Profile updated with avatar")

      // If this is the first avatar, award points via task completion
      let pointsAwarded = 0
      if (isFirstAvatar) {
        console.log("[v0] First avatar upload - checking for task...")

        // Find the avatar task
        const { data: avatarTask } = await supabase
          .from("tasks")
          .select("id, reward")
          .eq("title", "Set Your Profile Avatar")
          .eq("active", true)
          .single()

        if (avatarTask) {
          console.log("[v0] Avatar task found:", avatarTask.id)

          // Check if user already completed this task
          const { data: existingCompletion } = await supabase
            .from("task_completions")
            .select("id")
            .eq("user_id", userId)
            .eq("task_id", avatarTask.id)
            .single()

          if (!existingCompletion) {
            console.log("[v0] Awarding task completion...")

            // Record task completion
            const { error: taskError } = await supabase
              .from("task_completions")
              .insert({
                user_id: userId,
                task_id: avatarTask.id,
                points_awarded: avatarTask.reward,
              })

            if (taskError) {
              console.error("[v0] Task completion error:", taskError)
            } else {
              // Update user points
              const { error: pointsError } = await supabase
                .from("profiles")
                .update({
                  points: supabase.raw(`points + ${avatarTask.reward}`),
                })
                .eq("id", userId)

              if (pointsError) {
                console.error("[v0] Points update error:", pointsError)
              } else {
                pointsAwarded = avatarTask.reward
                console.log("[v0] Points awarded:", pointsAwarded)
              }
            }
          }
        }
      }

      // Notify parent component
      if (onAvatarUpdated) {
        onAvatarUpdated(blob.url, pointsAwarded)
      }
    } catch (err) {
      console.error("[v0] Avatar upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload avatar")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <LiquidCard className="p-6">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Avatar className="w-32 h-32 border-4 border-primary/20">
            {previewUrl ? (
              <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Avatar" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-background text-4xl font-display font-bold">
                {nickname?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div>
          <h3 className="font-display font-bold text-foreground mb-2" style={{ fontSize: 'var(--text-base)' }}>
            {currentAvatarUrl ? "Update Your Avatar" : "Set Your Profile Avatar"}
          </h3>
          {!currentAvatarUrl && (
            <p className="text-sm text-success font-bold mb-2">
              🎁 Earn 10,000 points for uploading your first avatar!
            </p>
          )}
          <p className="text-xs text-foreground/60">
            JPG, PNG, or GIF • Max 5MB
          </p>
        </div>

        <div>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
          <label htmlFor="avatar-upload">
            <GlowButton
              as="span"
              disabled={isUploading}
              className="cursor-pointer"
              variant="primary"
            >
              {isUploading ? "Uploading..." : currentAvatarUrl ? "Change Avatar" : "Upload Avatar"}
            </GlowButton>
          </label>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>
    </LiquidCard>
  )
}
