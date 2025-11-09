"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"

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
  const [showBonusModal, setShowBonusModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    loadTasks()
  }, [])

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

  const handleCompleteTask = async (taskId: string, actionUrl: string | null) => {
    try {
      setCompletingTask(taskId)

      // If task has external URL, open it
      if (actionUrl) {
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
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: true } : task)))

      if (data.bonusAwarded) {
        setShowBonusModal(true)
      } else if (data.isDaily) {
        alert(`Daily check-in completed! You earned ${data.pointsAwarded} points! Come back tomorrow for more!`)
      } else {
        alert(`Task completed! You earned ${data.pointsAwarded} points!`)
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

      {showBonusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <LiquidCard className="max-w-md w-full p-8 text-center border-2 border-accent animate-in zoom-in-95">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-display font-bold text-accent mb-4">Congratulations!</h2>
            <p className="text-lg text-foreground mb-6">
              You've completed all tasks and earned your
              <span className="block text-4xl font-display font-bold text-primary my-4">10,000 BONUS POINTS!</span>
            </p>
            <GlowButton onClick={() => setShowBonusModal(false)} className="w-full">
              Awesome! 🚀
            </GlowButton>
          </LiquidCard>
        </div>
      )}

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
          {tasks.map((task) => (
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
                  <GlowButton
                    onClick={() => handleCompleteTask(task.id, task.action_url)}
                    disabled={completingTask === task.id}
                  >
                    {completingTask === task.id ? t("processing") : t("complete")}
                  </GlowButton>
                )}
              </div>
            </LiquidCard>
          ))}
        </div>
      </div>
    </div>
  )
}
