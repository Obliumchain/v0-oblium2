"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { TaskCompletionDialog } from "@/components/task-completion-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { useLanguage } from "@/lib/language-context"
import { Share2 } from 'lucide-react'

interface Task {
  id: string
  icon: string
  title: string
  description: string
  reward: number
  task_type: string
  action_url: string | null
  completed: boolean
  is_daily_repeatable: boolean
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [completionDialog, setCompletionDialog] = useState<{
    open: boolean
    taskName: string
    points: number
    isBonus: boolean
    isDaily: boolean
  }>({
    open: false,
    taskName: "",
    points: 0,
    isBonus: false,
    isDaily: false,
  })
  const [referralCode, setReferralCode] = useState<string>("")
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    loadTasks()
    loadReferralCode()
  }, [])

  const loadReferralCode = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("referral_code").eq("id", user.id).single()

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code)
      }
    } catch (error) {
      console.error("Error loading referral code:", error)
    }
  }

  const loadTasks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Get all active tasks
      const { data: allTasks, error: tasksError } = await supabase.from("tasks").select("*").eq("active", true)

      if (tasksError) throw tasksError

      const todayEST = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" })
      const todayDate = new Date(todayEST).toISOString().split("T")[0]

      // Get user's completed tasks
      const { data: completions, error: completionsError } = await supabase
        .from("task_completions")
        .select("task_id, completed_date")
        .eq("user_id", user.id)

      if (completionsError) throw completionsError

      const completedTaskIds = new Set(
        completions
          ?.filter((c) => {
            const task = allTasks?.find((t) => t.id === c.task_id)
            // If daily task, only count as completed if done today
            if (task?.is_daily_repeatable) {
              return c.completed_date === todayDate
            }
            // For non-daily tasks, always count as completed
            return true
          })
          .map((c) => c.task_id) || [],
      )

      // Merge tasks with completion status
      const tasksWithStatus = allTasks?.map((task) => ({
        ...task,
        completed: completedTaskIds.has(task.id),
      }))

      setTasks(tasksWithStatus || [])
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShareWithReferral = async (taskId: string) => {
    const shareUrl = `https://www.obliumtoken.com?ref=${referralCode}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedTaskId(taskId)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedTaskId(null), 2000)

      // Open X (Twitter) to share
      const twitterShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
        `Join me on Oblium! Start mining crypto tokens today! ${shareUrl}`,
      )}`
      window.open(twitterShareUrl, "_blank")
    } catch (error) {
      console.error("Error copying link:", error)
      alert("Failed to copy link. Please try again.")
    }
  }

  const handleCompleteTask = async (taskId: string, actionUrl: string | null, taskType: string) => {
    try {
      if (taskType === "daily" && actionUrl) {
        // Get user ID to pass to external task app
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (user) {
          // Redirect to task.obliumtoken.com with userId
          const externalUrl = `${actionUrl}?userId=${user.id}&returnUrl=${encodeURIComponent(window.location.origin + '/tasks')}`
          window.location.href = externalUrl
          return
        }
      }
      
      setCompletingTask(taskId)

      if (taskType === "twitter_engagement") {
        // Open the tweet to like and repost
        if (actionUrl) {
          window.open(actionUrl, "_blank")
        }

        // Wait a moment for user to see the tweet, then show share option
        setTimeout(() => {
          handleShareWithReferral(taskId)
        }, 1000)
      } else if (actionUrl) {
        // If task has external URL, open it
        window.open(actionUrl, "_blank")
      }

      // Call API to complete task and award points
      const response = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Failed to complete task")
        return
      }

      // Update local state
      const completedTask = tasks.find((t) => t.id === taskId)
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: true } : task)))

      if (data.bonusAwarded) {
        setCompletionDialog({
          open: true,
          taskName: "All Tasks Completed!",
          points: data.pointsAwarded,
          isBonus: true,
          isDaily: false,
        })
      } else {
        setCompletionDialog({
          open: true,
          taskName: completedTask?.title || "Task Completed",
          points: data.pointsAwarded,
          isBonus: false,
          isDaily: data.isDaily || false,
        })
      }
    } catch (error) {
      console.error("Error completing task:", error)
      alert("Failed to complete task. Please try again.")
    } finally {
      setCompletingTask(null)
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const totalReward = tasks.reduce((sum, task) => sum + (task.completed ? task.reward : 0), 0)

  const visibleTasks = tasks.filter((task) => {
    // Always show daily tasks even if completed (they reset tomorrow)
    if (task.is_daily_repeatable) return true
    // Hide completed non-daily tasks
    return !task.completed
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background flex items-center justify-center">
        <BackgroundAnimation />
        <div className="text-primary text-xl">{t("loadingTasks")}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0015] to-background pb-32 lg:pb-8">
      <BackgroundAnimation />
      <Navigation />

      <TaskCompletionDialog
        open={completionDialog.open}
        onOpenChange={(open) => setCompletionDialog({ ...completionDialog, open })}
        taskName={completionDialog.taskName}
        pointsAwarded={completionDialog.points}
        isBonus={completionDialog.isBonus}
        isDaily={completionDialog.isDaily}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">{t("tasksTitle")}</h1>
          <p className="text-foreground/60">{t("tasksSubtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <LiquidCard className="p-6 text-center">
            <div className="text-foreground/60 text-sm mb-2">{t("completedLabel")}</div>
            <div className="text-4xl font-display font-bold text-success">
              {completedCount}/{tasks.length}
            </div>
          </LiquidCard>
          <LiquidCard className="p-6 text-center">
            <div className="text-foreground/60 text-sm mb-2">{t("pointsEarned")}</div>
            <div className="text-4xl font-display font-bold text-primary">{totalReward}</div>
          </LiquidCard>
          <LiquidCard className="p-6 text-center">
            <div className="text-foreground/60 text-sm mb-2">{t("potentialReward")}</div>
            <div className="text-4xl font-display font-bold text-accent">
              {tasks.reduce((sum, task) => sum + (task.completed ? 0 : task.reward), 0)}
            </div>
          </LiquidCard>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTasks.map((task) => (
            <LiquidCard
              key={task.id}
              className={`p-6 h-full flex flex-col transition-all duration-300 ${
                task.completed ? "border-success/50 bg-success/5" : "hover:border-primary/50"
              } ${task.is_daily_repeatable && !task.completed ? "ring-2 ring-accent/30" : ""}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-4xl">{task.icon}</div>
                  {task.is_daily_repeatable && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-semibold">
                      {t("daily") || "DAILY"}
                    </span>
                  )}
                </div>
                {task.completed && (
                  <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="font-display font-bold text-lg text-foreground mb-2">{task.title}</h3>
              <p className="text-foreground/60 text-sm mb-4 flex-grow">{task.description}</p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-display font-bold text-xl">{task.reward}</span>
                  <span className="text-foreground/60 text-xs">{t("pts")}</span>
                </div>
                {!task.completed && (
                  <div className="flex gap-2">
                    <GlowButton
                      onClick={() => handleCompleteTask(task.id, task.action_url, task.task_type)}
                      disabled={completingTask === task.id}
                    >
                      {completingTask === task.id ? t("processing") : t("complete")}
                    </GlowButton>
                    {task.task_type === "twitter_engagement" && (
                      <button
                        onClick={() => handleShareWithReferral(task.id)}
                        className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                        title="Share with referral link"
                      >
                        {copiedTaskId === task.id ? (
                          <span className="text-xs text-success">✓ Copied!</span>
                        ) : (
                          <Share2 className="w-4 h-4 text-accent" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </LiquidCard>
          ))}
        </div>
      </div>
    </div>
  )
}
