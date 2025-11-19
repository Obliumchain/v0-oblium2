"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/language-context"
import { ExternalLink, Check } from "lucide-react"

interface Task {
  id: string
  icon: string
  title: string
  description: string
  reward: number
  task_type: string
  action_url: string | null
  is_daily_repeatable: boolean
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [openedTasks, setOpenedTasks] = useState<Set<string>>(new Set())
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    loadTasks()
    loadUser()
    const stored = localStorage.getItem("oblium_completed_tasks")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setCompletedTasks(new Set(parsed))
      } catch (e) {
        console.error("Failed to parse stored tasks:", e)
      }
    }
  }, [])

  const loadUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await loadCompletedTasks(user.id)
      }
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }

  const loadCompletedTasks = async (uid: string) => {
    try {
      const { data, error } = await supabase.from("task_completions").select("task_id").eq("user_id", uid)

      if (error) throw error

      const completedIds = data?.map((c) => c.task_id) || []
      setCompletedTasks(new Set(completedIds))
    } catch (error) {
      console.error("Error loading completed tasks:", error)
    }
  }

  const loadTasks = async () => {
    try {
      const { data: allTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("active", true)
        .order("task_type", { ascending: true })
        .order("reward", { ascending: false })

      if (tasksError) throw tasksError

      setTasks(allTasks || [])
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    if (!task.action_url) return

    setOpenedTasks((prev) => new Set(prev).add(task.id))

    window.open(task.action_url, "_blank", "noopener,noreferrer")
  }

  const handleCompleteTask = async (taskId: string) => {
    if (completedTasks.has(taskId)) {
      alert("You've already completed this task!")
      return
    }

    if (!userId) {
      alert("❌ Please log in to claim rewards!")
      return
    }

    setCompletingTask(taskId)

    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) throw new Error("Task not found")

      const { error: completionError } = await supabase.from("task_completions").insert({
        user_id: userId,
        task_id: taskId,
        points_awarded: task.reward,
        completed_date: new Date().toISOString().split("T")[0],
      })

      if (completionError) {
        if (completionError.code === "23505") {
          throw new Error("You've already completed this task!")
        }
        throw completionError
      }

      const { error: pointsError } = await supabase.rpc("increment_points", {
        user_id: userId,
        points_to_add: task.reward,
      })

      if (pointsError) {
        console.error("Points error:", pointsError)
        const { data: profile } = await supabase.from("profiles").select("points").eq("id", userId).single()

        if (profile) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ points: (profile.points || 0) + task.reward })
            .eq("id", userId)

          if (updateError) throw updateError
        }
      }

      const newCompleted = new Set(completedTasks)
      newCompleted.add(taskId)
      setCompletedTasks(newCompleted)

      localStorage.setItem("oblium_completed_tasks", JSON.stringify(Array.from(newCompleted)))

      alert(`✅ Task completed! You earned ${task.reward} points!`)
    } catch (error) {
      console.error("Error completing task:", error)
      alert(`❌ ${error instanceof Error ? error.message : "Failed to complete task"}`)
    } finally {
      setCompletingTask(null)
    }
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "DAILY"
      case "social":
        return "SOCIAL"
      case "referral":
        return "REFERRAL"
      case "special":
        return "SPECIAL"
      default:
        return type.toUpperCase()
    }
  }

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-accent/20 text-accent"
      case "social":
        return "bg-blue-500/20 text-blue-400"
      case "referral":
        return "bg-purple-500/20 text-purple-400"
      case "special":
        return "bg-green-500/20 text-green-400"
      default:
        return "bg-foreground/20 text-foreground"
    }
  }

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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">{t("tasksTitle")}</h1>
          <p className="text-foreground/60">{t("tasksSubtitle")}</p>
        </div>

        <LiquidCard className="p-6 mb-8 bg-primary/5 border-primary/30">
          <div className="flex items-start gap-4">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Complete Tasks to Earn Points</h3>
              <p className="text-foreground/70 text-sm">
                Click "Start" to open the task link. Complete the action on X/Twitter, then return here and click "Claim
                Reward" to receive your points.
              </p>
            </div>
          </div>
        </LiquidCard>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const isCompleted = completedTasks.has(task.id)
            const isOpened = openedTasks.has(task.id)

            return (
              <LiquidCard
                key={task.id}
                className={`p-6 h-full flex flex-col transition-all duration-300 ${
                  isCompleted ? "opacity-60 border-green-500/30" : "hover:border-primary/50 group"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-4xl">{task.icon}</div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${getTaskTypeColor(task.task_type)}`}
                    >
                      {getTaskTypeLabel(task.task_type)}
                    </span>
                  </div>
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors" />
                  )}
                </div>

                <h3 className="font-display font-bold text-lg text-foreground mb-2">{task.title}</h3>
                <p className="text-foreground/60 text-sm mb-4 flex-grow">{task.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-display font-bold text-xl">{task.reward}</span>
                    <span className="text-foreground/60 text-xs">{t("pts")}</span>
                  </div>
                  {isCompleted ? (
                    <span className="text-green-500 text-sm font-semibold">Completed</span>
                  ) : isOpened ? (
                    <GlowButton
                      size="sm"
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={completingTask === task.id}
                    >
                      {completingTask === task.id ? "Claiming..." : "Claim Reward"}
                    </GlowButton>
                  ) : (
                    <GlowButton size="sm" onClick={() => handleTaskClick(task)}>
                      {t("start") || "Start"}
                    </GlowButton>
                  )}
                </div>
              </LiquidCard>
            )
          })}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">No Tasks Available</h3>
            <p className="text-foreground/60">Check back later for new tasks!</p>
          </div>
        )}
      </div>
    </div>
  )
}
