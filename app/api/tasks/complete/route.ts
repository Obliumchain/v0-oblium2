import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isValidUUID, generateErrorId } from "@/lib/validation"

export async function POST(request: Request) {
  const errorId = generateErrorId()
  try {
    const supabase = await createClient()
    const { taskId } = await request.json()

    if (!taskId || !isValidUUID(taskId)) {
      return NextResponse.json({ error: "Invalid task ID", errorId }, { status: 400 })
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("active", true)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found or inactive", errorId }, { status: 404 })
    }

    if (task.is_daily_repeatable) {
      // Check if user can complete this daily task today
      const { data: canComplete, error: checkError } = await supabase.rpc("can_complete_daily_task", {
        p_user_id: user.id,
        p_task_id: taskId,
      })

      if (checkError) {
        console.error(`[${errorId}] Failed to check daily task:`, checkError)
        return NextResponse.json({ error: "Failed to verify daily task", errorId }, { status: 500 })
      }

      if (!canComplete) {
        return NextResponse.json(
          { error: "Daily task already completed today. Come back tomorrow!", errorId },
          { status: 400 },
        )
      }
    } else {
      // For non-daily tasks, check if already completed (original logic)
      const { data: existingCompletion } = await supabase
        .from("task_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("task_id", taskId)
        .maybeSingle()

      if (existingCompletion) {
        return NextResponse.json({ error: "Task already completed", errorId }, { status: 400 })
      }
    }

    const { error: completionError } = await supabase.from("task_completions").insert({
      user_id: user.id,
      task_id: taskId,
      points_awarded: task.reward,
      completed_date: new Date().toISOString().split("T")[0], // Store date in YYYY-MM-DD format
    })

    if (completionError) {
      console.error(`[${errorId}] Failed to complete task:`, completionError)
      return NextResponse.json({ error: "Failed to complete task", errorId }, { status: 500 })
    }

    const { error: pointsError } = await supabase.rpc("increment_points", {
      user_id: user.id,
      points_to_add: task.reward,
    })

    if (pointsError) {
      console.error(`[${errorId}] Failed to update points:`, pointsError)
      // Rollback completion if points update fails
      await supabase.from("task_completions").delete().eq("user_id", user.id).eq("task_id", taskId)
      return NextResponse.json({ error: "Failed to award points", errorId }, { status: 500 })
    }

    let allTasksCompleted = false
    let bonusAwarded = false

    if (!task.is_daily_repeatable) {
      // Get all non-daily tasks
      const { data: allNonDailyTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("active", true)
        .eq("is_daily_repeatable", false)

      // Get all user's completed non-daily tasks
      const { data: completedTasks } = await supabase.from("task_completions").select("task_id").eq("user_id", user.id)

      const completedTaskIds = new Set(completedTasks?.map((t) => t.task_id) || [])

      // Check if all non-daily tasks are completed
      const allCompleted = allNonDailyTasks?.every((t) => completedTaskIds.has(t.id)) || false

      if (allCompleted) {
        // Check if bonus hasn't been awarded yet
        const { data: profile } = await supabase
          .from("profiles")
          .select("task_completion_bonus_awarded")
          .eq("id", user.id)
          .single()

        if (profile && !profile.task_completion_bonus_awarded) {
          // Award 10,000 point bonus
          const { error: bonusError } = await supabase.rpc("increment_points", {
            user_id: user.id,
            points_to_add: 10000,
          })

          if (!bonusError) {
            // Mark bonus as awarded
            await supabase.from("profiles").update({ task_completion_bonus_awarded: true }).eq("id", user.id)

            allTasksCompleted = true
            bonusAwarded = true
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: task.reward,
      isDaily: task.is_daily_repeatable || false,
      allTasksCompleted,
      bonusAwarded,
    })
  } catch (error) {
    console.error(`[${errorId}] Task completion error:`, error)
    return NextResponse.json({ error: "Internal server error", errorId }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
