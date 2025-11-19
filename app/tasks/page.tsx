"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { LiquidCard } from "@/components/ui/liquid-card"
import { GlowButton } from "@/components/ui/glow-button"
import { BackgroundAnimation } from "@/components/background-animation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { useLanguage } from "@/lib/language-context"
import { ExternalLink } from 'lucide-react'
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
  const [userId, setUserId] = useState<string>("")
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

      setUserId(user.id)

      // Get all active tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("active", true)
        .order('task_type', { ascending: true })
        .order('reward', { ascending: false })

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

    // Build external URL with userId and return URL
    const returnUrl = encodeURIComponent(`${window.location.origin}/tasks`)
    const externalUrl = `${task.action_url}?userId=${userId}&returnUrl=${returnUrl}&taskId=${task.id}`
    
    // Redirect to external task app
    window.location.href = externalUrl
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'DAILY'
      case 'social': return 'SOCIAL'
      case 'referral': return 'REFERRAL'
      case 'special': return 'SPECIAL'
      default: return type.toUpperCase()
    }
  }

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-accent/20 text-accent'
      case 'social': return 'bg-blue-500/20 text-blue-400'
      case 'referral': return 'bg-purple-500/20 text-purple-400'
      case 'special': return 'bg-green-500/20 text-green-400'
      default: return 'bg-foreground/20 text-foreground'
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

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">{t("tasksTitle")}</h1>
          <p className="text-foreground/60">{t("tasksSubtitle")}</p>
        </div>

        {/* Info Banner */}
        <LiquidCard className="p-6 mb-8 bg-primary/5 border-primary/30">
          <div className="flex items-start gap-4">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">
                Complete Tasks to Earn Points
              </h3>
              <p className="text-foreground/70 text-sm">
                Click on any task below to be redirected to our task platform where you can complete the task and earn points. 
                Your progress will be automatically tracked and points will be added to your account.
              </p>
            </div>
          </div>
        </LiquidCard>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <LiquidCard
              key={task.id}
              className="p-6 h-full flex flex-col transition-all duration-300 hover:border-primary/50 cursor-pointer group"
              onClick={() => handleTaskClick(task)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-4xl">{task.icon}</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getTaskTypeColor(task.task_type)}`}>
                    {getTaskTypeLabel(task.task_type)}
                  </span>
                </div>
                <ExternalLink className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors" />
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
                <GlowButton size="sm">
                  {t("start") || "Start"}
                </GlowButton>
              </div>
            </LiquidCard>
          ))}
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
